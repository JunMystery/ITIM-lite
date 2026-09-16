/**
 * Verification test suite for modern TypeScript + Tailwind build artifacts & constraints
 */

const fs = require("fs");
const path = require("path");
const assert = require("assert");

console.log("=== TypeScript + Tailwind Build & Architecture Tests ===");

// 1. Check dist/ITIM.hta and dist/index.html and root ITIM.hta
const htaPath = path.join(__dirname, "../dist/ITIM.hta");
const htmlPath = path.join(__dirname, "../dist/index.html");
const rootHtaPath = path.join(__dirname, "../ITIM.hta");

assert(fs.existsSync(htaPath), "dist/ITIM.hta must exist");
assert(fs.existsSync(htmlPath), "dist/index.html must exist");
assert(fs.existsSync(rootHtaPath), "root ITIM.hta must exist");

const htaContent = fs.readFileSync(htaPath, "utf8");
assert(htaContent.includes("<hta:application"), "dist/ITIM.hta must contain HTA declaration");
assert(htaContent.includes('content="IE=edge"'), "dist/ITIM.hta must contain IE=edge emulation header");
assert(htaContent.includes("polyfills-legacy"), "dist/ITIM.hta must load legacy polyfills");
assert(htaContent.includes("index-legacy"), "dist/ITIM.hta must load legacy index bundle");
assert(!htaContent.includes("type=\"module\""), "dist/ITIM.hta must strip ES module scripts for MSHTA/IE11");
assert(!htaContent.includes("crossorigin"), "dist/ITIM.hta must strip crossorigin to prevent file:// CORS errors");
console.log("  ✓ dist/ITIM.hta properly formatted with HTA headers, no module scripts, and no CORS issues");

const rootHtaContent = fs.readFileSync(rootHtaPath, "utf8");
assert(rootHtaContent.includes("dist/assets/"), "root ITIM.hta must point to dist/assets");
console.log("  ✓ root ITIM.hta correctly references compiled dist assets");

const htmlContent = fs.readFileSync(htmlPath, "utf8");
assert(htmlContent.includes('<div id="app"></div>'), "dist/index.html must include #app mount point");
console.log("  ✓ dist/index.html properly contains app root");

// 2. Check compiled Tailwind CSS
const assetsDir = path.join(__dirname, "../dist/assets");
const files = fs.readdirSync(assetsDir);
const cssFile = files.find((f) => f.endsWith(".css"));
assert(cssFile, "Compiled Tailwind CSS must exist in dist/assets");

const cssContent = fs.readFileSync(path.join(assetsDir, cssFile), "utf8");
assert(cssContent.length > 5000, "Compiled Tailwind CSS must contain substantial utility styles");
console.log(`  ✓ Compiled Tailwind CSS bundle generated (${(cssContent.length / 1024).toFixed(1)} KB)`);

// 3. Strict Check: ZERO Cartoon Emojis in any src/ file
const emojiRegex = /[\u{1F300}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2702}-\u{27B0}]/u;
function scanFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const ent of entries) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      scanFiles(full);
    } else if (ent.name.endsWith(".ts")) {
      const content = fs.readFileSync(full, "utf8");
      const match = content.match(emojiRegex);
      assert(!match, `Emoji found in ${full}: ${match ? match[0] : ""}`);
      
      const loc = content.split("\n").length;
      assert(loc < 300, `File ${full} exceeds 300 LOC limit (current: ${loc})`);
    }
  }
}

scanFiles(path.join(__dirname, "../src"));
console.log("  ✓ Strict Zero-Emoji constraint verified across all TypeScript source files");
console.log("  ✓ Strict 300 LOC limit constraint verified across all TypeScript source files");

console.log("\n==========================================");
console.log("ALL TS + TAILWIND ARTIFACT TESTS PASSED.");
console.log("==========================================\n");
