/* ==========================================================================
   ITIM-lite - Unified Transactions & History Service
   Manages multi-item batch operations with guaranteed unique History IDs
   ========================================================================== */

var TransactionsService = (function () {
  function getDb() {
    return AppState.db;
  }

  function getAll() {
    var db = getDb();
    if (!db.transactions) db.transactions = [];
    return db.transactions;
  }

  function getById(txnId) {
    var list = getAll();
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === txnId) return list[i];
    }
    return null;
  }

  function generateNextTxnId() {
    var list = getAll();
    var maxNum = 5000;
    for (var i = 0; i < list.length; i++) {
      var match = (list[i].id || "").match(/TXN-(\d+)/i);
      if (match) {
        var n = parseInt(match[1], 10);
        if (n > maxNum) maxNum = n;
      }
    }
    var nextId = "TXN-" + (maxNum + 1);
    // Collision guard
    while (getById(nextId)) {
      maxNum++;
      nextId = "TXN-" + (maxNum + 1);
    }
    return nextId;
  }

  function getNowTimestamp() {
    var d = new Date();
    var pad = function (n) { return n < 10 ? "0" + n : "" + n; };
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()) +
      " " + pad(d.getHours()) + ":" + pad(d.getMinutes()) + ":" + pad(d.getSeconds());
  }

  function checkoutBulk(params) {
    var rawItems = params.items || [];
    var assetIds = params.assetIds || [];
    if (rawItems.length === 0 && assetIds.length === 0) return { success: false, error: "No items specified." };
    if (!params.employeeName) return { success: false, error: "Employee name is required." };

    var items = [];
    if (rawItems.length > 0) {
      for (var i = 0; i < rawItems.length; i++) {
        var it = rawItems[i];
        var type = it.itemType || "asset";
        if (type === "asset") {
          var aId = it.assetId || it.id;
          var asset = InventoryService.getById(aId);
          if (asset) {
            items.push({ itemType: "asset", assetId: asset.id, name: asset.name, category: asset.category, serial: asset.serial || "", condition: it.condition || params.condition || "Good / Functional" });
            InventoryService.update(asset.id, { status: "inuse", assignedTo: params.employeeName, department: params.department || asset.department });
          }
        } else if (type === "consumable") {
          var con = ConsumablesService.getById(it.id);
          var cQty = it.quantity || 1;
          items.push({ itemType: "consumable", assetId: it.id, name: con ? con.name : it.name, category: con ? con.category : "Consumable", quantity: cQty, condition: "Issued" });
          if (typeof ConsumablesService !== "undefined" && con) ConsumablesService.adjustQuantity(it.id, -cQty);
        } else if (type === "license") {
          var lic = LicensesService.getById(it.id);
          items.push({ itemType: "license", assetId: it.id, name: lic ? lic.software : it.name, category: lic ? lic.vendor : "Software", quantity: 1, condition: "Assigned" });
          if (typeof LicensesService !== "undefined" && lic) LicensesService.update(it.id, { assignedSeats: (parseInt(lic.assignedSeats, 10) || 0) + 1 });
        }
      }
    } else {
      for (var aIdx = 0; aIdx < assetIds.length; aIdx++) {
        var ast = InventoryService.getById(assetIds[aIdx]);
        if (ast) {
          items.push({ itemType: "asset", assetId: ast.id, name: ast.name, category: ast.category, serial: ast.serial || "", condition: params.condition || "Good / Functional" });
          InventoryService.update(ast.id, { status: "inuse", assignedTo: params.employeeName, department: params.department || ast.department });
        }
      }
    }

    var record = {
      id: generateNextTxnId(),
      type: "CHECKOUT",
      status: "active",
      timestamp: getNowTimestamp(),
      employeeName: params.employeeName,
      employeeEmail: params.employeeEmail || "",
      department: params.department || "",
      expectedReturnDate: params.expectedReturnDate || "",
      notes: params.notes || "",
      officer: params.officer || "IT Admin",
      items: items,
      itemCount: items.length
    };

    getAll().unshift(record);
    if (typeof AuditService !== "undefined") {
      AuditService.log("TRANSACTION_CHECKOUT", "Transaction " + record.id + ": Checked out " + items.length + " items to " + params.employeeName);
    }
    AppState.save();
    return { success: true, transaction: record };
  }

  function checkinBulk(params) {
    var rawItems = params.items || [];
    var assetIds = params.assetIds || [];
    var disps = params.dispositions || {};
    if (rawItems.length === 0 && assetIds.length === 0) return { success: false, error: "No items specified." };

    var items = [];
    if (rawItems.length > 0) {
      for (var i = 0; i < rawItems.length; i++) {
        var it = rawItems[i];
        var type = it.itemType || "asset";
        var itemId = it.assetId || it.id;
        var disp = disps[itemId] || it.disposition || "return";
        if (type === "asset") {
          var asset = InventoryService.getById(itemId);
          if (asset) {
            items.push({ itemType: "asset", assetId: asset.id, name: asset.name, category: asset.category, serial: asset.serial || "", disposition: disp, condition: disp === "disposal" ? "Disposed" : (params.condition || "Returned") });
            InventoryService.update(asset.id, { status: (disp === "disposal" ? "retired" : "available"), assignedTo: "" });
          }
        } else if (type === "consumable") {
          items.push({ itemType: "consumable", assetId: itemId, name: it.name, category: "Consumable", quantity: it.quantity || 1, disposition: disp, condition: disp === "disposal" ? "Disposed" : "Returned" });
          if (disp === "return" && typeof ConsumablesService !== "undefined") ConsumablesService.adjustQuantity(itemId, it.quantity || 1);
          else if (typeof AuditService !== "undefined") AuditService.log("CONSUMABLE_DISPOSAL", "Consumable " + itemId + " marked disposed upon check-in");
        } else if (type === "license") {
          items.push({ itemType: "license", assetId: itemId, name: it.name, category: "Software", quantity: 1, disposition: disp, condition: disp === "disposal" ? "Decommissioned" : "Returned" });
          if (disp === "return" && typeof LicensesService !== "undefined") {
            var lic = LicensesService.getById(itemId);
            if (lic) LicensesService.update(itemId, { assignedSeats: Math.max(0, (parseInt(lic.assignedSeats, 10) || 0) - 1) });
          }
        }
      }
    } else {
      for (var j = 0; j < assetIds.length; j++) {
        var a = InventoryService.getById(assetIds[j]);
        if (a) {
          var aDisp = disps[a.id] || "return";
          items.push({ itemType: "asset", assetId: a.id, name: a.name, category: a.category, serial: a.serial || "", disposition: aDisp, condition: aDisp === "disposal" ? "Disposed" : "Good" });
          InventoryService.update(a.id, { status: (aDisp === "disposal" ? "retired" : "available"), assignedTo: "" });
        }
      }
    }

    var record = {
      id: generateNextTxnId(),
      type: "CHECKIN",
      timestamp: getNowTimestamp(),
      employeeName: params.employeeName || (items[0] ? items[0].previousAssignee : "Staff"),
      notes: params.notes || "",
      officer: params.officer || "IT Admin",
      items: items,
      itemCount: items.length
    };

    // Update parent checkout transaction status if linked or matching
    if (params.parentTxnId) {
      var pTxn = getById(params.parentTxnId);
      if (pTxn) { pTxn.status = "returned"; pTxn.returnTxnId = record.id; }
    } else {
      for (var mi = 0; mi < items.length; mi++) {
        if (items[mi].itemType === "asset") {
          var act = getActiveByAsset(items[mi].assetId);
          if (act) { act.status = "returned"; act.returnTxnId = record.id; }
        }
      }
    }

    getAll().unshift(record);
    if (typeof AuditService !== "undefined") {
      AuditService.log("TRANSACTION_CHECKIN", "Transaction " + record.id + ": Returned/disposed " + items.length + " items");
    }
    AppState.save();
    return { success: true, transaction: record };
  }

  function changeStatusBulk(assetIds, newStatus, notes) {
    if (!assetIds || assetIds.length === 0) return { success: false, error: "No assets specified." };

    var items = [];
    for (var i = 0; i < assetIds.length; i++) {
      var asset = InventoryService.getById(assetIds[i]);
      if (asset) {
        items.push({ itemType: "asset", assetId: asset.id, name: asset.name, category: asset.category, serial: asset.serial || "", previousStatus: asset.status });
        InventoryService.update(asset.id, { status: newStatus });
      }
    }

    var record = {
      id: generateNextTxnId(),
      type: "STATUS_CHANGE",
      timestamp: getNowTimestamp(),
      newStatus: newStatus,
      notes: notes || ("Bulk status change to " + newStatus),
      officer: "IT Admin",
      items: items,
      itemCount: items.length
    };

    getAll().unshift(record);
    if (typeof AuditService !== "undefined") {
      AuditService.log("TRANSACTION_STATUS", "Transaction " + record.id + ": Changed status of " + items.length + " assets to " + newStatus);
    }
    AppState.save();
    return { success: true, transaction: record };
  }

  function generateReceiptHtml(txn) {
    if (!txn) return "";
    var hwRows = [], conRows = [], licRows = [];
    for (var i = 0; i < (txn.items || []).length; i++) {
      var it = txn.items[i];
      var t = it.itemType || "asset";
      var statusText = it.disposition ? (it.disposition === "disposal" ? "Disposal / Retired" : "Returned to Stock") : (it.condition || "Issued");
      if (t === "consumable") {
        conRows.push("<tr><td>" + (conRows.length + 1) + "</td><td><strong>" + (it.assetId || it.id) + "</strong></td><td>" + it.name + "</td><td>" + (it.quantity || 1) + "</td><td>" + statusText + "</td></tr>");
      } else if (t === "license") {
        licRows.push("<tr><td>" + (licRows.length + 1) + "</td><td><strong>" + (it.assetId || it.id) + "</strong></td><td>" + it.name + "</td><td>1 Seat</td><td>" + statusText + "</td></tr>");
      } else {
        hwRows.push("<tr><td>" + (hwRows.length + 1) + "</td><td><strong>" + (it.assetId || it.id) + "</strong></td><td>" + it.name + "</td><td>" + (it.serial || "-") + "</td><td>" + statusText + "</td></tr>");
      }
    }

    var tablesHtml = "";
    if (hwRows.length > 0) {
      tablesHtml += '<div style="font-weight:bold; margin-top:12px; font-size:13px;">1. Hardware Equipment (' + hwRows.length + ')</div>' +
        '<table><thead><tr><th style="width:30px;">#</th><th style="width:90px;">Asset ID</th><th>Name / Model</th><th style="width:120px;">Serial No</th><th style="width:110px;">Status/Condition</th></tr></thead><tbody>' + hwRows.join("") + '</tbody></table>';
    }
    if (conRows.length > 0) {
      tablesHtml += '<div style="font-weight:bold; margin-top:12px; font-size:13px;">2. Consumables &amp; Accessories (' + conRows.length + ')</div>' +
        '<table><thead><tr><th style="width:30px;">#</th><th style="width:90px;">ID</th><th>Item Description</th><th style="width:60px;">Qty</th><th style="width:110px;">Status/Condition</th></tr></thead><tbody>' + conRows.join("") + '</tbody></table>';
    }
    if (licRows.length > 0) {
      tablesHtml += '<div style="font-weight:bold; margin-top:12px; font-size:13px;">3. Software Licenses (' + licRows.length + ')</div>' +
        '<table><thead><tr><th style="width:30px;">#</th><th style="width:90px;">ID</th><th>Software Product</th><th style="width:60px;">Allocation</th><th style="width:110px;">Status/Condition</th></tr></thead><tbody>' + licRows.join("") + '</tbody></table>';
    }

    return "<!DOCTYPE html><html><head><title>Transaction Receipt - " + txn.id + "</title>" +
      "<style>body { font-family: Arial, sans-serif; margin: 30px; line-height: 1.5; color: #222; } .header { border-bottom: 2px solid #000; padding-bottom: 12px; margin-bottom: 20px; } .title { font-size: 18px; font-weight: bold; text-transform: uppercase; margin: 0; } .meta { font-size: 12px; color: #555; } table { width: 100%; border-collapse: collapse; margin: 8px 0 16px 0; } th, td { border: 1px solid #ccc; padding: 6px 10px; text-align: left; font-size: 12px; } th { background: #f5f5f5; font-weight: bold; } .policy { font-size: 11px; color: #444; margin-top: 20px; border: 1px solid #ddd; padding: 8px; background: #fafafa; } .signatures { display: flex; justify-content: space-between; margin-top: 40px; } .sig-block { width: 45%; border-top: 1px solid #000; padding-top: 6px; font-size: 12px; }</style></head><body>" +
      '<div class="header"><div class="title">IT Asset &amp; Consumables Handover Record</div><div class="meta">Transaction ID: <strong>' + txn.id + '</strong> | Type: ' + txn.type + ' | Timestamp: ' + txn.timestamp + '</div></div>' +
      '<div style="margin-bottom:12px; font-size:13px;"><strong>Recipient / Party:</strong> ' + (txn.employeeName || "N/A") + ' &nbsp;|&nbsp; <strong>Department:</strong> ' + (txn.department || "N/A") + ' &nbsp;|&nbsp; <strong>Expected Return:</strong> ' + (txn.expectedReturnDate || "Indefinite") + '</div>' +
      tablesHtml +
      '<div class="policy"><strong>Acknowledgement:</strong> By signing below, the recipient acknowledges receipt of the equipment, accessories, and software licenses listed above, and accepts responsibility under corporate IT policy.</div>' +
      '<div class="signatures"><div class="sig-block"><strong>Employee Signature:</strong><br><br><br>Name: ' + (txn.employeeName || "") + '<br>Date: _______________</div><div class="sig-block"><strong>Issuing IT Officer:</strong><br><br><br>Name: ' + (txn.officer || "IT Admin") + '<br>Date: _______________</div></div>' +
      "<script>window.onload = function() { window.print(); };<\/script></body></html>";
  }

  function getActiveHandovers() {
    return getAll().filter(function (t) {
      return t.type === "CHECKOUT" && t.status === "active";
    });
  }

  function getActiveByAsset(assetId) {
    var list = getActiveHandovers();
    for (var i = 0; i < list.length; i++) {
      var itms = list[i].items || [];
      for (var j = 0; j < itms.length; j++) {
        if (itms[j].assetId === assetId || itms[j].id === assetId) return list[i];
      }
    }
    return null;
  }

  function printTransactionReceipt(txnId) {
    var txn = getById(txnId);
    if (!txn) return;
    var w = window.open("", "_blank", "width=850,height=750");
    if (!w) { alert("Popup blocked. Please allow popups to print transaction receipts."); return; }
    w.document.write(generateReceiptHtml(txn));
    w.document.close();
  }

  return {
    getAll: getAll,
    getById: getById,
    getActiveHandovers: getActiveHandovers,
    getActiveByAsset: getActiveByAsset,
    generateNextTxnId: generateNextTxnId,
    checkoutBulk: checkoutBulk,
    checkinBulk: checkinBulk,
    changeStatusBulk: changeStatusBulk,
    generateReceiptHtml: generateReceiptHtml,
    printTransactionReceipt: printTransactionReceipt
  };
})();
