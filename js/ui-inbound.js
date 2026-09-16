/* ==========================================================================
   ITIM-lite - PO Inbound UI Controller & Receiving Workflow
   ========================================================================== */

var UI_Inbound = (function () {
  var currentFilter = "all";

  function getStatusBadge(status) {
    if (status === "received") return '<span class="badge badge-available">Fully Received</span>';
    if (status === "partial") return '<span class="badge badge-inuse">Partially Received</span>';
    if (status === "pending") return '<span class="badge badge-repair">Pending Delivery</span>';
    return '<span class="badge badge-retired">' + status + '</span>';
  }

  function initFilterBar() {
    if (typeof UI_FilterBar === "undefined") return;
    UI_FilterBar.init("inbound", {
      title: "Purchase Orders",
      placeholder: "Search PO number, vendor, notes, items...",
      fields: [
        {
          id: "status", label: "Status", type: "select",
          options: [
            { value: "all", label: "All Statuses" }, { value: "pending", label: "Pending" },
            { value: "partial", label: "Partial" }, { value: "received", label: "Fully Received" }
          ]
        },
        { id: "vendor", label: "Vendor", type: "text", placeholder: "e.g. Dell, Lenovo" },
        { id: "date", label: "Order Date", type: "date" }
      ],
      onFilter: function () { render(); }
    });
  }

  function render() {
    initFilterBar();
    var curSearch = "", curStatus = "all", curVendor = "", curDate = "";
    if (typeof UI_FilterBar !== "undefined") {
      UI_FilterBar.render("inbound-filter-bar", "inbound");
      var crit = UI_FilterBar.getCriteria("inbound");
      curSearch = (crit.search || "").toLowerCase();
      curStatus = (crit.filters && crit.filters.status) ? crit.filters.status : "all";
      curVendor = (crit.filters && crit.filters.vendor) ? crit.filters.vendor.toLowerCase() : "";
      curDate = (crit.filters && crit.filters.date) ? crit.filters.date : "";
    }

    var tbody = document.getElementById("inbound-table-tbody");
    if (!tbody || typeof POService === "undefined") return;

    var list = POService.getAll();
    var rows = [];

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

      var totalOrd = 0, totalRec = 0;
      for (var j = 0; j < po.items.length; j++) {
        var it = po.items[j];
        totalOrd += (it.qtyOrdered || 0);
        totalRec += (it.qtyReceived || 0);
      }

      var itemsDesc = po.items.length + " items (" + totalRec + "/" + totalOrd + " received)";
      rows.push('<tr class="clickable-row" onclick="UI_ActionsMenu.onRowClick(event, \'inbound\', \'' + po.poNumber + '\')" oncontextmenu="UI_ActionsMenu.show(event, \'inbound\', \'' + po.poNumber + '\')">' +
        '<td><strong>' + po.poNumber + '</strong></td><td>' + po.vendor + '</td><td>' + (po.orderDate || "—") + '</td><td>' + itemsDesc + '</td><td>' + getStatusBadge(po.status) + '</td>' +
        '<td style="text-align:right;"><button class="btn btn-icon btn-sm action-menu-trigger" onclick="UI_ActionsMenu.show(event, \'inbound\', \'' + po.poNumber + '\')" title="Actions">⋮</button></td></tr>');
    }

    tbody.innerHTML = rows.length ? rows.join("") : '<tr><td colspan="6" style="text-align:center; padding:24px; color:var(--text-secondary);">No purchase orders found.</td></tr>';
  }

  function setFilter(status) {
    currentFilter = status;
    if (typeof UI_FilterBar !== "undefined") {
      var crit = UI_FilterBar.getCriteria("inbound");
      crit.filters.status = status;
    }
    render();
  }

  function closeModal() {
    var host = document.getElementById("modal-host");
    if (host) host.innerHTML = "";
  }

  function openCreateModal() {
    var host = document.getElementById("modal-host");
    if (!host) return;
    var today = new Date().toISOString().slice(0, 10);
    var nextId = (typeof POService !== "undefined") ? POService.generateNextPoId() : "PO-8001";

    host.innerHTML = '<div class="modal-backdrop open" onclick="if ((event.target || event.srcElement) === this) UI_Inbound.closeModal()"><div class="modal" style="width:640px; max-width:92vw;">' +
      '<div class="modal-header"><h3>+ New Purchase Order</h3><span class="modal-close" onclick="UI_Inbound.closeModal()">✕</span></div>' +
      '<form onsubmit="UI_Inbound.submitCreate(event)"><div class="modal-body" style="max-height:70vh; overflow-y:auto;">' +
        '<div class="form-row">' +
          '<div class="form-group"><label class="form-label">PO Number:</label><input type="text" id="po-input-id" class="form-input" value="' + nextId + '" readonly style="background:#f5f5f5;" /></div>' +
          '<div class="form-group"><label class="form-label">Vendor: *</label><input type="text" id="po-input-vendor" class="form-input" required placeholder="e.g. Dell Direct, CDW" /></div>' +
        '</div>' +
        '<div class="form-row">' +
          '<div class="form-group"><label class="form-label">Order Date:</label><input type="date" id="po-input-orderdate" class="form-input" value="' + today + '" required /></div>' +
          '<div class="form-group"><label class="form-label">Notes:</label><input type="text" id="po-input-notes" class="form-input" placeholder="e.g. Q3 Batch Refresh" /></div>' +
        '</div>' +
        '<div style="margin-top:10px; border-top:1px solid #e5e5e5; padding-top:8px;">' +
          '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;"><strong>Line Items:</strong><button type="button" class="btn btn-sm" onclick="UI_Inbound.addItemRow()">+ Add Item</button></div>' +
          '<div id="po-items-container"></div>' +
        '</div></div>' +
      '<div class="modal-footer"><button type="button" class="btn" onclick="UI_Inbound.closeModal()">Cancel</button><button type="submit" class="btn btn-primary">Create PO</button></div>' +
      '</form></div></div>';
    addItemRow();
  }

  var lineItemCounter = 0;
  function addItemRow() {
    var container = document.getElementById("po-items-container");
    if (!container) return;
    var catalogItems = (typeof CatalogService !== "undefined") ? CatalogService.getAll() : [];
    var optItems = [];
    if (catalogItems.length === 0) {
      optItems.push({ value: "", label: "-- No items in Master Catalog. Register items first! --" });
    } else {
      for (var c = 0; c < catalogItems.length; c++) {
        var it = catalogItems[c];
        var label = (it.sku ? it.sku + " - " : "") + it.name + " [" + it.type.toUpperCase() + (it.model ? " / " + it.model : "") + "]";
        optItems.push({ value: it.id, label: label });
      }
    }
    lineItemCounter++;
    var rowId = "po-master-sel-" + lineItemCounter;
    var row = document.createElement("div");
    row.className = "form-row po-item-row";
    row.style.marginBottom = "6px";
    var comboHtml = (typeof UI_ComboBox !== "undefined")
      ? UI_ComboBox.renderHtml(rowId, optItems, optItems.length > 0 ? optItems[0].value : "", "searchable-combo-sm", 'class="po-item-master"')
      : '<select class="form-select combo-box po-item-master" id="' + rowId + '">' + optItems.map(function(o){ return '<option value="'+o.value+'">'+o.label+'</option>'; }).join("") + '</select>';

    row.innerHTML = '<div style="flex:3;">' + comboHtml + '</div>' +
      '<div style="flex:1;"><input type="number" class="form-input po-item-qty" min="1" value="1" title="Quantity" required /></div>' +
      '<div style="flex:0.3;"><button type="button" class="btn btn-sm" onclick="var r=this.parentNode.parentNode; if(r&&r.parentNode) r.parentNode.removeChild(r);" style="color:#d13438;">✕</button></div>';
    container.appendChild(row);
  }

  function submitCreate(e) {
    if (e && e.preventDefault) e.preventDefault();
    var vendor = document.getElementById("po-input-vendor").value;
    var orderDate = document.getElementById("po-input-orderdate").value;
    var notes = document.getElementById("po-input-notes").value;
    var rowEls = document.querySelectorAll(".po-item-row");
    var items = [];
    for (var i = 0; i < rowEls.length; i++) {
      var masterSel = rowEls[i].querySelector(".po-item-master");
      var masterId = masterSel ? masterSel.value : "";
      var qty = parseInt(rowEls[i].querySelector(".po-item-qty").value, 10) || 1;
      if (!masterId) {
        alert("Please select a registered master item for all line items.");
        return;
      }
      items.push({ masterId: masterId, qtyOrdered: qty });
    }
    if (!items.length) { alert("Please add at least one line item."); return; }
    try {
      var po = POService.createPO({ vendor: vendor, orderDate: orderDate, notes: notes, items: items });
      closeModal();
      if (typeof NavController !== "undefined") {
        NavController.switchView("inbound");
        NavController.updateBadges();
      }
      render();
      if (typeof Notifications !== "undefined") Notifications.show("PO " + po.poNumber + " created successfully.", "success");
    } catch (err) { alert("Error: " + err.message); }
  }

  function openReceiveModal(poNumber) {
    var po = POService.getById(poNumber);
    var host = document.getElementById("modal-host");
    if (!po || !host) return;

    var itemOpts = [];
    for (var i = 0; i < po.items.length; i++) {
      var it = po.items[i];
      var rem = it.qtyOrdered - (it.qtyReceived || 0);
      if (rem > 0) itemOpts.push({ value: String(i), label: it.name + ' [' + (it.type || "asset").toUpperCase() + '] (' + rem + ' left of ' + it.qtyOrdered + ')' });
    }
    if (!itemOpts.length) { alert("All items for PO " + poNumber + " already received."); return; }

    var receiveComboHtml = (typeof UI_ComboBox !== "undefined")
      ? UI_ComboBox.renderHtml("receive-item-idx", itemOpts, itemOpts[0].value)
      : '<select id="receive-item-idx" class="form-select combo-box">' + itemOpts.map(function(o){ return '<option value="'+o.value+'">'+o.label+'</option>'; }).join("") + '</select>';

    host.innerHTML = '<div class="modal-backdrop open" onclick="if ((event.target || event.srcElement) === this) UI_Inbound.closeModal()"><div class="modal" style="width:540px; max-width:92vw;">' +
      '<div class="modal-header"><h3>Receive Inbound - ' + po.poNumber + '</h3><span class="modal-close" onclick="UI_Inbound.closeModal()">✕</span></div>' +
      '<form onsubmit="UI_Inbound.submitReceive(event, \'' + po.poNumber + '\')"><div class="modal-body">' +
        '<div style="background:#e0f0ff; padding:8px 12px; border-radius:4px; margin-bottom:10px; font-size:12px;"><strong>Vendor:</strong> ' + po.vendor + ' | <strong>Ordered:</strong> ' + po.orderDate + '</div>' +
        '<div class="form-row">' +
          '<div class="form-group" style="flex:2;"><label class="form-label">Select Line Item: *</label>' + receiveComboHtml + '</div>' +
          '<div class="form-group" style="flex:1;"><label class="form-label">Quantity to Receive:</label><input type="number" id="receive-qty" class="form-input" min="1" value="1" /></div>' +
        '</div>' +
        '<div class="form-row">' +
          '<div class="form-group" style="flex:2;"><label class="form-label">Storage Location: *</label><input type="text" id="receive-location" class="form-input" value="IT Stock Room Shelf A" required /></div>' +
          '<div class="form-group" style="flex:1;"><label class="form-label">Receiving Officer:</label><input type="text" id="receive-officer" class="form-input" value="Receiving Staff" required /></div>' +
        '</div>' +
        '<div class="form-group"><label class="form-label">Serial Numbers (Optional; 1 per line for Hardware):</label><textarea id="receive-serials" class="form-input" rows="2" placeholder="Leave blank, or enter SNs (up to quantity). If fewer than Qty, remainder are left blank."></textarea><small style="color:#666666; font-size:11px;">Validation: SN count &le; Qty is OK. SN &gt; Qty is blocked. Remaining items get blank SN.</small></div>' +
      '</div><div class="modal-footer"><button type="button" class="btn" onclick="UI_Inbound.closeModal()">Cancel</button><button type="submit" class="btn btn-primary">Intake to Inventory</button></div>' +
      '</form></div></div>';
  }

  function submitReceive(e, poNumber) {
    if (e && e.preventDefault) e.preventDefault();
    var idx = parseInt(document.getElementById("receive-item-idx").value, 10);
    var qty = parseInt(document.getElementById("receive-qty").value, 10) || 1;
    var location = document.getElementById("receive-location").value;
    var officer = document.getElementById("receive-officer").value;
    var serialsRaw = document.getElementById("receive-serials").value;
    var serials = serialsRaw.split(/[\n,]+/).map(function (s) { return s.trim(); }).filter(function (s) { return s.length > 0; });

    if (serials.length > qty) {
      alert("Validation Error: Entered " + serials.length + " serial numbers, but quantity to receive is " + qty + ". (SN > Qty is not allowed)");
      return;
    }

    try {
      var res = POService.receiveItems(poNumber, idx, { qty: qty, serials: serials, location: location, officer: officer });
      closeModal();
      render();
      if (typeof NavController !== "undefined") NavController.updateBadges();
      var itemRef = (res.assets && res.assets.length)
        ? res.assets.map(function (a) { return a.id; }).join(", ")
        : (res.consumables && res.consumables.length ? res.consumables.map(function (c) { return c.id; }).join(", ") : (res.po.items[idx] ? res.po.items[idx].name : "Items"));
      if (typeof Notifications !== "undefined") Notifications.show("Intake complete: " + itemRef + " (Txn: " + res.transaction.id + ")", "success");
    } catch (err) { alert("Error: " + err.message); }
  }

  function openDetailModal(poNumber) {
    var po = POService.getById(poNumber);
    var host = document.getElementById("modal-host");
    if (!po || !host) return;

    var itemRows = [];
    for (var i = 0; i < po.items.length; i++) {
      var it = po.items[i];
      var assetBadges = (it.assetIds || []).map(function (id) { return '<span class="badge badge-available">' + id + '</span>'; }).join(" ") || "<em>None</em>";
      itemRows.push('<tr><td>' + it.name + '</td><td>' + it.category + '</td><td>' + it.qtyOrdered + '</td><td>' + (it.qtyReceived || 0) + '</td><td>' + assetBadges + '</td></tr>');
    }

    host.innerHTML = '<div class="modal-backdrop open" onclick="if ((event.target || event.srcElement) === this) UI_Inbound.closeModal()"><div class="modal" style="width:620px; max-width:92vw;">' +
      '<div class="modal-header"><h3>Purchase Order - ' + po.poNumber + '</h3><span class="modal-close" onclick="UI_Inbound.closeModal()">✕</span></div>' +
      '<div class="modal-body" style="max-height:70vh; overflow-y:auto;">' +
        '<div style="margin-bottom:12px; font-size:12px;">' +
          '<div class="form-row" style="margin-bottom:6px;"><div style="flex:1;"><strong>Vendor:</strong> ' + po.vendor + '</div><div style="flex:1;"><strong>Status:</strong> ' + getStatusBadge(po.status) + '</div></div>' +
          '<div class="form-row" style="margin-bottom:6px;"><div style="flex:1;"><strong>Order Date:</strong> ' + (po.orderDate || "—") + '</div><div style="flex:1;"><strong>Received Date:</strong> ' + (po.receivedDate || "—") + '</div></div>' +
          '<div><strong>Notes:</strong> ' + (po.notes || "—") + '</div>' +
        '</div>' +
        '<table class="data-table"><thead><tr><th>Item</th><th>Category</th><th>Ordered</th><th>Received</th><th>Created Asset IDs</th></tr></thead><tbody>' + itemRows.join("") + '</tbody></table>' +
      '</div><div class="modal-footer"><button type="button" class="btn" onclick="UI_Inbound.closeModal()">Close</button></div></div></div>';
  }

  return {
    render: render,
    setFilter: setFilter,
    openCreateModal: openCreateModal,
    openReceiveModal: openReceiveModal,
    openDetailModal: openDetailModal,
    closeModal: closeModal,
    addItemRow: addItemRow,
    submitCreate: submitCreate,
    submitReceive: submitReceive
  };
})();
