/* ==========================================================================
   ITIM-lite - Transaction Detail & Sign-Off Modal Controller
   ========================================================================== */

var UI_Detail = (function () {
  function ensureModal() {
    if (document.getElementById("transaction-detail-modal")) return;
    var host = document.getElementById("modal-host") || document.body;
    var div = document.createElement("div");
    div.id = "transaction-detail-modal";
    div.className = "modal-backdrop";
    div.onclick = function (e) { e = e || window.event; if ((e.target || e.srcElement) === div) close(); };
    div.innerHTML = '<div class="modal" style="width:680px; max-width:92vw;">' +
      '<div class="modal-header"><h3 id="txn-detail-header-title">Transaction Details</h3><button class="btn btn-sm" onclick="UI_Detail.close()">✕</button></div>' +
      '<div id="txn-detail-body" class="modal-body" style="max-height:65vh; overflow-y:auto;"></div>' +
      '<div class="modal-footer">' +
        '<button class="btn" onclick="UI_Detail.close()">Close</button>' +
        '<button id="txn-detail-print-btn" class="btn btn-primary">Print Receipt</button>' +
      '</div>' +
    '</div>';
    host.appendChild(div);
  }

  function open(txnId) {
    ensureModal();
    var txn = TransactionsService.getById(txnId);
    if (!txn) {
      Notifications.show("Transaction not found.", "error");
      return;
    }

    var body = document.getElementById("txn-detail-body");
    var hwRows = [], conRows = [], licRows = [];
    for (var i = 0; i < (txn.items || []).length; i++) {
      var it = txn.items[i];
      var t = it.itemType || "asset";
      var statusText = it.disposition ? (it.disposition === "disposal" ? '<span class="badge badge-retired">Disposed</span>' : '<span class="badge badge-available">Returned</span>') : (it.condition || "Issued");
      if (t === "consumable") {
        conRows.push('<tr><td>' + (conRows.length + 1) + '</td><td style="font-family:var(--font-mono); font-weight:600;">' + (it.assetId || it.id) + '</td><td>' + it.name + '</td><td style="text-align:center;">' + (it.quantity || 1) + '</td><td>' + statusText + '</td></tr>');
      } else if (t === "license") {
        licRows.push('<tr><td>' + (licRows.length + 1) + '</td><td style="font-family:var(--font-mono); font-weight:600;">' + (it.assetId || it.id) + '</td><td>' + it.name + '</td><td style="text-align:center;">1 Seat</td><td>' + statusText + '</td></tr>');
      } else {
        hwRows.push('<tr><td>' + (hwRows.length + 1) + '</td><td style="font-family:var(--font-mono); font-weight:600;">' + (it.assetId || it.id) + '</td><td>' + it.name + '</td><td style="font-family:var(--font-mono); font-size:11px;">' + (it.serial || "-") + '</td><td>' + statusText + '</td></tr>');
      }
    }

    var tablesHtml = "";
    if (hwRows.length > 0) {
      tablesHtml += '<div style="font-weight:600; font-size:12px; margin:10px 0 4px 0;">Hardware Assets (' + hwRows.length + ')</div>' +
        '<div class="data-table-container" style="margin-bottom:8px;"><table class="data-table" style="font-size:11px;"><thead><tr><th>#</th><th>Asset ID</th><th>Name / Model</th><th>Serial No</th><th>Status/Condition</th></tr></thead><tbody>' + hwRows.join("") + '</tbody></table></div>';
    }
    if (conRows.length > 0) {
      tablesHtml += '<div style="font-weight:600; font-size:12px; margin:10px 0 4px 0;">Consumables &amp; Accessories (' + conRows.length + ')</div>' +
        '<div class="data-table-container" style="margin-bottom:8px;"><table class="data-table" style="font-size:11px;"><thead><tr><th>#</th><th>ID</th><th>Item Description</th><th style="text-align:center;">Qty</th><th>Status/Condition</th></tr></thead><tbody>' + conRows.join("") + '</tbody></table></div>';
    }
    if (licRows.length > 0) {
      tablesHtml += '<div style="font-weight:600; font-size:12px; margin:10px 0 4px 0;">Software Licenses (' + licRows.length + ')</div>' +
        '<div class="data-table-container" style="margin-bottom:8px;"><table class="data-table" style="font-size:11px;"><thead><tr><th>#</th><th>ID</th><th>Software Product</th><th style="text-align:center;">Allocation</th><th>Status/Condition</th></tr></thead><tbody>' + licRows.join("") + '</tbody></table></div>';
    }

    body.innerHTML = '<div style="margin-bottom:14px; background:#f5f5f5; padding:12px; border-radius:4px; font-size:12px;">' +
      '<div class="form-row" style="margin-bottom:6px;"><div style="flex:1;"><strong>Transaction ID:</strong> <span style="font-family:Consolas, monospace; color:#0067b8; font-weight:bold;">' + txn.id + '</span></div><div style="flex:1;"><strong>Type:</strong> <span class="badge badge-inuse">' + txn.type + '</span></div></div>' +
      '<div class="form-row" style="margin-bottom:6px;"><div style="flex:1;"><strong>Timestamp:</strong> ' + txn.timestamp + '</div><div style="flex:1;"><strong>IT Officer:</strong> ' + (txn.officer || "IT Admin") + '</div></div>' +
      '<div class="form-row" style="margin-bottom:6px;"><div style="flex:1;"><strong>Recipient / Party:</strong> ' + (txn.employeeName || "Stock / Internal") + '</div><div style="flex:1;"><strong>Department:</strong> ' + (txn.department || "N/A") + '</div></div>' +
      '<div class="form-row"><div style="flex:1;"><strong>Expected Return:</strong> ' + (txn.expectedReturnDate || "Indefinite") + '</div><div style="flex:1;"><strong>Item Count:</strong> ' + (txn.itemCount || (txn.items ? txn.items.length : 0)) + '</div></div>' +
    '</div>' +
    (txn.notes ? '<div style="margin-bottom:12px; font-size:12px;"><strong>Notes / Reference:</strong> ' + txn.notes + '</div>' : '') +
    tablesHtml;

    document.getElementById("txn-detail-print-btn").onclick = function () {
      TransactionsService.printTransactionReceipt(txn.id);
    };

    document.getElementById("transaction-detail-modal").className = "modal-backdrop open";
  }

  function close() {
    var modal = document.getElementById("transaction-detail-modal");
    if (modal) modal.className = "modal-backdrop";
  }

  return {
    open: open,
    close: close,
    closeModal: close
  };
})();
