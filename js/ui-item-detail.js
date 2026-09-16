/* ==========================================================================
   ITIM-lite - Unified Item Detail Inspection Modal Controller
   Pure ES5 for Windows HTA / IE11 compatibility (< 200 LOC)
   ========================================================================== */

var UI_ItemDetail = (function () {
  function ensureModal() {
    if (document.getElementById("item-detail-modal")) return;
    var host = document.getElementById("modal-host") || document.body;
    var div = document.createElement("div");
    div.id = "item-detail-modal";
    div.className = "modal-backdrop";
    div.onclick = function (e) {
      e = e || window.event;
      if ((e.target || e.srcElement) === div) close();
    };
    div.innerHTML = '<div class="modal" style="width:620px; max-width:92vw;">' +
      '<div class="modal-header"><h3 id="item-detail-title">Item Details</h3><button type="button" class="btn btn-sm" onclick="UI_ItemDetail.close()">✕</button></div>' +
      '<div id="item-detail-body" class="modal-body" style="max-height:68vh; overflow-y:auto;"></div>' +
      '<div id="item-detail-footer" class="modal-footer"></div>' +
    '</div>';
    host.appendChild(div);
  }

  function close() {
    var modal = document.getElementById("item-detail-modal");
    if (modal) modal.className = "modal-backdrop";
  }

  function renderRow(label, value) {
    return '<div class="form-group" style="flex:1; min-width:180px; margin-bottom:8px;">' +
      '<label class="form-label" style="font-size:11px; margin-bottom:2px;">' + label + ':</label>' +
      '<div style="font-size:13px; font-weight:500; color:var(--text-primary); word-break:break-word;">' + (value || "-") + '</div>' +
    '</div>';
  }

  function open(type, id) {
    ensureModal();
    var titleEl = document.getElementById("item-detail-title");
    var bodyEl = document.getElementById("item-detail-body");
    var footerEl = document.getElementById("item-detail-footer");
    if (!bodyEl || !footerEl) return;

    var isVi = (typeof I18N !== "undefined" && I18N.getLang && I18N.getLang() === "vi");
    var lblClose = isVi ? "Đóng" : "Close";
    var lblEdit = isVi ? "Chỉnh sửa" : "Edit Item";
    var lblPrint = isVi ? "In nhãn" : "Print Tag";

    if (type === "asset") {
      var a = (typeof InventoryService !== "undefined") ? InventoryService.getById(id) : null;
      if (!a) return;
      if (titleEl) titleEl.innerText = (isVi ? "Chi tiết thiết bị: " : "Asset Details: ") + a.name;

      var stLabel = typeof I18N !== "undefined" ? I18N.t("status_" + a.status) : a.status;
      var badgeHtml = '<span class="badge badge-' + (a.status || "available") + '">' + stLabel + '</span>';

      var cfHtml = "";
      if (a.customFields) {
        var cfList = [];
        for (var k in a.customFields) {
          if (a.customFields.hasOwnProperty(k) && a.customFields[k]) {
            cfList.push(renderRow(k.toUpperCase(), a.customFields[k]));
          }
        }
        if (cfList.length > 0) {
          cfHtml = '<div style="background:var(--bg-surface-secondary); padding:8px 10px; border-radius:4px; margin-bottom:10px; border:1px solid var(--border-subtle);">' +
            '<div style="font-size:11px; font-weight:700; color:var(--text-secondary); margin-bottom:6px; text-transform:uppercase;">' + (isVi ? "Thông số danh mục" : "Category Specifications") + '</div>' +
            '<div class="form-row" style="flex-wrap:wrap;">' + cfList.join("") + '</div>' +
          '</div>';
        }
      }

      bodyEl.innerHTML = '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; border-bottom:1px solid var(--border-subtle); padding-bottom:8px;">' +
        '<div><span style="font-family:var(--font-mono); font-size:15px; font-weight:700; color:var(--color-primary);">' + a.id + '</span> <span style="margin-left:8px;">' + badgeHtml + '</span></div>' +
        '<span style="font-size:12px; color:var(--text-secondary);">' + (a.category || "") + '</span>' +
      '</div>' +
      '<div class="form-row" style="flex-wrap:wrap;">' +
        renderRow(isVi ? "Tên thiết bị" : "Asset Name", a.name) +
        renderRow(isVi ? "Mã Serial / Service Tag" : "Serial Number", '<span style="font-family:var(--font-mono);">' + (a.serial || "-") + '</span>') +
      '</div>' +
      '<div class="form-row" style="flex-wrap:wrap;">' +
        renderRow(isVi ? "Model & Cấu hình" : "Model & Specs", a.model) +
        renderRow(isVi ? "Vị trí đặt" : "Location", a.location) +
      '</div>' +
      '<div class="form-row" style="flex-wrap:wrap;">' +
        renderRow(isVi ? "Đang cấp phát cho" : "Assigned To", a.assignedTo ? ('<strong>' + a.assignedTo + '</strong> (' + (a.department || "-") + ')') : (isVi ? "Trong kho" : "In Stock")) +
        renderRow(isVi ? "Ngày bàn giao / mua" : "Purchase Date", a.purchaseDate) +
      '</div>' +
      '<div class="form-row" style="flex-wrap:wrap;">' +
        renderRow(isVi ? "Hạn bảo hành" : "Warranty Expiry", a.warrantyExpiry) +
        renderRow(isVi ? "Ghi chú" : "Notes", a.notes) +
      '</div>' +
      cfHtml;

      footerEl.innerHTML = '<button type="button" class="btn" onclick="UI_ItemDetail.close()">' + lblClose + '</button>' +
        '<button type="button" class="btn" onclick="UI_AssetModal.printLabel(\'' + a.id + '\')">' + lblPrint + '</button>' +
        '<button type="button" class="btn btn-primary" onclick="UI_ItemDetail.close(); UI_AssetModal.open(\'' + a.id + '\');">' + lblEdit + '</button>';

    } else if (type === "license") {
      var l = (typeof LicensesService !== "undefined") ? LicensesService.getById(id) : null;
      if (!l) return;
      if (titleEl) titleEl.innerText = (isVi ? "Chi tiết bản quyền: " : "Software License: ") + l.software;

      var total = parseInt(l.totalSeats, 10) || 0;
      var asg = parseInt(l.assignedSeats, 10) || 0;
      var avail = Math.max(0, total - asg);
      var pct = (total > 0) ? Math.min(100, Math.round((asg / total) * 100)) : 100;

      bodyEl.innerHTML = '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; border-bottom:1px solid var(--border-subtle); padding-bottom:8px;">' +
        '<div><span style="font-family:var(--font-mono); font-size:15px; font-weight:700; color:var(--color-primary);">' + l.id + '</span> <span class="badge badge-available" style="margin-left:8px;">' + (l.type || "Perpetual") + '</span></div>' +
        '<span style="font-size:12px; color:var(--text-secondary);">' + (l.vendor || "") + '</span>' +
      '</div>' +
      '<div class="form-row" style="flex-wrap:wrap;">' +
        renderRow(isVi ? "Tên phần mềm" : "Software Title", l.software) +
        renderRow(isVi ? "Nhà cung cấp" : "Vendor", l.vendor) +
      '</div>' +
      '<div style="background:var(--bg-surface-secondary); padding:10px; border-radius:4px; margin-bottom:10px; border:1px solid var(--border-subtle);">' +
        '<div style="display:flex; justify-content:space-between; font-size:12px; font-weight:600; margin-bottom:4px;">' +
          '<span>' + (isVi ? "Phân bổ số lượng" : "Seat Allocation") + ': ' + asg + ' / ' + total + ' seats</span>' +
          '<span style="color:var(--color-primary);">' + avail + ' ' + (isVi ? "chỗ trống" : "available") + ' (' + pct + '%)</span>' +
        '</div>' +
        '<div style="background:var(--bg-surface-tertiary); border-radius:4px; height:8px; overflow:hidden;"><div style="background:#0078d4; width:' + pct + '%; height:100%;"></div></div>' +
      '</div>' +
      '<div class="form-row" style="flex-wrap:wrap;">' +
        renderRow(isVi ? "Mã License Key" : "License Key", '<span style="font-family:var(--font-mono);">' + (l.key || "-") + '</span>') +
        renderRow(isVi ? "Ngày gia hạn / Hết hạn" : "Expiry / Renewal", l.expiryDate || "Perpetual") +
      '</div>' +
      '<div class="form-row">' +
        renderRow(isVi ? "Ghi chú" : "Notes", l.notes) +
      '</div>';

      footerEl.innerHTML = '<button type="button" class="btn" onclick="UI_ItemDetail.close()">' + lblClose + '</button>' +
        '<button type="button" class="btn btn-primary" onclick="UI_ItemDetail.close(); UI_Licenses.openModal(\'' + l.id + '\');">' + lblEdit + '</button>';

    } else if (type === "consumable") {
      var c = (typeof ConsumablesService !== "undefined") ? ConsumablesService.getById(id) : null;
      if (!c) return;
      if (titleEl) titleEl.innerText = (isVi ? "Chi tiết vật tư: " : "Consumable Item: ") + c.name;

      var qty = parseInt(c.quantity, 10) || 0;
      var min = parseInt(c.minQuantity, 10) || 0;
      var isLow = (qty <= min);
      var cBadge = isLow ? '<span class="badge badge-warning">' + (isVi ? "Sắp hết hàng" : "Low Stock") + '</span>' : '<span class="badge badge-available">' + (isVi ? "Đủ hàng" : "In Stock") + '</span>';

      bodyEl.innerHTML = '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; border-bottom:1px solid var(--border-subtle); padding-bottom:8px;">' +
        '<div><span style="font-family:var(--font-mono); font-size:15px; font-weight:700; color:var(--color-primary);">' + c.id + '</span> <span style="margin-left:8px;">' + cBadge + '</span></div>' +
        '<span style="font-size:12px; color:var(--text-secondary);">' + (c.category || "") + '</span>' +
      '</div>' +
      '<div class="form-row" style="flex-wrap:wrap;">' +
        renderRow(isVi ? "Tên vật tư" : "Item Name", c.name) +
        renderRow(isVi ? "Danh mục" : "Category", c.category) +
      '</div>' +
      '<div class="form-row" style="flex-wrap:wrap;">' +
        renderRow(isVi ? "Số lượng tồn kho" : "Quantity in Stock", '<strong style="font-size:16px;">' + qty + '</strong> (Min: ' + min + ')') +
        renderRow(isVi ? "Vị trí lưu kho" : "Storage Location", c.location || "-") +
      '</div>';

      footerEl.innerHTML = '<button type="button" class="btn" onclick="UI_ItemDetail.close()">' + lblClose + '</button>' +
        '<button type="button" class="btn btn-primary" onclick="UI_ItemDetail.close(); UI_Consumables.openModal(\'' + c.id + '\');">' + lblEdit + '</button>';
    }

    document.getElementById("item-detail-modal").className = "modal-backdrop open";
  }

  return {
    open: open,
    close: close
  };
})();
