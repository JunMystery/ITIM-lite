/* ==========================================================================
   ITIM-lite - Unified Inventory View Controller (Hardware, Software & Stock)
   ========================================================================== */

var UI_Assets = (function () {
  var currentTypeFilter = "all";
  var currentCategory = "all";
  var currentStatus = "all";
  var currentSearch = "";
  var selectedMap = {};
  var currentPage = 1;
  var currentPageSize = 10;

  function getStatusBadge(it) {
    if (it.itemType === "asset") {
      var s = it.raw.status, lbl = typeof I18N !== "undefined" ? I18N.t("status_" + s) : s;
      return '<span class="badge badge-' + s + '">' + lbl + '</span>';
    }
    if (it.itemType === "license") {
      var exp = it.raw.expiryDate ? new Date(it.raw.expiryDate) : null;
      var isExp = exp && !isNaN(exp.getTime()) && exp < new Date();
      return isExp ? '<span class="badge badge-retired" style="background:#d13438;color:#fff;">Expired</span>' : '<span class="badge badge-available">Active</span>';
    }
    if (it.itemType === "consumable") {
      var q = parseInt(it.raw.quantity || 0, 10), m = parseInt(it.raw.minQuantity || 0, 10);
      if (q <= 0) return '<span class="badge badge-retired" style="background:#d13438;color:#fff;">Out of Stock</span>';
      return (q <= m) ? '<span class="badge badge-warning">Low Stock</span>' : '<span class="badge badge-available">In Stock</span>';
    }
    return '<span class="badge">-</span>';
  }

  function getStockSeats(it) {
    if (it.itemType === "asset") {
      var st = it.raw.status;
      return '<span style="font-weight:600;">1 unit</span> <span style="font-size:10px;color:var(--text-secondary);">(' + (st === "inuse" ? "In-Use" : (st === "available" ? "Ready" : st)) + ')</span>';
    }
    if (it.itemType === "license") {
      var tot = parseInt(it.raw.totalSeats || 0, 10), asg = parseInt(it.raw.assignedSeats || 0, 10);
      var pct = tot > 0 ? Math.min(100, Math.round((asg / tot) * 100)) : 100;
      var clr = (tot <= 0 || (tot - asg <= 0)) ? "#d13438" : (pct >= 85 ? "#ffaa00" : "#0078d4");
      return '<div style="min-width:100px;"><div style="display:flex;justify-content:space-between;font-size:11px;"><span>' + asg + ' / ' + tot + '</span><span>' + pct + '%</span></div>' +
        '<div style="background:var(--bg-surface-tertiary);border-radius:3px;height:4px;overflow:hidden;"><div style="background:' + clr + ';width:' + pct + '%;height:100%;"></div></div></div>';
    }
    if (it.itemType === "consumable") {
      var qty = parseInt(it.raw.quantity || 0, 10), min = parseInt(it.raw.minQuantity || 0, 10);
      return '<span style="font-weight:600;' + (qty <= 0 ? 'color:#d13438;' : '') + '">' + qty + ' in stock</span>' +
        (min > 0 ? ' <span style="font-size:10px;color:var(--text-tertiary);">(Min: ' + min + ')</span>' : '');
    }
    return "-";
  }

  function getTypeBadge(t) {
    if (t === "asset") return '<span class="badge" style="background:rgba(0,120,212,0.12);color:#0078d4;font-size:10px;margin-left:8px;vertical-align:middle;">Hardware</span>';
    if (t === "license") return '<span class="badge" style="background:rgba(16,124,65,0.12);color:#107c41;font-size:10px;margin-left:8px;vertical-align:middle;">Software</span>';
    return '<span class="badge" style="background:rgba(180,90,0,0.12);color:#b45a00;font-size:10px;margin-left:8px;vertical-align:middle;">Stock</span>';
  }

  function getSelectedIds() {
    var ids = [];
    for (var k in selectedMap) { if (selectedMap.hasOwnProperty(k) && selectedMap[k]) ids.push(k); }
    return ids;
  }

  function updateBulkBar() {
    var bar = document.getElementById("assets-bulk-bar"), lbl = document.getElementById("assets-selected-label"), cnt = getSelectedIds().length;
    if (!bar) return;
    bar.style.display = cnt > 0 ? "flex" : "none";
    if (lbl) lbl.innerText = cnt + " item" + (cnt > 1 ? "s" : "") + " selected";
    var allCb = document.getElementById("assets-select-all");
    if (allCb) {
      var rows = document.querySelectorAll(".asset-row-cb");
      allCb.checked = (rows.length > 0 && cnt === rows.length);
    }
  }

  function toggleItem(id, chk) { selectedMap[id] = chk; updateBulkBar(); }
  function toggleSelectAll(chk) {
    var cbs = document.querySelectorAll(".asset-row-cb");
    for (var i = 0; i < cbs.length; i++) { cbs[i].checked = chk; var id = cbs[i].getAttribute("data-id"); if (id) selectedMap[id] = chk; }
    updateBulkBar();
  }
  function clearSelection() {
    selectedMap = {};
    var cbs = document.querySelectorAll(".asset-row-cb");
    for (var i = 0; i < cbs.length; i++) cbs[i].checked = false;
    var all = document.getElementById("assets-select-all");
    if (all) all.checked = false;
    updateBulkBar();
  }

  function triggerBulkAction(act) {
    var ids = getSelectedIds();
    if (!ids.length) { Notifications.show("Please select at least one item.", "warning"); return; }
    if (act === "print") {
      for (var i = 0; i < ids.length; i++) { if (typeof UI_AssetModal !== "undefined") UI_AssetModal.printLabel(ids[i]); }
      return;
    }
    if (typeof UI_History !== "undefined") UI_History.openBulkModal(ids);
  }

  function initFilterBar() {
    if (typeof UI_FilterBar === "undefined") return;
    UI_FilterBar.init("assets", {
      title: "Inventory", placeholder: "Search items, serials, vendors, categories...",
      fields: [
        {
          id: "status", label: "Status", type: "select",
          options: [
            { value: "all", label: "All Statuses" }, { value: "available", label: "Available" },
            { value: "inuse", label: "In Use" }, { value: "in_stock", label: "In Stock" },
            { value: "low_stock", label: "Low Stock" }, { value: "repair", label: "In Repair" },
            { value: "retired", label: "Retired / Expired" }
          ]
        },
        { id: "category", label: "Category / Type", type: "text", placeholder: "e.g. Laptop, Subscription" }
      ],
      onFilter: function () { currentPage = 1; render(); }
    });
  }

  function setTypeFilter(t) {
    currentTypeFilter = t || "all";
    var btns = { all: "tab-btn-all", asset: "tab-btn-assets", license: "tab-btn-licenses", consumable: "tab-btn-consumables" };
    for (var k in btns) {
      var el = document.getElementById(btns[k]);
      if (el) el.className = (k === currentTypeFilter) ? "btn btn-sm btn-primary" : "btn btn-sm";
    }
    currentPage = 1;
    render();
  }

  function getAllItems() {
    var list = [];
    if (currentTypeFilter === "all" || currentTypeFilter === "asset") {
      var assets = (typeof InventoryService !== "undefined") ? InventoryService.getAll() : [];
      for (var a = 0; a < assets.length; a++) {
        var it = assets[a];
        list.push({ id: it.id, itemType: "asset", name: it.name, detail: (it.model || "") + (it.serial ? " • " + it.serial : ""), categoryOrType: it.category || "Hardware", locationOrAssigned: it.assignedTo ? (it.assignedTo + (it.department ? " (" + it.department + ")" : "")) : (it.location || "-"), raw: it });
      }
    }
    if (currentTypeFilter === "all" || currentTypeFilter === "license") {
      var licenses = (typeof LicensesService !== "undefined") ? LicensesService.getAll() : [];
      for (var l = 0; l < licenses.length; l++) {
        var lic = licenses[l];
        list.push({ id: lic.id, itemType: "license", name: lic.software, detail: lic.vendor || "", categoryOrType: lic.type || "License", locationOrAssigned: lic.expiryDate ? "Exp: " + lic.expiryDate : "Perpetual", raw: lic });
      }
    }
    if (currentTypeFilter === "all" || currentTypeFilter === "consumable") {
      var consumables = (typeof ConsumablesService !== "undefined") ? ConsumablesService.getAll() : [];
      for (var c = 0; c < consumables.length; c++) {
        var con = consumables[c];
        list.push({ id: con.id, itemType: "consumable", name: con.name, detail: "", categoryOrType: con.category || "Consumable", locationOrAssigned: con.location || "-", raw: con });
      }
    }
    return list;
  }

  function filterItems(items) {
    return items.filter(function (it) {
      if (currentSearch) {
        var hay = (it.id + " " + it.name + " " + it.detail + " " + it.categoryOrType + " " + it.locationOrAssigned).toLowerCase();
        if (hay.indexOf(currentSearch.toLowerCase()) === -1) return false;
      }
      if (currentCategory && currentCategory !== "all") {
        if (it.categoryOrType.toLowerCase().indexOf(currentCategory.toLowerCase()) === -1) return false;
      }
      if (currentStatus && currentStatus !== "all") {
        if (it.itemType === "asset" && it.raw.status !== currentStatus) return false;
        if (it.itemType === "consumable") {
          var q = parseInt(it.raw.quantity || 0, 10), m = parseInt(it.raw.minQuantity || 0, 10);
          if (currentStatus === "in_stock" && q <= 0) return false;
          if (currentStatus === "low_stock" && (q <= 0 || q > m)) return false;
          if (currentStatus === "retired" && q > 0) return false;
        }
        if (it.itemType === "license") {
          var exp = it.raw.expiryDate ? new Date(it.raw.expiryDate) : null;
          var isExp = exp && !isNaN(exp.getTime()) && exp < new Date();
          if (currentStatus === "retired" && !isExp) return false;
          if (currentStatus === "available" && isExp) return false;
        }
      }
      return true;
    });
  }

  function render() {
    initFilterBar();
    if (typeof UI_FilterBar !== "undefined") {
      UI_FilterBar.render("assets-filter-bar", "assets");
      var crit = UI_FilterBar.getCriteria("assets");
      currentSearch = crit.search || "";
      currentStatus = (crit.filters && crit.filters.status) ? crit.filters.status : "all";
      currentCategory = (crit.filters && crit.filters.category) ? crit.filters.category : "all";
    }
    var list = filterItems(getAllItems());
    var tbody = document.getElementById("assets-table-tbody");
    if (!tbody) return;

    var paged = (typeof UIPagination !== "undefined")
      ? UIPagination.paginate(list, currentPage, currentPageSize)
      : { pagedItems: list, totalItems: list.length, totalPages: 1, currentPage: 1, pageSize: list.length, startItem: (list.length ? 1 : 0), endItem: list.length };
    currentPage = paged.currentPage;

    if (list.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; color:var(--text-tertiary); padding:30px;">' + (typeof I18N !== "undefined" ? I18N.t("empty_assets") : "No inventory items match criteria.") + '</td></tr>';
      updateBulkBar();
      if (typeof UIPagination !== "undefined") UIPagination.renderBar("assets-pagination-container", paged, "UI_Assets.setPage", "UI_Assets.setPageSize");
      return;
    }

    var html = [];
    for (var i = 0; i < paged.pagedItems.length; i++) {
      var it = paged.pagedItems[i], isChecked = !!selectedMap[it.id];
      html.push('<tr class="clickable-row" onclick="UI_ActionsMenu.onRowClick(event, \'' + it.itemType + '\', \'' + it.id + '\')" oncontextmenu="UI_ActionsMenu.show(event, \'' + it.itemType + '\', \'' + it.id + '\')">' +
        '<td style="width:30px; text-align:center;"><input type="checkbox" class="asset-row-cb" data-id="' + it.id + '" ' + (isChecked ? 'checked' : '') + ' onchange="UI_Assets.toggleItem(\'' + it.id + '\', this.checked)" /></td>' +
        '<td style="font-family:var(--font-mono); font-weight:600; width:95px;">' + it.id + '</td>' +
        '<td><div style="display:flex; align-items:center; gap:6px;"><strong>' + it.name + '</strong>' + getTypeBadge(it.itemType) + '</div>' + (it.detail ? '<span style="font-size:11px; color:var(--text-secondary);">' + it.detail + '</span>' : '') + '</td>' +
        '<td>' + it.categoryOrType + '</td>' +
        '<td>' + getStockSeats(it) + '</td>' +
        '<td>' + getStatusBadge(it) + '</td>' +
        '<td style="font-size:12px;">' + it.locationOrAssigned + '</td>' +
        '<td style="text-align:right; white-space:nowrap;"><button class="btn btn-icon btn-sm action-menu-trigger" onclick="UI_ActionsMenu.show(event, \'' + it.itemType + '\', \'' + it.id + '\')" title="Actions">⋮</button></td>' +
      "</tr>");
    }
    tbody.innerHTML = html.join("");
    updateBulkBar();
    if (typeof UIPagination !== "undefined") UIPagination.renderBar("assets-pagination-container", paged, "UI_Assets.setPage", "UI_Assets.setPageSize");
  }

  function setPage(p) { currentPage = parseInt(p, 10) || 1; render(); }
  function setPageSize(s) { currentPageSize = parseInt(s, 10) || 10; currentPage = 1; render(); }
  function deleteAsset(id) {
    var asset = (typeof InventoryService !== "undefined") ? InventoryService.getById(id) : null;
    if (!asset) return;
    Notifications.confirm("Are you sure you want to delete asset " + id + " (" + asset.name + ")?", function () {
      InventoryService.remove(id);
      delete selectedMap[id];
      Notifications.show("Asset " + id + " removed.", "info");
      render();
      if (typeof NavController !== "undefined" && NavController.updateBadges) NavController.updateBadges();
    });
  }

  function switchTab(t) {
    if (t === "hardware" || t === "assets") setTypeFilter("asset");
    else if (t === "software" || t === "licenses") setTypeFilter("license");
    else if (t === "stock" || t === "consumables") setTypeFilter("consumable");
    else setTypeFilter("all");
  }

  function init() { initFilterBar(); }

  return {
    init: init, render: render, deleteAsset: deleteAsset,
    toggleItem: toggleItem, toggleSelectAll: toggleSelectAll, clearSelection: clearSelection,
    getSelectedIds: getSelectedIds, triggerBulkAction: triggerBulkAction,
    switchTab: switchTab, setTypeFilter: setTypeFilter,
    getTypeFilter: function () { return currentTypeFilter; },
    getActiveTab: function () { return currentTypeFilter; },
    setPage: setPage, setPageSize: setPageSize
  };
})();