/**
 * steps/step1_loadZip.js
 * ─────────────────────────────────────────────
 * STEP 1 — Find the .zip file in the configured ZIP_DIR
 *           and load it with adm-zip.
 *
 * Returns: { zip: AdmZip instance, zipFileName: string }
 */

const fs = require("fs");
const path = require("path");
const AdmZip = require("adm-zip");
const { ZIP_DIR } = require("../config/paths");

function loadZip() {
    // ── Find the first .zip file in ZIP_DIR ──────────────────────────────────
    if (!fs.existsSync(ZIP_DIR)) {
        throw new Error(`ZIP directory not found: ${ZIP_DIR}`);
    }

    const files = fs.readdirSync(ZIP_DIR).filter((f) => f.endsWith(".zip"));

    if (files.length === 0) {
        throw new Error(`No .zip files found in: ${ZIP_DIR}`);
    }

    const zipFileName = files[0]; // first zip (single iflow for now)
    const zipFilePath = path.join(ZIP_DIR, zipFileName);

    console.log(`\n📦  Found zip file : ${zipFileName}`);

    // ── Load the zip ──────────────────────────────────────────────────────────
    const zip = new AdmZip(zipFilePath);

    return { zip, zipFileName };
}

module.exports = { loadZip };
