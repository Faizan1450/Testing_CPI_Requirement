/**
 * steps/step2_extractFiles.js
 * ─────────────────────────────────────────────
 * STEP 2 — Read the two important files directly from the
 *           zip in memory (no disk extraction needed).
 *
 *   File A → parameters.prop
 *   File B → *.iflw
 *
 * Returns: { iflwContent: string, propContent: string, iflwFileName: string }
 */

const { ZIP_INNER } = require("../config/paths");

function extractFilesFromZip(zip) {
    const entries = zip.getEntries(); // all files inside zip

    let iflwEntry = null;
    let propEntry = null;

    // ── Normalise the expected suffix paths ──────────────────────────────────
    // We use forward slashes for comparison on any OS
    const PROP_SUFFIX = ZIP_INNER.PARAMETERS_PROP.join("/");
    const IFLW_FOLDER = ZIP_INNER.IFLW_FOLDER.join("/");

    for (const entry of entries) {
        const entryPath = entry.entryName.replace(/\\/g, "/");

        // parameters.prop
        if (entryPath.endsWith(PROP_SUFFIX)) {
            propEntry = entry;
        }

        // *.iflw inside the integrationflow folder
        if (entryPath.includes(IFLW_FOLDER) && entryPath.endsWith(".iflw")) {
            iflwEntry = entry;
        }
    }

    // ── Validate we found both ───────────────────────────────────────────────
    if (!propEntry) {
        throw new Error(
            `parameters.prop not found inside zip.\nExpected path ending with: ${PROP_SUFFIX}`
        );
    }
    if (!iflwEntry) {
        throw new Error(
            `*.iflw file not found inside zip.\nExpected inside folder: ${IFLW_FOLDER}`
        );
    }

    const propContent = propEntry.getData().toString("utf8");
    const iflwContent = iflwEntry.getData().toString("utf8");
    const iflwFileName = iflwEntry.entryName.split("/").pop();

    console.log(`📄  iflow file     : ${iflwFileName}`);
    console.log(`📄  parameters.prop: found`);

    return { iflwContent, propContent, iflwFileName };
}

module.exports = { extractFilesFromZip };
