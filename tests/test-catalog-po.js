/* ==========================================================================
   ITIM-lite - Master Catalog & Multi-SN PO Intake Unit Test Suite
   ========================================================================== */

var fs = require("fs");
var path = require("path");

global.window = {
  location: { pathname: path.join(process.cwd(), "ITIM.hta") }
};
global.localStorage = {
  store: {},
  getItem: function (k) { return this.store[k] || null; },
  setItem: function (k, v) { this.store[k] = String(v); },
  removeItem: function (k) { delete this.store[k]; }
};
global.alert = function () {};
global.confirm = function () { return true; };

function loadModule(relPath) {
  var full = path.join(__dirname, "..", relPath);
  var code = fs.readFileSync(full, "utf8");
  eval.call(global, code);
}

[
  "config.js", "i18n.js", "fso-storage.js", "backup-engine.js", "barcode-qr.js",
  "inventory-service.js", "licenses-service.js", "consumables-service.js",
  "assignments-service.js", "transactions-service.js", "catalog-service.js",
  "po-service.js", "export-import.js", "ui-combobox.js", "ui-pagination.js",
  "ui-actions-menu.js", "ui-layout.js", "ui-inbound.js", "ui-catalog.js"
].forEach(function (m) { loadModule("js/" + m); });

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

console.log("\n=== 1. Master Catalog Service Tests ===");
var initialCatalog = CatalogService.getAll();
assert(initialCatalog.length >= 3, "Initial seed catalog items count is " + initialCatalog.length + " (>= 3)");

var hwItems = CatalogService.getByType("hardware");
var swItems = CatalogService.getByType("software");
var conItems = CatalogService.getByType("consumable");
assert(hwItems.length >= 1 && swItems.length >= 1 && conItems.length >= 1, "Catalog items correctly filtered by type");

// Add item with auto-generated SKU
var newCat = CatalogService.add({
  name: "Dell UltraSharp 27 Monitor",
  type: "hardware",
  category: "Monitor",
  model: "U2723QE 4K USB-C Hub"
});
assert(newCat.id && newCat.sku && newCat.sku.indexOf("SKU-") === 0, "Auto-generated SKU for master item: " + newCat.sku);

// Add item with custom SKU / Barcode
var customCat = CatalogService.add({
  sku: "BARCODE-MS-WIN11-PRO",
  name: "Windows 11 Pro OEM",
  type: "software",
  category: "Operating System",
  model: "OEM 64-bit"
});
assert(customCat.sku === "BARCODE-MS-WIN11-PRO", "Custom SKU / Barcode registered: " + customCat.sku);

// Prevent duplicate SKU
var duplicateBlocked = false;
try {
  CatalogService.add({ sku: "BARCODE-MS-WIN11-PRO", name: "Dupe", type: "software" });
} catch (e) {
  duplicateBlocked = true;
}
assert(duplicateBlocked, "Duplicate SKU registration is strictly blocked");

// Update catalog item
var updated = CatalogService.update(newCat.id, { model: "U2723QE Revision B" });
assert(updated.model === "U2723QE Revision B", "Master catalog item updated successfully");

console.log("\n=== 2. PO Creation with Master Identification Tests ===");
var poWithMaster = POService.createPO({
  vendor: "Dell Direct B2B",
  items: [
    { masterId: newCat.id, qtyOrdered: 3 },
    { masterId: customCat.id, qtyOrdered: 5 }
  ]
});
assert(poWithMaster.poNumber && poWithMaster.items.length === 2, "Created PO linked to Master Catalog IDs");
assert(poWithMaster.items[0].name === "Dell UltraSharp 27 Monitor" && poWithMaster.items[0].type === "hardware", "Line item 0 resolved name & type from Master Catalog");
assert(poWithMaster.items[1].name === "Windows 11 Pro OEM" && poWithMaster.items[1].type === "software", "Line item 1 resolved software type from Master Catalog");

console.log("\n=== 3. Multi-SN Receive Validation: SN > Qty is NOT OK ===");
var snOverQtyBlocked = false;
var snErrorMsg = "";
try {
  // Ordered 3 units, trying to receive 2 units with 3 serial numbers -> SN > Qty must throw!
  POService.receiveItems(poWithMaster.poNumber, 0, {
    qty: 2,
    serials: ["SN-MON-001", "SN-MON-002", "SN-MON-003"],
    location: "IT Warehouse Shelf B"
  });
} catch (err) {
  snOverQtyBlocked = true;
  snErrorMsg = err.message;
}
assert(snOverQtyBlocked, "Intake with SN > Qty is strictly blocked with error: " + snErrorMsg);

console.log("\n=== 4. Multi-SN Receive Validation: SN <= Qty is OK (Blank SN allowed) ===");
// Case A: Partial SNs provided (1 serial provided for 2 items received, remaining item gets blank SN)
var recRes = POService.receiveItems(poWithMaster.poNumber, 0, {
  qty: 2,
  serials: ["SN-MON-001"],
  location: "IT Warehouse Shelf B"
});
assert(recRes.success && recRes.assets.length === 2, "Intake succeeded for 2 items with 1 serial");
assert(recRes.assets[0].serial === "SN-MON-001", "Asset 0 received entered serial SN-MON-001");
assert(recRes.assets[1].serial === "", "Asset 1 has blank serial (SN <= Qty allowed, no fake serial)");

// Case B: All SNs blank (0 serials provided for remaining 1 item)
var recRes2 = POService.receiveItems(poWithMaster.poNumber, 0, {
  qty: 1,
  serials: [],
  location: "IT Warehouse Shelf B"
});
assert(recRes2.success && recRes2.assets.length === 1, "Intake succeeded with 0 serials (all blank)");
assert(recRes2.assets[0].serial === "", "Asset received with blank serial");
assert(poWithMaster.items[0].qtyReceived === 3, "Line item 0 is fully received (3/3)");

console.log("\n=== 5. Software License PO Intake Tests ===");
var swRecRes = POService.receiveItems(poWithMaster.poNumber, 1, {
  qty: 5,
  location: "Cloud Digital Portal"
});
assert(swRecRes.success && swRecRes.assets.length === 0, "Software intake creates license seats without hardware assets");
var winLic = LicensesService.getAll().filter(function (l) { return l.software === "Windows 11 Pro OEM"; })[0];
assert(winLic && winLic.totalSeats === 5, "Windows license seats updated to 5 via PO intake");
assert(poWithMaster.status === "received", "Purchase order status transitioned to received");

console.log("\n=== 6. UI_ActionsMenu & Master Catalog UI Integration Tests ===");
var catActions = UI_ActionsMenu.getActions("catalog", newCat.id);
assert(catActions.length === 2, "UI_ActionsMenu returns 2 actions for catalog item");
assert(catActions[0].label === "Edit Catalog Item" && catActions[1].label === "Delete Item", "Edit and Delete actions available");

// Catalog remove test
CatalogService.remove(newCat.id);
assert(CatalogService.getById(newCat.id) === null, "Master catalog item removed");

console.log("\n==========================================");
console.log("CATALOG & PO SUITE: " + passed + " passed, " + failed + " failed.");
console.log("==========================================\n");

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
