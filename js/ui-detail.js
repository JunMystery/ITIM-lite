/* ==========================================================================
   ITIM-lite - Transaction Detail & Sign-Off Modal Controller with Full i18n
   Pure ES5 for Windows HTA / IE11 compatibility (< 100 LOC)
   ========================================================================== */

var UI_Detail = (function () {
  function tr(k, fb) { return (typeof I18N !== "undefined") ? I18N.t(k) : (fb || k); }

  function ensureModal() {
    if (document.getElementById("transaction-detail-modal")) return;
    var host = document.getElementById("modal-host") || document.body;
    var div = document.createElement("div");
    div.id = "transaction-detail-modal";
    div.className = "modal-backdrop";
    div.onclick = function (e) { e = e || window.event; if ((e.target || e.srcElement) === div) close(); };
    div.innerHTML = '<div class="modal modal-secondary" style="width:66vw; max-width:92vw;">' +
      '<div class="modal-header"><h3 id="txn-detail-header-title">' + tr("txn_detail_title", "Transaction Details") + '</h3><button class="btn btn-sm" onclick="UI_Detail.close()">✕</button></div>' +
      '<div id="txn-detail-body" class="modal-body" style="flex:1 1 auto; min-height:0; overflow-y:auto; padding:16px 20px;"></div>' +
      '<div class="modal-footer">' +
        '<button class="btn" onclick="UI_Detail.close()">' + tr("btn_cancel", "Close") + '</button>' +
        '<button id="txn-detail-print-btn" class="btn btn-primary">' + tr("btn_print_receipt", "Print Receipt") + '</button>' +
      '</div>' +
    '</div>';
    host.appendChild(div);
  }

  function open(txnId) {
    ensureModal();
    var txn = TransactionsService.getById(txnId);
    if (!txn) {
      if (typeof Notifications !== "undefined") Notifications.show("Transaction not found.", "error");
      return;
    }

    var body = document.getElementById("txn-detail-body");
    var hwRows = [], conRows = [], licRows = [];
    for (var i = 0; i < (txn.items || []).length; i++) {
      var it = txn.items[i], t = it.itemType || "asset";
      var statusText = it.disposition
        ? (it.disposition === "disposal" ? '<span class="badge badge-retired">' + tr("status_disposed", "Disposed") + '</span>' : '<span class="badge badge-available">' + tr("status_returned", "Returned") + '</span>')
        : (it.condition || tr("status_issued", "Issued"));
      if (t === "consumable") {
        conRows.push('<tr><td>' + (conRows.length + 1) + '</td><td style="font-family:var(--font-mono); font-weight:600;">' + (it.assetId || it.id) + '</td><td>' + it.name + '</td><td style="text-align:center;">' + (it.quantity || 1) + '</td><td>' + statusText + '</td></tr>');
      } else if (t === "license") {
        licRows.push('<tr><td>' + (licRows.length + 1) + '</td><td style="font-family:var(--font-mono); font-weight:600;">' + (it.assetId || it.id) + '</td><td>' + it.name + '</td><td style="text-align:center;">1 ' + tr("license_seats", "Seat") + '</td><td>' + statusText + '</td></tr>');
      } else {
        hwRows.push('<tr><td>' + (hwRows.length + 1) + '</td><td style="font-family:var(--font-mono); font-weight:600;">' + (it.assetId || it.id) + '</td><td>' + it.name + '</td><td style="font-family:var(--font-mono); font-size:11px;">' + (it.serial || "-") + '</td><td>' + statusText + '</td></tr>');
      }
    }

    var tablesHtml = "";
    if (hwRows.length > 0) {
      tablesHtml += '<div style="font-weight:600; font-size:12px; margin:12px 0 4px 0;">' + tr("section_hardware", "Hardware Assets") + ' (' + hwRows.length + ')</div>' +
        '<div class="data-table-container" style="margin-bottom:8px;"><table class="data-table" style="font-size:11px;"><thead><tr><th>#</th><th>' + tr("th_asset_id", "Asset ID") + '</th><th>' + tr("th_name_model", "Name / Details") + '</th><th>' + tr("th_serial_no", "Serial No") + '</th><th>' + tr("th_status", "Status/Condition") + '</th></tr></thead><tbody>' + hwRows.join("") + '</tbody></table></div>';
    }
    if (conRows.length > 0) {
      tablesHtml += '<div style="font-weight:600; font-size:12px; margin:12px 0 4px 0;">' + tr("section_consumables", "Consumables & Accessories") + ' (' + conRows.length + ')</div>' +
        '<div class="data-table-container" style="margin-bottom:8px;"><table class="data-table" style="font-size:11px;"><thead><tr><th>#</th><th>' + tr("th_id", "ID") + '</th><th>' + tr("th_item_name", "Item Description") + '</th><th style="text-align:center;">' + tr("th_items", "Qty") + '</th><th>' + tr("th_status", "Status/Condition") + '</th></tr></thead><tbody>' + conRows.join("") + '</tbody></table></div>';
    }
    if (licRows.length > 0) {
      tablesHtml += '<div style="font-weight:600; font-size:12px; margin:12px 0 4px 0;">' + tr("section_software", "Software Licenses") + ' (' + licRows.length + ')</div>' +
        '<div class="data-table-container" style="margin-bottom:8px;"><table class="data-table" style="font-size:11px;"><thead><tr><th>#</th><th>' + tr("th_id", "ID") + '</th><th>' + tr("lbl_software_title", "Software Product") + '</th><th style="text-align:center;">' + tr("th_seat_alloc", "Allocation") + '</th><th>' + tr("th_status", "Status/Condition") + '</th></tr></thead><tbody>' + licRows.join("") + '</tbody></table></div>';
    }

    var ts = (typeof I18N !== "undefined") ? I18N.formatDateTime(txn.timestamp) : txn.timestamp;
    var expDate = (typeof I18N !== "undefined" && txn.expectedReturnDate) ? I18N.formatDate(txn.expectedReturnDate) : (txn.expectedReturnDate || "—");

    body.innerHTML = '<div style="margin-bottom:14px; background:var(--bg-surface-secondary); padding:12px; border-radius:4px; font-size:12px; border:1px solid var(--border-subtle);">' +
      '<div class="form-row" style="margin-bottom:6px;"><div style="flex:1;"><strong>' + tr("th_txn_id", "Txn ID") + ':</strong> <span style="font-family:Consolas, monospace; color:#0067b8; font-weight:bold;">' + txn.id + '</span></div><div style="flex:1;"><strong>' + tr("th_type", "Type") + ':</strong> <span class="badge badge-inuse">' + txn.type + '</span></div></div>' +
      '<div class="form-row" style="margin-bottom:6px;"><div style="flex:1;"><strong>' + tr("th_timestamp", "Timestamp") + ':</strong> ' + ts + '</div><div style="flex:1;"><strong>' + tr("lbl_it_officer", "IT Officer:") + '</strong> ' + (txn.officer || "IT Admin") + '</div></div>' +
      '<div class="form-row" style="margin-bottom:6px;"><div style="flex:1;"><strong>' + tr("th_recipient", "Recipient / Party") + ':</strong> ' + (txn.employeeName || "Stock / Internal") + '</div><div style="flex:1;"><strong>' + tr("ph_department", "Department") + ':</strong> ' + (txn.department || "N/A") + '</div></div>' +
      '<div class="form-row"><div style="flex:1;"><strong>' + tr("lbl_expected_return", "Expected Return:") + '</strong> ' + expDate + '</div><div style="flex:1;"><strong>' + tr("th_items", "Items") + ':</strong> ' + (txn.itemCount || (txn.items ? txn.items.length : 0)) + '</div></div>' +
    '</div>' +
    (txn.notes ? '<div style="margin-bottom:12px; font-size:12px;"><strong>' + tr("lbl_txn_notes", "Notes / Reference:") + '</strong> ' + txn.notes + '</div>' : '') +
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

  return { open: open, close: close, closeModal: close };
})();
