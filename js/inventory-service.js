/* ==========================================================================
   ITIM-lite - Hardware Asset Inventory Service
   ========================================================================== */

var InventoryService = (function () {
  function getDb() {
    return AppState.db;
  }

  function getAll() {
    var db = getDb();
    return (db && db.assets) ? db.assets : [];
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
    var maxNum = 1000;
    for (var i = 0; i < list.length; i++) {
      var match = list[i].id.match(/AST-(\d+)/i);
      if (match) {
        var n = parseInt(match[1], 10);
        if (n > maxNum) maxNum = n;
      }
    }
    return "AST-" + (maxNum + 1);
  }

  function add(assetData) {
    if (!assetData || !assetData.poNumber || assetData.source !== "PO_INBOUND") {
      throw new Error("Direct asset creation forbidden: items can only enter inventory via PO Inbound intake.");
    }
    var db = getDb();
    if (!assetData.id) {
      assetData.id = generateNextId();
    }
    assetData.status = assetData.status || "available";
    db.assets.push(assetData);

    AuditService.log("ASSET_CREATE", "Intake asset " + assetData.id + " (" + assetData.name + ") via PO " + assetData.poNumber);
    AppState.save();
    return assetData;
  }

  function addInboundAsset(assetData) {
    assetData = assetData || {};
    assetData.source = "PO_INBOUND";
    return add(assetData);
  }

  function update(id, updatedFields) {
    var db = getDb();
    var asset = getById(id);
    if (!asset) return null;

    for (var key in updatedFields) {
      if (updatedFields.hasOwnProperty(key)) {
        asset[key] = updatedFields[key];
      }
    }

    AuditService.log("ASSET_UPDATE", "Updated asset " + id + " details");
    AppState.save();
    return asset;
  }

  function remove(id) {
    var db = getDb();
    var index = -1;
    for (var i = 0; i < db.assets.length; i++) {
      if (db.assets[i].id === id) {
        index = i;
        break;
      }
    }
    if (index !== -1) {
      var removed = db.assets.splice(index, 1)[0];
      AuditService.log("ASSET_DELETE", "Deleted asset " + id + " (" + removed.name + ")");
      AppState.save();
      return true;
    }
    return false;
  }

  function filter(query, category, status) {
    var list = getAll();
    var q = (query || "").toLowerCase().trim();

    return list.filter(function (item) {
      if (category && category !== "all" && item.category !== category) {
        return false;
      }
      if (status && status !== "all" && item.status !== status) {
        return false;
      }
      if (q) {
        var matchId = (item.id || "").toLowerCase().indexOf(q) !== -1;
        var matchName = (item.name || "").toLowerCase().indexOf(q) !== -1;
        var matchSerial = (item.serial || "").toLowerCase().indexOf(q) !== -1;
        var matchModel = (item.model || "").toLowerCase().indexOf(q) !== -1;
        var matchUser = (item.assignedTo || "").toLowerCase().indexOf(q) !== -1;
        var matchDept = (item.department || "").toLowerCase().indexOf(q) !== -1;
        var matchLoc = (item.location || "").toLowerCase().indexOf(q) !== -1;
        return matchId || matchName || matchSerial || matchModel || matchUser || matchDept || matchLoc;
      }
      return true;
    });
  }

  function getMetrics() {
    var list = getAll();
    var total = list.length;
    var inUse = 0;
    var available = 0;
    var inRepair = 0;
    var retired = 0;
    var expiringWarrantyCount = 0;

    var now = new Date();
    var in90Days = new Date(now.getTime() + (90 * 24 * 60 * 60 * 1000));

    for (var i = 0; i < list.length; i++) {
      var a = list[i];
      if (a.status === "inuse") inUse++;
      else if (a.status === "available") available++;
      else if (a.status === "repair") inRepair++;
      else if (a.status === "retired") retired++;

      if (a.warrantyExpiry) {
        var expiry = new Date(a.warrantyExpiry);
        if (expiry >= now && expiry <= in90Days) {
          expiringWarrantyCount++;
        }
      }
    }

    return {
      total: total,
      inUse: inUse,
      available: available,
      inRepair: inRepair,
      retired: retired,
      expiringWarrantyCount: expiringWarrantyCount
    };
  }

  return {
    getAll: getAll,
    getById: getById,
    generateNextId: generateNextId,
    add: add,
    addInboundAsset: addInboundAsset,
    update: update,
    remove: remove,
    filter: filter,
    getMetrics: getMetrics
  };
})();
