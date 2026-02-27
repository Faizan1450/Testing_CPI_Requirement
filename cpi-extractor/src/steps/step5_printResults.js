/**
 * steps/step5_printResults.js
 * ─────────────────────────────────────────────
 * STEP 5 — Pretty-prints the extracted header results
 *           to the console in a clean, readable format.
 *
 * Groups results by CallActivity so output is easy to read.
 */

// ── ANSI colour helpers ───────────────────────────────────────────────────
const C = {
    reset: "\x1b[0m",
    bold: "\x1b[1m",
    cyan: "\x1b[36m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    red: "\x1b[31m",
    grey: "\x1b[90m",
    blue: "\x1b[34m",
};

function bold(s) { return `${C.bold}${s}${C.reset}`; }
function cyan(s) { return `${C.cyan}${s}${C.reset}`; }
function green(s) { return `${C.green}${s}${C.reset}`; }
function yellow(s) { return `${C.yellow}${s}${C.reset}`; }
function red(s) { return `${C.red}${s}${C.reset}`; }
function grey(s) { return `${C.grey}${s}${C.reset}`; }

// ── Main print function ───────────────────────────────────────────────────
function printResults(results, iflwFileName) {
    if (results.length === 0) {
        console.log(yellow("\n⚠️   No header entries found in this iflow."));
        return;
    }

    // Group by callActivityId
    const grouped = {};
    for (const row of results) {
        const key = row.callActivityId;
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(row);
    }

    console.log("\n" + "═".repeat(72));
    console.log(bold(cyan(`  iFlow File : ${iflwFileName}`)));
    console.log("═".repeat(72));

    for (const [caId, rows] of Object.entries(grouped)) {
        const caName = rows[0].callActivityName;

        console.log(
            `\n  ${bold("📌 CallActivity:")} ${bold(cyan(caName))}  ${grey(`(${caId})`)}`
        );
        console.log("  " + "─".repeat(68));

        // Print column header
        console.log(
            `  ${bold("Header Name".padEnd(28))}` +
            `${bold("Value".padEnd(30))}` +
            `${bold("Source")}`
        );
        console.log("  " + "─".repeat(68));

        for (const row of rows) {
            const nameCol = row.headerName.padEnd(28);
            let valueCol;
            let sourceLabel;

            if (row.headerName === "(empty headerTable)") {
                // The whole table was empty
                console.log(`  ${grey("(no header rows defined)")}`);
                continue;
            }

            if (row.resolvedFrom === "direct") {
                valueCol = green(row.resolvedValue.padEnd(30));
                sourceLabel = grey("direct value");
            } else if (row.resolvedFrom === "parameters.prop") {
                const displayVal = row.resolvedValue === ""
                    ? grey("<empty>")
                    : green(row.resolvedValue);
                valueCol = (row.resolvedValue === ""
                    ? grey("<empty>")
                    : green(row.resolvedValue)).padEnd(30);
                sourceLabel = yellow("parameters.prop");
                // Fix padEnd on coloured string (ANSI chars shift length)
                valueCol = displayVal;
                sourceLabel = yellow("↑ parameters.prop");
            } else {
                // NOT_FOUND — show raw placeholder in red
                valueCol = red(row.rawValue);
                sourceLabel = red("❌ NOT FOUND in parameters.prop");
            }

            console.log(`  ${bold(nameCol)}${valueCol}  ${sourceLabel}`);
        }
    }

    console.log("\n" + "═".repeat(72));

    // ── Summary stats ─────────────────────────────────────────────────────
    const realRows = results.filter((r) => r.headerName !== "(empty headerTable)");
    const resolved = realRows.filter((r) => r.resolvedFrom === "parameters.prop");
    const direct = realRows.filter((r) => r.resolvedFrom === "direct");
    const notFound = realRows.filter((r) => r.resolvedFrom === "NOT_FOUND");

    console.log(bold("\n  📊 Summary"));
    console.log(`     Total headers    : ${bold(realRows.length)}`);
    console.log(`     Direct values    : ${green(direct.length)}`);
    console.log(`     From prop file   : ${yellow(resolved.length)}`);
    console.log(`     ❌ Not resolved  : ${notFound.length > 0 ? red(notFound.length) : "0"}`);
    console.log();
}

module.exports = { printResults };
