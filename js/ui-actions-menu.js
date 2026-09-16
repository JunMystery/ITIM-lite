/* ==========================================================================
   ITIM-lite - Unified Table Actions Menu & Context Menu Controller
   ========================================================================== */

var UI_ActionsMenu = (function () {
  var menuEl = null;

  var ICONS = {
    edit: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
    transfer: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>',
    tag: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>',
    del: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>',
    plus: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
    minus: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/></svg>',
    inbound: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 11 12 14 15 11"/><line x1="12" y1="2" x2="12" y2="14"/><path d="M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-6"/></svg>',
    print: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>',
    doc: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>'
  };

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
      items.push({ label: "View Details / Edit", icon: ICONS.edit, run: function () { if (typeof UI_AssetModal !== "undefined") UI_AssetModal.open(id); } });
      items.push({ label: (a && a.status === "inuse" ? "Return to Stock" : "Assign to Staff"), icon: ICONS.transfer, run: function () { if (typeof UI_History !== "undefined") UI_History.openForAsset(id); } });
      items.push({ label: "Print Asset Tag", icon: ICONS.tag, run: function () { if (typeof UI_AssetModal !== "undefined") UI_AssetModal.printLabel(id); } });
      items.push({ label: "Delete Asset", icon: ICONS.del, danger: true, run: function () { if (typeof UI_Assets !== "undefined") UI_Assets.deleteAsset(id); } });
    } else if (type === "license") {
      items.push({ label: "Edit License", icon: ICONS.edit, run: function () { if (typeof UI_Licenses !== "undefined") UI_Licenses.openModal(id); } });
      items.push({ label: "Delete License", icon: ICONS.del, danger: true, run: function () { if (typeof UI_Licenses !== "undefined") UI_Licenses.deleteLicense(id); } });
    } else if (type === "consumable") {
      items.push({ label: "Increase (+1)", icon: ICONS.plus, run: function () { if (typeof UI_Consumables !== "undefined") UI_Consumables.adjust(id, 1); } });
      items.push({ label: "Decrease (-1)", icon: ICONS.minus, run: function () { if (typeof UI_Consumables !== "undefined") UI_Consumables.adjust(id, -1); } });
      items.push({ label: "Edit Item", icon: ICONS.edit, run: function () { if (typeof UI_Consumables !== "undefined") UI_Consumables.openModal(id); } });
      items.push({ label: "Delete Item", icon: ICONS.del, danger: true, run: function () { if (typeof UI_Consumables !== "undefined") UI_Consumables.deleteItem(id); } });
    } else if (type === "assignment") {
      var asg = (typeof AssignmentsService !== "undefined") ? AssignmentsService.getById(id) : null;
      if (asg && asg.status === "active") {
        items.push({ label: "Return Equipment", icon: ICONS.inbound, run: function () { if (typeof UI_Assignments !== "undefined") UI_Assignments.openCheckinModal(id); } });
      }
      items.push({ label: "Print Receipt", icon: ICONS.print, run: function () { if (typeof UI_Assignments !== "undefined") UI_Assignments.printHandover(id); } });
    } else if (type === "history") {
      var txn = (typeof TransactionsService !== "undefined") ? TransactionsService.getById(id) : null;
      if (txn && txn.type === "CHECKOUT" && txn.status === "active") {
        items.push({ label: "Check-in / Return", icon: ICONS.inbound, run: function () { if (typeof UI_History !== "undefined") UI_History.openCheckinForTxn(id); } });
      }
      items.push({ label: "View Details", icon: ICONS.doc, run: function () { if (typeof UI_History !== "undefined") UI_History.openDetail(id); } });
      items.push({ label: "Print Receipt", icon: ICONS.print, run: function () { if (typeof TransactionsService !== "undefined") TransactionsService.printTransactionReceipt(id); } });
    } else if (type === "inbound") {
      var po = (typeof POService !== "undefined") ? POService.getById(id) : null;
      if (po && po.status !== "received" && po.status !== "cancelled") {
        items.push({ label: "Receive Inbound", icon: ICONS.inbound, run: function () { if (typeof UI_Inbound !== "undefined") UI_Inbound.openReceiveModal(id); } });
      }
      items.push({ label: "View Details", icon: ICONS.doc, run: function () { if (typeof UI_Inbound !== "undefined") UI_Inbound.openDetailModal(id); } });
    } else if (type === "catalog") {
      items.push({ label: "Edit Catalog Item", icon: ICONS.edit, run: function () { if (typeof UI_Catalog !== "undefined") UI_Catalog.openModal(id); } });
      items.push({ label: "Delete Item", icon: ICONS.del, danger: true, run: function () { if (typeof UI_Catalog !== "undefined") UI_Catalog.deleteItem(id); } });
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
        '<span style="display:inline-flex; align-items:center; justify-content:center; width:16px; margin-right:8px;">' + act.icon + '</span><span>' + act.label + '</span></button>');
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
    if (e) {
      var target = e.target || e.srcElement;
      while (target && target !== e.currentTarget) {
        var tag = (target.tagName || "").toUpperCase();
        if (tag === "BUTTON" || tag === "INPUT" || tag === "A" || tag === "SELECT" || (target.className && target.className.indexOf("action-menu-trigger") !== -1)) {
          return;
        }
        target = target.parentNode;
      }
    }

    if (typeof UI_ItemDetail !== "undefined" && (type === "asset" || type === "license" || type === "consumable")) {
      UI_ItemDetail.open(type, id);
    } else if (type === "asset" && typeof UI_AssetModal !== "undefined") {
      UI_AssetModal.open(id);
    } else if (type === "license" && typeof UI_Licenses !== "undefined") {
      UI_Licenses.openModal(id);
    } else if (type === "consumable" && typeof UI_Consumables !== "undefined") {
      UI_Consumables.openModal(id);
    } else if (type === "assignment" && typeof UI_Assignments !== "undefined") {
      UI_Assignments.printHandover(id);
    } else if (type === "history" && typeof UI_History !== "undefined") {
      UI_History.openDetail(id);
    } else if (type === "inbound" && typeof UI_Inbound !== "undefined") {
      UI_Inbound.openDetailModal(id);
    } else if (type === "catalog" && typeof UI_Catalog !== "undefined") {
      UI_Catalog.openModal(id);
    }
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
