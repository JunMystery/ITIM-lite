/* ==========================================================================
   ITIM-lite - Multi-Item Handover & Disposal Test Suite
   ========================================================================== */

function runMultiItemTests(assert, ctx) {
  console.log("\n=== 16. Multi-Item Handover & Disposal Tests ===");

  var con = ctx.ConsumablesService.getAll()[0];
  var lic = ctx.LicensesService.getAll()[0];
  var ast = ctx.InventoryService.getAll().filter(function(a){ return a.status === "available"; })[0];
  assert(con && lic && ast, "Pre-requisite items available for multi-item test");

  ctx.ConsumablesService.adjustQuantity(con.id, 20);
  var initConStock = con.quantity;
  var initLicSeats = lic.assignedSeats || 0;

  // 1. Checkout with attached consumables & software
  var asgRes = ctx.AssignmentsService.checkout({
    assetId: ast.id,
    employeeName: "Alice Cooper",
    department: "R&D",
    consumables: [{ id: con.id, name: con.name, quantity: 2 }],
    licenses: [{ id: lic.id, name: lic.software }]
  });
  assert(asgRes.success, "Checkout with attached consumables and software succeeded");
  assert(con.quantity === initConStock - 2, "Consumable stock decremented by 2 upon handover");
  assert(lic.assignedSeats === initLicSeats + 1, "License assigned seats incremented by 1 upon handover");
  assert(ast.status === "inuse", "Hardware asset marked inuse");
  assert(asgRes.assignment.txnId, "Handover generated linked transaction ID: " + asgRes.assignment.txnId);

  // 2. Check-in with disposal: consumable and software disposed, asset returned
  var asgId = asgRes.assignment.id;
  var conDisposals = {};
  conDisposals[con.id] = "disposal";
  var licDisposals = {};
  licDisposals[lic.id] = "disposal";
  var checkinDisposalRes = ctx.AssignmentsService.checkin(asgId, "Used", "Mouse damaged", {
    assetAction: "return",
    consumableActions: conDisposals,
    licenseActions: licDisposals
  });
  assert(checkinDisposalRes.success, "Check-in with disposal succeeded");
  assert(ast.status === "available", "Hardware asset returned to stock (available)");
  assert(con.quantity === initConStock - 2, "Consumable stock NOT returned when marked disposal");
  assert(lic.assignedSeats === initLicSeats + 1, "License seats NOT freed when marked disposal");

  // 3. Checkout second asset and checkin with return to stock
  var ast2 = ctx.InventoryService.getAll().filter(function(a){ return a.status === "available"; })[0];
  var asgRes2 = ctx.AssignmentsService.checkout({
    assetId: ast2.id,
    employeeName: "Bob Dylan",
    consumables: [{ id: con.id, name: con.name, quantity: 1 }],
    licenses: [{ id: lic.id, name: lic.software }]
  });
  assert(asgRes2.success, "Second checkout succeeded");
  var conReturns = {};
  conReturns[con.id] = "return";
  var licReturns = {};
  licReturns[lic.id] = "return";
  var checkinReturnRes = ctx.AssignmentsService.checkin(asgRes2.assignment.id, "Good", "", {
    assetAction: "return",
    consumableActions: conReturns,
    licenseActions: licReturns
  });
  assert(checkinReturnRes.success, "Second check-in with return to stock succeeded");
  assert(con.quantity === initConStock - 2, "Consumable stock restored (+1) upon return to stock");
  assert(lic.assignedSeats === initLicSeats + 1, "License seat released (-1) upon return to stock");

  // 4. Multi-Item Transactions Service Tests
  console.log("\n=== 17. Heterogeneous Multi-Item Transactions Tests ===");
  var multiTxnRes = ctx.TransactionsService.checkoutBulk({
    items: [
      { itemType: "asset", id: ast.id, name: ast.name },
      { itemType: "consumable", id: con.id, name: con.name, quantity: 3 },
      { itemType: "license", id: lic.id, name: lic.software }
    ],
    employeeName: "Charlie Brown"
  });
  assert(multiTxnRes.success, "Heterogeneous multi-item transaction checkout succeeded");
  var txn = multiTxnRes.transaction;
  assert(txn.itemCount === 3, "Transaction recorded exactly 3 heterogeneous items");
  assert(txn.status === "active", "Checkout transaction has status active");
  var activeHandovers = ctx.TransactionsService.getActiveHandovers();
  assert(activeHandovers.some(function(t) { return t.id === txn.id; }), "Checkout transaction present in getActiveHandovers()");

  var receiptHtml = ctx.TransactionsService.generateReceiptHtml(txn);
  assert(receiptHtml.indexOf("1. Hardware Equipment") !== -1, "Receipt contains Hardware Equipment table");
  assert(receiptHtml.indexOf("2. Consumables &amp; Accessories") !== -1, "Receipt contains Consumables & Accessories table");
  assert(receiptHtml.indexOf("3. Software Licenses") !== -1, "Receipt contains Software Licenses table");

  // 5. Check-in transaction with mixed dispositions
  var dispMap = {};
  dispMap[ast.id] = "disposal";
  dispMap[con.id] = "return";
  var inTxnRes = ctx.TransactionsService.checkinBulk({
    items: txn.items,
    dispositions: dispMap,
    parentTxnId: txn.id
  });
  assert(inTxnRes.success, "Multi-item check-in transaction succeeded");
  assert(ast.status === "retired", "Asset marked retired when checked in with disposal");
  assert(ctx.TransactionsService.getById(txn.id).status === "returned", "Parent checkout transaction transitioned to returned status");

  // 6. UI_ItemPicker basic functionality
  console.log("\n=== 18. UI_ItemPicker Tests ===");
  assert(typeof ctx.UI_ItemPicker !== "undefined", "UI_ItemPicker is defined");
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { runMultiItemTests: runMultiItemTests };
}
