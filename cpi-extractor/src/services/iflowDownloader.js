/**
 * src/services/iflowDownloader.js
 * ─────────────────────────────────────────────
 * Downloads an iflow zip from SAP CPI as an in-memory Buffer.
 *
 * Endpoint pattern:
 *   GET {baseURL}/api/v1/IntegrationDesigntimeArtifacts(Id='{iflowName}',Version='active')/$value
 *
 * The response is binary (zip file) — we return it as a Buffer
 * so it can be passed directly to AdmZip without touching the disk.
 */

const axios = require("axios");
const env = require("../config/env");

/**
 * @param {string} iflowName  - The iflow artifact ID
 * @param {string} token      - Bearer token from authService.getToken()
 * @returns {Promise<Buffer>} - Raw zip content as a Buffer
 */
async function downloadIflowZip(iflowName, token) {
    // SAP OData URL — single quotes are NOT URL-encoded (they are OData syntax)
    const url =
        `${env.BASE_URL}/api/v1/IntegrationDesigntimeArtifacts` +
        `(Id='${iflowName}',Version='active')/$value`;

    console.log(`  ⬇️   Downloading: ${iflowName}`);
    console.log(`  🔗  URL: ${url}`);

    try {
        const response = await axios.get(url, {
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/zip, application/octet-stream",
            },
            responseType: "arraybuffer",
            timeout: 30_000,
        });

        const buffer = Buffer.from(response.data);
        const sizeKB = (buffer.length / 1024).toFixed(1);
        console.log(`  📦  Downloaded ${sizeKB} KB`);

        return buffer;

    } catch (err) {
        // Decode arraybuffer error body into readable text for diagnosis
        if (err.response?.data) {
            const rawBody = Buffer.from(err.response.data).toString("utf8");
            const status = err.response.status;
            throw new Error(`HTTP ${status} — ${rawBody.slice(0, 300)}`);
        }
        throw err;
    }
}

module.exports = { downloadIflowZip };
