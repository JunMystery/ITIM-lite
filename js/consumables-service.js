/* ==========================================================================
   ITIM-lite - Consumables & Accessories Inventory Service
   ========================================================================== */

var ConsumablesService = (function () {
  function getDb() {
    return AppState.db;
  }

  function getAll() {
    var db = getDb();
    return (db && db.consumables) ? db.consumables : [];
  }

  function getById(id) {
    var list = getAll();
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) return list[i];
    }
    return null;
  }

  function generateNextId() {
    var list = getAll();
    var maxNum = 3000;
    for (var i = 0; i < list.length; i++) {
      var match = list[i].id.match(/CON-(\d+)/i);
      if (match) {
        var n = parseInt(match[1], 10);
        if (n > maxNum) maxNum = n;
      }
    }
    return "CON-" + (maxNum + 1);
  }

  function add(conData) {
    if (!conData || !conData.poNumber || conData.source !== "PO_INBOUND") {
      throw new Error("Direct consumable creation forbidden: items can only enter inventory via PO Inbound intake.");
    }
    var db = getDb();
    if (!conData.id) {
      conData.id = generateNextId();
    }
    conData.quantity = (conData.quantity !== undefined && conData.quantity !== null && !isNaN(conData.quantity)) ? parseInt(conData.quantity, 10) : 0;
    conData.minQuantity = (conData.minQuantity !== undefined && conData.minQuantity !== null && !isNaN(conData.minQuantity)) ? parseInt(conData.minQuantity, 10) : 0;

    db.consumables.push(conData);
    if (typeof AuditService !== "undefined") {
      AuditService.log("CONSUMABLE_CREATE", "Intake consumable " + conData.id + " (" + conData.name + ") via PO " + conData.poNumber);
    }
    AppState.save();
    return conData;
  }

  function addInboundConsumable(conData) {
    conData = conData || {};
    conData.source = "PO_INBOUND";
    return add(conData);
  }

  function update(id, updatedFields) {
    var db = getDb();
    var item = getById(id);
    if (!item) return null;

    for (var key in updatedFields) {
      if (updatedFields.hasOwnProperty(key)) {
        item[key] = updatedFields[key];
      }
    }
    item.quantity = (item.quantity !== undefined && item.quantity !== null && !isNaN(item.quantity)) ? parseInt(item.quantity, 10) : 0;
    item.minQuantity = (item.minQuantity !== undefined && item.minQuantity !== null && !isNaN(item.minQuantity)) ? parseInt(item.minQuantity, 10) : 0;

    if (typeof AuditService !== "undefined") {
      AuditService.log("CONSUMABLE_UPDATE", "Updated consumable " + id);
    }
    AppState.save();
    return item;
  }

  function remove(id) {
    var db = getDb();
    var index = -1;
    for (var i = 0; i < db.consumables.length; i++) {
      if (db.consumables[i].id === id) {
        index = i;
        break;
      }
    }
    if (index !== -1) {
      var removed = db.consumables.splice(index, 1)[0];
      if (typeof AuditService !== "undefined") {
        AuditService.log("CONSUMABLE_DELETE", "Deleted consumable " + id + " (" + removed.name + ")");
      }
      AppState.save();
      return true;
    }
    return false;
  }

  function adjustQuantity(id, delta) {
    var item = getById(id);
    if (!item) return null;

    item.quantity = Math.max(0, (parseInt(item.quantity, 10) || 0) + delta);
    if (typeof AuditService !== "undefined") {
      AuditService.log("STOCK_ADJUST", "Adjusted " + item.name + " stock by " + (delta > 0 ? "+" + delta : delta) + " (new qty: " + item.quantity + ")");
    }
    AppState.save();
    return item;
  }

  function getLowStockItems() {
    var list = getAll();
    return list.filter(function (c) {
      return (parseInt(c.quantity, 10) || 0) <= (parseInt(c.minQuantity, 10) || 0);
    });
  }

  function getMetrics() {
    var list = getAll();
    var totalItems = 0;
    var lowStockCount = 0;

    for (var i = 0; i < list.length; i++) {
      var item = list[i];
      var qty = parseInt(item.quantity, 10) || 0;
      var min = parseInt(item.minQuantity, 10) || 0;

      totalItems += qty;
      if (qty <= min) {
        lowStockCount++;
      }
    }

    return {
      uniqueTypes: list.length,
      totalUnits: totalItems,
      lowStockCount: lowStockCount
    };
  }

  return {
    getAll: getAll,
    getById: getById,
    generateNextId: generateNextId,
    add: add,
    addInboundConsumable: addInboundConsumable,
    update: update,
    remove: remove,
    adjustQuantity: adjustQuantity,
    getLowStockItems: getLowStockItems,
    getMetrics: getMetrics
  };
})();
