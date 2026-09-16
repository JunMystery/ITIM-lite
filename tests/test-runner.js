/* ==========================================================================
   ITIM-lite - Automated Unit Test Suite
   ========================================================================== */

var fs = require("fs");
var path = require("path");

// Mock browser environment for Node.js test execution
global.window = { location: { pathname: path.join(process.cwd(), "ITIM.hta") } };
global.localStorage = {
  store: {},
  getItem: function (k) { return this.store[k] || null; },
  setItem: function (k, v) { this.store[k] = String(v); },
  removeItem: function (k) { delete this.store[k]; }
};
global.alert = function () {};

// Load modules sequentially
function loadModule(relPath) {
  eval.call(global, fs.readFileSync(path.join(__dirname, "..", relPath), "utf8"));
}

[
  "config.js", "i18n.js", "fso-storage.js", "backup-engine.js", "barcode-qr.js",
  "inventory-service.js", "licenses-service.js", "consumables-service.js",
  "assignments-service.js", "transactions-service.js", "stocktake-service.js", "po-service.js",
  "export-import.js", "ui-combobox.js", "ui-pagination.js", "ui-actions-menu.js",
  "ui-layout.js", "ui-inbound.js", "ui-item-picker.js", "ui-audit.js", "ui-item-detail.js"
].forEach(function (m) { loadModule("js/" + m); });

// Mock AppState
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

console.log("\n=== 1. InventoryService Tests ===");
var initialCount = InventoryService.getAll().length;
assert(initialCount === 4, "Initial seed assets count is 4");
var directBlocked = false;
try { InventoryService.add({ name: "Direct Rogue", category: "Laptop", serial: "R-1" }); } catch (e) { directBlocked = true; }
assert(directBlocked, "Direct asset creation without PO is strictly blocked");
var newAsset = InventoryService.addInboundAsset({
  name: "MacBook Pro 16 M3", category: "Laptop", serial: "C02XYZ12345",
  model: "M3 Pro 36GB 512GB", status: "available", poNumber: "PO-8001"
});
assert(newAsset.id && newAsset.id.indexOf("AST-") === 0, "Generated valid Asset ID: " + newAsset.id);
assert(InventoryService.getAll().length === initialCount + 1, "Asset count incremented to " + (initialCount + 1));
var found = InventoryService.getById(newAsset.id);
assert(found && found.name === "MacBook Pro 16 M3", "Retrieved asset by ID");
var filtered = InventoryService.filter("MacBook", "all", "all");
assert(filtered.length === 1 && filtered[0].id === newAsset.id, "Filtered asset by search keyword");
var metrics = InventoryService.getMetrics();
assert(metrics.total === 5 && metrics.available >= 1, "Total & available assets metrics valid");

console.log("\n=== 2. LicensesService Tests ===");
assert(LicensesService.getAll().length === 2, "Initial seed licenses count is 2");
var newLic = LicensesService.add({ software: "JetBrains Suite", vendor: "JetBrains", type: "Annual Subscription", totalSeats: 15, assignedSeats: 12, key: "JB-9999" });
assert(newLic.id && newLic.id.indexOf("LIC-") === 0, "Created license ID: " + newLic.id);
assert(LicensesService.getMetrics().availableSeats >= 3, "Calculated available license seats correctly");
var zeroLic = LicensesService.add({ software: "Zero App", vendor: "Open", type: "Perpetual", totalSeats: 0, assignedSeats: 0, key: "Z-0" });
assert(zeroLic.totalSeats === 0 && LicensesService.getById(zeroLic.id) !== null, "License seats can reach 0 and entry is not deleted");

console.log("\n=== 3. ConsumablesService Tests ===");
var directConBlocked = false;
try { ConsumablesService.add({ name: "Rogue Cable", quantity: 5 }); } catch (e) { directConBlocked = true; }
assert(directConBlocked, "Direct consumable creation without PO is strictly blocked");
var initialCon = ConsumablesService.getById("CON-3001");
var initialQty = initialCon.quantity;
ConsumablesService.adjustQuantity("CON-3001", 5);
assert(ConsumablesService.getById("CON-3001").quantity === initialQty + 5, "Increased stock by +5");
ConsumablesService.adjustQuantity("CON-3001", -2);
assert(ConsumablesService.getById("CON-3001").quantity === initialQty + 3, "Decreased stock by -2");
var conCountBefore = ConsumablesService.getAll().length;
ConsumablesService.adjustQuantity("CON-3001", -9999);
assert(ConsumablesService.getById("CON-3001").quantity === 0, "Consumable stock reaches 0");
assert(ConsumablesService.getAll().length === conCountBefore, "Consumable entry not deleted when reaching 0");
assert(ConsumablesService.getLowStockItems().length >= 1, "Detected low stock consumables below threshold");

