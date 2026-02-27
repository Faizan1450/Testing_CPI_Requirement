/**
 * index.js  (V2) — Express server entry point
 * ─────────────────────────────────────────────
 * Start: node index.js
 * Port:  3000 (override via PORT in .env)
 *
 * Endpoint:  POST /extract
 * Body:
 *   {
 *     "iflows": [
 *       "IDM_AM_ContractTable_To_SAPS4_IDD250128_EIC_IBProcessing",
 *       "IDM_AM_GLSTANDARD_To_SAPS4_IDD2052_EIC_IBProcessing"
 *     ]
 *   }
 *
 * Response:
 *   {
 *     "status": "completed",
 *     "file": "/absolute/path/to/CPI_Headers_Extract.xlsx",
 *     "summary": { "total": 2, "processed": 2, "failed": 0 },
 *     "failed": [
 *       { "iflow": "WRONG_NAME", "error": "HTTP 404 — artifact not found" }
 *     ]
 *   }
 */

// Load & validate .env FIRST — before any other module
require("./src/config/env");

const express = require("express");
const { getToken } = require("./src/services/authService");
const { runExtractor } = require("./extractor");
const { exportBatchToExcel } = require("./src/steps/step5_exportExcel");
const env = require("./src/config/env");

const app = express();
app.use(express.json());

// ── Health check ──────────────────────────────────────────────────────────
app.get("/", (_req, res) => {
    res.json({ status: "ok", message: "CPI Extractor API is running." });
});

// ── Main extraction endpoint ───────────────────────────────────────────────
app.post("/extract", async (req, res) => {
    const { iflows } = req.body;

    // ── Validate input ────────────────────────────────────────────────────
    if (!Array.isArray(iflows) || iflows.length === 0) {
        return res.status(400).json({
            status: "error",
            message: 'Request body must contain a non-empty "iflows" array.',
            example: { iflows: ["IDM_AM_ContractTable_To_SAPS4_IDD250128_EIC_IBProcessing"] },
        });
    }

    console.log(`\n🚀  POST /extract — ${iflows.length} iflow(s) requested`);
    console.log("   ", iflows.join("\n    "));

    const failed = [];
    const batchResults = []; // { iflowName, results[] }

    try {
        // ── Fetch OAuth token once for the whole batch ────────────────────
        const token = await getToken();

        // ── Process each iflow ────────────────────────────────────────────
        for (const iflowName of iflows) {
            try {
                const { iflowName: name, results } = await runExtractor(iflowName, token);

                const headerCount = results.filter(
                    (r) => r.headerName !== "(empty headerTable)"
                ).length;

                batchResults.push({ iflowName: name, results });

            } catch (err) {
                // Individual iflow failed — capture error, continue with rest
                const errorMsg = buildErrorMessage(err);
                console.error(`  ❌  Failed [${iflowName}]: ${errorMsg}`);
                failed.push({ iflow: iflowName, error: errorMsg });
            }
        }

        // ── Export whatever we collected to Excel ─────────────────────────
        let filePath = null;
        if (batchResults.length > 0) {
            console.log(`\n📊  Exporting ${batchResults.length} iflow(s) to Excel...`);
            filePath = await exportBatchToExcel(batchResults);
            console.log(`✅  Excel saved → ${filePath}`);
        } else {
            console.log("⚠️   No data to export — all iflows failed.");
        }

        const processed = batchResults.length;

        return res.json({
            status: "completed",
            file: filePath,
            summary: { total: iflows.length, processed, failed: failed.length },
            ...(failed.length > 0 && { failed }),
        });

    } catch (err) {
        // Catastrophic error (e.g. token fetch failed)
        console.error(`\n💥  Fatal error: ${err.message}`);
        return res.status(500).json({
            status: "error",
            message: err.message,
        });
    }
});

// ── Error message builder ───────────────────────────────────────────────────
function buildErrorMessage(err) {
    if (err.response) {
        // Axios HTTP error
        const status = err.response.status;
        const msg = err.response.data
            ? JSON.stringify(err.response.data).slice(0, 200)
            : err.message;
        return `HTTP ${status} — ${msg}`;
    }
    return err.message;
}

// ── Start server ───────────────────────────────────────────────────────────
app.listen(env.PORT, () => {
    console.log(`\n🟢  CPI Extractor API running on http://localhost:${env.PORT}`);
    console.log(`    POST http://localhost:${env.PORT}/extract`);
    console.log(`    Body: { "iflows": ["<IflowName>", ...] }\n`);
});
