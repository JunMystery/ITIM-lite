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
    div.onclick = function (e) { e = e || window.event; if ((e.target || e.srcElement) === div) closeModal(); };
    div.innerHTML = '<div class="modal" style="width:680px; max-height:90vh; display:flex; flex-direction:column;">' +
      '<div class="modal-header"><h3 id="txn-detail-header-title">Transaction Details</h3><button class="btn btn-sm" onclick="UI_Detail.close()">✕</button></div>' +
      '<div id="txn-detail-body" class="modal-body" style="overflow-y:auto; flex:1;"></div>' +
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
    var rows = [];
    for (var i = 0; i < (txn.items || []).length; i++) {
      var it = txn.items[i];
      rows.push("<tr>" +
        "<td>" + (i + 1) + "</td>" +
        '<td style="font-family:var(--font-mono); font-weight:600;">' + it.assetId + "</td>" +
        "<td>" + it.name + "</td>" +
        "<td>" + (it.serial || "-") + "</td>" +
        "<td>" + (it.category || "-") + "</td>" +
        "<td>" + (it.condition || "Good") + "</td>" +
      "</tr>");
    }

    body.innerHTML = '<div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:14px; background:var(--bg-surface-secondary); padding:12px; border-radius:var(--radius-md); font-size:12px;">' +
      '<div><strong>Transaction ID:</strong> <span style="font-family:var(--font-mono); color:var(--color-primary); font-weight:bold;">' + txn.id + '</span></div>' +
      '<div><strong>Type:</strong> <span class="badge badge-inuse">' + txn.type + '</span></div>' +
      '<div><strong>Timestamp:</strong> ' + txn.timestamp + '</div>' +
      '<div><strong>IT Officer:</strong> ' + (txn.officer || "IT Admin") + '</div>' +
      '<div><strong>Recipient / Party:</strong> ' + (txn.employeeName || "Stock / Internal") + '</div>' +
      '<div><strong>Department:</strong> ' + (txn.department || "N/A") + '</div>' +
      '<div><strong>Expected Return:</strong> ' + (txn.expectedReturnDate || "Indefinite") + '</div>' +
      '<div><strong>Item Count:</strong> ' + txn.itemCount + '</div>' +
    '</div>' +
    (txn.notes ? '<div style="margin-bottom:12px; font-size:12px;"><strong>Notes / Reference:</strong> ' + txn.notes + '</div>' : '') +
    '<div style="font-size:13px; font-weight:600; margin-bottom:6px;">Itemized Assets (' + txn.itemCount + ')</div>' +
    '<div class="data-table-container">' +
      '<table class="data-table">' +
        '<thead><tr><th>#</th><th>Asset ID</th><th>Name / Model</th><th>Serial No</th><th>Category</th><th>Condition</th></tr></thead>' +
        '<tbody>' + rows.join("") + '</tbody>' +
      '</table>' +
    '</div>';

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
    close: close
  };
})();
