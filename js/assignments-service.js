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
      notes: params.notes || ""
    };

    AppState.db.assignments.unshift(record);

    InventoryService.update(asset.id, {
      status: "inuse",
      assignedTo: params.employeeName,
      department: params.department || asset.department
    });

    AuditService.log("CHECKOUT", "Asset " + asset.id + " checked out to " + params.employeeName);
    AppState.save();
    return { success: true, assignment: record };
  }

  function checkin(assignmentId, conditionIn, returnNotes) {
    var record = getById(assignmentId);
    if (!record) return { success: false, error: "Assignment record not found." };

    record.status = "returned";
    record.returnDate = new Date().toISOString().split("T")[0];
    record.conditionIn = conditionIn || "Returned in Good Condition";
    if (returnNotes) {
      record.notes = (record.notes ? record.notes + " | " : "") + returnNotes;
    }

    var asset = InventoryService.getById(record.assetId);
    if (asset) {
      InventoryService.update(asset.id, {
        status: "available",
        assignedTo: ""
      });
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
    return getAll().filter(function (a) {
      return a.assetId === assetId;
    });
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
