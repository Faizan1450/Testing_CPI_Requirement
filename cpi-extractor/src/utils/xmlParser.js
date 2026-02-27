/**
 * utils/xmlParser.js
 * ─────────────────────────────────────────────
 * Thin wrapper around xml2js for consistent parse options.
 * Used in two places:
 *   1. Parsing the full .iflw file
 *   2. Parsing the embedded headerTable XML string (after HTML-entity decode)
 */

const xml2js = require("xml2js");

/**
 * Parse an XML string into a JS object (async).
 * @param {string} xmlString
 * @returns {Promise<object>}
 */
async function parseXml(xmlString) {
    return xml2js.parseStringPromise(xmlString, {
        explicitArray: true,   // always wrap children in arrays → consistent access
        explicitCharkey: true, // text content lives at obj._ not obj
        attrkey: "$",          // attribute bag is obj.$
        charkey: "_",          // text content key
        trim: true,
    });
}

/**
 * Decode HTML entities that SAP uses inside ifl property values.
 * SAP embeds the inner XML using &lt; &gt; &amp; etc.
 * @param {string} str
 * @returns {string}
 */
function decodeHtmlEntities(str) {
    return str
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&amp;/g, "&")
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'");
}

module.exports = { parseXml, decodeHtmlEntities };
