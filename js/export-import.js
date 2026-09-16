/* ==========================================================================
   ITIM-lite - CSV & JSON Export / Import Service
   Generates Excel-ready CSVs and handles backup imports
   ========================================================================== */

var ExportImportService = (function () {
  function escapeCsv(val) {
    if (val === null || val === undefined) return '""';
    var str = String(val).replace(/"/g, '""');
    return '"' + str + '"';
  }

  function exportLicensesToCsv() {
    var licenses = LicensesService.getAll();
    var headers = ["License ID", "Software Title", "Vendor", "License Type", "Total Seats", "Assigned Seats", "License Key", "Expiry Date", "Notes"];
    var rows = [headers.map(escapeCsv).join(",")];

    for (var i = 0; i < licenses.length; i++) {
      var l = licenses[i];
      var row = [
        l.id, l.software, l.vendor, l.type,
        l.totalSeats, l.assignedSeats, l.key,
        l.expiryDate, l.notes
      ];
      rows.push(row.map(escapeCsv).join(","));
    }
    return rows.join("\r\n");
  }

  function saveExportFile(filename, content) {
    var storagePath = AppState.getStoragePath();
    if (FsoStorage.isHta) {
      try {
        var base = FsoStorage.resolvePath(storagePath);
        var exportDir = FsoStorage.isHta ? (new ActiveXObject("Scripting.FileSystemObject")).BuildPath(base, "exports") : "exports";
        FsoStorage.ensureDirectoryExists(exportDir);
        var fso = new ActiveXObject("Scripting.FileSystemObject");
        var fullPath = fso.BuildPath(exportDir, filename);
        var ok = FsoStorage.writeUtf8(fullPath, content);
        if (ok) {
          return { success: true, path: fullPath };
        }
      } catch (e) {
        // Fall back
      }
    }

    // Web fallback download
    try {
      var blob = new Blob([content], { type: "text/plain;charset=utf-8" });
      var url = URL.createObjectURL(blob);
      var a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return { success: true, path: "Downloaded to local files" };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  return {
    exportLicensesToCsv: exportLicensesToCsv,
    saveExportFile: saveExportFile
  };
})();
