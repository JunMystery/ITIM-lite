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
    var db = getDb();
    var assetIds = params.assetIds || [];
    if (assetIds.length === 0) return { success: false, error: "No assets specified." };
    if (!params.employeeName) return { success: false, error: "Employee name is required." };

    var items = [];
    for (var i = 0; i < assetIds.length; i++) {
      var asset = InventoryService.getById(assetIds[i]);
      if (asset) {
        items.push({
          assetId: asset.id,
          name: asset.name,
          category: asset.category,
          serial: asset.serial || "",
          model: asset.model || "",
          condition: params.condition || "Good / Functional"
        });
        InventoryService.update(asset.id, {
          status: "inuse",
          assignedTo: params.employeeName,
          department: params.department || asset.department
        });
      }
    }

    var record = {
      id: generateNextTxnId(),
      type: "CHECKOUT",
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
      AuditService.log("TRANSACTION_CHECKOUT", "Transaction " + record.id + ": Checked out " + items.length + " assets to " + params.employeeName);
    }
    AppState.save();
    return { success: true, transaction: record };
  }

  function checkinBulk(params) {
    var assetIds = params.assetIds || [];
    if (assetIds.length === 0) return { success: false, error: "No assets specified." };

    var items = [];
    for (var i = 0; i < assetIds.length; i++) {
      var asset = InventoryService.getById(assetIds[i]);
      if (asset) {
        items.push({
          assetId: asset.id,
          name: asset.name,
          category: asset.category,
          serial: asset.serial || "",
          previousAssignee: asset.assignedTo || "",
          condition: params.condition || "Good / Normal Wear"
        });
        InventoryService.update(asset.id, {
          status: "available",
          assignedTo: ""
        });
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

    getAll().unshift(record);
    if (typeof AuditService !== "undefined") {
      AuditService.log("TRANSACTION_CHECKIN", "Transaction " + record.id + ": Returned " + items.length + " assets to stock");
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
        items.push({
          assetId: asset.id,
          name: asset.name,
          category: asset.category,
          serial: asset.serial || "",
          previousStatus: asset.status
        });
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
    var rows = [];
    for (var i = 0; i < (txn.items || []).length; i++) {
      var it = txn.items[i];
      rows.push("<tr>" +
        "<td>" + (i + 1) + "</td>" +
        "<td><strong>" + it.assetId + "</strong></td>" +
        "<td>" + it.name + " (" + (it.category || "") + ")</td>" +
        "<td>" + (it.serial || "-") + "</td>" +
        "<td>" + (it.condition || "Good") + "</td>" +
      "</tr>");
    }

    return "<!DOCTYPE html><html><head><title>Transaction Receipt - " + txn.id + "</title>" +
      "<style>body { font-family: Arial, sans-serif; margin: 30px; line-height: 1.5; color: #222; } .header { border-bottom: 2px solid #000; padding-bottom: 12px; margin-bottom: 20px; } .title { font-size: 20px; font-weight: bold; text-transform: uppercase; margin: 0; } .meta { font-size: 12px; color: #555; } table { width: 100%; border-collapse: collapse; margin: 18px 0; } th, td { border: 1px solid #ccc; padding: 8px 12px; text-align: left; font-size: 12px; } th { background: #f5f5f5; font-weight: bold; } .policy { font-size: 11px; color: #444; margin-top: 25px; border: 1px solid #ddd; padding: 10px; background: #fafafa; } .signatures { display: flex; justify-content: space-between; margin-top: 50px; } .sig-block { width: 45%; border-top: 1px solid #000; padding-top: 6px; font-size: 12px; }</style></head><body>" +
      '<div class="header"><div class="title">IT Asset Transaction Record & Sign-Off</div><div class="meta">Transaction ID: <strong>' + txn.id + '</strong> | Type: ' + txn.type + ' | Timestamp: ' + txn.timestamp + '</div></div>' +
      '<div style="margin-bottom:12px; font-size:13px;"><strong>Recipient / Party:</strong> ' + (txn.employeeName || "N/A") + ' &nbsp;|&nbsp; <strong>Department:</strong> ' + (txn.department || "N/A") + ' &nbsp;|&nbsp; <strong>Expected Return:</strong> ' + (txn.expectedReturnDate || "Indefinite") + '</div>' +
      '<table><thead><tr><th style="width:30px;">#</th><th style="width:100px;">Asset ID</th><th>Asset Description</th><th style="width:130px;">Serial No</th><th style="width:110px;">Condition</th></tr></thead><tbody>' +
      rows.join("") +
      '</tbody></table>' +
      '<div class="policy"><strong>Acknowledgement:</strong> By signing below, the recipient acknowledges physical receipt of the equipment listed above in the condition noted, and accepts responsibility for safe custody under corporate IT policy.</div>' +
      '<div class="signatures"><div class="sig-block"><strong>Employee Signature:</strong><br><br><br>Name: ' + (txn.employeeName || "") + '<br>Date: _______________</div><div class="sig-block"><strong>Issuing IT Officer:</strong><br><br><br>Name: ' + (txn.officer || "IT Admin") + '<br>Date: _______________</div></div>' +
      "<script>window.onload = function() { window.print(); };<\/script></body></html>";
  }

  function printTransactionReceipt(txnId) {
    var txn = getById(txnId);
    if (!txn) return;

    var printWindow = window.open("", "_blank", "width=850,height=750");
    if (!printWindow) {
      alert("Popup blocked. Please allow popups to print transaction receipts.");
      return;
    }

    var html = generateReceiptHtml(txn);
    printWindow.document.write(html);
    printWindow.document.close();
  }

  return {
    getAll: getAll,
    getById: getById,
    generateNextTxnId: generateNextTxnId,
    checkoutBulk: checkoutBulk,
    checkinBulk: checkinBulk,
    changeStatusBulk: changeStatusBulk,
    generateReceiptHtml: generateReceiptHtml,
    printTransactionReceipt: printTransactionReceipt
  };
})();
