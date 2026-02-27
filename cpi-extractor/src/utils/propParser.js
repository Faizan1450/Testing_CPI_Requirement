/**
 * utils/propParser.js
 * ─────────────────────────────────────────────
 * Parses the content of a Java-style .properties file
 * into a plain JS object (key → value map).
 *
 * Rules:
 *  - Lines starting with # are comments → skip
 *  - Blank lines → skip
 *  - Lines like  key=value  → { key: "value" }
 *  - Lines like  key=        → { key: "" }   (empty value is valid!)
 */

function parsePropContent(content) {
    const map = {};

    const lines = content.split(/\r?\n/);

    for (const rawLine of lines) {
        const line = rawLine.trim();

        // Skip blank lines and comments
        if (!line || line.startsWith("#")) continue;

        // Split only on the FIRST '=', so values can contain '='
        const eqIndex = line.indexOf("=");
        if (eqIndex === -1) continue; // malformed line, ignore

        const key = line.substring(0, eqIndex).trim();
        const value = line.substring(eqIndex + 1).trim();

        map[key] = value;
    }

    return map;
}

module.exports = { parsePropContent };
