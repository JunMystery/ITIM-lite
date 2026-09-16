/* ==========================================================================
   ITIM-lite - Assets View Controller with Multi-Item Bulk Actions
   ========================================================================== */

var UI_Assets = (function () {
  var currentCategory = "all";
  var currentStatus = "all";
  var currentSearch = "";
  var selectedMap = {};
  var currentPage = 1;
  var currentPageSize = 10;

  function getStatusBadge(status) {
    if (status === "inuse") return '<span class="badge badge-inuse">In Use</span>';
    if (status === "available") return '<span class="badge badge-available">Available</span>';
    if (status === "repair") return '<span class="badge badge-repair">In Repair</span>';
    if (status === "retired") return '<span class="badge badge-retired">Retired</span>';
    return '<span class="badge">' + status + '</span>';
  }

  function getSelectedIds() {
    var ids = [];
    for (var k in selectedMap) {
      if (selectedMap.hasOwnProperty(k) && selectedMap[k]) ids.push(k);
    }
    return ids;
  }

  function updateBulkBar() {
    var bar = document.getElementById("assets-bulk-bar");
    var label = document.getElementById("assets-selected-label");
    var count = getSelectedIds().length;

    if (!bar) return;
    if (count > 0) {
      bar.style.display = "flex";
      if (label) label.innerText = count + " asset" + (count > 1 ? "s" : "") + " selected";
    } else {
      bar.style.display = "none";
    }

    var selectAllCb = document.getElementById("assets-select-all");
    if (selectAllCb) {
      var allRows = document.querySelectorAll(".asset-row-cb");
      selectAllCb.checked = (allRows.length > 0 && count === allRows.length);
    }
  }

  function toggleItem(id, checked) {
    selectedMap[id] = checked;
    updateBulkBar();
  }

  function toggleSelectAll(checked) {
    var cbs = document.querySelectorAll(".asset-row-cb");
    for (var i = 0; i < cbs.length; i++) {
      cbs[i].checked = checked;
      var id = cbs[i].getAttribute("data-id");
      if (id) selectedMap[id] = checked;
    }
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

  function triggerBulkAction(action) {
    var ids = getSelectedIds();
    if (ids.length === 0) {
      Notifications.show("Please select at least one asset.", "warning");
      return;
    }

    if (action === "print") {
      for (var i = 0; i < ids.length; i++) {
        UI_AssetModal.printLabel(ids[i]);
      }
      return;
    }

    if (typeof UI_History !== "undefined") {
      UI_History.openBulkModal(ids);
    }
  }

  function initFilterBar() {
    if (typeof UI_FilterBar === "undefined") return;
    UI_FilterBar.init("assets", {
      title: "Assets",
      placeholder: "Search assets, serials, models, users...",
      fields: [
        {
          id: "status", label: "Status", type: "select",
          options: [
            { value: "all", label: "All Statuses" }, { value: "available", label: "Available" },
            { value: "inuse", label: "In Use" }, { value: "repair", label: "In Repair" }, { value: "retired", label: "Retired" }
          ]
        },
        {
          id: "category", label: "Category", type: "select",
          options: [
            { value: "all", label: "All Categories" }, { value: "Laptop", label: "Laptop" },
            { value: "Desktop", label: "Desktop" }, { value: "Server", label: "Server" },
            { value: "Monitor", label: "Monitor" }, { value: "Networking", label: "Networking" },
            { value: "Printer", label: "Printer" }, { value: "Mobile Device", label: "Mobile Device" }, { value: "Peripheral", label: "Peripheral" }
          ]
        },
        { id: "department", label: "Department", type: "text", placeholder: "e.g. Engineering" },
        { id: "location", label: "Location", type: "text", placeholder: "e.g. Floor 2" }
      ],
      onFilter: function () { currentPage = 1; render(); }
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
    var list = InventoryService.filter(currentSearch, currentCategory, currentStatus);
    var tbody = document.getElementById("assets-table-tbody");
    if (!tbody) return;

    var paged = (typeof UIPagination !== "undefined")
      ? UIPagination.paginate(list, currentPage, currentPageSize)
      : { pagedItems: list, totalItems: list.length, totalPages: 1, currentPage: 1, pageSize: list.length, startItem: (list.length ? 1 : 0), endItem: list.length };

    currentPage = paged.currentPage;

    if (list.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; color:var(--text-tertiary); padding:30px;">No assets match current criteria.</td></tr>';
      updateBulkBar();
      if (typeof UIPagination !== "undefined") {
        UIPagination.renderBar("assets-pagination-container", paged, "UI_Assets.setPage", "UI_Assets.setPageSize");
      }
      return;
    }

    var html = [];
    for (var i = 0; i < paged.pagedItems.length; i++) {
      var a = paged.pagedItems[i];
      var isChecked = !!selectedMap[a.id];

      html.push('<tr class="clickable-row" onclick="UI_ActionsMenu.onRowClick(event, \'asset\', \'' + a.id + '\')" oncontextmenu="UI_ActionsMenu.show(event, \'asset\', \'' + a.id + '\')">' +
        '<td style="width:30px; text-align:center;"><input type="checkbox" class="asset-row-cb" data-id="' + a.id + '" ' + (isChecked ? 'checked' : '') + ' onchange="UI_Assets.toggleItem(\'' + a.id + '\', this.checked)" /></td>' +
        '<td style="font-family:var(--font-mono); font-weight:600; width:95px;">' + a.id + '</td>' +
        '<td><strong>' + a.name + '</strong><br><span style="font-size:11px; color:var(--text-secondary);">' + (a.model || "") + '</span></td>' +
        '<td>' + a.category + '</td>' +
        '<td style="font-family:var(--font-mono); font-size:11px;">' + (a.serial || "-") + '</td>' +
        '<td>' + getStatusBadge(a.status) + '</td>' +
        '<td>' + (a.assignedTo ? ('<strong>' + a.assignedTo + '</strong><br><span style="font-size:11px; color:var(--text-secondary);">' + (a.department || "") + '</span>') : '<span style="color:var(--text-tertiary);">-</span>') + '</td>' +
        '<td style="text-align:right; white-space:nowrap;">' +
          '<button class="btn btn-icon btn-sm action-menu-trigger" onclick="UI_ActionsMenu.show(event, \'asset\', \'' + a.id + '\')" title="Actions">⋮</button>' +
        '</td>' +
      "</tr>");
    }
    tbody.innerHTML = html.join("");
    updateBulkBar();

    if (typeof UIPagination !== "undefined") {
      UIPagination.renderBar("assets-pagination-container", paged, "UI_Assets.setPage", "UI_Assets.setPageSize");
    }
  }

  function setPage(p) {
    currentPage = parseInt(p, 10) || 1;
    render();
  }

  function setPageSize(s) {
    currentPageSize = parseInt(s, 10) || 10;
    currentPage = 1;
    render();
  }

  function deleteAsset(id) {
    var asset = InventoryService.getById(id);
    if (!asset) return;

    Notifications.confirm("Are you sure you want to delete asset " + id + " (" + asset.name + ")?", function () {
      InventoryService.remove(id);
      delete selectedMap[id];
      Notifications.show("Asset " + id + " removed.", "info");
      render();
      NavController.updateBadges();
    });
  }

  function init() {
    initFilterBar();
  }

  return {
    init: init,
    render: render,
    deleteAsset: deleteAsset,
    toggleItem: toggleItem,
    toggleSelectAll: toggleSelectAll,
    clearSelection: clearSelection,
    getSelectedIds: getSelectedIds,
    triggerBulkAction: triggerBulkAction,
    setPage: setPage,
    setPageSize: setPageSize
  };
})();
