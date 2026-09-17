/* ==========================================================================
   ITIM-lite - Purchase Order (PO) & Inbound Intake Service
   ========================================================================== */

var POService = (function () {
  function getDb() {
    return AppState.db;
  }

  function getAll() {
    var db = getDb();
    if (!db) return [];
    if (!db.purchaseOrders) db.purchaseOrders = [];
    return db.purchaseOrders;
  }

  function getById(idOrPoNumber) {
    var list = getAll();
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === idOrPoNumber || list[i].poNumber === idOrPoNumber) {
        return list[i];
      }
    }
    return null;
  }

  function generateNextPoId() {
    var list = getAll();
    var maxNum = 8000;
    for (var i = 0; i < list.length; i++) {
      var match = (list[i].poNumber || list[i].id || "").match(/PO-(\d+)/i);
      if (match) {
        var n = parseInt(match[1], 10);
        if (n > maxNum) maxNum = n;
      }
    }
    return "PO-" + (maxNum + 1);
  }

  function createPO(data) {
    var db = getDb();
    if (!data.vendor || !data.vendor.trim()) {
      throw new Error("Vendor name is required to create a Purchase Order.");
    }
    if (!data.items || !data.items.length) {
      throw new Error("A Purchase Order must contain at least one line item.");
    }

    var poNumber = data.poNumber || generateNextPoId();
    var po = {
      id: poNumber, poNumber: poNumber, vendor: data.vendor.trim(),
      orderDate: data.orderDate || (new Date().toISOString().slice(0, 10)),
      expectedDate: data.expectedDate || "", receivedDate: "", status: "pending", notes: data.notes || "", items: []
    };

    for (var i = 0; i < data.items.length; i++) {
      var item = data.items[i];
      var master = (typeof CatalogService !== "undefined") ? CatalogService.getById(item.masterId || item.id || item.sku) : null;
      if (!master && !item.name) throw new Error("Line item requires a registered master item or item name.");
      var itemType = master ? master.type : (item.type || (item.category === "Cables & Adapters" || item.category === "Toner & Cartridge" ? "consumable" : "asset"));
      var preSerials = (item.serials && item.serials.length) ? item.serials.slice(0) : [];
      po.items.push({
        masterId: master ? master.id : (item.masterId || ""),
        name: master ? master.name : (item.name || "Item"),
        type: itemType,
        category: master ? master.category : (item.category || "Laptop"),
        model: master ? master.model : (item.model || ""),
        qtyOrdered: parseInt(item.qtyOrdered, 10) || 1,
        qtyReceived: 0, assetIds: [], licenseIds: [], consumableIds: [],
        serials: preSerials
      });
    }

    if (!db.purchaseOrders) db.purchaseOrders = [];
    db.purchaseOrders.push(po);
    if (typeof AuditService !== "undefined") AuditService.log("PO_CREATE", "Created Purchase Order " + po.poNumber + " for " + po.vendor);
    AppState.save();
    return po;
  }

  function receiveItems(poNumber, lineItemIndex, receiptDetails) {
    var po = getById(poNumber);
    if (!po) throw new Error("Purchase Order not found: " + poNumber);
    if (po.status === "cancelled") throw new Error("Cannot receive items against a cancelled Purchase Order.");
    if (po.status === "received") throw new Error("Purchase Order " + poNumber + " is already fully received.");

    if (lineItemIndex < 0 || lineItemIndex >= po.items.length) {
      throw new Error("Invalid line item index: " + lineItemIndex);
    }

    var item = po.items[lineItemIndex];
    var remaining = item.qtyOrdered - (item.qtyReceived || 0);
    if (remaining <= 0) {
      throw new Error("Line item " + item.name + " is already fully received.");
    }

    var serials = (receiptDetails && receiptDetails.serials) ? receiptDetails.serials : ((item.serials && item.serials.length) ? item.serials.slice(0) : []);
    var qty = (receiptDetails && receiptDetails.qty !== undefined && receiptDetails.qty !== null) ? (parseInt(receiptDetails.qty, 10) || 1) : (serials.length > 0 ? serials.length : 1);

    if (serials.length > qty) {
      throw new Error("Number of serial numbers (" + serials.length + ") cannot exceed quantity to receive (" + qty + ").");
    }
    if (qty > remaining) {
      throw new Error("Received quantity (" + qty + ") exceeds remaining ordered quantity (" + remaining + ").");
    }

    var isConsumable = (item.type === "consumable") ||
      (typeof ITIM_CONFIG !== "undefined" && ITIM_CONFIG.CONSUMABLE_CATEGORIES && ITIM_CONFIG.CONSUMABLE_CATEGORIES.indexOf(item.category) !== -1);
    var isSoftware = (item.type === "software");

    var createdAssets = [];
    var createdConsumables = [];
    var createdLicenses = [];

    if (isConsumable) {
      var allCons = (typeof ConsumablesService !== "undefined") ? ConsumablesService.getAll() : [];
      var existing = null;
      for (var c = 0; c < allCons.length; c++) {
        if (allCons[c].name.toLowerCase() === item.name.toLowerCase()) { existing = allCons[c]; break; }
      }
      var isSerialized = !!(receiptDetails && receiptDetails.isSerialized) || (serials.length > 0);
      var loc = (receiptDetails && receiptDetails.location) ? receiptDetails.location : "IT Stock Shelf C";
      if (existing) {
        ConsumablesService.adjustQuantity(existing.id, qty);
        if (receiptDetails && receiptDetails.location) existing.location = loc;
        if (isSerialized) {
          existing.isSerialized = true;
          if (!existing.serials) existing.serials = [];
          for (var si = 0; si < serials.length; si++) {
            existing.serials.push({ sn: serials[si].trim(), status: "available", location: loc });
          }
        }
        createdConsumables.push(existing);
      } else if (typeof ConsumablesService !== "undefined") {
        var newSerials = [];
        if (isSerialized) {
          for (var sj = 0; sj < serials.length; sj++) {
            newSerials.push({ sn: serials[sj].trim(), status: "available", location: loc });
          }
        }
        var newCon = ConsumablesService.addInboundConsumable({
          name: item.name, category: item.category, quantity: qty, minQuantity: 5,
          location: loc, poNumber: po.poNumber, isSerialized: isSerialized, serials: newSerials
        });
        createdConsumables.push(newCon);
      }
      if (!item.consumableIds) item.consumableIds = [];
      if (createdConsumables.length && item.consumableIds.indexOf(createdConsumables[0].id) === -1) {
        item.consumableIds.push(createdConsumables[0].id);
      }
    } else if (isSoftware) {
      var allLic = (typeof LicensesService !== "undefined") ? LicensesService.getAll() : [];
      var existingLic = null;
      for (var l = 0; l < allLic.length; l++) {
        if (allLic[l].software.toLowerCase() === item.name.toLowerCase()) { existingLic = allLic[l]; break; }
      }
      var singleKey = (receiptDetails && receiptDetails.licenseKey) ? receiptDetails.licenseKey.trim() : "";
      var multiKeys = (receiptDetails && receiptDetails.licenseKeys) ? receiptDetails.licenseKeys : [];
      var effKey = singleKey || (multiKeys.length > 0 ? multiKeys.join(", ") : (serials.length > 0 ? serials.join(", ") : ""));
      if (existingLic) {
        var upd = {
          totalSeats: (existingLic.totalSeats || 0) + qty,
          expiryDate: (receiptDetails && receiptDetails.expiryDate) ? receiptDetails.expiryDate : existingLic.expiryDate
        };
        if (effKey && !existingLic.key) upd.key = effKey;
        if (multiKeys.length > 0) existingLic.keys = (existingLic.keys || []).concat(multiKeys);
        LicensesService.update(existingLic.id, upd);
        createdLicenses.push(existingLic);
      } else if (typeof LicensesService !== "undefined") {
        var newLic = LicensesService.add({
          software: item.name, vendor: item.vendor || po.vendor, type: "Subscription",
          totalSeats: qty, assignedSeats: 0, key: effKey, keys: multiKeys,
          expiryDate: (receiptDetails && receiptDetails.expiryDate) ? receiptDetails.expiryDate : "",
          notes: "Intake from PO " + po.poNumber
        });
        createdLicenses.push(newLic);
      }
      if (!item.licenseIds) item.licenseIds = [];
      if (createdLicenses.length && item.licenseIds.indexOf(createdLicenses[0].id) === -1) {
        item.licenseIds.push(createdLicenses[0].id);
      }
    } else {
      for (var i = 0; i < qty; i++) {
        var serial = (i < serials.length) ? serials[i].trim() : "";
        var asset = InventoryService.addInboundAsset({
          name: item.name,
          category: item.category,
          model: item.model,
          serial: serial,
          poNumber: po.poNumber,
          department: "IT Stock",
          location: (receiptDetails && receiptDetails.location) ? receiptDetails.location : "IT Warehouse Shelf A",
          status: "available",
          purchaseDate: po.orderDate,
          notes: (receiptDetails && receiptDetails.notes) ? receiptDetails.notes : ("Inbound delivery from PO " + po.poNumber)
        });
        createdAssets.push(asset);
        if (!item.assetIds) item.assetIds = [];
        item.assetIds.push(asset.id);
      }
    }

    item.qtyReceived = (item.qtyReceived || 0) + qty;

    // Check overall PO completion status
    var allReceived = true;
    var anyReceived = false;
    for (var j = 0; j < po.items.length; j++) {
      if (po.items[j].qtyReceived < po.items[j].qtyOrdered) allReceived = false;
      if (po.items[j].qtyReceived > 0) anyReceived = true;
    }

    if (allReceived) {
      po.status = "received";
      po.receivedDate = new Date().toISOString().slice(0, 10);
    } else if (anyReceived) {
      po.status = "partial";
    }

    // Auto-record INBOUND transaction record
    var txnItems = [];
    if (isConsumable && createdConsumables.length) {
      var conSn = (serials.length > 0) ? serials.join(", ") : ("QTY: " + qty);
      txnItems.push({
        assetId: createdConsumables[0].id, name: item.name, category: item.category, serial: conSn,
        condition: (receiptDetails && receiptDetails.condition) ? receiptDetails.condition : "Factory Sealed / New"
      });
    } else if (isSoftware && createdLicenses.length) {
      txnItems.push({
        assetId: createdLicenses[0].id, name: item.name, category: "Software", serial: effKey || ("SEATS: +" + qty),
        condition: "Licensed / Active"
      });
    } else {
      for (var k = 0; k < createdAssets.length; k++) {
        txnItems.push({
          assetId: createdAssets[k].id, name: createdAssets[k].name, category: createdAssets[k].category, serial: createdAssets[k].serial,
          condition: (receiptDetails && receiptDetails.condition) ? receiptDetails.condition : "Factory Sealed / New"
        });
      }
    }

    var txnId = (typeof TransactionsService !== "undefined" && TransactionsService.generateNextId)
      ? TransactionsService.generateNextId() : ("TXN-" + (new Date().getTime()));
    var db = getDb();
    if (!db.transactions) db.transactions = [];
    var inboundTxn = {
      id: txnId, type: "INBOUND",
      timestamp: (new Date().toISOString().slice(0, 19).replace("T", " ")),
      employeeName: "IT Warehouse", department: "IT Stock Room",
      officer: (receiptDetails && receiptDetails.officer) ? receiptDetails.officer : "Receiving Staff",
      notes: "Inbound intake from " + po.vendor + " under " + po.poNumber,
      items: txnItems, itemCount: txnItems.length, poNumber: po.poNumber
    };
    db.transactions.unshift(inboundTxn);

    if (typeof AuditService !== "undefined") {
      var itemRef = isConsumable ? (createdConsumables.map(function (c) { return c.id; }).join(", "))
        : isSoftware ? (createdLicenses.map(function (l) { return l.id; }).join(", "))
        : (createdAssets.map(function (a) { return a.id; }).join(", "));
      AuditService.log("PO_RECEIVE", "Received " + qty + "x " + item.name + " on " + po.poNumber + " (" + itemRef + ")");
    }
    AppState.save();
    return { success: true, po: po, isConsumable: isConsumable, isSoftware: isSoftware, assets: createdAssets, consumables: createdConsumables, licenses: createdLicenses, transaction: inboundTxn };
  }

  function cancelPO(poNumber, reason) {
    var po = getById(poNumber);
    if (!po) throw new Error("Purchase Order not found: " + poNumber);
    for (var i = 0; i < po.items.length; i++) {
      if (po.items[i].qtyReceived > 0) throw new Error("Cannot cancel PO " + poNumber + " because items have already been received.");
    }
    po.status = "cancelled";
    po.cancelReason = reason || "Cancelled by user";
    if (typeof AuditService !== "undefined") AuditService.log("PO_CANCEL", "Cancelled Purchase Order " + po.poNumber + ". Reason: " + po.cancelReason);
    AppState.save();
    return po;
  }

  return {
    getAll: getAll,
    getById: getById,
    generateNextPoId: generateNextPoId,
    createPO: createPO,
    receiveItems: receiveItems,
    cancelPO: cancelPO
  };
})();