console.log("\n=== 4. AssignmentsService Tests ===");
var checkoutRes = AssignmentsService.checkout({
  assetId: newAsset.id, employeeName: "Alice Walker", department: "Design", conditionOut: "Pristine / Factory Sealed"
});
assert(checkoutRes.success, "Successfully checked out asset to employee");
assert(InventoryService.getById(newAsset.id).status === "inuse", "Asset status transitioned to inuse");
var checkinRes = AssignmentsService.checkin(checkoutRes.assignment.id, "Good Condition", "Returned on schedule");
assert(checkinRes.success, "Successfully returned asset");
assert(InventoryService.getById(newAsset.id).status === "available", "Asset status transitioned back to available");
var logs = AuditService.getAll();
assert(logs.length > 0, "Audit logs recorded: " + logs.length + " entries");

console.log("\n=== 5. ExportImportService (Items CSV Deleted) Tests ===");
assert(typeof ExportImportService.exportAssetsToCsv === "undefined", "Item CSV export function deleted");
assert(typeof ExportImportService.importAssetsFromCsv === "undefined", "Item CSV import function deleted");
var licCsv = ExportImportService.exportLicensesToCsv();
assert(typeof licCsv === "string" && licCsv.indexOf('"License ID"') !== -1, "Licenses CSV export intact");
var htaSrc = fs.readFileSync(path.join(__dirname, "../ITIM.hta"), "utf8");
var htmlSrc = fs.readFileSync(path.join(__dirname, "../index.html"), "utf8");
assert(htaSrc.indexOf("csv-import-file-input") === -1 && htmlSrc.indexOf("csv-import-file-input") === -1, "csv-import-file-input removed from shells");

console.log("\n=== 6. BarcodeQR Generator Tests ===");
var barcodeSvg = BarcodeQR.generateBarcodeSvg("AST-1001", 35, 2);
assert(barcodeSvg.indexOf("<svg") === 0 && barcodeSvg.indexOf("</svg>") !== -1, "Generated valid Code39 SVG barcode");
assert(barcodeSvg.indexOf("AST-1001") !== -1, "Barcode contains label text");

var qrSvg = BarcodeQR.generateQrSvg("AST-1001", 80);
assert(qrSvg.indexOf("<svg") === 0 && qrSvg.indexOf("</svg>") !== -1, "Generated valid QR Code SVG");

console.log("\n=== 7. BackupEngine Tests ===");
var backupRes = BackupEngine.createBackup(".\\data", AppState.db);
assert(backupRes.success && BackupEngine.listBackups(".\\data").length >= 1, "Created & listed backup snapshot");
BackupEngine.pruneOldBackups(".\\data", { maxBackupCount: 1, autoCleanMode: "count" });
assert(BackupEngine.listBackups(".\\data").length <= 1, "Cleaned backup by count");
var oldName = "inventory_backup_2020-01-01_00-00-00.json";
localStorage.setItem("ITIM_BACKUP_" + oldName, "{}");
var curIdx = BackupEngine.listBackups(".\\data");
curIdx.push({ name: oldName, path: oldName, size: 2, dateCreated: "2020-01-01" });
localStorage.setItem("ITIM_BACKUPS_INDEX", JSON.stringify(curIdx));
BackupEngine.pruneOldBackups(".\\data", { autoCleanMode: "date", autoCleanDays: 1 });
var afterClean = BackupEngine.listBackups(".\\data");
assert(!afterClean.some(function (c) { return c.name === oldName; }), "Cleaned old backup by date");

console.log("\n=== 8. Multilingual i18n & Placeholders Tests (EN, VI, JP) ===");
I18N.setLang("en");
assert(I18N.getLang() === "en" && I18N.t("dash_title") === "IT Operations & Fleet Command" && I18N.t("nav_audit") === "Inventory Audit", "EN i18n & stocktake verified");
I18N.setLang("vi");
assert(I18N.getLang() === "vi" && I18N.t("nav_dashboard") === "Bảng điều khiển" && I18N.t("nav_audit") === "Kiểm kê", "VI i18n & stocktake verified");
I18N.setLang("jp");
assert(I18N.getLang() === "jp" && I18N.t("nav_dashboard") === "ダッシュボード" && I18N.t("nav_audit") === "実地棚卸", "JP i18n & stocktake verified");
I18N.setLang("en");

