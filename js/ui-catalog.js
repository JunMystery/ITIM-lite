/* ==========================================================================
   ITIM-lite - Master Item Catalog View Controller
   Pure ES5 for Windows HTA / IE11 compatibility
   ========================================================================== */

var UI_Catalog = (function () {
  var editingId = null;
  var activeFilter = "all";

  function tr(k, fb) { return (typeof I18N !== "undefined") ? I18N.t(k) : (fb || k); }

  function ensureModal() {
    if (document.getElementById("catalog-modal")) return;
    var host = document.getElementById("modal-host") || document.body;
    var div = document.createElement("div");
    div.id = "catalog-modal";
    div.className = "modal-backdrop";
    div.onclick = function (e) {
      e = e || window.event;
      if ((e.target || e.srcElement) === div) closeModal();
    };

    var typeSelectHtml = UI_ComboBox.renderHtml("cat-input-type", [
      { value: "hardware", label: tr("tab_hardware", "Hardware (Asset)") },
      { value: "software", label: tr("tab_software", "Software (License)") },
      { value: "consumable", label: tr("tab_consumables", "Consumable (Stock)") }
    ], "hardware", "", 'onchange="UI_Catalog.onTypeChange()"');

    var catSelectHtml = UI_ComboBox.renderHtml("cat-input-category", [], "", "", 'onchange="UI_Catalog.onCategoryChange()"');

    div.innerHTML = '<div class="modal modal-secondary" style="width:66vw; max-width:92vw;">' +
      '<div class="modal-header"><h3 id="catalog-modal-title">' + tr("cat_modal_title_new", "Register Master Item") + '</h3><button class="btn btn-sm" onclick="UI_Catalog.closeModal()">✕</button></div>' +
      '<div class="modal-body" style="flex:1 1 auto; min-height:0; overflow-y:auto; padding:16px 20px;">' +
        '<div class="form-row">' +
          '<div class="form-group"><label class="form-label">' + tr("cat_sku_barcode", "SKU / Custom Barcode:") + '</label><input type="text" id="cat-input-sku" class="form-input" placeholder="e.g. SKU-1001 or blank for auto" /></div>' +
          '<div class="form-group"><label class="form-label">' + tr("cat_item_type", "Item Type: *") + '</label>' + typeSelectHtml + '</div>' +
        '</div>' +
        '<div class="form-group"><label class="form-label">' + tr("cat_item_name", "Item Name: *") + '</label><input type="text" id="cat-input-name" class="form-input" placeholder="e.g. Dell Latitude 5530 or Office 365" required /></div>' +
        '<div class="form-row">' +
          '<div class="form-group"><label class="form-label">' + tr("cat_category", "Category: *") + '</label>' + catSelectHtml + '</div>' +
          '<div class="form-group"><label class="form-label">' + tr("cat_model_edition", "Model / Edition:") + '</label><input type="text" id="cat-input-model" class="form-input" placeholder="e.g. Core i7 16GB / E3 Plan" /></div>' +
        '</div>' +
        '<div id="cat-custom-fields-container"></div>' +
        '<div class="form-group"><label class="form-label">' + tr("cat_specs_notes", "Description / Specifications / Notes:") + '</label><input type="text" id="cat-input-notes" class="form-input" placeholder="Standard specifications or vendor notes" /></div>' +
      '</div>' +
      '<div class="modal-footer"><button class="btn" onclick="UI_Catalog.closeModal()">' + tr("btn_cancel", "Cancel") + '</button><button class="btn btn-primary" onclick="UI_Catalog.save()">' + tr("btn_save_item", "Save Item") + '</button></div>' +
    '</div>';
    host.appendChild(div);
  }

  function populateCategories(type, selectedCategory, existingValues) {
    var catItems = [];
    if (typeof CategoryService !== "undefined") {
      var dbCats = CategoryService.list(type);
      for (var i = 0; i < dbCats.length; i++) {
        catItems.push({ value: dbCats[i].name, label: dbCats[i].name });
      }
    }
    if (catItems.length === 0) {
      var defs = (type === "software") ? ["Office Suite", "Operating System", "Security", "Developer Tool"]
        : (type === "consumable") ? ["Cables & Adapters", "Toner & Cartridge", "Keyboards & Mice"] : ["Laptop", "Desktop", "Server", "Monitor", "Networking"];
      for (var d = 0; d < defs.length; d++) catItems.push({ value: defs[d], label: defs[d] });
    }
    var sel = selectedCategory || (catItems.length > 0 ? catItems[0].value : "");
    UI_ComboBox.populate("cat-input-category", catItems, sel);
    renderCustomFields(sel, existingValues);
  }

  function renderCustomFields(categoryName, existingValues) {
    var container = document.getElementById("cat-custom-fields-container");
    if (!container) return;
    var values = existingValues || {};
    var cat = typeof CategoryService !== "undefined" ? CategoryService.getByName(categoryName) : null;
    var fields = (cat && cat.customFields) ? cat.customFields : [];
    if (fields.length === 0) {
      container.innerHTML = "";
      return;
    }

    var html = ['<div style="background:#f9fafb; padding:8px 10px; border-radius:4px; border:1px solid #e5e7eb; margin-bottom:12px;"><div style="font-size:11px; font-weight:700; text-transform:uppercase; color:#666666; margin-bottom:6px;">Category Custom Specifications</div><div class="form-row" style="flex-wrap:wrap;">'];
    for (var i = 0; i < fields.length; i++) {
      var f = fields[i];
      var v = (values[f.id] !== undefined) ? values[f.id] : "";
      var inp = '';
      if (f.type === "select") {
        inp = UI_ComboBox.renderHtml("cat-cf-" + f.id, f.options || [], v, "searchable-combo-sm", 'class="cat-custom-field" data-field-id="' + f.id + '"');
      } else {
        var itype = (f.type === "number" ? "number" : (f.type === "date" ? "date" : "text"));
        inp = '<input type="' + itype + '" id="cat-cf-' + f.id + '" class="form-input cat-custom-field" data-field-id="' + f.id + '" value="' + v + '" />';
      }
      html.push('<div class="form-group" style="min-width:180px; flex:1;"><label class="form-label" style="font-size:11px;">' + f.label + (f.required ? ' *' : '') + ':</label>' + inp + '</div>');
    }
    html.push('</div></div>');
    container.innerHTML = html.join("");
  }

  function onTypeChange() {
    var type = UI_ComboBox.getValue("cat-input-type") || "hardware";
    populateCategories(type);
  }

  function onCategoryChange() {
    var catName = UI_ComboBox.getValue("cat-input-category");
    renderCustomFields(catName, null);
  }

  function initFilterBar() {
    if (typeof UI_FilterBar === "undefined") return;
    UI_FilterBar.init("catalog", {
      title: "Master Catalog",
      placeholder: "Search SKU, barcode, name, model...",
      fields: [
        {
          id: "type", label: "Item Type", type: "select",
          options: [
            { value: "all", label: "All Types" },
            { value: "hardware", label: "Hardware" },
            { value: "software", label: "Software" },
            { value: "consumable", label: "Consumable" }
          ]
        },
        { id: "category", label: "Category", type: "text" }
      ],
      onFilter: function () { render(); }
    });
    UI_FilterBar.render("catalog-filter-bar", "catalog");
  }

  function render() {
    var tbody = document.getElementById("catalog-tbody");
    if (!tbody) return;

    initFilterBar();
    var crit = (typeof UI_FilterBar !== "undefined") ? UI_FilterBar.getCriteria("catalog") : { search: "", filters: {} };
    var items = (typeof CatalogService !== "undefined") ? CatalogService.getAll() : [];

    if (crit.search) {
      var q = crit.search.toLowerCase();
      items = items.filter(function (it) {
        return (it.name && it.name.toLowerCase().indexOf(q) !== -1) ||
          (it.sku && it.sku.toLowerCase().indexOf(q) !== -1) ||
          (it.model && it.model.toLowerCase().indexOf(q) !== -1) ||
          (it.notes && it.notes.toLowerCase().indexOf(q) !== -1);
      });
    }

    if (crit.filters) {
      if (crit.filters.type && crit.filters.type !== "all") {
        items = items.filter(function (it) { return it.type === crit.filters.type; });
      }
      if (crit.filters.category && crit.filters.category !== "all") {
        var cq = crit.filters.category.toLowerCase();
        items = items.filter(function (it) { return it.category && it.category.toLowerCase().indexOf(cq) !== -1; });
      }
    }

    if (items.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:24px; color:var(--text-tertiary);">No items found in Master Catalog.</td></tr>';
      return;
    }

    var html = [];
    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      var typeBadge = (it.type === "software")
        ? '<span class="badge" style="background:#7c3aed; color:#fff;">Software</span>'
        : (it.type === "consumable")
          ? '<span class="badge" style="background:#ea580c; color:#fff;">Consumable</span>'
          : '<span class="badge" style="background:#0078d4; color:#fff;">Hardware</span>';

      html.push('<tr class="clickable-row" onclick="UI_ActionsMenu.onRowClick(event, \'catalog\', \'' + it.id + '\')" oncontextmenu="UI_ActionsMenu.show(event, \'catalog\', \'' + it.id + '\')">' +
        '<td><input type="checkbox" class="catalog-select-chk" value="' + it.id + '" onclick="event.stopPropagation()"></td>' +
        '<td style="font-family:var(--font-mono); font-weight:600;">' + (it.sku || it.id) + '</td>' +
        '<td><strong>' + it.name + '</strong></td>' +
        '<td>' + typeBadge + '</td>' +
        '<td>' + (it.category || "-") + '</td>' +
        '<td>' + (it.model || it.notes || "-") + '</td>' +
        '<td style="text-align:right; white-space:nowrap;">' +
          '<button class="btn btn-icon btn-sm action-menu-trigger" onclick="UI_ActionsMenu.show(event, \'catalog\', \'' + it.id + '\')" title="Actions">⋮</button>' +
        '</td>' +
      '</tr>');
    }
    tbody.innerHTML = html.join("");
  }

  function openModal(id) {
    ensureModal();
    editingId = id || null;
    var titleEl = document.getElementById("catalog-modal-title");
    var skuEl = document.getElementById("cat-input-sku");
    var nameEl = document.getElementById("cat-input-name");
    var modelEl = document.getElementById("cat-input-model");
    var notesEl = document.getElementById("cat-input-notes");

    if (id && typeof CatalogService !== "undefined") {
      var it = CatalogService.getById(id);
      if (it) {
        if (titleEl) titleEl.innerText = tr("cat_modal_title_edit", "Edit Master Item") + ": " + (it.sku || it.name);
        if (skuEl) skuEl.value = it.sku || "";
        UI_ComboBox.setValue("cat-input-type", it.type || "hardware");
        populateCategories(it.type || "hardware", it.category, it.customFields);
        if (nameEl) nameEl.value = it.name || "";
        if (modelEl) modelEl.value = it.model || "";
        if (notesEl) notesEl.value = it.notes || "";
      }
    } else {
      if (titleEl) titleEl.innerText = tr("cat_modal_title_new", "Register Master Item");
      if (skuEl) skuEl.value = "";
      UI_ComboBox.setValue("cat-input-type", "hardware");
      populateCategories("hardware");
      if (nameEl) nameEl.value = "";
      if (modelEl) modelEl.value = "";
      if (notesEl) notesEl.value = "";
    }

    var modal = document.getElementById("catalog-modal");
    if (modal) modal.className = "modal-backdrop open";
    if (nameEl) setTimeout(function () { nameEl.focus(); }, 100);
  }

  function closeModal() {
    var modal = document.getElementById("catalog-modal");
    if (modal) modal.className = "modal-backdrop";
    editingId = null;
  }

  function save() {
    var name = (document.getElementById("cat-input-name").value || "").trim();
    var sku = (document.getElementById("cat-input-sku").value || "").trim();
    var type = UI_ComboBox.getValue("cat-input-type") || "hardware";
    var category = UI_ComboBox.getValue("cat-input-category") || "";
    var model = (document.getElementById("cat-input-model").value || "").trim();
    var notes = (document.getElementById("cat-input-notes").value || "").trim();

    if (!name) { alert("Please enter an item name."); return; }

    var customFields = {};
    var cfInputs = document.getElementsByClassName("cat-custom-field");
    for (var i = 0; i < cfInputs.length; i++) {
      var fId = cfInputs[i].getAttribute("data-field-id");
      if (fId) {
        var fVal = (cfInputs[i].tagName === "INPUT" || cfInputs[i].tagName === "SELECT")
          ? cfInputs[i].value : UI_ComboBox.getValue(cfInputs[i].id);
        if (fVal !== undefined && fVal !== "") customFields[fId] = fVal;
      }
    }

    try {
      if (editingId) {
        CatalogService.update(editingId, { sku: sku, name: name, type: type, category: category, model: model, notes: notes, customFields: customFields });
      } else {
        CatalogService.add({ sku: sku, name: name, type: type, category: category, model: model, notes: notes, customFields: customFields });
      }
      closeModal();
      render();
      if (typeof NavController !== "undefined") NavController.updateBadges();
      if (typeof Notifications !== "undefined") Notifications.show("Catalog item saved successfully.", "success");
    } catch (err) { alert("Error: " + err.message); }
  }

  function deleteItem(id) {
    if (!confirm("Are you sure you want to delete this item from Master Catalog?")) return;
    try {
      CatalogService.remove(id);
      render();
      if (typeof NavController !== "undefined") NavController.updateBadges();
      if (typeof Notifications !== "undefined") Notifications.show("Master item deleted.", "info");
    } catch (err) { alert("Error: " + err.message); }
  }

  function toggleAll(checked) {
    var cbs = document.querySelectorAll(".catalog-select-chk");
    for (var i = 0; i < cbs.length; i++) cbs[i].checked = checked;
  }

  return {
    render: render,
    openModal: openModal,
    closeModal: closeModal,
    save: save,
    deleteItem: deleteItem,
    onTypeChange: onTypeChange,
    onCategoryChange: onCategoryChange,
    toggleAll: toggleAll
  };
})();
