/* ==========================================================================
   ITIM-lite - Navigation Controller & View Routing
   ========================================================================== */

var NavController = (function () {
  var activeView = "dashboard";

  function switchView(viewName, tabName) {
    if (viewName === "licenses") {
      switchView("assets", "licenses");
      return;
    }
    if (viewName === "consumables") {
      switchView("assets", "consumables");
      return;
    }
    if (viewName === "inventory") {
      switchView("assets", tabName);
      return;
    }

    activeView = viewName;

    // Update sidebar nav items
    var navItems = document.querySelectorAll(".nav-item");
    for (var i = 0; i < navItems.length; i++) {
      var item = navItems[i];
      if (item.getAttribute("data-view") === viewName || (viewName === "assets" && item.getAttribute("data-view") === "inventory")) {
        item.className = "nav-item active";
      } else {
        item.className = "nav-item";
      }
    }

    // Update view containers
    var views = document.querySelectorAll(".view-container");
    for (var j = 0; j < views.length; j++) {
      var v = views[j];
      if (v.id === "view-" + viewName) {
        v.className = "view-container active";
      } else {
        v.className = "view-container";
      }
    }

    // Trigger view-specific renderers
    if (viewName === "dashboard" && typeof UI_Dashboard !== "undefined") {
      UI_Dashboard.render();
    } else if (viewName === "assets" && typeof UI_Assets !== "undefined") {
      if (tabName && typeof UI_Assets.switchTab === "function") {
        UI_Assets.switchTab(tabName);
      } else {
        UI_Assets.render();
      }
    } else if (viewName === "inbound" && typeof UI_Inbound !== "undefined") {
      UI_Inbound.render();
    } else if (viewName === "assignments") {
      switchView("history");
      return;
    } else if (viewName === "history" && typeof UI_History !== "undefined") {
      UI_History.render();
    } else if (viewName === "audit" && typeof UI_Audit !== "undefined") {
      UI_Audit.render();
    } else if (viewName === "catalog" && typeof UI_Catalog !== "undefined") {
      UI_Catalog.render();
    } else if (viewName === "settings" && typeof UI_Settings !== "undefined") {
      UI_Settings.render();
    }

    updateBadges();
  }

  function updateBadges() {
    var assetCountEl = document.getElementById("nav-badge-assets");
    if (assetCountEl) {
      var astCount = (typeof InventoryService !== "undefined") ? InventoryService.getAll().length : 0;
      var licCount = (typeof LicensesService !== "undefined") ? LicensesService.getAll().length : 0;
      var conCount = (typeof ConsumablesService !== "undefined") ? ConsumablesService.getAll().length : 0;
      assetCountEl.innerText = (astCount + licCount + conCount);
    }

    var inbCountEl = document.getElementById("nav-badge-inbound");
    if (inbCountEl && typeof POService !== "undefined") {
      var poList = POService.getAll();
      var pending = 0;
      for (var p = 0; p < poList.length; p++) {
        if (poList[p].status === "pending" || poList[p].status === "partial") pending++;
      }
      inbCountEl.innerText = pending;
      inbCountEl.style.color = pending > 0 ? "#d13438" : "";
    }

    var txnBadge = document.getElementById("nav-badge-history");
    if (txnBadge && typeof TransactionsService !== "undefined") {
      txnBadge.innerText = TransactionsService.getAll().length;
    }

    var licCountEl = document.getElementById("nav-badge-licenses");
    if (licCountEl && typeof LicensesService !== "undefined") {
      licCountEl.innerText = LicensesService.getAll().length;
    }

    var conCountEl = document.getElementById("nav-badge-consumables");
    if (conCountEl && typeof ConsumablesService !== "undefined") {
      var low = ConsumablesService.getLowStockItems().length;
      conCountEl.innerText = low > 0 ? ("!" + low) : ConsumablesService.getAll().length;
      conCountEl.style.color = low > 0 ? "#d13438" : "";
    }

    var catBadge = document.getElementById("nav-badge-catalog");
    if (catBadge && typeof CatalogService !== "undefined") {
      catBadge.innerText = CatalogService.getAll().length;
    }
  }

  function init() {
    var navItems = document.querySelectorAll(".nav-item");
    for (var i = 0; i < navItems.length; i++) {
      (function (el) {
        el.onclick = function (e) {
          if (e && e.preventDefault) e.preventDefault();
          var targetView = el.getAttribute("data-view");
          if (targetView) switchView(targetView);
        };
      })(navItems[i]);
    }
  }

  return {
    init: init,
    switchView: switchView,
    updateBadges: updateBadges,
    getActiveView: function () { return activeView; }
  };
})();
