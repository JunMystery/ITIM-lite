/* ==========================================================================
   ITIM-lite - Consumables & Accessories View Controller
   ========================================================================== */

var UI_Consumables = (function () {
  var editingId = null;

  function ensureModal() {
    if (document.getElementById("consumable-modal")) return;
    var host = document.getElementById("modal-host") || document.body;
    var div = document.createElement("div");
    div.id = "consumable-modal";
    div.className = "modal-backdrop";
    div.onclick = function (e) { e = e || window.event; if ((e.target || e.srcElement) === div) closeModal(); };
    div.innerHTML = '<div class="modal">' +
      '<div class="modal-header"><h3 id="consumable-modal-title">Consumable Item</h3><button class="btn btn-sm" onclick="UI_Consumables.closeModal()">✕</button></div>' +
      '<div class="modal-body">' +
        '<div class="form-group"><label class="form-label">Item Name *:</label><input type="text" id="con-input-name" class="form-input" /></div>' +
        '<div class="form-group"><label class="form-label">Category:</label>' + (typeof UI_ComboBox !== "undefined" ? UI_ComboBox.renderHtml("con-input-category", [], "") : '<select id="con-input-category" class="form-select"></select>') + '</div>' +
        '<div class="form-row">' +
          '<div class="form-group"><label class="form-label">Quantity in Stock (PO Inbound only):</label><input type="number" id="con-input-qty" class="form-input" min="0" readonly disabled style="background:#f5f5f5; cursor:not-allowed;" title="Stock quantity cannot be edited directly. Intake via PO Inbound." /></div>' +
          '<div class="form-group"><label class="form-label">Low-Stock Alert:</label><input type="number" id="con-input-min-qty" class="form-input" min="0" /></div>' +
        '</div>' +
        '<div class="form-group"><label class="form-label">Location / Bin:</label><input type="text" id="con-input-location" class="form-input" /></div>' +
      '</div>' +
      '<div class="modal-footer"><button class="btn" onclick="UI_Consumables.closeModal()">Cancel</button><button class="btn btn-primary" onclick="UI_Consumables.save()">Save Item</button></div>' +
    '</div>';
    host.appendChild(div);
  }

  function initFilterBar() {
    if (typeof UI_FilterBar === "undefined") return;
    UI_FilterBar.init("consumables", {
      title: "Consumables & Accessories",
      placeholder: "Search consumable items, categories, bins...",
      fields: [
        {
          id: "stockStatus", label: "Stock Level", type: "select",
          options: [
            { value: "all", label: "All Levels" },
            { value: "in_stock", label: "In Stock" },
            { value: "low_stock", label: "Low Stock Alert" },
            { value: "out_of_stock", label: "Out of Stock (0)" }
          ]
        },
        { id: "category", label: "Category", type: "text", placeholder: "e.g. Cables, Toner" },
        { id: "location", label: "Location / Bin", type: "text", placeholder: "e.g. Bin C1" }
      ],
      onFilter: function () { render(); }
    });
  }

  function render() {
    initFilterBar();
    var curSearch = "", curStock = "all", curCat = "", curLoc = "";
    if (typeof UI_FilterBar !== "undefined") {
      UI_FilterBar.render("consumables-filter-bar", "consumables");
      var crit = UI_FilterBar.getCriteria("consumables");
      curSearch = (crit.search || "").toLowerCase();
      curStock = (crit.filters && crit.filters.stockStatus) ? crit.filters.stockStatus : "all";
      curCat = (crit.filters && crit.filters.category) ? crit.filters.category.toLowerCase() : "";
      curLoc = (crit.filters && crit.filters.location) ? crit.filters.location.toLowerCase() : "";
    }

    var list = ConsumablesService.getAll();
    if (curStock === "out_of_stock") list = list.filter(function (c) { return (c.quantity || 0) <= 0; });
    else if (curStock === "low_stock") list = list.filter(function (c) { return (c.quantity || 0) > 0 && (c.quantity || 0) <= (c.minQuantity || 0); });
    else if (curStock === "in_stock") list = list.filter(function (c) { return (c.quantity || 0) > 0; });
    if (curCat) list = list.filter(function (c) { return c.category && c.category.toLowerCase().indexOf(curCat) !== -1; });
    if (curLoc) list = list.filter(function (c) { return c.location && c.location.toLowerCase().indexOf(curLoc) !== -1; });
    if (curSearch) {
      list = list.filter(function (c) {
        var s = (c.id + " " + c.name + " " + (c.category || "") + " " + (c.location || "")).toLowerCase();
        return s.indexOf(curSearch) !== -1;
      });
    }
    var tbody = document.getElementById("consumables-table-tbody");
    if (!tbody) return;

    if (list.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:var(--text-tertiary); padding:30px;">No consumables or accessories recorded.</td></tr>';
      return;
    }

    var html = [];
    for (var i = 0; i < list.length; i++) {
      var c = list[i];
      var qty = (c.quantity !== undefined && c.quantity !== null) ? parseInt(c.quantity, 10) : 0;
      var min = (c.minQuantity !== undefined && c.minQuantity !== null) ? parseInt(c.minQuantity, 10) : 0;
      var isOut = qty <= 0;
      var isLow = !isOut && (qty <= min);
      var badge = isOut ? '<span class="badge badge-retired" style="background:#d13438; color:#fff;">Out of Stock (0)</span>'
        : (isLow ? '<span class="badge badge-warning">Low Stock (&le; ' + min + ')</span>'
        : '<span style="font-size:11px; color:var(--text-tertiary);">(Min: ' + min + ')</span>');

      html.push('<tr class="clickable-row" onclick="UI_ActionsMenu.onRowClick(event, \'consumable\', \'' + c.id + '\')" oncontextmenu="UI_ActionsMenu.show(event, \'consumable\', \'' + c.id + '\')">' +
        '<td style="font-family:var(--font-mono); font-weight:600; width:90px;">' + c.id + '</td>' +
        '<td><strong>' + c.name + '</strong></td>' +
        '<td>' + c.category + '</td>' +
        '<td><span style="font-size:14px; font-weight:bold; margin-right:8px;' + (isOut ? ' color:#d13438;' : '') + '">' + qty + '</span>' + badge + '</td>' +
        '<td>' + (c.location || "-") + '</td>' +
        '<td style="text-align:right; white-space:nowrap;">' +
          '<button class="btn btn-icon btn-sm action-menu-trigger" onclick="UI_ActionsMenu.show(event, \'consumable\', \'' + c.id + '\')" title="Actions">⋮</button>' +
        '</td>' +
      "</tr>");
    }
    tbody.innerHTML = html.join("");
  }

  function adjust(id, delta) {
    ConsumablesService.adjustQuantity(id, delta);
    render();
    if (typeof UI_Assets !== "undefined") UI_Assets.render();
    NavController.updateBadges();
  }

  function openModal(id) {
    ensureModal();
    editingId = id || null;
    var modal = document.getElementById("consumable-modal");
    var title = document.getElementById("consumable-modal-title");

    var catItems = [];
    if (typeof CategoryService !== "undefined") {
      var dbCats = CategoryService.list("consumable");
      for (var i = 0; i < dbCats.length; i++) catItems.push({ value: dbCats[i].name, label: dbCats[i].name });
    }
    if (catItems.length === 0 && typeof ITIM_CONFIG !== "undefined") {
      for (var c = 0; c < ITIM_CONFIG.CONSUMABLE_CATEGORIES.length; c++) catItems.push({ value: ITIM_CONFIG.CONSUMABLE_CATEGORIES[c], label: ITIM_CONFIG.CONSUMABLE_CATEGORIES[c] });
    }

    if (!id) {
      if (typeof Notifications !== "undefined") {
        Notifications.show("Direct consumable creation forbidden. Adding items is only allowed via PO Inbound intake.", "error");
      }
      if (typeof NavController !== "undefined") {
        NavController.switchView("inbound");
      }
      return;
    }

    var item = ConsumablesService.getById(id);
    if (!item) return;

    if (typeof UI_ComboBox !== "undefined") {
      UI_ComboBox.populate("con-input-category", catItems, item.category || "");
    } else {
      var catSelect = document.getElementById("con-input-category");
      if (catSelect) catSelect.value = item.category;
    }

    title.innerText = "Edit Item (" + item.id + ")";
    document.getElementById("con-input-name").value = item.name;
    document.getElementById("con-input-qty").value = item.quantity;
    document.getElementById("con-input-min-qty").value = item.minQuantity;
    document.getElementById("con-input-location").value = item.location || "";

    modal.className = "modal-backdrop open";
  }

  function closeModal() {
    var modal = document.getElementById("consumable-modal");
    if (modal) modal.className = "modal-backdrop";
  }

  function save() {
    var name = document.getElementById("con-input-name").value.trim();
    if (!name) {
      Notifications.show("Please enter an item name.", "warning");
      return;
    }

    if (!editingId) {
      Notifications.show("Direct creation forbidden. Intake items via PO Inbound.", "error");
      return;
    }

    var existingItem = ConsumablesService.getById(editingId);
    var data = {
      name: name,
      category: document.getElementById("con-input-category").value,
      quantity: existingItem ? existingItem.quantity : 0,
      minQuantity: parseInt(document.getElementById("con-input-min-qty").value, 10) || 0,
      location: document.getElementById("con-input-location").value.trim()
    };

    ConsumablesService.update(editingId, data);
    Notifications.show("Item updated successfully.", "success");
    closeModal();
    render();
    if (typeof UI_Assets !== "undefined") UI_Assets.render();
    NavController.updateBadges();
  }

  function deleteItem(id) {
    var item = ConsumablesService.getById(id);
    if (!item) return;

    Notifications.confirm("Delete " + item.name + "?", function () {
      ConsumablesService.remove(id);
      Notifications.show("Item removed.", "info");
      render();
      if (typeof UI_Assets !== "undefined") UI_Assets.render();
      NavController.updateBadges();
    });
  }

  return {
    render: render,
    adjust: adjust,
    openModal: openModal,
    closeModal: closeModal,
    save: save,
    deleteItem: deleteItem
  };
})();
