/**
 * steps/step3_parseParameters.js
 * ─────────────────────────────────────────────
 * STEP 3 — Parse the raw text content of parameters.prop
 *           into a usable key → value map.
 *
 * Returns: { paramMap: object }
 */

const { parsePropContent } = require("../utils/propParser");

function parseParameters(propContent) {
    const paramMap = parsePropContent(propContent);

    const count = Object.keys(paramMap).length;
    console.log(`🗂️   parameters.prop: ${count} key(s) loaded`);

    return { paramMap };
}

module.exports = { parseParameters };