console.log("\n=== 9. TransactionsService & Bulk Operations Tests ===");
var seedTxnCount = TransactionsService.getAll().length;
assert(seedTxnCount >= 1, "Initial transaction history count is valid (" + seedTxnCount + " txns)");

// Test bulk checkout with 2 assets
var bulkOutRes = TransactionsService.checkoutBulk({
  assetIds: ["AST-1002", "AST-1003"], employeeName: "Bob Smith", department: "Engineering",
  expectedReturnDate: "2026-12-31", notes: "Dual monitor setup", officer: "IT Admin"
});
assert(bulkOutRes.success === true, "Bulk checkout succeeded for multiple assets");
assert(bulkOutRes.transaction && bulkOutRes.transaction.id.indexOf("TXN-") === 0, "Generated unique Txn ID: " + (bulkOutRes.transaction ? bulkOutRes.transaction.id : ""));
assert(bulkOutRes.transaction.itemCount === 2, "Transaction recorded exactly 2 items");
assert(InventoryService.getById("AST-1002").status === "inuse", "AST-1002 transitioned to inuse");
assert(InventoryService.getById("AST-1003").status === "inuse", "AST-1003 transitioned to inuse");

var nextTxnId = TransactionsService.generateNextTxnId();
assert(nextTxnId !== bulkOutRes.transaction.id, "Generated non-colliding subsequent Txn ID: " + nextTxnId);

// Test bulk checkin
var bulkInRes = TransactionsService.checkinBulk({
  assetIds: ["AST-1002", "AST-1003"], condition: "Good", notes: "Returned after project completion", officer: "IT Admin"
});
assert(bulkInRes.success === true, "Bulk checkin succeeded for multiple assets");
assert(bulkInRes.transaction.type === "CHECKIN", "Recorded CHECKIN transaction type");
assert(InventoryService.getById("AST-1002").status === "available", "AST-1002 transitioned back to available");
assert(InventoryService.getById("AST-1003").status === "available", "AST-1003 transitioned back to available");

// Test bulk status change
var bulkStatusRes = TransactionsService.changeStatusBulk(["AST-1002"], "repair", "Scheduled maintenance", "IT Admin");
assert(bulkStatusRes.success === true, "Bulk status change succeeded");
assert(InventoryService.getById("AST-1002").status === "repair", "AST-1002 transitioned to repair");

// Test receipt HTML generation
var receiptHtml = TransactionsService.generateReceiptHtml(bulkOutRes.transaction);
assert(receiptHtml.indexOf(bulkOutRes.transaction.id) !== -1, "Receipt contains Txn ID");
assert(receiptHtml.indexOf("Bob Smith") !== -1, "Receipt contains employee name");

// Test detail view data lookup
var txnDetail = TransactionsService.getById(bulkOutRes.transaction.id);
assert(txnDetail !== null && txnDetail.items.length === 2, "Found transaction record for detail view with 2 items");
assert(txnDetail.items[0].assetId === "AST-1002" && txnDetail.items[1].assetId === "AST-1003", "Detail view item assetIds valid");
assert(I18N.t("btn_new_txn") === "+ New Transaction" && I18N.t("btn_details") === "Details", "EN txn i18n translated");
assert(I18N.t("txn_detail_title") === "Transaction Details & Sign-Off", "EN txn_detail_title translated");

console.log("\n=== 10. UIPagination & UI_ComboBox Tests ===");
var sampleItems = [];
for (var i = 1; i <= 25; i++) sampleItems.push({ id: "ITEM-" + i, name: "Item " + i });
var p1 = UIPagination.paginate(sampleItems, 1, 10);
assert(p1.totalItems === 25 && p1.totalPages === 3 && p1.currentPage === 1, "Pagination metadata calculated");
assert(p1.pagedItems.length === 10 && p1.startItem === 1 && p1.endItem === 10, "Page 1 range 1-10");
var p3 = UIPagination.paginate(sampleItems, 3, 10);
assert(p3.pagedItems.length === 5 && p3.startItem === 21 && p3.endItem === 25, "Page 3 range 21-25");
var pOut = UIPagination.paginate(sampleItems, 99, 10);
assert(pOut.currentPage === 3, "Out of bounds page 99 clamped to 3");
var pLow = UIPagination.paginate(sampleItems, -5, 10);
assert(pLow.currentPage === 1, "Negative page -5 clamped to 1");
var p50 = UIPagination.paginate(sampleItems, 1, 50);
assert(p50.totalPages === 1 && p50.pagedItems.length === 25, "PageSize 50 returns 1 page with all 25 items");

