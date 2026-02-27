/**
 * steps/step4_extractHeaders.js
 * ─────────────────────────────────────────────
 * STEP 4 — The heart of the automation.
 *
 * Walks every callActivity in the iflow process (including
 * those nested inside subProcesses), finds the "headerTable"
 * property, parses the embedded XML table, and resolves any
 * {{placeholder}} values against parameters.prop.
 *
 * Returns:
 *   Array of result objects:
 *   {
 *     callActivityId   : string,   e.g. "CallActivity_1"
 *     callActivityName : string,   e.g. "Set Headers"
 *     headerName       : string,   e.g. "SAP_Receiver"
 *     rawValue         : string,   e.g. "{{CallActivity_1_SAP_Receiver}}" or "true"
 *     resolvedValue    : string,   final value (placeholder resolved or original)
 *     isPlaceholder    : boolean,
 *     resolvedFrom     : string,   "direct" | "parameters.prop" | "NOT_FOUND"
 *   }
 */

const { parseXml, decodeHtmlEntities } = require("../utils/xmlParser");

// ── Regex to detect {{placeholder}} patterns ─────────────────────────────
const PLACEHOLDER_RE = /^\{\{(.+?)\}\}$/;

// ── Resolve a single cell value against the param map ────────────────────
function resolveValue(rawValue, paramMap) {
    const match = PLACEHOLDER_RE.exec(rawValue);

    if (!match) {
        // Not a placeholder — use value as-is
        return {
            isPlaceholder: false,
            resolvedValue: rawValue,
            resolvedFrom: "direct",
        };
    }

    // It IS a placeholder — look up the key inside {{ }}
    const placeholderKey = match[1];

    if (Object.prototype.hasOwnProperty.call(paramMap, placeholderKey)) {
        return {
            isPlaceholder: true,
            resolvedValue: paramMap[placeholderKey],
            resolvedFrom: "parameters.prop",
        };
    }

    // Placeholder key not found in prop file
    return {
        isPlaceholder: true,
        resolvedValue: rawValue, // keep raw {{...}} so user can see it
        resolvedFrom: "NOT_FOUND",
    };
}

// ── Parse the embedded XML table of a headerTable property ───────────────
async function parseHeaderTable(rawXmlValue, callActivityId, callActivityName, paramMap) {
    const results = [];

    // The value may be empty (CallActivity_5 has <value/>) → skip row parsing
    // but we still return empty array gracefully
    const trimmed = rawXmlValue.trim();
    if (!trimmed) return results;

    // Decode HTML entities → real XML string
    const xmlString = decodeHtmlEntities(trimmed);

    // Wrap in a root element so xml2js can parse it (SAP gives bare <row>...)
    const wrapped = `<table>${xmlString}</table>`;

    let parsed;
    try {
        parsed = await parseXml(wrapped);
    } catch (err) {
        console.warn(
            `  ⚠️   Could not parse headerTable XML for ${callActivityId}: ${err.message}`
        );
        return results;
    }

    // Structure: parsed.table.row = [ { cell: [ { _: "...", $: { id: "..." } } ] } ]
    const rows = parsed?.table?.row ?? [];

    for (const row of rows) {
        const cells = row?.cell ?? [];

        // Build a quick lookup: id → text value
        const cellMap = {};
        for (const cell of cells) {
            const id = cell?.$?.id ?? "";
            // Text content lives at cell._ (because of charkey:"_" option)
            // When the element is empty xml2js may give undefined
            const text = cell?._ ?? "";
            cellMap[id] = text;
        }

        // We need at minimum a "Name" cell — that's the header key
        const headerName = cellMap["Name"]; // may be empty string — still valid
        if (headerName === undefined) continue; // no Name cell at all → malformed, skip

        const rawValue = cellMap["Value"] ?? ""; // empty string if missing

        const { isPlaceholder, resolvedValue, resolvedFrom } = resolveValue(rawValue, paramMap);

        results.push({
            callActivityId,
            callActivityName,
            headerName,
            rawValue,
            resolvedValue,
            isPlaceholder,
            resolvedFrom,
        });
    }

    return results;
}

// ── Process a flat array of callActivity objects ──────────────────────────
async function processCallActivities(callActivities, paramMap) {
    const allResults = [];

    for (const ca of callActivities) {
        const caId = ca?.$?.id ?? "Unknown_ID";
        const caName = ca?.$?.name ?? "Unnamed";

        // Properties live at ca["bpmn2:extensionElements"][0]["ifl:property"]
        const extensionElements = ca?.["bpmn2:extensionElements"] ?? [];
        const properties = extensionElements[0]?.["ifl:property"] ?? [];

        for (const prop of properties) {
            // Each property: { key: ["headerTable"], value: ["...xml..."] }
            const keyArr = prop?.key ?? [];
            const valueArr = prop?.value ?? [];

            const propKey = keyArr[0]?._ ?? keyArr[0] ?? "";

            if (propKey !== "headerTable") continue;

            // Value node: when empty SAP gives just {} or ""
            const rawValueNode = valueArr[0];
            let rawValue = "";
            if (typeof rawValueNode === "string") {
                rawValue = rawValueNode;
            } else if (rawValueNode && typeof rawValueNode._ === "string") {
                rawValue = rawValueNode._;
            } else if (rawValueNode && typeof rawValueNode === "object") {
                // xml2js collapses <value/> to {} — treat as empty
                rawValue = "";
            }

            const headerRows = await parseHeaderTable(rawValue, caId, caName, paramMap);
            allResults.push(...headerRows);

            // If headerTable exists but had zero rows AND rawValue was empty,
            // we add a placeholder entry so users know the CA has an empty headerTable
            if (headerRows.length === 0 && rawValue.trim() === "") {
                allResults.push({
                    callActivityId: caId,
                    callActivityName: caName,
                    headerName: "(empty headerTable)",
                    rawValue: "",
                    resolvedValue: "",
                    isPlaceholder: false,
                    resolvedFrom: "direct",
                });
            }
        }
    }

    return allResults;
}

// ── Main exported function ────────────────────────────────────────────────
async function extractHeaders(iflwParsed, paramMap) {
    // Navigate to the process node
    const definitions = iflwParsed?.["bpmn2:definitions"] ?? {};
    const processes = definitions?.["bpmn2:process"] ?? [];

    if (processes.length === 0) {
        throw new Error("No <bpmn2:process> found in the iflow XML.");
    }

    const allResults = [];

    for (const process of processes) {
        // Direct callActivities in the main process
        const directCAs = process?.["bpmn2:callActivity"] ?? [];

        // callActivities inside subProcesses (e.g. exception handler)
        const subProcesses = process?.["bpmn2:subProcess"] ?? [];
        const subCAs = subProcesses.flatMap(
            (sp) => sp?.["bpmn2:callActivity"] ?? []
        );

        const allCAs = [...directCAs, ...subCAs];

        const results = await processCallActivities(allCAs, paramMap);
        allResults.push(...results);
    }

    return allResults;
}

module.exports = { extractHeaders };
