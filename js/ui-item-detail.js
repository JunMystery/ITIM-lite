/* ==========================================================================
   ITIM-lite - Unified Item Detail Inspection Modal Controller
   Horizontal Rule Divided Sections & Key-Value Rows with Live QR & Full i18n
   Pure ES5 for Windows HTA / IE11 compatibility (< 240 LOC)
   ========================================================================== */

var UI_ItemDetail = (function () {
  var activeQrItem = null;

  function tr(key, fallback) {
    return (typeof I18N !== "undefined") ? I18N.t(key) : (fallback || key);
  }

  function ensureModal() {
    if (document.getElementById("item-detail-modal")) return;
    var host = document.getElementById("modal-host") || document.body;
    var div = document.createElement("div");
    div.id = "item-detail-modal";
    div.className = "modal-backdrop";
    div.onclick = function (e) { e = e || window.event; if ((e.target || e.srcElement) === div) close(); };
    div.innerHTML = '<div class="modal modal-secondary" style="width:66vw; max-width:92vw;">' +
      '<div class="modal-header"><h3 id="item-detail-title">Item Details</h3><button type="button" class="btn btn-sm" onclick="UI_ItemDetail.close()">✕</button></div>' +
      '<div id="item-detail-body" class="modal-body" style="flex:1 1 auto; min-height:0; overflow-y:auto; padding:16px 20px;"></div>' +
      '<div id="item-detail-footer" class="modal-footer"></div>' +
    '</div>';
    host.appendChild(div);
  }

  function close() {
    var modal = document.getElementById("item-detail-modal");
    if (modal) modal.className = "modal-backdrop";
  }

  function renderSectionHeader(title) {
    return '<div style="display:flex; align-items:center; gap:10px; margin:16px 0 10px 0;">' +
      '<span style="font-size:11px; font-weight:700; color:var(--color-primary); text-transform:uppercase; letter-spacing:0.5px; white-space:nowrap;">' + title + '</span>' +
      '<div style="flex:1; height:1px; background:var(--border-subtle);"></div>' +
    '</div>';
  }

  function renderKv(label, val, isLast) {
    return '<div style="display:flex; justify-content:space-between; align-items:center; padding:7px 0;' + (!isLast ? ' border-bottom:1px solid var(--border-subtle);' : '') + '">' +
      '<span style="font-size:12px; color:var(--text-secondary); font-weight:500; min-width:130px;">' + label + '</span>' +
      '<span style="font-size:13px; color:var(--text-primary); font-weight:600; text-align:right; word-break:break-word;">' + (val || "-") + '</span>' +
    '</div>';
  }

  function renderQrCard(id, serial) {
    if (typeof BarcodeQR === "undefined") return "";
    activeQrItem = { id: id, serial: serial || "" };
    var toggle = serial
      ? '<div style="display:flex; justify-content:center; gap:4px; margin-bottom:5px;"><button type="button" id="qr-btn-id" class="btn btn-sm btn-primary" style="padding:1px 8px; font-size:10px;" onclick="UI_ItemDetail.switchQr(\'ID\')">' + tr("lbl_qr_id", "QR: ID") + '</button><button type="button" id="qr-btn-sn" class="btn btn-sm" style="padding:1px 8px; font-size:10px;" onclick="UI_ItemDetail.switchQr(\'SN\')">' + tr("lbl_qr_sn", "QR: SN") + '</button></div>'
      : '<div style="font-size:10px; font-weight:700; color:var(--text-secondary); text-transform:uppercase; margin-bottom:4px;">' + tr("lbl_qr_asset_tag", "QR ASSET TAG") + '</div>';

    return '<div id="detail-qr-box" style="background:#fff; border:1.5px dashed #0067b8; border-radius:6px; padding:8px 10px; text-align:center; box-shadow:0 1px 4px rgba(0,0,0,0.04);">' +
      toggle + '<div id="detail-qr-svg" style="display:flex; justify-content:center; padding:2px;"><div style="background:#fff; padding:4px; border-radius:4px; border:1px solid #e5e5e5; display:inline-block;">' + BarcodeQR.generateQrSvg(id, 64) + '</div></div>' +
      '<div id="detail-qr-text" style="font-family:var(--font-mono); font-size:10px; color:var(--text-secondary); margin-top:3px;">ID: ' + id + '</div></div>';
  }

  function switchQr(mode) {
    if (!activeQrItem) return;
    var isSn = (mode === "SN" && activeQrItem.serial), val = isSn ? activeQrItem.serial : activeQrItem.id;
    var svg = document.getElementById("detail-qr-svg"), txt = document.getElementById("detail-qr-text");
    var bId = document.getElementById("qr-btn-id"), bSn = document.getElementById("qr-btn-sn");
    if (svg && typeof BarcodeQR !== "undefined") {
      svg.innerHTML = '<div style="background:#fff; padding:4px; border-radius:4px; border:1px solid #e5e5e5; display:inline-block;">' + BarcodeQR.generateQrSvg(val, 64) + '</div>';
    }
    if (txt) txt.innerText = (isSn ? "SN: " : "ID: ") + val;
    if (bId) bId.className = !isSn ? "btn btn-sm btn-primary" : "btn btn-sm";
    if (bSn) bSn.className = isSn ? "btn btn-sm btn-primary" : "btn btn-sm";
  }

  function renderSnTable(c) {
    if (!c.serials || !c.serials.length) return "";
    var rows = [];
    for (var i = 0; i < c.serials.length; i++) {
      var s = c.serials[i], snVal = (typeof s === "string") ? s : s.sn;
      var st = (typeof s === "object" && s.status) ? s.status : "available";
      var holder = (typeof s === "object" && (s.assignedTo || s.location)) ? (s.assignedTo ? ('<strong>' + s.assignedTo + '</strong>') : s.location) : "-";
      var stBadge = (st === "assigned" || st === "inuse")
        ? '<span class="badge badge-inuse">' + tr("status_inuse", "Assigned") + '</span>'
        : '<span class="badge badge-available">' + tr("status_available", "Available") + '</span>';
      var bc = (typeof BarcodeQR !== "undefined") ? BarcodeQR.generateBarcodeSvg(snVal, 20, 1.1) : snVal;

      rows.push('<tr style="border-bottom:1px solid var(--border-subtle);">' +
        '<td style="font-family:var(--font-mono); font-weight:600; width:90px;">' + c.id + '</td>' +
        '<td style="font-family:var(--font-mono); font-weight:600;">' + snVal + '</td>' +
        '<td style="text-align:center; padding:3px 6px;">' + bc + '</td>' +
        '<td>' + stBadge + '</td>' +
        '<td style="font-size:12px;">' + holder + '</td>' +
      '</tr>');
    }

    return renderSectionHeader(tr("sec_serialized_units", "SERIALIZED UNITS") + ' (' + c.serials.length + ')') +
      '<div style="border:1px solid var(--border-subtle); border-radius:6px; overflow:hidden; margin-bottom:14px;">' +
        '<div style="background:var(--bg-surface-secondary); padding:9px 14px; display:flex; justify-content:space-between; align-items:center; cursor:pointer;" onclick="UI_ItemDetail.toggleSnTable()">' +
          '<span style="font-size:12px; font-weight:600;">' + tr("view_sn_lines", "View Serial Number inventory lines") + '</span>' +
          '<span id="sn-table-toggle-btn" style="font-size:12px; color:var(--color-primary); font-weight:600;">' + tr("btn_show", "Show ▼") + '</span>' +
        '</div>' +
        '<div id="consumable-sn-table" style="display:none; padding:8px 12px; border-top:1px solid var(--border-subtle); background:#fff;">' +
          '<div class="data-table-container"><table class="data-table" style="font-size:11px;">' +
            '<thead><tr><th>' + tr("th_id", "ID") + '</th><th>' + tr("th_serial_no", "Serial No") + '</th><th style="text-align:center;">' + tr("th_barcode_c39", "Barcode (Code39)") + '</th><th>' + tr("th_status", "Status") + '</th><th>' + tr("th_holder_location", "Holder / Location") + '</th></tr></thead>' +
            '<tbody>' + rows.join("") + '</tbody>' +
          '</table></div>' +
        '</div>' +
      '</div>';
  }

  function toggleSnTable() {
    var el = document.getElementById("consumable-sn-table"), btn = document.getElementById("sn-table-toggle-btn");
    if (!el) return;
    var isHidden = (el.style.display === "none");
    el.style.display = isHidden ? "block" : "none";
    if (btn) btn.innerText = isHidden ? tr("btn_hide", "Hide ▲") : tr("btn_show", "Show ▼");
  }

  function renderActivityTable(itemId) {
    var txns = (typeof TransactionsService !== "undefined") ? TransactionsService.getAll() : [], matched = [];
    for (var i = txns.length - 1; i >= 0; i--) {
      var t = txns[i], hit = false;
      if (t.items && t.items.length) {
        for (var j = 0; j < t.items.length; j++) {
          if (t.items[j].assetId === itemId || t.items[j].id === itemId) { hit = true; break; }
        }
      }
      if (hit) { matched.push(t); if (matched.length >= 4) break; }
    }
    if (!matched.length) return '<div style="font-size:12px; color:var(--text-tertiary); padding:6px 0;">' + tr("no_recent_activity", "No recent activity recorded.") + '</div>';

    var html = ['<div class="data-table-container" style="border:1px solid var(--border-subtle); border-radius:6px; overflow:hidden;"><table class="data-table" style="font-size:11px;"><thead><tr>' +
      '<th>' + tr("th_txn_id", "Txn ID") + '</th><th>' + tr("th_type", "Type") + '</th><th>' + tr("th_recipient", "Recipient / Party") + '</th><th>' + tr("th_timestamp", "Timestamp") + '</th>' +
    '</tr></thead><tbody>'];
    for (var k = 0; k < matched.length; k++) {
      var m = matched[k];
      var tsFormatted = (typeof I18N !== "undefined") ? I18N.formatDateTime(m.timestamp) : (m.timestamp || "-");
      html.push('<tr style="border-bottom:1px solid var(--border-subtle);"><td style="font-family:var(--font-mono); font-weight:600;">' + m.id + '</td><td><span class="badge">' + m.type + '</span></td><td>' + (m.employeeName || m.recipient || "-") + '</td><td style="font-family:var(--font-mono); font-size:10px;">' + tsFormatted + '</td></tr>');
    }
    html.push('</tbody></table></div>');
    return html.join("");
  }

  function open(type, id) {
    ensureModal();
    var titleEl = document.getElementById("item-detail-title"), bodyEl = document.getElementById("item-detail-body"), footerEl = document.getElementById("item-detail-footer");
    if (!bodyEl || !footerEl) return;
    var lblClose = tr("btn_cancel", "Close"), lblEdit = tr("btn_edit_item", "Edit Item"), lblPrint = tr("btn_tag", "Print Tag");

    if (type === "asset") {
      var a = (typeof InventoryService !== "undefined") ? InventoryService.getById(id) : null;
      if (!a) return;
      if (titleEl) titleEl.innerText = tr("detail_asset", "Asset Details: ") + a.name;
      var stLabel = typeof I18N !== "undefined" ? I18N.t("status_" + a.status) : a.status;

      var headerBar = '<div style="display:flex; justify-content:space-between; align-items:center; gap:16px; margin-bottom:12px; padding-bottom:12px; border-bottom:1px solid var(--border-subtle);">' +
        '<div style="flex:1; min-width:0;"><div style="font-size:18px; font-weight:700; color:var(--text-primary); line-height:1.3; margin-bottom:6px; word-break:break-word;">' + a.name + '</div>' +
        '<div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;"><span style="font-family:var(--font-mono); font-size:14px; font-weight:700; color:var(--color-primary);">' + a.id + '</span><span class="badge badge-' + (a.status || "available") + '">' + stLabel + '</span><span class="badge" style="font-size:11px;">' + (a.category || "Hardware") + '</span></div></div>' +
        '<div style="flex:0 0 auto;">' + renderQrCard(a.id, a.serial) + '</div></div>';

      var specsCard = '<div style="flex:1 1 280px; min-width:260px; background:#fff; border:1px solid var(--border-subtle); border-radius:6px; padding:12px 14px;">' +
        renderKv(tr("th_category", "Category"), a.category) +
        renderKv(tr("th_serial_no", "Serial Number"), '<span style="font-family:var(--font-mono);">' + (a.serial || "-") + '</span>') +
        renderKv(tr("th_model_specs", "Model & Specs"), a.model) +
        renderKv(tr("ph_notes", "Notes"), a.notes, true) +
      '</div>';

      var deployCard = '<div style="flex:1 1 280px; min-width:260px; background:#fff; border:1px solid var(--border-subtle); border-radius:6px; padding:12px 14px;">' +
        renderKv(tr("th_assigned_to", "Assigned To"), a.assignedTo ? ('<strong>' + a.assignedTo + '</strong> (' + (a.department || "-") + ')') : tr("lbl_ready_in_stock", "Ready in Stock")) +
        renderKv(tr("th_location", "Location"), a.location) +
        renderKv(tr("th_order_date", "Purchase Date"), (typeof I18N !== "undefined" ? I18N.formatDate(a.purchaseDate) : a.purchaseDate)) +
        renderKv(tr("kpi_warranty", "Warranty Expiry"), (typeof I18N !== "undefined" ? I18N.formatDate(a.warrantyExpiry) : a.warrantyExpiry), true) +
      '</div>';

      bodyEl.innerHTML = headerBar +
        renderSectionHeader(tr("sec_specs_lifecycle", "SPECIFICATIONS & LIFECYCLE")) +
        '<div style="display:flex; gap:12px; flex-wrap:wrap; margin-bottom:10px;">' + specsCard + deployCard + '</div>' +
        renderSectionHeader(tr("sec_recent_history", "RECENT TRANSACTION HISTORY")) +
        renderActivityTable(a.id);

      var assignBtn = (a.status === "inuse")
        ? '<button type="button" class="btn btn-sm" onclick="UI_ItemDetail.close(); UI_History.openForAsset(\'' + a.id + '\');">' + tr("btn_return_to_stock", "Return to Stock") + '</button>'
        : '<button type="button" class="btn btn-sm btn-primary" onclick="UI_ItemDetail.close(); UI_History.openForAsset(\'' + a.id + '\');">' + tr("btn_checkout_asset", "+ Check-out Asset") + '</button>';

      footerEl.innerHTML = '<div style="display:flex; justify-content:space-between; width:100%; align-items:center;">' +
        '<button type="button" class="btn" onclick="UI_ItemDetail.close()">' + lblClose + '</button>' +
        '<div style="display:flex; gap:8px;">' + assignBtn +
          '<button type="button" class="btn" onclick="UI_AssetModal.printLabel(\'' + a.id + '\')">' + lblPrint + '</button>' +
          '<button type="button" class="btn btn-primary" onclick="UI_ItemDetail.close(); UI_AssetModal.open(\'' + a.id + '\');">' + lblEdit + '</button>' +
        '</div></div>';

    } else if (type === "license") {
      var l = (typeof LicensesService !== "undefined") ? LicensesService.getById(id) : null;
      if (!l) return;
      if (titleEl) titleEl.innerText = tr("detail_software", "Software License: ") + l.software;

      var total = parseInt(l.totalSeats, 10) || 0, asg = parseInt(l.assignedSeats, 10) || 0, avail = Math.max(0, total - asg);
      var pct = (total > 0) ? Math.min(100, Math.round((asg / total) * 100)) : 100;
      var barClr = (total <= 0 || avail <= 0) ? "#d13438" : (pct >= 85 ? "#ffaa00" : "#0078d4");

      var headerBar = '<div style="display:flex; justify-content:space-between; align-items:center; gap:16px; margin-bottom:12px; padding-bottom:12px; border-bottom:1px solid var(--border-subtle);">' +
        '<div style="flex:1; min-width:0;"><div style="font-size:18px; font-weight:700; color:var(--text-primary); line-height:1.3; margin-bottom:6px; word-break:break-word;">' + l.software + '</div>' +
        '<div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;"><span style="font-family:var(--font-mono); font-size:14px; font-weight:700; color:var(--color-primary);">' + l.id + '</span><span class="badge badge-available">' + (l.type || "Active") + '</span><span class="badge" style="font-size:11px;">' + (l.vendor || "Software") + '</span></div></div>' +
        '<div style="flex:0 0 auto;">' + renderQrCard(l.id, l.key) + '</div></div>';

      var leftCard = '<div style="flex:1 1 280px; min-width:260px; background:#fff; border:1px solid var(--border-subtle); border-radius:6px; padding:12px 14px;">' +
        renderKv(tr("lbl_vendor", "Vendor"), l.vendor) +
        renderKv(tr("lbl_license_type", "License Type"), l.type || "Perpetual") +
        renderKv(tr("lbl_license_key", "License Key"), '<span style="font-family:var(--font-mono);">' + (l.key || "-") + '</span>') +
        renderKv(tr("ph_notes", "Notes"), l.notes, true) +
      '</div>';

      var rightCard = '<div style="flex:1 1 280px; min-width:260px; background:#fff; border:1px solid var(--border-subtle); border-radius:6px; padding:12px 14px;">' +
        '<div style="margin-bottom:10px;">' +
          '<div style="display:flex; justify-content:space-between; font-size:12px; font-weight:600; margin-bottom:4px;"><span>' + asg + ' / ' + total + ' seats</span><span style="color:' + barClr + ';">' + avail + ' ' + tr("seats_available", "available") + ' (' + pct + '%)</span></div>' +
          '<div style="background:var(--bg-surface-tertiary); border-radius:4px; height:8px; overflow:hidden;"><div style="background:' + barClr + '; width:' + pct + '%; height:100%;"></div></div>' +
        '</div>' +
        renderKv(tr("lbl_expiry_renewal", "Expiry / Renewal"), (typeof I18N !== "undefined" ? I18N.formatDate(l.expiryDate) : (l.expiryDate || "Perpetual")), true) +
      '</div>';

      bodyEl.innerHTML = headerBar +
        renderSectionHeader(tr("sec_software_seats", "SOFTWARE INFORMATION & SEATS")) +
        '<div style="display:flex; gap:12px; flex-wrap:wrap; margin-bottom:10px;">' + leftCard + rightCard + '</div>' +
        renderSectionHeader(tr("sec_recent_history", "RECENT ALLOCATION HISTORY")) +
        renderActivityTable(l.id);

      footerEl.innerHTML = '<div style="display:flex; justify-content:space-between; width:100%; align-items:center;">' +
        '<button type="button" class="btn" onclick="UI_ItemDetail.close()">' + lblClose + '</button>' +
        '<button type="button" class="btn btn-primary" onclick="UI_ItemDetail.close(); UI_Licenses.openModal(\'' + l.id + '\');">' + lblEdit + '</button>' +
      '</div>';

    } else if (type === "consumable") {
      var c = (typeof ConsumablesService !== "undefined") ? ConsumablesService.getById(id) : null;
      if (!c) return;
      if (titleEl) titleEl.innerText = tr("detail_consumable", "Consumable Item: ") + c.name;

      var qty = parseInt(c.quantity, 10) || 0, min = parseInt(c.minQuantity, 10) || 0;
      var cBadge = (qty <= 0) ? '<span class="badge badge-retired" style="background:#d13438; color:#fff;">' + tr("status_retired", "Out of Stock") + '</span>'
        : ((qty <= min) ? '<span class="badge badge-warning">' + tr("kpi_low_stock", "Low Stock") + '</span>' : '<span class="badge badge-available">' + tr("status_available", "In Stock") + '</span>');
      var firstSn = (c.serials && c.serials.length) ? (typeof c.serials[0] === "string" ? c.serials[0] : c.serials[0].sn) : "";

      var headerBar = '<div style="display:flex; justify-content:space-between; align-items:center; gap:16px; margin-bottom:12px; padding-bottom:12px; border-bottom:1px solid var(--border-subtle);">' +
        '<div style="flex:1; min-width:0;"><div style="font-size:18px; font-weight:700; color:var(--text-primary); line-height:1.3; margin-bottom:6px; word-break:break-word;">' + c.name + '</div>' +
        '<div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;"><span style="font-family:var(--font-mono); font-size:14px; font-weight:700; color:var(--color-primary);">' + c.id + '</span>' + cBadge + '<span class="badge" style="font-size:11px;">' + (c.category || "Consumables") + '</span></div></div>' +
        '<div style="flex:0 0 auto;">' + renderQrCard(c.id, firstSn) + '</div></div>';

      var leftCard = '<div style="flex:1 1 280px; min-width:260px; background:#fff; border:1px solid var(--border-subtle); border-radius:6px; padding:12px 14px;">' +
        renderKv(tr("th_category", "Category"), c.category) +
        renderKv(tr("lbl_storage_location", "Storage Location"), c.location || "-", true) +
      '</div>';

      var rightCard = '<div style="flex:1 1 280px; min-width:260px; background:#fff; border:1px solid var(--border-subtle); border-radius:6px; padding:12px 14px;">' +
        '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">' +
          '<div><span style="font-size:24px; font-weight:700;' + (qty <= 0 ? 'color:#d13438;' : '') + '">' + qty + '</span> <span style="font-size:12px; color:var(--text-secondary);">' + tr("in_stock_unit", "in stock") + '</span></div>' +
          '<div style="display:flex; gap:6px;">' +
            '<button type="button" class="btn btn-sm" onclick="ConsumablesService.adjustQuantity(\'' + c.id + '\', 1); if(typeof UI_Assets!==\'undefined\') UI_Assets.render(); UI_ItemDetail.open(\'consumable\', \'' + c.id + '\');">+1</button>' +
            '<button type="button" class="btn btn-sm" onclick="ConsumablesService.adjustQuantity(\'' + c.id + '\', -1); if(typeof UI_Assets!==\'undefined\') UI_Assets.render(); UI_ItemDetail.open(\'consumable\', \'' + c.id + '\');">-1</button>' +
          '</div>' +
        '</div>' +
        renderKv(tr("low_stock_threshold", "Low-Stock Threshold"), (min > 0 ? min + " " + tr("units", "units") : "None"), true) +
      '</div>';

      bodyEl.innerHTML = headerBar +
        renderSectionHeader(tr("sec_stock_metrics", "SPECIFICATIONS & STOCK METRICS")) +
        '<div style="display:flex; gap:12px; flex-wrap:wrap; margin-bottom:10px;">' + leftCard + rightCard + '</div>' +
        renderSnTable(c) +
        renderSectionHeader(tr("sec_recent_history", "RECENT TRANSACTION HISTORY")) +
        renderActivityTable(c.id);

      footerEl.innerHTML = '<div style="display:flex; justify-content:space-between; width:100%; align-items:center;">' +
        '<button type="button" class="btn" onclick="UI_ItemDetail.close()">' + lblClose + '</button>' +
        '<button type="button" class="btn btn-primary" onclick="UI_ItemDetail.close(); UI_Consumables.openModal(\'' + c.id + '\');">' + lblEdit + '</button>' +
      '</div>';
    }

    document.getElementById("item-detail-modal").className = "modal-backdrop open";
  }

  return {
    open: open, close: close, switchQr: switchQr, toggleSnTable: toggleSnTable
  };
})();
