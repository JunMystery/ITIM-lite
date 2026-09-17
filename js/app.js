/* ==========================================================================
   ITIM-lite - Application Bootstrap, State & Lifecycle
   ========================================================================== */

var BulkActions = {
  toggleAll: function (view, chk) {
    if (view === "catalog" && typeof UI_Catalog !== "undefined" && UI_Catalog.toggleAll) {
      UI_Catalog.toggleAll(chk);
    } else if (typeof UI_Assets !== "undefined" && UI_Assets.toggleSelectAll) {
      UI_Assets.toggleSelectAll(chk);
    }
  }
};

var AppState = {
  db: null,

  getStoragePath: function () {
    if (AppState.db && AppState.db.settings && AppState.db.settings.storagePath) {
      return AppState.db.settings.storagePath;
    }
    return ITIM_CONFIG.DEFAULT_STORAGE_PATH;
  },

  save: function () {
    var path = AppState.getStoragePath();
    var ok = FsoStorage.saveDb(path, AppState.db);
    if (!ok) {
      Notifications.show("Warning: Failed to save changes to storage path.", "error");
    }
    return ok;
  },

  load: function () {
    var storedPath = ITIM_CONFIG.DEFAULT_STORAGE_PATH;
    try {
      var cached = localStorage.getItem("ITIM_LAST_STORAGE_PATH");
      if (cached) storedPath = cached;
    } catch (e) {}

    AppState.db = FsoStorage.loadDb(storedPath);
    if (!AppState.db.settings) {
      AppState.db.settings = JSON.parse(JSON.stringify(ITIM_CONFIG.DEFAULT_SEED_DATA.settings));
    }
    if (!AppState.db.purchaseOrders) {
      AppState.db.purchaseOrders = JSON.parse(JSON.stringify(ITIM_CONFIG.DEFAULT_SEED_DATA.purchaseOrders || []));
    }
    AppState.updateStorageIndicator();
  },

  updateStorageIndicator: function () {
    var pill = document.getElementById("storage-status-pill");
    var dot = document.getElementById("storage-status-dot");
    var label = document.getElementById("storage-status-label");
    if (!pill || !dot) return;

    var path = AppState.getStoragePath();
    var isSmb = /^\\[\\]/.test(path) || (!/^[a-zA-Z]:\\/.test(path) && path.indexOf(":") === -1 && path.indexOf("\\\\") !== -1);
    var statusText = "";

    if (FsoStorage.isHta) {
      if (isSmb) {
        dot.className = "status-dot connected-smb";
        statusText = (typeof I18N !== "undefined") ? I18N.t("storage_connected_smb") : "SMB Storage Connected";
      } else {
        dot.className = "status-dot connected-local";
        statusText = (typeof I18N !== "undefined") ? I18N.t("storage_connected_local") : "Local Storage Connected";
      }
    } else {
      dot.className = "status-dot connected-local";
      statusText = "Browser Mode (LocalStorage)";
    }
    if (label) label.innerText = statusText;
    pill.title = statusText + " | " + FsoStorage.resolvePath(path);
  }
};

