const fs = require("fs");
const path = require("path");

const apiBase = String(process.env.NOVELHUB_API_BASE || "").trim().replace(/\/$/, "");
const output = `window.NOVELHUB_CONFIG = ${JSON.stringify({ apiBase })};\n`;
const target = path.join(__dirname, "..", "js", "config.js");

fs.writeFileSync(target, output, "utf8");
console.log(`NovelHub config generated${apiBase ? ` for ${apiBase}` : " without API base"}.`);
