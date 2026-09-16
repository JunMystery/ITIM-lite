/* ==========================================================================
   ITIM-lite - Unified Table Actions Menu & Context Menu Controller
   ========================================================================== */

var UI_ActionsMenu = (function () {
  var menuEl = null;

  function ensureMenu() {
    if (menuEl && menuEl.parentNode) return menuEl;
    menuEl = document.getElementById("app-actions-menu");
    if (!menuEl) {
      menuEl = document.createElement("div");
      menuEl.id = "app-actions-menu";
      menuEl.className = "actions-dropdown";
      document.body.appendChild(menuEl);
    }
    return menuEl;
  }

  function hide() {
    if (menuEl) menuEl.style.display = "none";
  }

  function getActions(type, id) {
    var items = [];
    if (type === "asset") {
      var a = (typeof InventoryService !== "undefined") ? InventoryService.getById(id) : null;
      items.push({ label: "View Details / Edit", icon: "✏️", run: function () { if (typeof UI_AssetModal !== "undefined") UI_AssetModal.open(id); } });
      items.push({ label: (a && a.status === "inuse" ? "Return to Stock" : "Assign to Staff"), icon: "🔄", run: function () { if (typeof UI_Assignments !== "undefined") UI_Assignments.openForAsset(id); } });
      items.push({ label: "Print Asset Tag", icon: "🏷️", run: function () { if (typeof UI_AssetModal !== "undefined") UI_AssetModal.printLabel(id); } });
      items.push({ label: "Delete Asset", icon: "🗑️", danger: true, run: function () { if (typeof UI_Assets !== "undefined") UI_Assets.deleteAsset(id); } });
    } else if (type === "license") {
      items.push({ label: "Edit License", icon: "✏️", run: function () { if (typeof UI_Licenses !== "undefined") UI_Licenses.openModal(id); } });
      items.push({ label: "Delete License", icon: "🗑️", danger: true, run: function () { if (typeof UI_Licenses !== "undefined") UI_Licenses.deleteLicense(id); } });
    } else if (type === "consumable") {
      items.push({ label: "Increase (+1)", icon: "➕", run: function () { if (typeof UI_Consumables !== "undefined") UI_Consumables.adjust(id, 1); } });
      items.push({ label: "Decrease (-1)", icon: "➖", run: function () { if (typeof UI_Consumables !== "undefined") UI_Consumables.adjust(id, -1); } });
      items.push({ label: "Edit Item", icon: "✏️", run: function () { if (typeof UI_Consumables !== "undefined") UI_Consumables.openModal(id); } });
      items.push({ label: "Delete Item", icon: "🗑️", danger: true, run: function () { if (typeof UI_Consumables !== "undefined") UI_Consumables.deleteItem(id); } });
    } else if (type === "assignment") {
      var asg = (typeof AssignmentsService !== "undefined") ? AssignmentsService.getById(id) : null;
      if (asg && asg.status === "active") {
        items.push({ label: "Return Equipment", icon: "📥", run: function () { if (typeof UI_Assignments !== "undefined") UI_Assignments.openCheckinModal(id); } });
      }
      items.push({ label: "Print Receipt", icon: "🖨️", run: function () { if (typeof UI_Assignments !== "undefined") UI_Assignments.printHandover(id); } });
    } else if (type === "history") {
      items.push({ label: "View Details", icon: "📄", run: function () { if (typeof UI_History !== "undefined") UI_History.openDetail(id); } });
      items.push({ label: "Print Receipt", icon: "🖨️", run: function () { if (typeof TransactionsService !== "undefined") TransactionsService.printTransactionReceipt(id); } });
    } else if (type === "inbound") {
      var po = (typeof POService !== "undefined") ? POService.getById(id) : null;
      if (po && po.status !== "received" && po.status !== "cancelled") {
        items.push({ label: "Receive Inbound", icon: "📥", run: function () { if (typeof UI_Inbound !== "undefined") UI_Inbound.openReceiveModal(id); } });
      }
      items.push({ label: "View Details", icon: "📄", run: function () { if (typeof UI_Inbound !== "undefined") UI_Inbound.openDetailModal(id); } });
    } else if (type === "catalog") {
      items.push({ label: "Edit Catalog Item", icon: "✏️", run: function () { if (typeof UI_Catalog !== "undefined") UI_Catalog.openModal(id); } });
      items.push({ label: "Delete Item", icon: "🗑️", danger: true, run: function () { if (typeof UI_Catalog !== "undefined") UI_Catalog.deleteItem(id); } });
    }
    return items;
  }

  function show(e, type, id) {
    if (e) {
      if (e.preventDefault) e.preventDefault();
      if (e.stopPropagation) e.stopPropagation();
    }
    var menu = ensureMenu();
    var actions = getActions(type, id);
    if (!actions.length) return;

    var html = [];
    for (var i = 0; i < actions.length; i++) {
      var act = actions[i];
      html.push('<button type="button" class="actions-dropdown-item' + (act.danger ? ' danger' : '') + '" data-idx="' + i + '">' +
        '<span style="font-size:13px;">' + act.icon + '</span><span>' + act.label + '</span></button>');
    }
    menu.innerHTML = html.join("");

    var btns = menu.querySelectorAll(".actions-dropdown-item");
    for (var j = 0; j < btns.length; j++) {
      (function (idx) {
        btns[idx].onclick = function (ev) {
          if (ev && ev.stopPropagation) ev.stopPropagation();
          hide();
          actions[idx].run();
        };
      })(j);
    }

    menu.style.display = "block";
    menu.style.visibility = "hidden";
    var menuWidth = menu.offsetWidth || 160;
    var menuHeight = menu.offsetHeight || 120;
    var winW = window.innerWidth || document.documentElement.clientWidth || 1024;
    var winH = window.innerHeight || document.documentElement.clientHeight || 768;

    var x = 0, y = 0;
    if (e && e.type === "contextmenu") {
      x = e.clientX || 0;
      y = e.clientY || 0;
    } else if (e) {
      var btn = e.currentTarget || e.target;
      var rect = btn.getBoundingClientRect();
      x = rect.right - menuWidth;
      y = rect.bottom + 4;
    }
    if (x + menuWidth > winW - 10) x = winW - menuWidth - 10;
    if (x < 10) x = 10;
    if (y + menuHeight > winH - 10) y = winH - menuHeight - 10;
    if (y < 10) y = 10;

    menu.style.left = x + "px";
    menu.style.top = y + "px";
    menu.style.visibility = "visible";
  }

  function onRowClick(e, type, id) {
    if (!e) return;
    var target = e.target || e.srcElement;
    while (target && target !== e.currentTarget) {
      var tag = (target.tagName || "").toUpperCase();
      if (tag === "BUTTON" || tag === "INPUT" || tag === "A" || tag === "SELECT" || (target.className && target.className.indexOf("action-menu-trigger") !== -1)) {
        return;
      }
      target = target.parentNode;
    }

    if (type === "asset" && typeof UI_AssetModal !== "undefined") UI_AssetModal.open(id);
    else if (type === "license" && typeof UI_Licenses !== "undefined") UI_Licenses.openModal(id);
    else if (type === "consumable" && typeof UI_Consumables !== "undefined") UI_Consumables.openModal(id);
    else if (type === "assignment" && typeof UI_Assignments !== "undefined") UI_Assignments.printHandover(id);
    else if (type === "history" && typeof UI_History !== "undefined") UI_History.openDetail(id);
    else if (type === "inbound" && typeof UI_Inbound !== "undefined") UI_Inbound.openDetailModal(id);
    else if (type === "catalog" && typeof UI_Catalog !== "undefined") UI_Catalog.openModal(id);
  }

  // Auto-bind document click to close menu
  if (typeof document !== "undefined") {
    var closeMenu = function (e) {
      e = e || window.event;
      var t = e.target || e.srcElement;
      if (menuEl && menuEl.style.display !== "none" && t && !menuEl.contains(t)) {
        hide();
      }
    };
    if (document.addEventListener) document.addEventListener("click", closeMenu, false);
    else if (document.attachEvent) document.attachEvent("onclick", closeMenu);
  }

  return {
    show: show,
    hide: hide,
    onRowClick: onRowClick,
    getActions: getActions
  };
})();
