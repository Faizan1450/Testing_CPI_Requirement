/**
 * src/steps/step1_loadFromBuffer.js
 * ─────────────────────────────────────────────
 * STEP 1 (V2) — Creates an AdmZip instance from an in-memory Buffer.
 *
 * Replaces step1_loadZip.js which read from disk.
 * The Buffer comes from iflowDownloader.downloadIflowZip().
 *
 * Returns: { zip: AdmZip instance }
 */

const AdmZip = require("adm-zip");

function loadZipFromBuffer(buffer, iflowName) {
    if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
        throw new Error(`Invalid or empty zip buffer received for iflow: ${iflowName}`);
    }

    const zip = new AdmZip(buffer);
    return { zip };
}

module.exports = { loadZipFromBuffer };