var comboHtml = UI_ComboBox.renderHtml("test-combo", [{ value: "10", text: "10" }, { value: "25", text: "25" }], "25");
assert(comboHtml.indexOf('id="test-combo"') !== -1 && comboHtml.indexOf('value="25"') !== -1, "Rendered combo box");
assert(I18N.t("showing_items") === "Showing" && I18N.t("per_page") === "per page", "EN pagination translated");

console.log("\n=== 11. Minimal Host Shells & UI_Layout Tests ===");
var mockApp = { innerHTML: "" }, mockModal = { innerHTML: "" };
global.document = { getElementById: function (id) { return id === "app" ? mockApp : (id === "modal-host" ? mockModal : null); } };
UI_Layout.render();
assert(mockApp.innerHTML.indexOf("view-dashboard") !== -1 && mockApp.innerHTML.indexOf("bulk-dock-bar") !== -1, "UI_Layout rendered views & bulk-dock-bar");
assert(mockApp.innerHTML.indexOf('data-view="assignments"') === -1, "Assignments removed from navigation sidebar");
assert(mockApp.innerHTML.indexOf('data-view="licenses"') === -1 && mockApp.innerHTML.indexOf('data-view="consumables"') === -1, "Separate licenses and consumables removed from navigation sidebar");
assert(mockApp.innerHTML.indexOf('tab-btn-assets') !== -1 && mockApp.innerHTML.indexOf('tab-btn-licenses') !== -1 && mockApp.innerHTML.indexOf('tab-btn-consumables') !== -1, "Inventory tabs rendered in UI_Layout");
assert(mockApp.innerHTML.indexOf('id="lang-switcher"') !== -1 && mockApp.innerHTML.indexOf("sidebar-controls") !== -1, "lang-switcher and theme toggle placed in sidebar footer");
assert(mockApp.innerHTML.indexOf("triggerCsv") === -1, "UI_Layout contains no CSV triggers");
var htaLines = fs.readFileSync(path.join(__dirname, "../ITIM.hta"), "utf8").trim().split("\n").length;
var htmlLines = fs.readFileSync(path.join(__dirname, "../index.html"), "utf8").trim().split("\n").length;
assert(htaLines < 60 && htmlLines < 60, "ITIM.hta and index.html are minimal (" + htaLines + ", " + htmlLines + " lines)");

console.log("\n=== 12. POService & Inbound Intake Enforcement Tests ===");
assert(POService.getAll().length === 3, "Initial seed PO count is 3");
var emptyPoBlocked = false;
try { POService.createPO({ vendor: "", items: [] }); } catch (e) { emptyPoBlocked = true; }
assert(emptyPoBlocked, "Invalid empty PO creation is blocked");
var po = POService.createPO({ vendor: "Apple Enterprise", items: [{ name: "MacBook Air M3", category: "Laptop", model: "Air M3 16GB", qtyOrdered: 2 }] });
assert(po.poNumber && po.poNumber.indexOf("PO-") === 0 && po.status === "pending", "New PO pending: " + po.poNumber);
var rec1 = POService.receiveItems(po.poNumber, 0, { serials: ["MBA-SN-001"], location: "IT Room Shelf C" });
assert(rec1.success && rec1.assets.length === 1 && po.status === "partial", "Received 1 asset, status partial");
assert(rec1.assets[0].poNumber === po.poNumber && rec1.transaction.type === "INBOUND", "Linked PO & INBOUND tx");
var rec2 = POService.receiveItems(po.poNumber, 0, { serials: ["MBA-SN-002"], location: "IT Room Shelf C" });
assert(po.status === "received" && po.receivedDate.length > 0, "PO received upon completion");
var conPo = POService.createPO({ vendor: "Anker Direct", items: [{ name: "Cat6 Ethernet Cable (2m / 6ft)", category: "Cables & Adapters", qtyOrdered: 10 }] });
var recCon = POService.receiveItems(conPo.poNumber, 0, { qty: 10, location: "Shelf B" });
assert(recCon.success && recCon.isConsumable && recCon.consumables.length === 1, "Consumable received via PO inbound intake");

console.log("\n=== 13. UI_Inbound Modal Activation Tests ===");
UI_Inbound.openCreateModal();
assert(mockModal.innerHTML.indexOf("modal-backdrop open") !== -1 && mockModal.innerHTML.indexOf("UI_Inbound.closeModal()") !== -1, "New PO modal opens with backdrop click dismiss");
UI_Inbound.openReceiveModal("PO-8003");
assert(mockModal.innerHTML.indexOf("Receive Inbound") !== -1, "Receive modal opens");
UI_Inbound.openDetailModal("PO-8001");
assert(mockModal.innerHTML.indexOf("Purchase Order - PO-8001") !== -1, "Detail modal opens");
UI_Inbound.closeModal();
assert(mockModal.innerHTML === "", "closeModal clears modal host");