function initApp() {
  // Resize and center HTA window if running in mshta.exe
  try {
    if (window.resizeTo && window.screen) {
      var width = 1260;
      var height = 800;
      var left = Math.max(0, (window.screen.availWidth - width) / 2);
      var top = Math.max(0, (window.screen.availHeight - height) / 2);
      window.resizeTo(width, height);
      window.moveTo(left, top);
    }
  } catch (e) {}

  // Render application layout skeleton
  if (typeof UI_Layout !== "undefined") {
    UI_Layout.render();
  }

  // Initialize notifications container
  Notifications.init();

  // Load database
  AppState.load();

  // Initialize Multilingual i18n
  if (typeof I18N !== "undefined") {
    I18N.init();
  }

  // Initialize UI components
  NavController.init();
  UI_Assets.init();

  // Start auto backup scheduler
  BackupEngine.startAutoBackup(
    AppState.getStoragePath,
    function () { return AppState.db; },
    function (res) {
      Notifications.show("Auto-backup snapshot saved: " + res.filename, "info");
    }
  );

  // Global backdrop click & Escape key modal dismissal
  function closeActiveModals(target) {
    if (target && target.id) {
      if (target.id === "asset-modal" && typeof UI_AssetModal !== "undefined") UI_AssetModal.close();
      else if (target.id === "checkout-modal" && typeof UI_Assignments !== "undefined") UI_Assignments.closeCheckoutModal();
      else if (target.id === "checkin-modal" && typeof UI_Assignments !== "undefined") UI_Assignments.closeCheckinModal();
      else if (target.id === "consumable-modal" && typeof UI_Consumables !== "undefined") UI_Consumables.closeModal();
      else if (target.id === "transaction-detail-modal" && typeof UI_Detail !== "undefined") UI_Detail.close();
      else if (target.id === "transaction-modal" && typeof UI_History !== "undefined") UI_History.closeModal();
      else if (target.id === "license-modal" && typeof UI_Licenses !== "undefined") UI_Licenses.closeModal();
    }
    if (typeof UI_Inbound !== "undefined") UI_Inbound.closeModal();
    var openModals = document.querySelectorAll ? document.querySelectorAll(".modal-backdrop.open") : [];
    for (var i = 0; i < openModals.length; i++) openModals[i].className = "modal-backdrop";
  }

  var handleBackdropClick = function (e) {
    e = e || window.event;
    var target = e.target || e.srcElement;
    if (target && target.className && typeof target.className === "string" && target.className.indexOf("modal-backdrop") !== -1) {
      if (typeof target.classList !== "undefined" ? target.classList.contains("modal-backdrop") : /(?:^|\s)modal-backdrop(?:\s|$)/.test(target.className)) {
        closeActiveModals(target);
      }
    }
  };

  if (document.addEventListener) {
    document.addEventListener("click", handleBackdropClick, false);
  } else if (document.attachEvent) {
    document.attachEvent("onclick", handleBackdropClick);
  }

  // Global Keyboard Shortcuts
  document.onkeydown = function (e) {
    e = e || window.event;
    if (e.keyCode === 27) {
      closeActiveModals();
      return;
    }
    if (e.ctrlKey || e.metaKey) {
      var key = String.fromCharCode(e.keyCode).toLowerCase();
      if (key === "s") {
        if (e.preventDefault) e.preventDefault();
        AppState.save();
        Notifications.show("Database saved manually.", "success");
        return false;
      } else if (key === "n") {
        if (e.preventDefault) e.preventDefault();
        if (typeof UI_Inbound !== "undefined") {
          UI_Inbound.openCreateModal();
        }
        return false;
      } else if (key === "b") {
        if (e.preventDefault) e.preventDefault();
        UI_Settings.createManualBackup();
        return false;
      } else if (key === "f") {
        var searchInput = document.getElementById("asset-search-input");
        if (searchInput) {
          if (e.preventDefault) e.preventDefault();
          NavController.switchView("assets");
          searchInput.focus();
          return false;
        }
      }
    }
  };

  // Initial view render
  NavController.switchView("dashboard");
}

function toggleTheme() {
  var body = document.body;
  var isDark;
  if (body.classList) {
    isDark = body.classList.toggle("theme-dark");
  } else {
    isDark = body.className.indexOf("theme-dark") === -1;
    if (isDark) {
      body.className += " theme-dark";
    } else {
      body.className = body.className.replace(/\btheme-dark\b/g, "").trim();
    }
  }
  try {
    localStorage.setItem("ITIM_THEME", isDark ? "dark" : "light");
  } catch (e) {}
}

// Check saved theme
try {
  if (localStorage.getItem("ITIM_THEME") === "dark") {
    if (document.body.classList) {
      document.body.classList.add("theme-dark");
    } else {
      document.body.className += " theme-dark";
    }
  }
} catch (e) {}

window.onload = initApp;
