/* ==========================================================================
   ITIM-lite - Category & Custom Fields Service
   Handles category schema, custom field definitions, and deletion rules
   ========================================================================== */

var CategoryService = (function () {
  function getDb() {
    if (!AppState.db.categories) AppState.db.categories = [];
    return AppState.db.categories;
  }

  function getCatalog() {
    return (AppState.db && AppState.db.catalog) ? AppState.db.catalog : [];
  }

  function getItemCount(cat) {
    if (!cat) return 0;
    var catalog = getCatalog();
    var count = 0;
    for (var i = 0; i < catalog.length; i++) {
      var it = catalog[i];
      if (it.category === cat.name || it.categoryId === cat.id) {
        count++;
      }
    }
    return count;
  }

  function list(typeFilter) {
    var cats = getDb();
    var res = [];
    for (var i = 0; i < cats.length; i++) {
      var c = cats[i];
      if (!typeFilter || typeFilter === "all" || c.type === typeFilter) {
        var copy = JSON.parse(JSON.stringify(c));
        copy.itemCount = getItemCount(c);
        res.push(copy);
      }
    }
    return res;
  }

  function getById(id) {
    var cats = getDb();
    for (var i = 0; i < cats.length; i++) {
      if (cats[i].id === id) return cats[i];
    }
    return null;
  }

  function getByName(name) {
    if (!name) return null;
    var cats = getDb();
    var target = String(name).toLowerCase().trim();
    for (var i = 0; i < cats.length; i++) {
      if (cats[i].name.toLowerCase().trim() === target) return cats[i];
    }
    return null;
  }

  function create(data) {
    if (!data || !data.name || !data.name.trim()) {
      return { success: false, error: "Category name is required." };
    }
    var cleanName = data.name.trim();
    if (getByName(cleanName)) {
      return { success: false, error: "Category '" + cleanName + "' already exists." };
    }

    var id = data.id || ("cat-" + cleanName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""));
    if (getById(id)) id = id + "-" + new Date().getTime();

    var cat = {
      id: id,
      name: cleanName,
      type: data.type || "hardware", // hardware, software, consumable
      description: data.description || "",
      customFields: data.customFields || []
    };

    getDb().push(cat);
    AppState.save();
    return { success: true, category: cat };
  }

  function update(id, data) {
    var cat = getById(id);
    if (!cat) return { success: false, error: "Category not found: " + id };

    if (data.name && data.name.trim() !== cat.name) {
      var existing = getByName(data.name.trim());
      if (existing && existing.id !== id) {
        return { success: false, error: "Category name '" + data.name + "' is already in use." };
      }
      var oldName = cat.name;
      cat.name = data.name.trim();
      var catalog = getCatalog();
      for (var i = 0; i < catalog.length; i++) {
        if (catalog[i].category === oldName || catalog[i].categoryId === id) {
          catalog[i].category = cat.name;
        }
      }
    }

    if (data.type) cat.type = data.type;
    if (data.description !== undefined) cat.description = data.description;
    if (data.customFields) cat.customFields = data.customFields;

    AppState.save();
    return { success: true, category: cat };
  }

  function deleteCategory(id) {
    var cat = getById(id);
    if (!cat) return { success: false, error: "Category not found: " + id };

    var count = getItemCount(cat);
    if (count > 0) {
      return {
        success: false,
        error: "Cannot delete category '" + cat.name + "' because it has " + count + " item(s) in Master Catalog."
      };
    }

    var cats = getDb();
    var idx = -1;
    for (var i = 0; i < cats.length; i++) {
      if (cats[i].id === id) { idx = i; break; }
    }
    if (idx !== -1) {
      cats.splice(idx, 1);
      AppState.save();
      return { success: true };
    }
    return { success: false, error: "Delete failed" };
  }

  function addCustomField(catId, field) {
    var cat = getById(catId);
    if (!cat) return { success: false, error: "Category not found: " + catId };
    if (!field || !field.label) return { success: false, error: "Field label is required." };

    var fId = field.id || field.label.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
    if (!cat.customFields) cat.customFields = [];

    for (var i = 0; i < cat.customFields.length; i++) {
      if (cat.customFields[i].id === fId) {
        return { success: false, error: "Field '" + fId + "' already exists in this category." };
      }
    }

    var newField = {
      id: fId,
      label: field.label.trim(),
      type: field.type || "text", // text, number, date, select
      options: field.options || [],
      required: !!field.required
    };

    cat.customFields.push(newField);
    AppState.save();
    return { success: true, field: newField };
  }

  function deleteCustomField(catId, fieldId) {
    var cat = getById(catId);
    if (!cat) return { success: false, error: "Category not found: " + catId };

    // Block deletion if any catalog item in this category has data in this custom field
    var catalog = getCatalog();
    var itemsWithData = 0;
    for (var i = 0; i < catalog.length; i++) {
      var it = catalog[i];
      if (it.category === cat.name || it.categoryId === cat.id) {
        if (it.customFields && it.customFields[fieldId] !== undefined && it.customFields[fieldId] !== null && String(it.customFields[fieldId]).trim() !== "") {
          itemsWithData++;
        }
      }
    }

    if (itemsWithData > 0) {
      return {
        success: false,
        error: "Cannot delete field '" + fieldId + "' because " + itemsWithData + " item(s) in Master Catalog contain data for this field."
      };
    }

    var fIdx = -1;
    for (var f = 0; f < (cat.customFields || []).length; f++) {
      if (cat.customFields[f].id === fieldId) { fIdx = f; break; }
    }

    if (fIdx !== -1) {
      cat.customFields.splice(fIdx, 1);
      AppState.save();
      return { success: true };
    }
    return { success: false, error: "Custom field not found: " + fieldId };
  }

  return {
    list: list,
    getById: getById,
    getByName: getByName,
    getItemCount: getItemCount,
    create: create,
    update: update,
    delete: deleteCategory,
    addCustomField: addCustomField,
    deleteCustomField: deleteCustomField
  };
})();
