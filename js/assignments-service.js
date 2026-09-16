/* ==========================================================================
   ITIM-lite - Hardware Assignments & Audit Trail Service
   ========================================================================== */

var AuditService = (function () {
  function log(action, detail) {
    if (!AppState.db) return;
    if (!AppState.db.auditLogs) AppState.db.auditLogs = [];

    var d = new Date();
    var ts = d.getFullYear() + "-" +
      (d.getMonth() + 1 < 10 ? "0" : "") + (d.getMonth() + 1) + "-" +
      (d.getDate() < 10 ? "0" : "") + d.getDate() + " " +
      (d.getHours() < 10 ? "0" : "") + d.getHours() + ":" +
      (d.getMinutes() < 10 ? "0" : "") + d.getMinutes() + ":" +
      (d.getSeconds() < 10 ? "0" : "") + d.getSeconds();

    AppState.db.auditLogs.unshift({
      timestamp: ts,
      action: action,
      detail: detail
    });

    if (AppState.db.auditLogs.length > 250) {
      AppState.db.auditLogs = AppState.db.auditLogs.slice(0, 250);
    }
  }

  function getAll() {
    return (AppState.db && AppState.db.auditLogs) ? AppState.db.auditLogs : [];
  }

  return {
    log: log,
    getAll: getAll
  };
})();

