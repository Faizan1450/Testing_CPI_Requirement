/**
 * src/steps/step5_exportExcel.js  (V2.1 — append mode)
 * ─────────────────────────────────────────────
 * Exports header data for ONE OR MANY iflows into a single Excel sheet.
 *
 * Behaviour:
 *  - Fixed filename: CPI_Headers_Extract.xlsx
 *  - If file exists → open it and APPEND new rows to the existing sheet
 *  - If file doesn't exist → create fresh with header row
 *
 * Sheet columns:
 *  A : iFlow Name
 *  B : CallActivity Name
 *  C : CallActivity ID
 *  D : Header Name
 *  E : Resolved Value
 *  F : Raw Value
 *  G : Source
 */

const path = require("path");
const fs = require("fs");
const ExcelJS = require("exceljs");

// ── Fixed output path ─────────────────────────────────────────────────────
const OUTPUT_DIR = path.resolve(__dirname, "../../../output");
const OUTPUT_FILE = path.join(OUTPUT_DIR, "CPI_Headers_Extract.xlsx");

// ── Colours ───────────────────────────────────────────────────────────────
const COLOURS = {
    headerBg: "FF1F3864",
    headerFont: "FFFFFFFF",
    directBg: "FFE2EFDA",
    propBg: "FFFFF2CC",
    notFoundBg: "FFFFC7CE",
    border: "FFB8CCE4",
};

const COLUMN_DEFS = [
    { header: "iFlow Name", key: "iflowName", width: 48 },
    { header: "CallActivity Name", key: "callActivityName", width: 28 },
    { header: "CallActivity ID", key: "callActivityId", width: 22 },
    { header: "Header Name", key: "headerName", width: 28 },
    { header: "Resolved Value", key: "resolvedValue", width: 36 },
    { header: "Raw Value", key: "rawValue", width: 40 },
    { header: "Source", key: "resolvedFrom", width: 20 },
];

function thinBorder() {
    const side = { style: "thin", color: { argb: COLOURS.border } };
    return { top: side, left: side, bottom: side, right: side };
}

function rowBg(source) {
    if (source === "NOT_FOUND") return COLOURS.notFoundBg;
    if (source === "parameters.prop") return COLOURS.propBg;
    return COLOURS.directBg;
}

function styleHeaderRow(headerRow) {
    headerRow.eachCell((cell) => {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLOURS.headerBg } };
        cell.font = { bold: true, color: { argb: COLOURS.headerFont }, size: 11, name: "Calibri" };
        cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
        cell.border = thinBorder();
    });
    headerRow.height = 28;
}

async function exportBatchToExcel(batchResults) {
    // ── Ensure output directory exists ───────────────────────────────────
    if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

    const workbook = new ExcelJS.Workbook();
    let ws;
    const fileExists = fs.existsSync(OUTPUT_FILE);

    if (fileExists) {
        // ── Load existing workbook and find/create the Headers sheet ─────
        await workbook.xlsx.readFile(OUTPUT_FILE);
        ws = workbook.getWorksheet("Headers");

        if (!ws) {
            // Sheet was deleted manually — recreate it
            ws = workbook.addWorksheet("Headers", { views: [{ state: "frozen", ySplit: 1 }] });
            ws.columns = COLUMN_DEFS;
            styleHeaderRow(ws.getRow(1));
        }
        console.log(`  📂  Appending to existing: ${OUTPUT_FILE}`);

    } else {
        // ── Create fresh workbook with header row ─────────────────────────
        workbook.creator = "CPI Extractor";
        workbook.created = new Date();
        ws = workbook.addWorksheet("Headers", { views: [{ state: "frozen", ySplit: 1 }] });
        ws.columns = COLUMN_DEFS;
        styleHeaderRow(ws.getRow(1));
        console.log(`  📄  Creating new file: ${OUTPUT_FILE}`);
    }

    // ── Append rows for every iflow sequentially ─────────────────────────
    for (const { iflowName, results } of batchResults) {
        for (const row of results) {
            // Skip empty headerTable placeholders
            if (row.headerName === "(empty headerTable)") continue;

            const dataRow = ws.addRow({
                iflowName,
                callActivityName: row.callActivityName,
                callActivityId: row.callActivityId,
                headerName: row.headerName,
                resolvedValue: row.resolvedFrom === "NOT_FOUND" ? "(NOT FOUND)" : row.resolvedValue,
                rawValue: row.rawValue,
                resolvedFrom: row.resolvedFrom,
            });

            const bg = rowBg(row.resolvedFrom);
            dataRow.eachCell({ includeEmpty: true }, (cell) => {
                cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bg } };
                cell.font = { size: 10, name: "Calibri" };
                cell.alignment = { vertical: "middle", wrapText: true };
                cell.border = thinBorder();
            });
            dataRow.height = 20;
        }
    }

    // ── Auto-filter on header row ─────────────────────────────────────────
    ws.autoFilter = {
        from: { row: 1, column: 1 },
        to: { row: 1, column: COLUMN_DEFS.length },
    };

    await workbook.xlsx.writeFile(OUTPUT_FILE);
    return OUTPUT_FILE;
}

module.exports = { exportBatchToExcel };
