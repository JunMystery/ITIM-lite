/* ==========================================================================
   ITIM-lite - Automated Backup Engine & Retention Rotation
   Saves timestamped snapshots to <storagePath>\backups and cleans old copies
   ========================================================================== */

var BackupEngine = (function () {
  var timerId = null;

  function pad(n) {
    return n < 10 ? "0" + n : "" + n;
  }

  function getTimestampString() {
    var d = new Date();
    return d.getFullYear() + "-" +
      pad(d.getMonth() + 1) + "-" +
      pad(d.getDate()) + "_" +
      pad(d.getHours()) + "-" +
      pad(d.getMinutes()) + "-" +
      pad(d.getSeconds());
  }

  function getBackupDir(storagePath) {
    var base = FsoStorage.resolvePath(storagePath);
    if (!FsoStorage.isHta) return "backups";
    var fso = new ActiveXObject("Scripting.FileSystemObject");
    return fso.BuildPath(base, "backups");
  }

  function listBackups(storagePath) {
    if (!FsoStorage.isHta) {
      try {
        var raw = localStorage.getItem("ITIM_BACKUPS_INDEX") || "[]";
        return JSON.parse(raw);
      } catch (e) {
        return [];
      }
    }

    var list = [];
    try {
      var fso = new ActiveXObject("Scripting.FileSystemObject");
      var backupDir = getBackupDir(storagePath);
      if (!fso.FolderExists(backupDir)) return [];

      var folder = fso.GetFolder(backupDir);
      var files = new Enumerator(folder.Files);
      for (; !files.atEnd(); files.moveNext()) {
        var file = files.item();
        if (/\.json$/i.test(file.Name)) {
          list.push({
            name: file.Name,
            path: file.Path,
            size: file.Size,
            dateCreated: new Date(file.DateCreated).toLocaleString()
          });
        }
      }
      // Sort newest first
      list.sort(function (a, b) {
        return b.name.localeCompare(a.name);
      });
    } catch (err) {
      console.error("Backup list error:", err);
    }
    return list;
  }

  function parseBackupDate(filename) {
    var m = (filename || "").match(/(\d{4})-(\d{2})-(\d{2})_(\d{2})-(\d{2})-(\d{2})/);
    if (!m) return null;
    return new Date(parseInt(m[1], 10), parseInt(m[2], 10) - 1, parseInt(m[3], 10), parseInt(m[4], 10), parseInt(m[5], 10), parseInt(m[6], 10));
  }

  function pruneOldBackups(storagePath, config) {
    if (typeof config === "number") config = { maxBackupCount: config, autoCleanMode: "count" };
    config = config || {};
    var maxCount = config.maxBackupCount || config.backupRetentionCount || ITIM_CONFIG.DEFAULT_BACKUP_RETENTION;
    var mode = config.autoCleanMode || ITIM_CONFIG.DEFAULT_CLEAN_MODE || "both";
    var maxDays = config.autoCleanDays || ITIM_CONFIG.DEFAULT_CLEAN_DAYS || 7;
    var now = new Date().getTime();
    var maxAgeMs = maxDays * 24 * 60 * 60 * 1000;

    var backups = listBackups(storagePath);
    if (!backups || backups.length === 0) return;

    var toDelete = [];
    if (mode === "date" || mode === "both") {
      for (var i = 0; i < backups.length; i++) {
        var bDate = parseBackupDate(backups[i].name);
        if (bDate && (now - bDate.getTime()) > maxAgeMs) {
          toDelete.push(backups[i]);
        }
      }
    }
    if (mode === "count" || mode === "both") {
      if (backups.length > maxCount) {
        for (var j = maxCount; j < backups.length; j++) {
          if (toDelete.indexOf(backups[j]) === -1) {
            toDelete.push(backups[j]);
          }
        }
      }
    }

    if (toDelete.length === 0) return;

    if (FsoStorage.isHta) {
      try {
        var fso = new ActiveXObject("Scripting.FileSystemObject");
        for (var k = 0; k < toDelete.length; k++) {
          if (fso.FileExists(toDelete[k].path)) fso.DeleteFile(toDelete[k].path, true);
        }
      } catch (e) {
        console.error("Prune backups error:", e);
      }
    } else {
      try {
        var delMap = {};
        for (var d = 0; d < toDelete.length; d++) {
          delMap[toDelete[d].name] = true;
          localStorage.removeItem("ITIM_BACKUP_" + toDelete[d].name);
        }
        var kept = [];
        for (var r = 0; r < backups.length; r++) {
          if (!delMap[backups[r].name]) kept.push(backups[r]);
        }
        localStorage.setItem("ITIM_BACKUPS_INDEX", JSON.stringify(kept));
      } catch (err) {
        console.error("Prune localStorage error:", err);
      }
    }
  }

  function createBackup(storagePath, currentData) {
    var ts = getTimestampString();
    var filename = "inventory_backup_" + ts + ".json";
    var jsonStr = JSON.stringify(currentData, null, 2);

    if (!FsoStorage.isHta) {
      try {
        var list = listBackups(storagePath);
        list.unshift({
          name: filename,
          path: filename,
          size: jsonStr.length,
          dateCreated: new Date().toLocaleString()
        });
        localStorage.setItem("ITIM_BACKUPS_INDEX", JSON.stringify(list));
        localStorage.setItem("ITIM_BACKUP_" + filename, jsonStr);
        var settings = (currentData && currentData.settings) || {};
        pruneOldBackups(storagePath, settings);
        return { success: true, filename: filename, path: filename };
      } catch (e) {
        return { success: false, error: e.message };
      }
    }

    try {
      var fso = new ActiveXObject("Scripting.FileSystemObject");
      var backupDir = getBackupDir(storagePath);
      FsoStorage.ensureDirectoryExists(backupDir);

      var destPath = fso.BuildPath(backupDir, filename);
      var ok = FsoStorage.writeUtf8(destPath, jsonStr);

      if (ok) {
        var settings = (currentData && currentData.settings) || {};
        pruneOldBackups(storagePath, settings);
        return { success: true, filename: filename, path: destPath };
      } else {
        return { success: false, error: "Failed to write backup file." };
      }
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  function restoreBackup(storagePath, backupFileName) {
    var content = null;
    if (!FsoStorage.isHta) {
      content = localStorage.getItem("ITIM_BACKUP_" + backupFileName);
    } else {
      try {
        var fso = new ActiveXObject("Scripting.FileSystemObject");
        var backupDir = getBackupDir(storagePath);
        var fullPath = fso.BuildPath(backupDir, backupFileName);
        content = FsoStorage.readUtf8(fullPath);
      } catch (e) {
        return { success: false, error: e.message };
      }
    }

    if (!content) return { success: false, error: "Backup file could not be read." };

    try {
      var parsed = JSON.parse(content);
      FsoStorage.saveDb(storagePath, parsed);
      return { success: true, data: parsed };
    } catch (err) {
      return { success: false, error: "Corrupted backup JSON: " + err.message };
    }
  }

  function startAutoBackup(getStoragePathFn, getDataFn, onBackupSuccessFn) {
    stopAutoBackup();
    var curData = getDataFn ? getDataFn() : null;
    var settings = (curData && curData.settings) || {};
    var timesPerDay = settings.backupsPerDay || ITIM_CONFIG.DEFAULT_BACKUPS_PER_DAY || 4;
    var intervalMinutes = Math.max(1, Math.round((24 * 60) / timesPerDay));

    timerId = setInterval(function () {
      var storagePath = getStoragePathFn();
      var data = getDataFn();
      if (!data) return;

      var res = createBackup(storagePath, data);
      if (res.success && typeof onBackupSuccessFn === "function") {
        onBackupSuccessFn(res);
      }
    }, intervalMinutes * 60 * 1000);
  }

  function stopAutoBackup() {
    if (timerId) {
      clearInterval(timerId);
      timerId = null;
    }
  }

  return {
    listBackups: listBackups,
    createBackup: createBackup,
    restoreBackup: restoreBackup,
    pruneOldBackups: pruneOldBackups,
    startAutoBackup: startAutoBackup,
    stopAutoBackup: stopAutoBackup
  };
})();
