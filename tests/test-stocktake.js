/* ==========================================================================
   ITIM-lite - Stocktaking & Inventory Audit Test Suite
   ========================================================================== */

function runStocktakeTests(assert, ctx) {
  console.log("\n=== 19. Stocktaking & Inventory Audit Tests ===");

  var sService = ctx.StocktakeService;
  var invService = ctx.InventoryService;
  assert(typeof sService !== "undefined", "StocktakeService is defined");

  // 1. Initial seed data
  var allSessions = sService.getAll();
  assert(allSessions.length >= 1, "Initial seed stocktake sessions exist (" + allSessions.length + " sessions)");
  var seed = sService.getById("STK-7001");
  assert(seed && seed.status === "completed", "Seed session STK-7001 found and completed");

  // 2. Create new session with all hardware scope
  var createRes = sService.createSession({
    name: "Q3 2026 Floor 2 Hardware Audit",
    scopeType: "all",
    auditor: "Senior IT Auditor",
    notes: "Floor 2 comprehensive hardware audit"
  });
  assert(createRes.success === true, "Successfully created new audit session");
  var session = createRes.session;
  assert(session.id && session.id.indexOf("STK-") === 0, "Generated unique Session ID: " + session.id);
  assert(session.status === "in_progress", "Session status is in_progress");
  assert(session.expectedAssets.length > 0, "Session captured expected assets snapshot (" + session.expectedAssets.length + " items)");

  // 3. Scan first expected asset (AST-1001)
  var scanRes1 = sService.recordScan(session.id, "AST-1001", { actualLocation: "Floor 3 - Desk 312", actualCondition: "Good" });
  assert(scanRes1.success === true && scanRes1.alreadyScanned === false, "Successfully scanned expected asset AST-1001");
  assert(scanRes1.isSurplus === false, "Asset is not marked surplus");

  // 4. Duplicate scan detection
  var dupScanRes = sService.recordScan(session.id, "AST-1001");
  assert(dupScanRes.success === true && dupScanRes.alreadyScanned === true, "Duplicate scan detected correctly");

  // 5. Scan surplus / uncataloged asset
  var surplusScan = sService.recordScan(session.id, "AST-UNREGISTERED-999");
  assert(surplusScan.success === true && surplusScan.isSurplus === true, "Surplus uncataloged asset recorded");

  // 6. Manual toggle item found
  var targetAssetId = session.expectedAssets[1] ? session.expectedAssets[1].assetId : "AST-1002";
  var togRes = sService.toggleItemFound(session.id, targetAssetId, true);
  assert(togRes.success === true, "Manually toggled item found on checklist");

  // 7. Discrepancy reconciliation calculation
  var recon = sService.getReconciliation(session.id);
  assert(recon !== null, "Generated reconciliation report data");
  assert(recon.stats.matchedCount >= 2, "Reconciliation counted at least 2 matched items");
  assert(recon.stats.surplusCount >= 1, "Reconciliation counted at least 1 surplus item");
  assert(recon.stats.missingCount >= 0, "Reconciliation counted missing items: " + recon.stats.missingCount);

  // 8. Generate printable HTML report
  var reportHtml = sService.generateReportHtml(session.id);
  assert(reportHtml.indexOf(session.id) !== -1, "Report contains session ID");
  assert(reportHtml.indexOf("Physical Inventory Stocktake") !== -1, "Report contains stocktake header");
  assert(reportHtml.indexOf("Missing Hardware Assets") !== -1, "Report contains missing assets table");
  assert(reportHtml.indexOf("Surplus / Uncataloged Items") !== -1, "Report contains surplus items table");
  assert(reportHtml.indexOf("Auditor / Lead") !== -1, "Report contains auditor signature block");

  // 9. Complete session and synchronize status
  var closeRes = sService.completeSession(session.id, { syncStatus: true, notes: "Audit completed by team." });
  assert(closeRes.success === true, "Session completed successfully");
  assert(sService.getById(session.id).status === "completed", "Session status transitioned to completed");
  assert(sService.getById(session.id).closedAt.length > 0, "Session closedAt timestamp recorded");

  // Verify missing assets retired if syncStatus was true
  if (recon.missing.length > 0) {
    var missingSample = invService.getById(recon.missing[0].assetId);
    assert(missingSample && missingSample.status === "retired", "Missing asset " + recon.missing[0].assetId + " transitioned to retired");
  }
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { runStocktakeTests: runStocktakeTests };
}
