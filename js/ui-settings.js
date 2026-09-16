/* ==========================================================================
   ITIM-lite - Settings, Storage & Backup Manager Controller
   ========================================================================== */

var UI_Settings = (function () {
  function render() {
    var settings = (AppState.db && AppState.db.settings) ? AppState.db.settings : ITIM_CONFIG.DEFAULT_SEED_DATA.settings;

    var pathInput = document.getElementById("setting-storage-path");
    if (pathInput) pathInput.value = settings.storagePath || ITIM_CONFIG.DEFAULT_STORAGE_PATH;

    var orgInput = document.getElementById("setting-org-name");
    if (orgInput) orgInput.value = settings.orgName || "Corporate IT Services";

    var timesInput = document.getElementById("setting-backup-times-day");
    if (timesInput) timesInput.value = settings.backupsPerDay || ITIM_CONFIG.DEFAULT_BACKUPS_PER_DAY || 4;

    var maxCountInput = document.getElementById("setting-backup-max-count");
    if (maxCountInput) maxCountInput.value = settings.maxBackupCount || settings.backupRetentionCount || 20;

    if (typeof UI_ComboBox !== "undefined") {
      UI_ComboBox.setValue("setting-backup-clean-mode", settings.autoCleanMode || "both");
    } else {
      var cleanModeSelect = document.getElementById("setting-backup-clean-mode");
      if (cleanModeSelect) cleanModeSelect.value = settings.autoCleanMode || "both";
    }

    var cleanDaysInput = document.getElementById("setting-backup-clean-days");
    if (cleanDaysInput) cleanDaysInput.value = settings.autoCleanDays || 7;

    renderBackupsList();
  }

  function renderBackupsList() {
    var tbody = document.getElementById("backups-table-tbody");
    if (!tbody) return;

    var storagePath = AppState.getStoragePath();
    var list = BackupEngine.listBackups(storagePath);

    if (list.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:var(--text-tertiary); padding:20px;">No backup snapshots found in storage directory.</td></tr>';
      return;
    }

    var html = [];
    for (var i = 0; i < list.length; i++) {
      var b = list[i];
      var sizeKb = (b.size / 1024).toFixed(1) + " KB";

      html.push("<tr>" +
        '<td style="font-family:var(--font-mono); font-size:12px; font-weight:600;">' + b.name + '</td>' +
        '<td style="font-size:11px; color:var(--text-secondary);">' + b.dateCreated + '</td>' +
        '<td style="font-size:11px;">' + sizeKb + '</td>' +
        '<td style="text-align:right;">' +
          '<button class="btn btn-sm btn-primary" onclick="UI_Settings.restoreBackupFile(\'' + b.name + '\')">Restore Snapshot</button>' +
        '</td>' +
      "</tr>");
    }
    tbody.innerHTML = html.join("");
  }

  function testPath() {
    var pathStr = document.getElementById("setting-storage-path").value.trim();
    var statusEl = document.getElementById("storage-test-result");
    statusEl.innerHTML = '<span style="color:var(--text-tertiary);">Testing storage path...</span>';

    setTimeout(function () {
      var res = FsoStorage.testStoragePath(pathStr);
      if (res.success) {
        statusEl.innerHTML = '<span style="color:#107c41; font-weight:600;">✓ ' + res.message + '<br><small style="color:var(--text-secondary); font-family:var(--font-mono);">' + res.resolvedPath + '</small></span>';
      } else {
        statusEl.innerHTML = '<span style="color:#d13438; font-weight:600;">✕ ' + res.message + '</span>';
      }
    }, 150);
  }

  function saveSettings() {
    var pathStr = document.getElementById("setting-storage-path").value.trim();
    var orgStr = document.getElementById("setting-org-name").value.trim();
    var timesDay = parseInt(document.getElementById("setting-backup-times-day").value, 10) || 4;
    var maxCount = parseInt(document.getElementById("setting-backup-max-count").value, 10) || 20;
    var cleanMode = document.getElementById("setting-backup-clean-mode").value || "both";
    var cleanDays = parseInt(document.getElementById("setting-backup-clean-days").value, 10) || 7;
    var intervalMin = Math.max(1, Math.round((24 * 60) / timesDay));

    if (!pathStr) pathStr = ITIM_CONFIG.DEFAULT_STORAGE_PATH;

    AppState.db.settings.storagePath = pathStr;
    AppState.db.settings.orgName = orgStr;
    AppState.db.settings.backupsPerDay = timesDay;
    AppState.db.settings.autoBackupIntervalMin = intervalMin;
    AppState.db.settings.maxBackupCount = maxCount;
    AppState.db.settings.backupRetentionCount = maxCount;
    AppState.db.settings.autoCleanMode = cleanMode;
    AppState.db.settings.autoCleanDays = cleanDays;

    var ok = AppState.save();
    if (ok) {
      Notifications.show("Configuration saved successfully.", "success");
      AppState.updateStorageIndicator();
      BackupEngine.startAutoBackup(AppState.getStoragePath, function () { return AppState.db; }, function (res) {
        Notifications.show("Auto-backup snapshot saved: " + res.filename, "info");
      });
      renderBackupsList();
    } else {
      Notifications.show("Failed to write settings to storage path.", "error");
    }
  }

  function createManualBackup() {
    var storagePath = AppState.getStoragePath();
    var res = BackupEngine.createBackup(storagePath, AppState.db);
    if (res.success) {
      Notifications.show("Snapshot created: " + res.filename, "success");
      renderBackupsList();
    } else {
      Notifications.show("Backup failed: " + res.error, "error");
    }
  }

  function restoreBackupFile(filename) {
    Notifications.confirm("RESTORE BACKUP WARNING:\n\nRestoring '" + filename + "' will overwrite your current inventory database.\n\nDo you want to proceed?", function () {
      var storagePath = AppState.getStoragePath();
      var res = BackupEngine.restoreBackup(storagePath, filename);
      if (res.success) {
        AppState.db = res.data;
        Notifications.show("Database successfully restored from " + filename, "success");
        NavController.switchView(NavController.getActiveView());
        NavController.updateBadges();
        renderBackupsList();
      } else {
        Notifications.show("Restore failed: " + res.error, "error");
      }
    });
  }

  return {
    render: render,
    renderBackupsList: renderBackupsList,
    testPath: testPath,
    saveSettings: saveSettings,
    createManualBackup: createManualBackup,
    restoreBackupFile: restoreBackupFile
  };
})();
