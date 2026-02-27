/**
 * config/paths.js
 * ─────────────────────────────────────────────
 * Central place for all folder / file path config.
 * Adjust ZIP_DIR if your zip files ever move.
 */

const path = require("path");

// __dirname = cpi-extractor/src/config
// Go up 3 levels → Testing CPI Requirement (workspace root)
const WORKSPACE_ROOT = path.resolve(__dirname, "../../..");

module.exports = {
    // Folder that holds the iflow .zip file(s)
    ZIP_DIR: path.join(WORKSPACE_ROOT, "Data", "Iflows Zip"),

    // Paths INSIDE the zip (relative, always the same SAP structure)
    ZIP_INNER: {
        // Pattern: <anything>/src/main/resources/parameters.prop
        PARAMETERS_PROP: ["src", "main", "resources", "parameters.prop"],

        // Pattern: <anything>/src/main/resources/scenarioflows/integrationflow/*.iflw
        IFLW_FOLDER: ["src", "main", "resources", "scenarioflows", "integrationflow"],
    },
};
