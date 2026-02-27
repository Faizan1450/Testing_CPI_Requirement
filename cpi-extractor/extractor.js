/**
 * extractor.js  (V2)
 * ─────────────────────────────────────────────
 * Orchestrates processing for a SINGLE iflow by name.
 *
 * Flow:
 *   token         → passed in from index.js (shared across all iflows)
 *   iflowName     → passed in from index.js
 *
 *   Step 1 → Download zip via SAP CPI API (in-memory Buffer)
 *   Step 2 → Load AdmZip from Buffer
 *   Step 3 → Extract .iflw + parameters.prop from zip
 *   Step 4 → Parse parameters.prop
 *   Step 5 → Parse .iflw XML → extract headers
 *
 * Returns: { iflowName, results[] }
 * Throws on error — index.js catches and marks iflow as failed.
 */

const { downloadIflowZip } = require("./src/services/iflowDownloader");
const { loadZipFromBuffer } = require("./src/steps/step1_loadFromBuffer");
const { extractFilesFromZip } = require("./src/steps/step2_extractFiles");
const { parseParameters } = require("./src/steps/step3_parseParameters");
const { extractHeaders } = require("./src/steps/step4_extractHeaders");
const { parseXml } = require("./src/utils/xmlParser");

async function runExtractor(iflowName, token) {
    console.log(`\n  ── Processing: ${iflowName}`);

    // Step 1: Download zip from SAP CPI API
    const buffer = await downloadIflowZip(iflowName, token);

    // Step 2: Load zip from in-memory buffer
    const { zip } = loadZipFromBuffer(buffer, iflowName);

    // Step 3: Extract .iflw and parameters.prop from zip
    const { iflwContent, propContent } = extractFilesFromZip(zip);

    // Step 4: Parse parameters.prop
    const { paramMap } = parseParameters(propContent);

    // Step 5: Parse iflow XML and extract headers
    const iflwParsed = await parseXml(iflwContent);
    const results = await extractHeaders(iflwParsed, paramMap);

    const count = results.filter((r) => r.headerName !== "(empty headerTable)").length;
    console.log(`  ✅  Done — ${count} header(s) found`);

    return { iflowName, results };
}

module.exports = { runExtractor };
