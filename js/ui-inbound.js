/* ==========================================================================
   ITIM-lite - PO Inbound UI Controller & Dedicated Workspace
   Pure ES5 for Windows HTA / IE11 compatibility (< 295 LOC)
   ========================================================================== */

var UI_Inbound = (function () {
  var isCreating = false, stagedItems = [], searchMatches = [];

  function tr(k, fb) { return (typeof I18N !== "undefined") ? I18N.t(k) : (fb || k); }
  function getStatusBadge(s) {
    if (s === "received") return '<span class="badge badge-available">' + tr("status_received", "Fully Received") + '</span>';
    if (s === "partial") return '<span class="badge badge-inuse">' + tr("status_partial", "Partially Received") + '</span>';
    if (s === "pending") return '<span class="badge badge-repair">' + tr("status_pending", "Pending Delivery") + '</span>';
    return '<span class="badge badge-retired">' + tr("status_" + s, s) + '</span>';
  }

  function ensureContainers() {
    var host = document.getElementById("view-inbound");
    if (!host || document.getElementById("inbound-table-view")) return;
    host.innerHTML = '<div id="inbound-table-view">' + host.innerHTML + '</div><div id="inbound-workspace-view" style="display:none;"></div>';
  }

  function initFilterBar() {
    if (typeof UI_FilterBar === "undefined") return;
    UI_FilterBar.init("inbound", {
      title: "Purchase Orders", placeholder: "Search PO number, vendor, notes, items...",
      fields: [
        { id: "status", label: "Status", type: "select", options: [{ value: "all", label: "All Statuses" }, { value: "pending", label: "Pending" }, { value: "partial", label: "Partial" }, { value: "received", label: "Fully Received" }] },
        { id: "vendor", label: "Vendor", type: "text", placeholder: "e.g. Dell, Lenovo" }, { id: "date", label: "Order Date", type: "date" }
      ],
      onFilter: function () { renderTable(); }
    });
  }

  function render() {
    ensureContainers();
    var tbl = document.getElementById("inbound-table-view"), wsp = document.getElementById("inbound-workspace-view");
    if (tbl) tbl.style.display = isCreating ? "none" : "block";
    if (wsp) wsp.style.display = isCreating ? "block" : "none";
    if (isCreating) renderCreateWorkspace(); else renderTable();
  }

  function renderTable() {
    initFilterBar();
    var curSearch = "", curStatus = "all", curVendor = "", curDate = "";
    if (typeof UI_FilterBar !== "undefined") {
      UI_FilterBar.render("inbound-filter-bar", "inbound");
      var crit = UI_FilterBar.getCriteria("inbound");
      curSearch = (crit.search || "").toLowerCase(); curStatus = (crit.filters && crit.filters.status) ? crit.filters.status : "all";
      curVendor = (crit.filters && crit.filters.vendor) ? crit.filters.vendor.toLowerCase() : ""; curDate = (crit.filters && crit.filters.date) ? crit.filters.date : "";
    }
    var tbody = document.getElementById("inbound-table-tbody");
    if (!tbody || typeof POService === "undefined") return;
    var list = POService.getAll(), rows = [];
    for (var i = 0; i < list.length; i++) {
      var po = list[i];
      if (curStatus !== "all" && po.status !== curStatus) continue;
      if (curVendor && (!po.vendor || po.vendor.toLowerCase().indexOf(curVendor) === -1)) continue;
      if (curDate && po.orderDate !== curDate) continue;
      if (curSearch) {
        var str = (po.poNumber + " " + po.vendor + " " + (po.notes || "")).toLowerCase();
        for (var k = 0; k < po.items.length; k++) str += " " + po.items[k].name.toLowerCase();
        if (str.indexOf(curSearch) === -1) continue;
      }
      var tOrd = 0, tRec = 0;
      for (var j = 0; j < po.items.length; j++) { tOrd += (po.items[j].qtyOrdered || 0); tRec += (po.items[j].qtyReceived || 0); }
      var desc = po.items.length + " " + tr("th_items", "items") + " (" + tRec + "/" + tOrd + ")";
      rows.push('<tr class="clickable-row" onclick="UI_ActionsMenu.onRowClick(event, \'inbound\', \'' + po.poNumber + '\')" oncontextmenu="UI_ActionsMenu.show(event, \'inbound\', \'' + po.poNumber + '\')">' +
        '<td><strong>' + po.poNumber + '</strong></td><td>' + po.vendor + '</td><td>' + (typeof I18N !== "undefined" && po.orderDate ? I18N.formatDate(po.orderDate) : (po.orderDate || "—")) + '</td><td>' + desc + '</td><td>' + getStatusBadge(po.status) + '</td>' +
        '<td style="text-align:right;"><button class="btn btn-icon btn-sm action-menu-trigger" onclick="UI_ActionsMenu.show(event, \'inbound\', \'' + po.poNumber + '\')" title="Actions">⋮</button></td></tr>');
    }
    tbody.innerHTML = rows.length ? rows.join("") : '<tr><td colspan="6" style="text-align:center; padding:24px; color:var(--text-secondary);">No purchase orders found.</td></tr>';
  }

  function setFilter(status) {
    if (typeof UI_FilterBar !== "undefined") { var crit = UI_FilterBar.getCriteria("inbound"); if (crit && crit.filters) crit.filters.status = status; }
    renderTable();
  }

  function openCreateWorkspace() { isCreating = true; stagedItems = []; render(); }
  function closeCreateWorkspace() { isCreating = false; stagedItems = []; render(); }
  function toggleSnRow(idx) { if (stagedItems[idx]) { stagedItems[idx].isExpanded = !stagedItems[idx].isExpanded; renderStagedTable(); } }
  function removeSingleSn(idx, sIdx) { if (stagedItems[idx] && stagedItems[idx].serials) { stagedItems[idx].serials.splice(sIdx, 1); renderStagedTable(); } }
  function removeItemRow(idx) { stagedItems.splice(idx, 1); renderStagedTable(); }
  function closeModal() { var host = document.getElementById("modal-host"); if (host) host.innerHTML = ""; }
  function toggleConSn(checked) { var b = document.getElementById("con-sn-box"); if (b) b.style.display = checked ? "block" : "none"; }
  function toggleSwKeyMode(mode) {
    var sb = document.getElementById("sw-single-key-box"), mb = document.getElementById("sw-multi-key-box");
    if (sb && mb) { sb.style.display = (mode === "single") ? "block" : "none"; mb.style.display = (mode === "multi") ? "block" : "none"; }
  }

  function renderCreateWorkspace() {
    var host = document.getElementById("inbound-workspace-view"); if (!host) return;
    var today = new Date().toISOString().slice(0, 10), nextId = (typeof POService !== "undefined") ? POService.generateNextPoId() : "PO-8001";
    host.innerHTML = '<div style="margin-bottom:14px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">' +
      '<div style="display:flex; align-items:center; gap:12px;"><button type="button" class="btn btn-sm" onclick="UI_Inbound.closeCreateWorkspace()">' + tr("btn_back_po_list", "← Back to PO List") + '</button><h2 style="margin:0; font-size:18px;">' + tr("po_new_title", "+ New Purchase Order") + '</h2></div>' +
      '<div style="display:flex; gap:8px;"><button type="button" class="btn" onclick="UI_Inbound.closeCreateWorkspace()">' + tr("btn_cancel", "Cancel") + '</button><button type="button" class="btn btn-primary" onclick="UI_Inbound.submitCreate()">' + tr("btn_create_po", "Create PO") + '</button></div></div>' +
      '<div class="card" style="padding:16px; margin-bottom:14px; background:var(--bg-surface-secondary); border:1px solid var(--border-subtle);"><div class="form-row">' +
        '<div class="form-group"><label class="form-label">' + tr("th_po_number", "PO Number") + ':</label><input type="text" id="po-input-id" class="form-input" value="' + nextId + '" readonly style="background:#f5f5f5;" /></div>' +
        '<div class="form-group"><label class="form-label">' + tr("th_vendor", "Vendor") + ': *</label><input type="text" id="po-input-vendor" class="form-input" placeholder="e.g. Dell Direct, CDW" required /></div>' +
        '<div class="form-group"><label class="form-label">' + tr("th_order_date", "Order Date") + ':</label><input type="date" id="po-input-orderdate" class="form-input" value="' + today + '" /></div></div>' +
        '<div class="form-group"><label class="form-label">' + tr("ph_notes", "Notes") + ':</label><input type="text" id="po-input-notes" class="form-input" placeholder="e.g. Q3 Batch Refresh" /></div></div>' +
      '<div class="card" style="padding:16px;"><div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; flex-wrap:wrap; gap:10px;">' +
        '<h4 style="margin:0;" id="po-staged-count-header">' + tr("po_line_items", "Line Items:") + ' (' + stagedItems.length + ')</h4>' +
        '<div style="position:relative; flex:1; max-width:440px;"><input type="text" id="po-search-catalog-input" class="form-input" placeholder="Search SKU, Name, Model (Press Enter to add)..." oninput="UI_Inbound.onSearchInput(this.value)" onkeydown="UI_Inbound.onSearchKeyDown(event)" autocomplete="off" />' +
          '<div id="po-search-dropdown" style="display:none; position:absolute; top:100%; left:0; right:0; max-height:220px; overflow-y:auto; background:#fff; border:1px solid var(--border-subtle); border-radius:4px; box-shadow:0 6px 16px rgba(0,0,0,0.12); z-index:1000; margin-top:2px;"></div>' +
        '</div></div>' +
        '<div class="data-table-container"><table class="data-table"><thead><tr><th style="width:35px; text-align:center;">#</th><th>' + tr("th_name_model", "Item / Model") + '</th><th>' + tr("th_type", "Type") + '</th><th>' + tr("th_category", "Category") + '</th><th style="width:100px;">' + tr("th_quantity", "Quantity") + '</th><th style="width:130px;">Serial Numbers</th><th style="text-align:right; width:50px;">' + tr("th_actions", "Action") + '</th></tr></thead><tbody id="po-staged-tbody"></tbody></table></div></div>';
    renderStagedTable();
  }

  function renderStagedTable() {
    var tbody = document.getElementById("po-staged-tbody"), countH = document.getElementById("po-staged-count-header");
    if (countH) countH.innerText = tr("po_line_items", "Line Items:") + " (" + stagedItems.length + ")";
    if (!tbody) return;
    if (!stagedItems.length) { tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:24px; color:var(--text-tertiary);">' + tr("po_no_items_staged", "No items added yet. Search Master Catalog above to add items.") + '</td></tr>'; return; }
    var html = [];
    for (var i = 0; i < stagedItems.length; i++) {
      var s = stagedItems[i], snCount = s.serials.length;
      var badge = (s.type === "software") ? '<span class="badge" style="background:#7c3aed;color:#fff;">Software</span>' : (s.type === "consumable" ? '<span class="badge" style="background:#ea580c;color:#fff;">Stock</span>' : '<span class="badge" style="background:#0078d4;color:#fff;">Hardware</span>');
      var snLabel = snCount > 0 ? ("SN: " + snCount + "/" + s.qtyOrdered + (s.isExpanded ? " ▲" : " ▼")) : "+ Add SN";
      html.push('<tr><td style="text-align:center; font-family:var(--font-mono);">' + (i + 1) + '</td><td><strong>' + s.name + '</strong>' + (s.model ? '<br><span style="font-size:11px; color:var(--text-secondary);">' + s.model + '</span>' : '') + '</td><td>' + badge + '</td><td>' + (s.category || "-") + '</td>' +
        '<td><input type="number" class="form-input" min="' + Math.max(1, snCount) + '" value="' + s.qtyOrdered + '" style="width:80px; height:28px;" onchange="UI_Inbound.updateItemQty(' + i + ', this.value)" /></td>' +
        '<td><button type="button" class="btn btn-sm ' + (snCount > 0 ? 'btn-primary' : '') + '" onclick="UI_Inbound.toggleSnRow(' + i + ')">' + snLabel + '</button></td>' +
        '<td style="text-align:right;"><button type="button" class="btn btn-sm" onclick="UI_Inbound.removeItemRow(' + i + ')" style="color:#d13438;">✕</button></td></tr>');
      if (s.isExpanded) {
        var tags = [];
        for (var k = 0; k < s.serials.length; k++) tags.push('<span class="badge" style="background:#fff; border:1px solid var(--color-primary); color:var(--color-primary); font-family:var(--font-mono); padding:2px 6px; font-size:11px; display:inline-flex; align-items:center; gap:5px;">' + s.serials[k] + '<button type="button" onclick="UI_Inbound.removeSingleSn(' + i + ', ' + k + ')" style="background:none; border:none; color:#d13438; cursor:pointer; font-weight:bold; padding:0; line-height:1;">✕</button></span>');
        html.push('<tr style="background:var(--bg-surface-secondary);"><td colspan="7" style="padding:8px 14px; border-bottom:1px solid var(--border-subtle);"><div style="display:flex; gap:8px; align-items:center; margin-bottom:6px; flex-wrap:wrap;"><span style="font-size:11px; font-weight:700; color:var(--color-primary);">SN (' + snCount + '/' + s.qtyOrdered + '):</span><input type="text" id="po-sn-in-' + i + '" class="form-input" style="height:26px; font-size:11px; width:220px; font-family:var(--font-mono);" placeholder="Type/scan SN & Enter..." onkeydown="if(event.keyCode===13){event.preventDefault(); UI_Inbound.addSingleSn(' + i + ', this.value); this.value=\'\';}" /><button type="button" class="btn btn-sm" onclick="var el=document.getElementById(\'po-sn-in-' + i + '\'); if(el&&el.value){ UI_Inbound.addSingleSn(' + i + ', el.value); el.value=\'\'; }">+ Add</button><button type="button" class="btn btn-sm" onclick="UI_Inbound.promptPasteSns(' + i + ')">Paste List</button><span style="font-size:10px; color:var(--text-secondary);">(Max ' + s.qtyOrdered + ' SNs; SN count cannot exceed total)</span></div><div style="display:flex; gap:6px; flex-wrap:wrap;">' + (tags.length ? tags.join(" ") : '<span style="font-size:11px; color:var(--text-tertiary);">No serials entered yet for this entry.</span>') + '</div></td></tr>');
      }
    }
    tbody.innerHTML = html.join("");
  }

  function onSearchInput(q) {
    var dd = document.getElementById("po-search-dropdown"); if (!dd) return;
    q = (q || "").trim().toLowerCase(); if (!q) { dd.style.display = "none"; searchMatches = []; return; }
    var all = (typeof CatalogService !== "undefined") ? CatalogService.getAll() : [];
    searchMatches = all.filter(function (it) {
      return (it.name && it.name.toLowerCase().indexOf(q) !== -1) || (it.sku && it.sku.toLowerCase().indexOf(q) !== -1) ||
        (it.model && it.model.toLowerCase().indexOf(q) !== -1) || (it.category && it.category.toLowerCase().indexOf(q) !== -1);
    });
    if (!searchMatches.length) dd.innerHTML = '<div style="padding:10px 14px; font-size:12px; color:var(--text-tertiary);">No matching master items found.</div>';
    else {
      var h = [];
      for (var i = 0; i < searchMatches.length; i++) {
        var it = searchMatches[i];
        h.push('<div class="clickable-row" style="padding:6px 10px; border-bottom:1px solid var(--border-subtle); cursor:pointer;" onclick="UI_Inbound.selectCatalogItem(\'' + it.id + '\')"><div style="font-weight:600; font-size:12px;"><span style="font-family:var(--font-mono); color:var(--color-primary); margin-right:6px;">' + (it.sku || it.id) + '</span>' + it.name + '</div><div style="font-size:11px; color:var(--text-secondary);">' + (it.type || "hardware").toUpperCase() + ' | ' + (it.category || "General") + (it.model ? ' | ' + it.model : '') + '</div></div>');
      }
      dd.innerHTML = h.join("");
    }
    dd.style.display = "block";
  }

  function onSearchKeyDown(e) {
    if (e.keyCode === 13) { e.preventDefault(); if (searchMatches && searchMatches.length > 0) selectCatalogItem(searchMatches[0].id); }
    else if (e.keyCode === 27) { var dd = document.getElementById("po-search-dropdown"); if (dd) dd.style.display = "none"; }
  }

  function selectCatalogItem(catId) {
    var it = (typeof CatalogService !== "undefined") ? CatalogService.getById(catId) : null;
    var inp = document.getElementById("po-search-catalog-input"), dd = document.getElementById("po-search-dropdown");
    if (inp) inp.value = ""; if (dd) dd.style.display = "none"; if (!it) return;
    stagedItems.push({ masterId: it.id, sku: it.sku || it.id, name: it.name, type: it.type || "hardware", category: it.category || "", model: it.model || "", qtyOrdered: 1, serials: [], isExpanded: false });
    renderStagedTable(); if (inp) inp.focus();
  }

  function toggleSnRow(idx) { if (stagedItems[idx]) { stagedItems[idx].isExpanded = !stagedItems[idx].isExpanded; renderStagedTable(); } }

  function addSingleSn(idx, sn) {
    sn = (sn || "").trim(); var it = stagedItems[idx]; if (!sn || !it) return;
    if (it.serials.length >= it.qtyOrdered) { if (typeof Notifications !== "undefined") Notifications.show("Cannot add SN: serial count cannot exceed total quantity (" + it.qtyOrdered + ").", "warning"); return; }
    it.serials.push(sn); renderStagedTable();
    var inp = document.getElementById("po-sn-in-" + idx); if (inp) inp.focus();
  }

  function removeSingleSn(idx, sIdx) { if (stagedItems[idx] && stagedItems[idx].serials) { stagedItems[idx].serials.splice(sIdx, 1); renderStagedTable(); } }

  function promptPasteSns(idx) {
    var it = stagedItems[idx]; if (!it) return;
    var rem = it.qtyOrdered - it.serials.length;
    if (rem <= 0) { if (typeof Notifications !== "undefined") Notifications.show("This line already has all " + it.qtyOrdered + " serials.", "warning"); return; }
    var raw = prompt("Paste Serial Numbers (separated by commas or newlines, up to " + rem + "):"); if (!raw) return;
    var list = raw.split(/[\n,]+/).map(function(s){ return s.trim(); }).filter(function(s){ return s.length > 0; });
    for (var k = 0; k < Math.min(rem, list.length); k++) it.serials.push(list[k]);
    renderStagedTable();
  }

  function updateItemQty(idx, val) {
    var q = parseInt(val, 10) || 1, it = stagedItems[idx]; if (!it) return;
    if (q < it.serials.length) { if (typeof Notifications !== "undefined") Notifications.show("Total quantity (" + q + ") cannot be less than entered SNs (" + it.serials.length + ").", "warning"); renderStagedTable(); return; }
    it.qtyOrdered = q; renderStagedTable();
  }

  function removeItemRow(idx) { stagedItems.splice(idx, 1); renderStagedTable(); }

  function submitCreate() {
    var vendor = (document.getElementById("po-input-vendor").value || "").trim();
    if (!vendor) { if (typeof Notifications !== "undefined") Notifications.show("Please enter vendor name.", "warning"); return; }
    if (!stagedItems.length) { if (typeof Notifications !== "undefined") Notifications.show("Please add at least one line item.", "warning"); return; }
    try {
      var po = POService.createPO({ vendor: vendor, orderDate: document.getElementById("po-input-orderdate").value, notes: document.getElementById("po-input-notes").value, items: stagedItems });
      closeCreateWorkspace(); if (typeof NavController !== "undefined") NavController.updateBadges();
      if (typeof Notifications !== "undefined") Notifications.show("PO " + po.poNumber + " created successfully with " + po.items.length + " line item(s).", "success");
    } catch (err) { alert("Error: " + err.message); }
  }

  function closeModal() { var host = document.getElementById("modal-host"); if (host) host.innerHTML = ""; }

  function openReceiveModal(poNumber) {
    var po = POService.getById(poNumber), host = document.getElementById("modal-host"); if (!po || !host) return;
    var itemOpts = [];
    for (var i = 0; i < po.items.length; i++) {
      var it = po.items[i], rem = it.qtyOrdered - (it.qtyReceived || 0);
      if (rem > 0) itemOpts.push({ value: String(i), label: it.name + ' [' + (it.type || "asset").toUpperCase() + '] (' + rem + ' left of ' + it.qtyOrdered + ')' });
    }
    if (!itemOpts.length) { alert("All items for PO " + poNumber + " already received."); return; }
    var comboHtml = (typeof UI_ComboBox !== "undefined") ? UI_ComboBox.renderHtml("receive-item-idx", itemOpts, itemOpts[0].value, "", 'onchange="UI_Inbound.onReceiveItemChange(\'' + poNumber + '\')"')
      : '<select id="receive-item-idx" class="form-select combo-box" onchange="UI_Inbound.onReceiveItemChange(\'' + poNumber + '\')">' + itemOpts.map(function(o){ return '<option value="'+o.value+'">'+o.label+'</option>'; }).join("") + '</select>';

    host.innerHTML = '<div class="modal-backdrop open" onclick="if ((event.target || event.srcElement) === this) UI_Inbound.closeModal()"><div class="modal modal-secondary" style="width:66vw; max-width:92vw;"><div class="modal-header"><h3>' + tr("po_receive_title", "Receive Inbound - ") + po.poNumber + '</h3><span class="modal-close" onclick="UI_Inbound.closeModal()">✕</span></div><form onsubmit="UI_Inbound.submitReceive(event, \'' + po.poNumber + '\')"><div class="modal-body" style="flex:1 1 auto; min-height:0; overflow-y:auto; padding:16px 20px;"><div style="background:#e0f0ff; padding:8px 12px; border-radius:4px; margin-bottom:10px; font-size:12px;"><strong>' + tr("th_vendor", "Vendor") + ':</strong> ' + po.vendor + ' | <strong>' + tr("th_order_date", "Ordered") + ':</strong> ' + (typeof I18N !== "undefined" && po.orderDate ? I18N.formatDate(po.orderDate) : (po.orderDate || "—")) + '</div><div class="form-row"><div class="form-group" style="flex:2;"><label class="form-label">' + tr("po_sel_line_item", "Select Line Item: *") + '</label>' + comboHtml + '</div><div class="form-group" style="flex:1;"><label class="form-label">' + tr("po_qty_to_receive", "Quantity to Receive:") + '</label><input type="number" id="receive-qty" class="form-input" min="1" value="1" /></div></div><div class="form-row"><div class="form-group" style="flex:2;"><label class="form-label">' + tr("lbl_storage_location", "Storage Location") + ': *</label><input type="text" id="receive-location" class="form-input" value="IT Stock Room Shelf A" required /></div><div class="form-group" style="flex:1;"><label class="form-label">' + tr("po_receiving_officer", "Receiving Officer:") + '</label><input type="text" id="receive-officer" class="form-input" value="Receiving Staff" required /></div></div><div id="receive-type-specific-host" style="margin-top:6px;"></div></div><div class="modal-footer"><button type="button" class="btn" onclick="UI_Inbound.closeModal()">' + tr("btn_cancel", "Cancel") + '</button><button type="submit" class="btn btn-primary">' + tr("po_intake_btn", "Intake to Inventory") + '</button></div></form></div></div>';
    onReceiveItemChange(poNumber);
  }

  function onReceiveItemChange(poNumber) {
    var po = POService.getById(poNumber), host = document.getElementById("receive-type-specific-host");
    var idxVal = (typeof UI_ComboBox !== "undefined") ? UI_ComboBox.getValue("receive-item-idx") : (document.getElementById("receive-item-idx") ? document.getElementById("receive-item-idx").value : "0");
    var idx = parseInt(idxVal, 10) || 0; if (!po || !host || !po.items[idx]) return;
    var item = po.items[idx], t = item.type || "asset", rem = item.qtyOrdered - (item.qtyReceived || 0);
    var qtyInput = document.getElementById("receive-qty"); if (qtyInput) { qtyInput.max = rem; qtyInput.value = rem > 0 ? rem : 1; }
    var preSerials = (item.serials && item.serials.length) ? item.serials.join("\n") : "";
    var html = [];
    if (t === "software") {
      html.push('<div style="background:var(--bg-surface-secondary); padding:10px; border-radius:4px; border:1px solid var(--border-subtle);"><div style="font-size:12px; font-weight:700; color:var(--color-primary); margin-bottom:6px;">' + tr("sec_software_seats", "Software License Keys") + '</div>' +
        '<div style="margin-bottom:8px; display:flex; gap:16px; font-size:12px;"><label><input type="radio" name="sw-key-mode" value="single" checked onchange="UI_Inbound.toggleSwKeyMode(\'single\')" /> ' + tr("po_key_single", "Single Key for all seats") + '</label><label><input type="radio" name="sw-key-mode" value="multi" onchange="UI_Inbound.toggleSwKeyMode(\'multi\')" /> ' + tr("po_key_multi", "Individual Key per seat") + '</label></div>' +
        '<div id="sw-single-key-box" class="form-group"><input type="text" id="receive-single-key" class="form-input" placeholder="' + tr("ph_license_key_single", "e.g. ABCD-1234-EFGH-5678") + '" value="' + (preSerials.indexOf("\n") === -1 ? preSerials : "") + '" /></div>' +
        '<div id="sw-multi-key-box" class="form-group" style="display:none;"><textarea id="receive-multi-keys" class="form-textarea" rows="3" placeholder="' + tr("ph_license_keys_multi", "Enter license key for each seat (1 per line)...") + '">' + preSerials + '</textarea></div>' +
        '<div class="form-group" style="margin:0;"><label class="form-label" style="font-size:11px;">' + tr("lbl_expiry_renewal", "Expiry / Renewal") + ':</label><input type="date" id="receive-expiry" class="form-input" /></div></div>');
    } else if (t === "consumable") {
      var isSerialized = !!(item.isSerialized || preSerials);
      html.push('<div style="background:var(--bg-surface-secondary); padding:10px; border-radius:4px; border:1px solid var(--border-subtle);"><div style="margin-bottom:6px;"><label style="font-size:12px; font-weight:700; cursor:pointer;"><input type="checkbox" id="receive-is-serialized" ' + (isSerialized ? 'checked' : '') + ' onchange="UI_Inbound.toggleConSn(this.checked)" /> ' + tr("po_track_sn", "Track with Serial Number (Serial Pool)") + '</label></div>' +
        '<div id="con-sn-box" style="' + (isSerialized ? 'display:block;' : 'display:none;') + '"><label class="form-label" style="font-size:11px;">' + tr("th_serial_no", "Serial Numbers") + ' (1 per line):</label><textarea id="receive-serials" class="form-textarea" rows="3" placeholder="' + tr("ph_serials_pool", "Enter or scan serial numbers (1 per line)...") + '">' + preSerials + '</textarea></div></div>');
    } else {
      html.push('<div class="form-group"><label class="form-label">' + tr("th_serial_no", "Serial Numbers") + ' (' + tr("ph_notes", "Optional; 1 per line for Hardware") + '):</label><textarea id="receive-serials" class="form-textarea" rows="3" placeholder="' + tr("ph_serials_optional", "Optional: Enter or scan serial numbers (1 per line, up to quantity)...") + '">' + preSerials + '</textarea></div>');
    }
    host.innerHTML = html.join("");
  }

  function submitReceive(e, poNumber) {
    if (e && e.preventDefault) e.preventDefault();
    var idxVal = (typeof UI_ComboBox !== "undefined") ? UI_ComboBox.getValue("receive-item-idx") : (document.getElementById("receive-item-idx") ? document.getElementById("receive-item-idx").value : "0");
    var idx = parseInt(idxVal, 10) || 0, qty = parseInt(document.getElementById("receive-qty").value, 10) || 1;
    var location = document.getElementById("receive-location").value, officer = document.getElementById("receive-officer").value;
    var po = POService.getById(poNumber), item = (po && po.items) ? po.items[idx] : null, itemType = item ? (item.type || "asset") : "asset";
    var singleKey = "", multiKeys = [], serials = [], isSerialized = false, expiryDate = "";
    if (itemType === "software") {
      var radios = document.getElementsByName("sw-key-mode"), mode = "single";
      for (var r = 0; r < radios.length; r++) { if (radios[r].checked) mode = radios[r].value; }
      if (mode === "single") singleKey = (document.getElementById("receive-single-key") ? document.getElementById("receive-single-key").value : "").trim();
      else { var rawK = document.getElementById("receive-multi-keys") ? document.getElementById("receive-multi-keys").value : ""; multiKeys = rawK.split(/[\n,]+/).map(function(s){ return s.trim(); }).filter(function(s){ return s.length > 0; }); }
      var expEl = document.getElementById("receive-expiry"); if (expEl) expiryDate = expEl.value;
    } else if (itemType === "consumable") {
      var chk = document.getElementById("receive-is-serialized"); isSerialized = chk ? chk.checked : false;
      serials = (document.getElementById("receive-serials") ? document.getElementById("receive-serials").value : "").split(/[\n,]+/).map(function(s){ return s.trim(); }).filter(function(s){ return s.length > 0; });
    } else {
      serials = (document.getElementById("receive-serials") ? document.getElementById("receive-serials").value : "").split(/[\n,]+/).map(function(s){ return s.trim(); }).filter(function(s){ return s.length > 0; });
    }
    if (serials.length > qty) { alert("Validation Error: Entered " + serials.length + " serial numbers, but quantity to receive is " + qty + "."); return; }
    try {
      var res = POService.receiveItems(poNumber, idx, { qty: qty, serials: serials, licenseKey: singleKey, licenseKeys: multiKeys, isSerialized: isSerialized, location: location, officer: officer, expiryDate: expiryDate });
      closeModal(); render();
      if (typeof NavController !== "undefined") NavController.updateBadges();
      var itemRef = (res.assets && res.assets.length) ? res.assets.map(function(a){ return a.id; }).join(", ")
        : (res.consumables && res.consumables.length ? res.consumables.map(function(c){ return c.id; }).join(", ")
        : (res.licenses && res.licenses.length ? res.licenses.map(function(l){ return l.id; }).join(", ") : (res.po.items[idx] ? res.po.items[idx].name : "Items")));
      if (typeof Notifications !== "undefined") Notifications.show("Intake complete: " + itemRef + " (Txn: " + res.transaction.id + ")", "success");
    } catch (err) { alert("Error: " + err.message); }
  }

  function openDetailModal(poNumber) {
    var po = POService.getById(poNumber), host = document.getElementById("modal-host"); if (!po || !host) return;
    var rows = [];
    for (var i = 0; i < po.items.length; i++) {
      var it = po.items[i], badges = (it.assetIds || []).concat(it.consumableIds || []).concat(it.licenseIds || []).map(function(id){ return '<span class="badge badge-available">' + id + '</span>'; }).join(" ") || "<em>None</em>";
      var snText = (it.serials && it.serials.length) ? ('<br><span style="font-size:10px; color:var(--color-primary); font-family:var(--font-mono);">SN: ' + it.serials.join(", ") + '</span>') : '';
      rows.push('<tr><td>' + it.name + snText + '</td><td>' + it.category + '</td><td>' + it.qtyOrdered + '</td><td>' + (it.qtyReceived || 0) + '</td><td>' + badges + '</td></tr>');
    }
    host.innerHTML = '<div class="modal-backdrop open" onclick="if ((event.target || event.srcElement) === this) UI_Inbound.closeModal()"><div class="modal modal-secondary" style="width:66vw; max-width:92vw;"><div class="modal-header"><h3>' + tr("po_detail_title", "Purchase Order - ") + po.poNumber + '</h3><span class="modal-close" onclick="UI_Inbound.closeModal()">✕</span></div><div class="modal-body" style="flex:1 1 auto; min-height:0; overflow-y:auto; padding:16px 20px;"><div style="margin-bottom:12px; font-size:12px; background:var(--bg-surface-secondary); padding:10px 14px; border-radius:4px; border:1px solid var(--border-subtle);"><div class="form-row" style="margin-bottom:6px;"><div style="flex:1;"><strong>' + tr("th_vendor", "Vendor") + ':</strong> ' + po.vendor + '</div><div style="flex:1;"><strong>' + tr("th_status", "Status") + ':</strong> ' + getStatusBadge(po.status) + '</div></div><div class="form-row" style="margin-bottom:6px;"><div style="flex:1;"><strong>' + tr("th_order_date", "Order Date") + ':</strong> ' + (typeof I18N !== "undefined" && po.orderDate ? I18N.formatDate(po.orderDate) : (po.orderDate || "—")) + '</div><div style="flex:1;"><strong>' + tr("po_received_date", "Received Date:") + '</strong> ' + (typeof I18N !== "undefined" && po.receivedDate ? I18N.formatDate(po.receivedDate) : (po.receivedDate || "—")) + '</div></div><div><strong>' + tr("ph_notes", "Notes") + ':</strong> ' + (po.notes || "—") + '</div></div><div class="data-table-container"><table class="data-table"><thead><tr><th>' + tr("th_name", "Item") + '</th><th>' + tr("th_category", "Category") + '</th><th>' + tr("po_ordered", "Ordered") + '</th><th>' + tr("po_received", "Received") + '</th><th>' + tr("po_created_assets", "Created IDs") + '</th></tr></thead><tbody>' + rows.join("") + '</tbody></table></div></div><div class="modal-footer"><button type="button" class="btn" onclick="UI_Inbound.closeModal()">' + tr("btn_cancel", "Close") + '</button></div></div></div>';
  }

  return {
    render: render, setFilter: setFilter, openCreateModal: openCreateWorkspace, openCreateWorkspace: openCreateWorkspace, closeCreateWorkspace: closeCreateWorkspace,
    onSearchInput: onSearchInput, onSearchKeyDown: onSearchKeyDown, selectCatalogItem: selectCatalogItem, toggleSnRow: toggleSnRow, addSingleSn: addSingleSn, removeSingleSn: removeSingleSn,
    promptPasteSns: promptPasteSns, updateItemQty: updateItemQty, removeItemRow: removeItemRow, submitCreate: submitCreate, openReceiveModal: openReceiveModal, onReceiveItemChange: onReceiveItemChange,
    toggleSwKeyMode: toggleSwKeyMode, toggleConSn: toggleConSn, submitReceive: submitReceive, openDetailModal: openDetailModal, closeModal: closeModal
  };
})();
