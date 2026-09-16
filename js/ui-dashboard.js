/* ==========================================================================
   ITIM-lite - Dashboard View Controller & Activity Logs
   ========================================================================== */

var UI_Dashboard = (function () {
  var currentActivityFilter = "ALL";

  function render() {
    var aMetrics = InventoryService.getMetrics();
    var lMetrics = LicensesService.getMetrics();
    var cMetrics = ConsumablesService.getMetrics();

    // 1. Hardware Deployment & Segmented Bar
    var elTotal = document.getElementById("dash-total-assets");
    if (elTotal) elTotal.innerText = aMetrics.total;
    var elInUse = document.getElementById("dash-inuse-assets");
    if (elInUse) elInUse.innerText = aMetrics.inUse;
    var elAvail = document.getElementById("dash-avail-assets");
    if (elAvail) elAvail.innerText = aMetrics.available;
    var elRepair = document.getElementById("dash-repair-assets");
    if (elRepair) elRepair.innerText = aMetrics.inRepair;

    var total = Math.max(1, aMetrics.total);
    var inUsePct = aMetrics.total > 0 ? Math.round((aMetrics.inUse / total) * 100) : 0;
    var availPct = aMetrics.total > 0 ? Math.round((aMetrics.available / total) * 100) : 0;
    var repairPct = aMetrics.total > 0 ? Math.max(0, 100 - inUsePct - availPct) : 0;

    var elDeployRate = document.getElementById("dash-deploy-rate");
    if (elDeployRate) elDeployRate.innerText = inUsePct + "% " + (typeof I18N !== "undefined" ? I18N.t("status_active") : "Active");
    var barInUse = document.getElementById("dash-bar-inuse");
    if (barInUse) barInUse.style.width = inUsePct + "%";
    var barAvail = document.getElementById("dash-bar-avail");
    if (barAvail) barAvail.style.width = availPct + "%";
    var barRepair = document.getElementById("dash-bar-repair");
    if (barRepair) barRepair.style.width = repairPct + "%";

    // 2. Risk & Action Radar
    var elLowStock = document.getElementById("dash-low-stock");
    if (elLowStock) elLowStock.innerText = cMetrics.lowStockCount;
    var elWarranty = document.getElementById("dash-expiring-warranty");
    if (elWarranty) elWarranty.innerText = aMetrics.expiringWarrantyCount;
    var totalRisk = (cMetrics.lowStockCount || 0) + (aMetrics.expiringWarrantyCount || 0);
    var elRiskBadge = document.getElementById("dash-risk-badge");
    if (elRiskBadge) {
      var rWord = totalRisk === 1 ? (typeof I18N !== "undefined" ? I18N.t("risk_alert") : "Alert") : (typeof I18N !== "undefined" ? I18N.t("risk_alerts") : "Alerts");
      elRiskBadge.innerText = totalRisk + " " + rWord;
      elRiskBadge.className = "badge " + (totalRisk > 0 ? "badge-warning" : "badge-available");
    }

    // 3. Software Quotas & Pending POs
    var elLicSeats = document.getElementById("dash-license-seats");
    if (elLicSeats) elLicSeats.innerText = lMetrics.assignedSeats + " / " + lMetrics.totalSeats;
    var elLicBar = document.getElementById("dash-license-bar");
    if (elLicBar) {
      var licPct = lMetrics.totalSeats > 0 ? Math.min(100, Math.round((lMetrics.assignedSeats / lMetrics.totalSeats) * 100)) : 0;
      elLicBar.style.width = licPct + "%";
    }
    var elPendingPos = document.getElementById("dash-pending-pos");
    if (elPendingPos && typeof POService !== "undefined") {
      var pCount = POService.getAll().filter(function (p) { return p.status === "pending" || p.status === "partial"; }).length;
      var pWord = pCount === 1 ? (typeof I18N !== "undefined" ? I18N.t("active_po") : "Active PO") : (typeof I18N !== "undefined" ? I18N.t("active_pos") : "Active POs");
      elPendingPos.innerText = pCount + " " + pWord;
    }

    renderRecentActivity();
  }

  function filterRecent(type) {
    currentActivityFilter = type || "ALL";
    var btns = ["all", "checkout", "checkin", "inbound"];
    for (var i = 0; i < btns.length; i++) {
      var btn = document.getElementById("btn-dash-flt-" + btns[i]);
      if (btn) {
        if (btns[i].toUpperCase() === currentActivityFilter.toUpperCase()) {
          btn.className = "btn btn-sm active";
        } else {
          btn.className = "btn btn-sm";
        }
      }
    }
    renderRecentActivity();
  }

  function renderRecentActivity() {
    var tbody = document.getElementById("dash-activity-tbody");
    if (!tbody) return;

    var logs = AuditService.getAll();
    if (currentActivityFilter !== "ALL") {
      logs = logs.filter(function (l) {
        if (currentActivityFilter === "INBOUND") return l.action && (l.action.indexOf("PO_") === 0 || l.action === "INBOUND");
        return l.action === currentActivityFilter;
      });
    }
    logs = logs.slice(0, 8);

    if (logs.length === 0) {
      tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; color:var(--text-tertiary); padding:16px;">' + (typeof I18N !== "undefined" ? I18N.t("no_activity") : "No recent activity recorded") + '</td></tr>';
      return;
    }

    var html = [];
    for (var i = 0; i < logs.length; i++) {
      var l = logs[i];
      var badgeClass = "badge-available";
      if (l.action === "CHECKOUT") badgeClass = "badge-inuse";
      else if (l.action === "CHECKIN") badgeClass = "badge-available";
      else if (l.action === "ASSET_DELETE") badgeClass = "badge-retired";
      else if (l.action === "STOCK_ADJUST" || l.action === "STATUS_CHANGE") badgeClass = "badge-warning";
      else if (l.action && (l.action.indexOf("PO_") === 0 || l.action === "INBOUND")) badgeClass = "badge-inuse";

      html.push("<tr>" +
        '<td style="white-space:nowrap; width:150px; font-family:var(--font-mono); font-size:11px;">' + l.timestamp + '</td>' +
        '<td style="width:130px;"><span class="badge ' + badgeClass + '">' + l.action + '</span></td>' +
        '<td>' + l.detail + '</td>' +
        "</tr>");
    }
    tbody.innerHTML = html.join("");
  }

  function initAuditFilterBar() {
    if (typeof UI_FilterBar === "undefined") return;
    UI_FilterBar.init("audit", {
      title: "Audit Log",
      placeholder: "Search action, detail, timestamp...",
      fields: [
        {
          id: "action", label: "Action Type", type: "select",
          options: [
            { value: "all", label: "All Actions" }, { value: "PO_CREATE", label: "PO_CREATE" },
            { value: "PO_RECEIVE", label: "PO_RECEIVE" }, { value: "PO_CANCEL", label: "PO_CANCEL" },
            { value: "CHECKOUT", label: "CHECKOUT" }, { value: "CHECKIN", label: "CHECKIN" },
            { value: "STATUS_CHANGE", label: "STATUS_CHANGE" }, { value: "ASSET_CREATE", label: "ASSET_CREATE" },
            { value: "CATALOG_ADD", label: "CATALOG_ADD" }
          ]
        },
        { id: "keyword", label: "Detail Keyword", type: "text", placeholder: "e.g. Dell, AST-1001" }
      ],
      onFilter: function () { renderAuditLogs(); }
    });
  }

  function renderAuditLogs() {
    initAuditFilterBar();
    var curSearch = "", curAction = "all", curKeyword = "";
    if (typeof UI_FilterBar !== "undefined") {
      UI_FilterBar.render("audit-filter-bar", "audit");
      var crit = UI_FilterBar.getCriteria("audit");
      curSearch = (crit.search || "").toLowerCase();
      curAction = (crit.filters && crit.filters.action) ? crit.filters.action : "all";
      curKeyword = (crit.filters && crit.filters.keyword) ? crit.filters.keyword.toLowerCase() : "";
    }

    var tbody = document.getElementById("audit-table-tbody");
    if (!tbody) return;

    var logs = AuditService.getAll();
    if (curAction !== "all") logs = logs.filter(function (l) { return l.action === curAction; });
    if (curKeyword) logs = logs.filter(function (l) { return (l.detail || "").toLowerCase().indexOf(curKeyword) !== -1; });
    if (curSearch) {
      logs = logs.filter(function (l) {
        var str = (l.timestamp + " " + l.action + " " + (l.detail || "")).toLowerCase();
        return str.indexOf(curSearch) !== -1;
      });
    }
    if (logs.length === 0) {
      tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; color:var(--text-tertiary); padding:20px;">No audit trail recorded yet.</td></tr>';
      return;
    }

    var html = [];
    for (var i = 0; i < logs.length; i++) {
      var l = logs[i];
      var badgeClass = "badge-available";
      if (l.action === "CHECKOUT") badgeClass = "badge-inuse";
      else if (l.action === "ASSET_DELETE") badgeClass = "badge-retired";
      else if (l.action === "STOCK_ADJUST") badgeClass = "badge-warning";

      html.push("<tr>" +
        '<td style="white-space:nowrap; width:160px; font-family:var(--font-mono); font-size:11px;">' + l.timestamp + '</td>' +
        '<td style="width:140px;"><span class="badge ' + badgeClass + '">' + l.action + '</span></td>' +
        '<td>' + l.detail + '</td>' +
        "</tr>");
    }
    tbody.innerHTML = html.join("");
  }

  return {
    render: render,
    renderAuditLogs: renderAuditLogs,
    filterRecent: filterRecent
  };
})();
