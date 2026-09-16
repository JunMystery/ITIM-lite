/* ==========================================================================
   ITIM-lite - Category & Custom Fields Automated Test Suite
   ========================================================================== */

var fs = require("fs");
var path = require("path");

global.window = { location: { pathname: path.join(process.cwd(), "ITIM.hta") } };
global.localStorage = { store: {}, getItem: function (k) { return this.store[k] || null; }, setItem: function (k, v) { this.store[k] = String(v); } };
global.alert = function () {};

function loadModule(relPath) {
  var full = path.join(__dirname, "..", relPath);
  var code = fs.readFileSync(full, "utf8");
  eval.call(global, code);
}

["config.js", "i18n.js", "fso-storage.js", "category-service.js", "catalog-service.js"].forEach(function (m) {
  loadModule("js/" + m);
});

global.AppState = {
  db: JSON.parse(JSON.stringify(global.ITIM_CONFIG.DEFAULT_SEED_DATA)),
  getStoragePath: function () { return ".\\data"; },
  save: function () { return true; }
};

var passed = 0;
var failed = 0;

function assert(condition, message) {
  if (condition) {
    passed++;
    console.log("  ✓ " + message);
  } else {
    failed++;
    console.error("  ✕ FAIL: " + message);
  }
}

console.log("\n=== 1. Category Service Seed & Listing Tests ===");
var cats = CategoryService.list();
assert(cats.length >= 5, "Loaded " + cats.length + " initial seed categories (>= 5)");

var laptopCat = CategoryService.getByName("Laptop");
assert(laptopCat !== null && laptopCat.id === "cat-laptop", "Found 'Laptop' category by name");
assert(Array.isArray(laptopCat.customFields) && laptopCat.customFields.length >= 3, "Laptop has " + (laptopCat.customFields ? laptopCat.customFields.length : 0) + " custom fields defined");

console.log("\n=== 2. Category Deletion Safeguard: Cannot Delete if Category has Items ===");
var laptopCount = CategoryService.getItemCount(laptopCat);
assert(laptopCount > 0, "Laptop category currently has " + laptopCount + " item(s) in Master Catalog");

var delLaptopRes = CategoryService.delete("cat-laptop");
assert(!delLaptopRes.success, "Deleting category with existing catalog items is strictly blocked");
assert(delLaptopRes.error && delLaptopRes.error.indexOf("Cannot delete category") !== -1, "Error message explains item block: " + delLaptopRes.error);
assert(CategoryService.getById("cat-laptop") !== null, "Laptop category preserved in database");

console.log("\n=== 3. Category Deletion Allowed when 0 Items ===");
var createRes = CategoryService.create({ name: "Temporary Peripherals", type: "hardware", description: "Empty test cat" });
assert(createRes.success, "Created empty test category: " + createRes.category.id);
var tempCount = CategoryService.getItemCount(createRes.category);
assert(tempCount === 0, "Empty category has 0 catalog items");

var delTempRes = CategoryService.delete(createRes.category.id);
assert(delTempRes.success, "Successfully deleted category with 0 catalog items");
assert(CategoryService.getById(createRes.category.id) === null, "Temporary category removed from database");

console.log("\n=== 4. Custom Field Management & Deletion Safeguard ===");
var addFieldRes = CategoryService.addCustomField("cat-laptop", { label: "Dedicated GPU", type: "text" });
assert(addFieldRes.success, "Added new custom field 'dedicated_gpu' to Laptop category");

// Attempt to delete 'cpu' field which has existing data in SKU-1001
var delCpuRes = CategoryService.deleteCustomField("cat-laptop", "cpu");
assert(!delCpuRes.success, "Deleting custom field with existing catalog item data is strictly blocked");
assert(delCpuRes.error && delCpuRes.error.indexOf("contain data") !== -1, "Error message explains data block: " + delCpuRes.error);

// Attempt to delete 'dedicated_gpu' field which has NO data
var delGpuRes = CategoryService.deleteCustomField("cat-laptop", "dedicated_gpu");
assert(delGpuRes.success, "Deleting custom field with NO catalog item data is allowed");

console.log("\n=== 5. Catalog Item Custom Field Integration ===");
var sku1001 = CatalogService.getById("SKU-1001");
assert(sku1001 !== null && typeof sku1001.customFields === "object", "Master Catalog item SKU-1001 has customFields object");
assert(sku1001.customFields.cpu === "Intel Core i7-1265U", "SKU-1001 custom field CPU is 'Intel Core i7-1265U'");
assert(sku1001.customFields.ram_gb === 16, "SKU-1001 custom field RAM is 16 GB");

console.log("\n==========================================");
console.log("CATEGORY SUITE: " + passed + " passed, " + failed + " failed.");
console.log("==========================================\n");

if (failed > 0) process.exit(1); else process.exit(0);
