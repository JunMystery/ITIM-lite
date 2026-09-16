/* ==========================================================================
   ITIM-lite - Category & Custom Fields Management UI Controller
   ========================================================================== */

var UI_Categories = (function () {
  var activeCategory = null;

  function closeModal() {
    var m = document.getElementById("category-mgr-modal");
    if (m && m.parentNode) m.parentNode.removeChild(m);
  }

  function closeEditModal() {
    var sub = document.getElementById("cat-edit-submodal");
    if (sub && sub.parentNode) sub.parentNode.removeChild(sub);
  }

  function closeFieldsModal() {
    var sub = document.getElementById("cat-fields-submodal");
    if (sub && sub.parentNode) sub.parentNode.removeChild(sub);
  }

  function openModal() {
    closeModal();
    var host = document.getElementById("modal-host") || document.body;
    var cats = CategoryService.list();

    var rowsHtml = [];
    for (var i = 0; i < cats.length; i++) {
      var c = cats[i];
      var count = c.itemCount || 0;
      var fCount = (c.customFields || []).length;
      var delBtn = count > 0
        ? '<button class="btn btn-sm btn-icon" disabled title="Cannot delete category with ' + count + ' item(s)" style="opacity:0.4; cursor:not-allowed;">✕</button>'
        : '<button class="btn btn-sm btn-icon btn-danger" onclick="UI_Categories.deleteCategory(\'' + c.id + '\')" title="Delete Category">✕</button>';

      rowsHtml.push('<tr>' +
        '<td style="font-weight:600;">' + c.name + '</td>' +
        '<td><span class="badge" style="background:#e0e7ff; color:#3730a3; text-transform:capitalize;">' + c.type + '</span></td>' +
        '<td><span class="badge ' + (count > 0 ? 'badge-inuse' : 'badge-available') + '">' + count + ' items</span></td>' +
        '<td><button class="btn btn-sm" onclick="UI_Categories.openFieldsModal(\'' + c.id + '\')">' + fCount + ' Fields</button></td>' +
        '<td style="text-align:right; white-space:nowrap;">' +
          '<button class="btn btn-sm" onclick="UI_Categories.openEditModal(\'' + c.id + '\')" title="Edit" style="margin-right:4px;">Edit</button>' +
          delBtn +
        '</td>' +
      '</tr>');
    }

    if (rowsHtml.length === 0) {
      rowsHtml.push('<tr><td colspan="5" style="text-align:center; padding:16px; color:#888888;">No categories defined.</td></tr>');
    }

    var div = document.createElement("div");
    div.id = "category-mgr-modal";
    div.className = "modal-backdrop open";
    div.onclick = function (e) {
      e = e || window.event;
      if ((e.target || e.srcElement) === div) closeModal();
    };

    div.innerHTML = '<div class="modal" style="width:680px; max-width:92vw;">' +
      '<div class="modal-header">' +
        '<h3>Manage Categories &amp; Custom Fields</h3>' +
        '<button type="button" class="btn btn-sm" onclick="UI_Categories.closeModal()">✕</button>' +
      '</div>' +
      '<div class="modal-body">' +
        '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">' +
          '<span style="font-size:12px; color:#666666;">Categories group items and define unique custom fields schema.</span>' +
          '<button class="btn btn-primary btn-sm" onclick="UI_Categories.openEditModal()">+ New Category</button>' +
        '</div>' +
        '<div class="data-table-container" style="max-height:360px; overflow-y:auto;">' +
          '<table class="data-table">' +
            '<thead><tr><th>Name</th><th>Type</th><th>Catalog Items</th><th>Custom Fields</th><th style="text-align:right;">Actions</th></tr></thead>' +
            '<tbody>' + rowsHtml.join("") + '</tbody>' +
          '</table>' +
        '</div>' +
      '</div>' +
      '<div class="modal-footer"><button type="button" class="btn" onclick="UI_Categories.closeModal()">Close</button></div>' +
    '</div>';

    host.appendChild(div);
  }

  function openEditModal(catId) {
    var isEdit = !!catId;
    var cat = isEdit ? CategoryService.getById(catId) : { name: "", type: "hardware", description: "" };
    if (isEdit && !cat) return;

    var host = document.getElementById("modal-host") || document.body;
    var div = document.createElement("div");
    div.id = "cat-edit-submodal";
    div.className = "modal-backdrop open";
    div.style.zIndex = "10001";
    div.onclick = function (e) {
      e = e || window.event;
      if ((e.target || e.srcElement) === div) div.parentNode.removeChild(div);
    };

    var typeComboHtml = UI_ComboBox.renderHtml("cat-edit-type", [
      { value: "hardware", label: "Hardware Asset" },
      { value: "software", label: "Software License" },
      { value: "consumable", label: "Consumable / Stock" }
    ], cat.type || "hardware");

    div.innerHTML = '<div class="modal" style="width:440px; max-width:90vw;">' +
      '<div class="modal-header"><h3>' + (isEdit ? "Edit Category" : "New Category") + '</h3>' +
        '<button type="button" class="btn btn-sm" onclick="UI_Categories.closeEditModal()">✕</button></div>' +
      '<div class="modal-body">' +
        '<div class="form-group"><label class="form-label">Category Name *</label><input type="text" id="cat-edit-name" class="form-input" value="' + (cat.name || "") + '" placeholder="e.g. Laptop, Server, Monitor" /></div>' +
        '<div class="form-group"><label class="form-label">Classification Type *</label>' + typeComboHtml + '</div>' +
        '<div class="form-group"><label class="form-label">Description</label><input type="text" id="cat-edit-desc" class="form-input" value="' + (cat.description || "") + '" /></div>' +
      '</div>' +
      '<div class="modal-footer">' +
        '<button type="button" class="btn" onclick="UI_Categories.closeEditModal()">Cancel</button>' +
        '<button type="button" class="btn btn-primary" onclick="UI_Categories.saveCategory(\'' + (catId || "") + '\')">Save</button>' +
      '</div>' +
    '</div>';

    host.appendChild(div);
  }

  function saveCategory(catId) {
    var name = (document.getElementById("cat-edit-name").value || "").trim();
    var type = UI_ComboBox.getValue("cat-edit-type") || "hardware";
    var desc = (document.getElementById("cat-edit-desc").value || "").trim();

    if (!name) {
      Notifications.show("Category name is required.", "error");
      return;
    }

    var res;
    if (catId) {
      res = CategoryService.update(catId, { name: name, type: type, description: desc });
    } else {
      res = CategoryService.create({ name: name, type: type, description: desc });
    }

    if (res.success) {
      var sub = document.getElementById("cat-edit-submodal");
      if (sub && sub.parentNode) sub.parentNode.removeChild(sub);
      Notifications.show("Category saved successfully.", "success");
      openModal();
      if (typeof UI_Catalog !== "undefined" && UI_Catalog.render) UI_Catalog.render();
    } else {
      Notifications.show(res.error, "error");
    }
  }

  function deleteCategory(catId) {
    var res = CategoryService.delete(catId);
    if (res.success) {
      Notifications.show("Category deleted.", "success");
      openModal();
      if (typeof UI_Catalog !== "undefined" && UI_Catalog.render) UI_Catalog.render();
    } else {
      Notifications.show(res.error, "error");
      alert(res.error);
    }
  }

  function openFieldsModal(catId) {
    var cat = CategoryService.getById(catId);
    if (!cat) return;
    activeCategory = cat;

    var host = document.getElementById("modal-host") || document.body;
    var div = document.createElement("div");
    div.id = "cat-fields-submodal";
    div.className = "modal-backdrop open";
    div.style.zIndex = "10001";
    div.onclick = function (e) {
      e = e || window.event;
      if ((e.target || e.srcElement) === div) div.parentNode.removeChild(div);
    };

    renderFieldsModalContent(div, cat);
    host.appendChild(div);
  }

  function renderFieldsModalContent(container, cat) {
    var fields = cat.customFields || [];
    var rows = [];
    for (var i = 0; i < fields.length; i++) {
      var f = fields[i];
      var optStr = (f.type === "select" && f.options) ? ' (' + f.options.join(", ") + ')' : '';
      rows.push('<tr>' +
        '<td style="font-weight:600;">' + f.label + '</td>' +
        '<td><span class="badge badge-repair" style="text-transform:uppercase; font-size:10px;">' + f.type + optStr + '</span></td>' +
        '<td>' + (f.required ? 'Yes' : 'No') + '</td>' +
        '<td style="text-align:right;"><button class="btn btn-sm btn-icon btn-danger" onclick="UI_Categories.deleteField(\'' + cat.id + '\', \'' + f.id + '\')">✕</button></td>' +
      '</tr>');
    }
    if (rows.length === 0) {
      rows.push('<tr><td colspan="4" style="text-align:center; padding:12px; color:#888888;">No custom fields defined.</td></tr>');
    }

    var fieldTypeCombo = UI_ComboBox.renderHtml("new-field-type", [
      { value: "text", label: "Text String" },
      { value: "number", label: "Number" },
      { value: "date", label: "Date" },
      { value: "select", label: "Dropdown / Select" }
    ], "text", "searchable-combo-sm");

    container.innerHTML = '<div class="modal" style="width:580px; max-width:92vw;">' +
      '<div class="modal-header"><h3>Custom Fields: ' + cat.name + '</h3>' +
        '<button type="button" class="btn btn-sm" onclick="UI_Categories.closeFieldsModal()">✕</button></div>' +
      '<div class="modal-body">' +
        '<table class="data-table" style="margin-bottom:14px;"><thead><tr><th>Label</th><th>Type</th><th>Required</th><th style="text-align:right;">Action</th></tr></thead><tbody>' + rows.join("") + '</tbody></table>' +
        '<div style="background:#f9fafb; padding:10px; border-radius:4px; border:1px solid #e5e7eb;">' +
          '<div style="font-weight:600; font-size:12px; margin-bottom:8px;">+ Add Custom Field</div>' +
          '<div class="form-row" style="margin-bottom:6px;">' +
            '<div style="flex:1;"><input type="text" id="new-field-label" class="form-input" placeholder="Field Label (e.g. RAM GB, CPU)" /></div>' +
            '<div style="flex:1;">' + fieldTypeCombo + '</div>' +
          '</div>' +
          '<div class="form-row" style="align-items:center;">' +
            '<div style="flex:1;"><input type="text" id="new-field-options" class="form-input" placeholder="Options for select (comma-separated)" /></div>' +
            '<div style="margin-left:8px;"><button type="button" class="btn btn-sm btn-primary" onclick="UI_Categories.addField(\'' + cat.id + '\')">Add Field</button></div>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="modal-footer"><button type="button" class="btn" onclick="UI_Categories.closeFieldsModal(); UI_Categories.openModal();">Back</button></div>' +
    '</div>';
  }

  function addField(catId) {
    var lbl = (document.getElementById("new-field-label").value || "").trim();
    var typ = UI_ComboBox.getValue("new-field-type") || "text";
    var optRaw = (document.getElementById("new-field-options").value || "").trim();

    if (!lbl) {
      Notifications.show("Field label is required.", "error");
      return;
    }

    var opts = [];
    if (typ === "select" && optRaw) {
      var parts = optRaw.split(",");
      for (var i = 0; i < parts.length; i++) {
        var p = parts[i].trim();
        if (p) opts.push(p);
      }
    }

    var res = CategoryService.addCustomField(catId, { label: lbl, type: typ, options: opts });
    if (res.success) {
      Notifications.show("Custom field added.", "success");
      var sub = document.getElementById("cat-fields-submodal");
      var cat = CategoryService.getById(catId);
      if (sub && cat) renderFieldsModalContent(sub, cat);
    } else {
      Notifications.show(res.error, "error");
    }
  }

  function deleteField(catId, fieldId) {
    var res = CategoryService.deleteCustomField(catId, fieldId);
    if (res.success) {
      Notifications.show("Custom field deleted.", "success");
      var sub = document.getElementById("cat-fields-submodal");
      var cat = CategoryService.getById(catId);
      if (sub && cat) renderFieldsModalContent(sub, cat);
    } else {
      Notifications.show(res.error, "error");
      alert(res.error);
    }
  }

  return {
    openModal: openModal,
    closeModal: closeModal,
    openEditModal: openEditModal,
    saveCategory: saveCategory,
    deleteCategory: deleteCategory,
    openFieldsModal: openFieldsModal,
    closeEditModal: closeEditModal,
    closeFieldsModal: closeFieldsModal,
    addField: addField,
    deleteField: deleteField
  };
})();