var AssignmentsService = (function () {
  function getAll() {
    return (AppState.db && AppState.db.assignments) ? AppState.db.assignments : [];
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
    var maxNum = 4000;
    for (var i = 0; i < list.length; i++) {
      var match = list[i].id.match(/ASG-(\d+)/i);
      if (match) {
        var n = parseInt(match[1], 10);
        if (n > maxNum) maxNum = n;
      }
    }
    return "ASG-" + (maxNum + 1);
  }

  function checkout(params) {
    var asset = InventoryService.getById(params.assetId);
    if (!asset) return { success: false, error: "Asset not found." };
    if (asset.status === "inuse") {
      return { success: false, error: "Asset is already marked In Use." };
    }

    var record = {
      id: generateNextId(),
      assetId: asset.id,
      assetName: asset.name,
      employeeName: params.employeeName,
      employeeEmail: params.employeeEmail || "",
      department: params.department || "",
      checkoutDate: params.checkoutDate || new Date().toISOString().split("T")[0],
      expectedReturnDate: params.expectedReturnDate || "",
      returnDate: "",
      status: "active",
      conditionOut: params.conditionOut || "Good / Normal",
      conditionIn: "",
      notes: params.notes || "",
      consumables: params.consumables || [],
      licenses: params.licenses || []
    };

    AppState.db.assignments.unshift(record);

    // Synchronize multi-item transaction or fallback to direct updates
    if (typeof TransactionsService !== "undefined") {
      var txnItems = [{ assetId: asset.id, name: asset.name, category: asset.category, serial: asset.serial || "", condition: record.conditionOut, itemType: "asset" }];
      for (var j = 0; j < record.consumables.length; j++) {
        var con = record.consumables[j];
        txnItems.push({ id: con.id, assetId: con.id, name: con.name, category: con.category || "Consumable", quantity: con.quantity || 1, itemType: "consumable" });
      }
      for (var k = 0; k < record.licenses.length; k++) {
        var lk = record.licenses[k];
        txnItems.push({ id: lk.id, assetId: lk.id, name: lk.name, category: lk.category || "Software", quantity: 1, itemType: "license" });
      }
      var tRes = TransactionsService.checkoutBulk({
        items: txnItems,
        assetIds: [asset.id],
        employeeName: params.employeeName,
        employeeEmail: params.employeeEmail || "",
        department: params.department || "",
        expectedReturnDate: params.expectedReturnDate || "",
        notes: "Handover assignment " + record.id + (params.notes ? " - " + params.notes : ""),
        officer: params.officer || "IT Admin"
      });
      if (tRes && tRes.success && tRes.transaction) {
        record.txnId = tRes.transaction.id;
      }
    } else {
      InventoryService.update(asset.id, {
        status: "inuse",
        assignedTo: params.employeeName,
        department: params.department || asset.department
      });
      if (typeof ConsumablesService !== "undefined") {
        for (var ci = 0; ci < record.consumables.length; ci++) {
          var c = record.consumables[ci];
          ConsumablesService.adjustQuantity(c.id, -(c.quantity || 1));
        }
      }
      if (typeof LicensesService !== "undefined") {
        for (var li = 0; li < record.licenses.length; li++) {
          var l = record.licenses[li];
          var lic = LicensesService.getById(l.id);
          if (lic) LicensesService.update(l.id, { assignedSeats: (parseInt(lic.assignedSeats, 10) || 0) + 1 });
        }
      }
    }

    AuditService.log("CHECKOUT", "Asset " + asset.id + " + " + (record.consumables.length + record.licenses.length) + " items checked out to " + params.employeeName);
    AppState.save();
    return { success: true, assignment: record };
  }

  function checkin(assignmentId, conditionIn, returnNotes, dispositions) {
    var record = getById(assignmentId);
    if (!record) return { success: false, error: "Assignment record not found." };

    record.status = "returned";
    record.returnDate = new Date().toISOString().split("T")[0];
    record.conditionIn = conditionIn || "Returned in Good Condition";
    if (returnNotes) {
      record.notes = (record.notes ? record.notes + " | " : "") + returnNotes;
    }
    record.dispositions = dispositions || {};

    // 1. Hardware Asset Disposition
    var assetAction = (dispositions && dispositions.assetAction) || "return";
    if (typeof TransactionsService !== "undefined") {
      var checkinItems = [{ itemType: "asset", id: record.assetId, assetId: record.assetId, name: record.assetName, disposition: assetAction }];
      for (var ci = 0; ci < (record.consumables || []).length; ci++) {
        var c = record.consumables[ci];
        checkinItems.push({ itemType: "consumable", id: c.id, assetId: c.id, name: c.name, quantity: c.quantity || 1, disposition: (dispositions && dispositions.consumableActions && dispositions.consumableActions[c.id]) || "return" });
      }
      for (var li = 0; li < (record.licenses || []).length; li++) {
        var l = record.licenses[li];
        checkinItems.push({ itemType: "license", id: l.id, assetId: l.id, name: l.name, quantity: 1, disposition: (dispositions && dispositions.licenseActions && dispositions.licenseActions[l.id]) || "return" });
      }
      TransactionsService.checkinBulk({
        parentTxnId: record.txnId,
        items: checkinItems,
        employeeName: record.employeeName,
        notes: "Check-in assignment " + record.id + (returnNotes ? " - " + returnNotes : "")
      });
    } else {
      var asset = InventoryService.getById(record.assetId);
      if (asset) {
        InventoryService.update(asset.id, { status: (assetAction === "disposal" ? "retired" : "available"), assignedTo: "" });
      }
      if (typeof ConsumablesService !== "undefined" && record.consumables) {
        for (var cj = 0; cj < record.consumables.length; cj++) {
          var cItem = record.consumables[cj];
          var cAct = (dispositions && dispositions.consumableActions && dispositions.consumableActions[cItem.id]) || "return";
          if (cAct === "return") ConsumablesService.adjustQuantity(cItem.id, cItem.quantity || 1);
        }
      }
      if (typeof LicensesService !== "undefined" && record.licenses) {
        for (var lj = 0; lj < record.licenses.length; lj++) {
          var lItem = record.licenses[lj];
          var lAct = (dispositions && dispositions.licenseActions && dispositions.licenseActions[lItem.id]) || "return";
          if (lAct === "return") {
            var lic = LicensesService.getById(lItem.id);
            if (lic) LicensesService.update(lItem.id, { assignedSeats: Math.max(0, (parseInt(lic.assignedSeats, 10) || 0) - 1) });
          }
        }
      }
    }

    AuditService.log("CHECKIN", "Asset " + record.assetId + " returned from " + record.employeeName);
    AppState.save();
    return { success: true, assignment: record };
  }

  function getActive() {
    return getAll().filter(function (a) {
      return a.status === "active";
    });
  }

  function getByAsset(assetId) {
    var found = getAll().filter(function (a) { return a.assetId === assetId && a.status === "active"; });
    if (found.length > 0) return found;
    if (typeof TransactionsService !== "undefined") {
      var act = TransactionsService.getActiveByAsset(assetId);
      if (act) return [{ id: act.id, assetId: assetId, employeeName: act.employeeName, status: "active" }];
    }
    return [];
  }

  return {
    getAll: getAll,
    getById: getById,
    generateNextId: generateNextId,
    checkout: checkout,
    checkin: checkin,
    getActive: getActive,
    getByAsset: getByAsset
  };
})();
