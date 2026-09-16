/* ==========================================================================
   ITIM-lite - Master Identification & Item Catalog Service
   Pre-registers Hardware Assets, Software, and Stock before PO Inbound
   ========================================================================== */

var CatalogService = (function () {
  function getDb() {
    return AppState.db;
  }

  function getAll() {
    var db = getDb();
    return (db && db.catalog) ? db.catalog : [];
  }

  function getById(id) {
    if (!id) return null;
    var list = getAll();
    var needle = String(id).trim().toUpperCase();
    for (var i = 0; i < list.length; i++) {
      if (String(list[i].id).toUpperCase() === needle) return list[i];
    }
    return null;
  }

  function generateNextId() {
    var list = getAll();
    var maxNum = 1000;
    for (var i = 0; i < list.length; i++) {
      var match = String(list[i].id).match(/SKU-(\d+)/i);
      if (match) {
        var n = parseInt(match[1], 10);
        if (n > maxNum) maxNum = n;
      }
    }
    return "SKU-" + (maxNum + 1);
  }

  function add(item) {
    item = item || {};
    var name = String(item.name || "").trim();
    if (!name) throw new Error("Item name is required for Master Catalog.");

    var type = item.type || "hardware";
    if (type === "asset") type = "hardware";
    if (type !== "hardware" && type !== "software" && type !== "consumable") {
      throw new Error("Invalid item type. Must be hardware, software, or consumable.");
    }

    var sku = String(item.id || item.sku || "").trim();
    if (!sku) {
      sku = generateNextId();
    }
    sku = sku.toUpperCase();

    if (getById(sku)) {
      throw new Error("Master item code / SKU '" + sku + "' already exists.");
    }

    var record = {
      id: sku,
      sku: sku,
      name: name,
      type: type,
      category: item.category || (type === "software" ? "Office Suite" : (type === "consumable" ? "Cables & Adapters" : "Laptop")),
      model: item.model || "",
      vendor: item.vendor || "",
      notes: item.notes || "",
      customFields: item.customFields || {}
    };

    var db = getDb();
    if (!db.catalog) db.catalog = [];
    db.catalog.push(record);

    if (typeof AuditService !== "undefined") {
      AuditService.log("CATALOG_CREATE", "Registered master item " + record.id + " (" + record.name + ")");
    }
    AppState.save();
    return record;
  }

  function update(id, fields) {
    var item = getById(id);
    if (!item) return null;

    if (fields.name) item.name = String(fields.name).trim();
    if (fields.category) item.category = fields.category;
    if (fields.model !== undefined) item.model = fields.model;
    if (fields.vendor !== undefined) item.vendor = fields.vendor;
    if (fields.notes !== undefined) item.notes = fields.notes;
    if (fields.customFields !== undefined) item.customFields = fields.customFields;

    if (typeof AuditService !== "undefined") {
      AuditService.log("CATALOG_UPDATE", "Updated master item " + id);
    }
    AppState.save();
    return item;
  }

  function remove(id) {
    var db = getDb();
    if (!db.catalog) return false;
    var index = -1;
    var needle = String(id).toUpperCase();
    for (var i = 0; i < db.catalog.length; i++) {
      if (String(db.catalog[i].id).toUpperCase() === needle) {
        index = i;
        break;
      }
    }
    if (index !== -1) {
      var removed = db.catalog.splice(index, 1)[0];
      if (typeof AuditService !== "undefined") {
        AuditService.log("CATALOG_DELETE", "Deleted master item " + id + " (" + removed.name + ")");
      }
      AppState.save();
      return true;
    }
    return false;
  }

  function getByType(typeFilter) {
    return filter(typeFilter);
  }

  function filter(typeFilter, keyword) {
    var list = getAll();
    var kw = (keyword || "").toLowerCase().trim();
    var tf = (typeFilter === "asset") ? "hardware" : typeFilter;
    return list.filter(function (it) {
      var itType = (it.type === "asset") ? "hardware" : it.type;
      var matchType = (!tf || tf === "all" || itType === tf);
      var matchKw = (!kw ||
        it.id.toLowerCase().indexOf(kw) !== -1 ||
        it.name.toLowerCase().indexOf(kw) !== -1 ||
        (it.category && it.category.toLowerCase().indexOf(kw) !== -1) ||
        (it.model && it.model.toLowerCase().indexOf(kw) !== -1));
      return matchType && matchKw;
    });
  }

  return {
    getAll: getAll,
    getById: getById,
    getByType: getByType,
    generateNextId: generateNextId,
    add: add,
    update: update,
    remove: remove,
    filter: filter
  };
})();
