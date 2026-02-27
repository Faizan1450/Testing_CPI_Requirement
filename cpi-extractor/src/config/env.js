/**
 * src/config/env.js
 * ─────────────────────────────────────────────
 * Loads .env from the project root (cpi-extractor/) and
 * validates all required variables are present.
 *
 * Import this ONCE at the top of index.js before anything else.
 */

require("dotenv").config(); // loads .env from cwd (cpi-extractor/)

const REQUIRED_VARS = [
    "MDLZ_CPI_API_BASE_URL",
    "MDLZ_CLIENT_ID",
    "MDLZ_CLIENT_SECRET",
    "MDLZ_TOKEN_URL",
];

for (const key of REQUIRED_VARS) {
    if (!process.env[key]) {
        throw new Error(
            `❌  Missing required environment variable: ${key}\n` +
            `    Please check your .env file inside cpi-extractor/`
        );
    }
}

module.exports = {
    BASE_URL: process.env.MDLZ_CPI_API_BASE_URL,
    CLIENT_ID: process.env.MDLZ_CLIENT_ID,
    CLIENT_SECRET: process.env.MDLZ_CLIENT_SECRET,
    TOKEN_URL: process.env.MDLZ_TOKEN_URL,
    PORT: process.env.PORT || 3000,
};
