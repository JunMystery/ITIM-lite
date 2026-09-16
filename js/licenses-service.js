/* ==========================================================================
   ITIM-lite - Software License & Subscription Service
   ========================================================================== */

var LicensesService = (function () {
  function getDb() {
    return AppState.db;
  }

  function getAll() {
    var db = getDb();
    return (db && db.licenses) ? db.licenses : [];
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
    var maxNum = 2000;
    for (var i = 0; i < list.length; i++) {
      var match = list[i].id.match(/LIC-(\d+)/i);
      if (match) {
        var n = parseInt(match[1], 10);
        if (n > maxNum) maxNum = n;
      }
    }
    return "LIC-" + (maxNum + 1);
  }

  function add(licData) {
    var db = getDb();
    if (!licData.id) {
      licData.id = generateNextId();
    }
    licData.totalSeats = (licData.totalSeats !== undefined && licData.totalSeats !== null && !isNaN(licData.totalSeats)) ? parseInt(licData.totalSeats, 10) : 0;
    licData.assignedSeats = parseInt(licData.assignedSeats, 10) || 0;

    db.licenses.push(licData);
    AuditService.log("LICENSE_CREATE", "Added license " + licData.id + " (" + licData.software + ")");
    AppState.save();
    return licData;
  }

  function update(id, updatedFields) {
    var db = getDb();
    var lic = getById(id);
    if (!lic) return null;

    for (var key in updatedFields) {
      if (updatedFields.hasOwnProperty(key)) {
        lic[key] = updatedFields[key];
      }
    }
    lic.totalSeats = (lic.totalSeats !== undefined && lic.totalSeats !== null && !isNaN(lic.totalSeats)) ? parseInt(lic.totalSeats, 10) : 0;
    lic.assignedSeats = parseInt(lic.assignedSeats, 10) || 0;

    AuditService.log("LICENSE_UPDATE", "Updated license " + id);
    AppState.save();
    return lic;
  }

  function remove(id) {
    var db = getDb();
    var index = -1;
    for (var i = 0; i < db.licenses.length; i++) {
      if (db.licenses[i].id === id) {
        index = i;
        break;
      }
    }
    if (index !== -1) {
      var removed = db.licenses.splice(index, 1)[0];
      AuditService.log("LICENSE_DELETE", "Deleted license " + id + " (" + removed.software + ")");
      AppState.save();
      return true;
    }
    return false;
  }

  function getMetrics() {
    var list = getAll();
    var totalSeats = 0;
    var assignedSeats = 0;
    var expiringCount = 0;

    var now = new Date();
    var in60Days = new Date(now.getTime() + (60 * 24 * 60 * 60 * 1000));

    for (var i = 0; i < list.length; i++) {
      var item = list[i];
      totalSeats += (parseInt(item.totalSeats, 10) || 0);
      assignedSeats += (parseInt(item.assignedSeats, 10) || 0);

      if (item.expiryDate) {
        var exp = new Date(item.expiryDate);
        if (exp >= now && exp <= in60Days) {
          expiringCount++;
        }
      }
    }

    return {
      totalLicenses: list.length,
      totalSeats: totalSeats,
      assignedSeats: assignedSeats,
      availableSeats: Math.max(0, totalSeats - assignedSeats),
      expiringCount: expiringCount
    };
  }

  return {
    getAll: getAll,
    getById: getById,
    generateNextId: generateNextId,
    add: add,
    update: update,
    remove: remove,
    getMetrics: getMetrics
  };
})();