console.log("\n=== 14. UI_ActionsMenu & Row Interaction Tests ===");
var assetActions = UI_ActionsMenu.getActions("asset", "AST-001");
var poActions = UI_ActionsMenu.getActions("inbound", "PO-8003");
var licActions = UI_ActionsMenu.getActions("license", "LIC-001");
assert(assetActions.length >= 2 && poActions.length >= 2 && licActions.length >= 2, "UI_ActionsMenu returns actions for tables");
assert(typeof assetActions[0].run === "function" && assetActions[0].label && assetActions[0].icon, "Action objects valid");

// ==========================================
// 15. IE11 Compatibility & Modal Layout Tests
// ==========================================
console.log("\n=== 15. IE11 Compatibility & Modal Layout Tests ===");
var jsDir = path.join(__dirname, "../js");
var codeHist = fs.readFileSync(path.join(jsDir, "ui-history.js"), "utf8");
assert(codeHist.indexOf('var modal = document.getElementById("transaction-modal");') !== -1, "UI_History declares modal element");
var codeDet = fs.readFileSync(path.join(jsDir, "ui-detail.js"), "utf8");
assert(codeDet.indexOf("closeModal();") === -1 && codeDet.indexOf("closeModal: close") !== -1, "UI_Detail defines closeModal alias and avoids undefined closeModal call");
var cssModals = fs.readFileSync(path.join(__dirname, "../css/modals.css"), "utf8");
assert(cssModals.indexOf("vertical-align: middle;") !== -1 && cssModals.indexOf("max-height: 65vh;") !== -1, "css/modals.css uses vertical-align middle and max-height 65vh on modal");
var noBadCalls = ["ui-inbound.js", "ui-categories.js", "ui-detail.js", "ui-catalog.js", "ui-assignments.js", "ui-item-picker.js"].every(function (f) {
  var c = fs.readFileSync(path.join(jsDir, f), "utf8");
  return c.indexOf(".closest(") === -1 && c.indexOf(".remove()") === -1;
});
assert(noBadCalls, "No unsupported .closest() or .remove() calls in active UI scripts");
var allUnder300 = fs.readdirSync(jsDir).filter(function (f) { return f.endsWith(".js"); }).every(function (f) {
  return fs.readFileSync(path.join(jsDir, f), "utf8").split("\n").length < 300;
});
assert(allUnder300, "All source JS files remain strictly < 300 LOC");

// 16. Multi-Item Handover & Disposal Test Suite
require("./test-multi-item.js").runMultiItemTests(assert, {
  InventoryService: InventoryService, LicensesService: LicensesService,
  ConsumablesService: ConsumablesService, AssignmentsService: AssignmentsService,
  TransactionsService: TransactionsService, UI_ItemPicker: global.UI_ItemPicker
});

// 19. Stocktaking & Inventory Audit Test Suite
require("./test-stocktake.js").runStocktakeTests(assert, {
  StocktakeService: StocktakeService, InventoryService: InventoryService
});

// 20. UI_ItemDetail & Consolidated Inventory Tests
console.log("\n=== 20. UI_ItemDetail & Consolidated Inventory Tests ===");
assert(typeof UI_ItemDetail !== "undefined" && typeof UI_ItemDetail.open === "function", "UI_ItemDetail is defined");
var itemDetailOpened = null;
var origDetailOpen = UI_ItemDetail.open;
UI_ItemDetail.open = function (t, id) { itemDetailOpened = { type: t, id: id }; };
UI_ActionsMenu.onRowClick(null, "asset", "AST-1001");
assert(itemDetailOpened && itemDetailOpened.type === "asset" && itemDetailOpened.id === "AST-1001", "Row click on asset triggers UI_ItemDetail.open");
UI_ActionsMenu.onRowClick(null, "license", "LIC-2001");
assert(itemDetailOpened && itemDetailOpened.type === "license" && itemDetailOpened.id === "LIC-2001", "Row click on license triggers UI_ItemDetail.open");
UI_ActionsMenu.onRowClick(null, "consumable", "CON-3001");
assert(itemDetailOpened && itemDetailOpened.type === "consumable" && itemDetailOpened.id === "CON-3001", "Row click on consumable triggers UI_ItemDetail.open");
UI_ItemDetail.open = origDetailOpen;

console.log("\n==========================================");
console.log("TEST RESULTS: " + passed + " passed, " + failed + " failed.");
console.log("==========================================\n");

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
