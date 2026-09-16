/* ==========================================================================
   ITIM-lite - Stocktaking & Inventory Audit View Controller
   ========================================================================== */

var UI_Audit = (function () {
  var activeSessionId = null;

  function render() {
    var host = document.getElementById("stocktake-workspace-host");
    if (!host) return;
    if (activeSessionId) {
      renderWorkspace(activeSessionId);
    } else {
      renderSessionsTable();
    }
  }

  function renderSessionsTable() {
    var host = document.getElementById("stocktake-workspace-host");
    if (!host) return;
    var list = (typeof StocktakeService !== "undefined") ? StocktakeService.getAll() : [];

    var html = [];
    html.push('<div class="card" style="margin-top:8px;">');
    html.push('  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">');
    html.push('    <h3 style="margin:0;">Audit Sessions (' + list.length + ')</h3>');
    html.push('    <div style="font-size:12px; color:var(--text-secondary);">Click on an in-progress session to count or completed to view report</div>');
    html.push('  </div>');
    html.push('  <div class="data-table-container">');
    html.push('    <table class="data-table">');
    html.push('      <thead><tr><th>Session ID</th><th>Name</th><th>Scope</th><th>Auditor</th><th>Created</th><th>Status</th><th style="text-align:right;">Actions</th></tr></thead>');
    html.push('      <tbody>');

    if (list.length === 0) {
      html.push('<tr><td colspan="7" style="text-align:center; color:var(--text-tertiary); padding:30px;">No audit sessions created yet. Click "+ New Audit Session" to start.</td></tr>');
    } else {
      for (var i = 0; i < list.length; i++) {
        var s = list[i];
        var isLive = s.status === "in_progress";
        var badge = isLive ? '<span class="badge badge-inuse">In-Progress</span>' : '<span class="badge badge-available">Completed</span>';
        var expCount = (s.expectedAssets || []).length;
        var scnCount = (s.scannedAssets || []).length;

        html.push('<tr class="clickable-row" onclick="UI_Audit.openSession(\'' + s.id + '\')">' +
          '<td style="font-family:var(--font-mono); font-weight:700;"><a href="javascript:void(0)" style="color:var(--color-primary); text-decoration:underline;">' + s.id + '</a></td>' +
          '<td><strong>' + s.name + '</strong><br><span style="font-size:11px; color:var(--text-secondary);">' + (s.notes || "") + '</span></td>' +
          '<td><span class="badge" style="background:var(--bg-surface-secondary);">' + s.scope.type.toUpperCase() + ': ' + s.scope.value + '</span></td>' +
          '<td>' + s.auditor + '</td>' +
          '<td style="font-family:var(--font-mono); font-size:11px;">' + s.createdAt + '</td>' +
          '<td>' + badge + '<br><span style="font-size:10px; color:var(--text-tertiary);">' + scnCount + '/' + expCount + ' items</span></td>' +
          '<td style="text-align:right; white-space:nowrap;" onclick="event.stopPropagation();">' +
            (isLive ? '<button class="btn btn-primary btn-sm" onclick="UI_Audit.openSession(\'' + s.id + '\')">Count / Scan</button> ' : '') +
            '<button class="btn btn-sm" onclick="UI_Audit.viewReport(\'' + s.id + '\')">Report</button> ' +
            '<button class="btn btn-sm" onclick="StocktakeService.printReport(\'' + s.id + '\')">Print</button>' +
          '</td>' +
        '</tr>');
      }
    }

    html.push('      </tbody></table></div></div>');
    host.innerHTML = html.join("");
  }

  function openSession(sessionId) {
    activeSessionId = sessionId;
    render();
  }

  function closeWorkspace() {
    activeSessionId = null;
    render();
  }

  function renderWorkspace(sessionId) {
    var host = document.getElementById("stocktake-workspace-host");
    var recon = StocktakeService.getReconciliation(sessionId);
    if (!host || !recon) { closeWorkspace(); return; }
    var s = recon.session, st = recon.stats;
    var isLive = s.status === "in_progress";

    var pct = st.expectedCount > 0 ? Math.round((st.matchedCount / st.expectedCount) * 100) : 100;
    var html = [];

    html.push('<div style="margin-bottom:12px; display:flex; justify-content:space-between; align-items:center;">' +
      '<div><button class="btn btn-sm" onclick="UI_Audit.closeWorkspace()" style="margin-right:8px;">← Back to Sessions</button>' +
      '<strong style="font-size:16px;">' + s.name + '</strong> <span style="font-family:var(--font-mono); color:var(--color-primary); font-weight:700;">[' + s.id + ']</span> ' +
      (isLive ? '<span class="badge badge-inuse">In-Progress</span>' : '<span class="badge badge-available">Completed</span>') +
      '</div>' +
      '<div>' +
        (isLive ? '<button class="btn btn-primary btn-sm" onclick="UI_Audit.confirmCloseSession(\'' + s.id + '\')" style="margin-right:6px;">Complete &amp; Close Session</button>' : '') +
        '<button class="btn btn-sm" onclick="StocktakeService.printReport(\'' + s.id + '\')">Print Official Report</button>' +
      '</div>' +
    '</div>');

    // KPI Metrics Bar
    html.push('<div class="metrics-grid" style="margin-bottom:12px;">' +
      '<div class="metric-card" style="padding:10px;"><div style="font-size:11px; color:var(--text-secondary);">Progress</div><div style="font-size:22px; font-weight:bold; color:var(--color-primary);">' + pct + '%</div><div style="font-size:11px;">' + st.matchedCount + ' of ' + st.expectedCount + ' matched</div></div>' +
      '<div class="metric-card" style="padding:10px;"><div style="font-size:11px; color:var(--text-secondary);">Total Scanned</div><div style="font-size:22px; font-weight:bold;">' + st.scannedCount + '</div><div style="font-size:11px;">Physical counts</div></div>' +
      '<div class="metric-card" style="padding:10px;"><div style="font-size:11px; color:green;">Matched</div><div style="font-size:22px; font-weight:bold; color:green;">' + st.matchedCount + '</div><div style="font-size:11px;">Verified in stock</div></div>' +
      '<div class="metric-card" style="padding:10px;"><div style="font-size:11px; color:red;">Missing</div><div style="font-size:22px; font-weight:bold; color:red;">' + st.missingCount + '</div><div style="font-size:11px;">Not yet found</div></div>' +
      '<div class="metric-card" style="padding:10px;"><div style="font-size:11px; color:#e67e22;">Surplus</div><div style="font-size:22px; font-weight:bold; color:#e67e22;">' + st.surplusCount + '</div><div style="font-size:11px;">Uncataloged / Extra</div></div>' +
    '</div>');

    // Scan Box (If live)
    if (isLive) {
      html.push('<div class="card" style="padding:12px; margin-bottom:12px; background:var(--bg-surface-secondary); border:1px solid var(--border-subtle);">' +
        '<div style="display:flex; gap:8px; align-items:center;">' +
          '<div style="flex:1;"><input type="text" id="stocktake-scan-input" class="form-input" placeholder="Scan Barcode / QR or type Asset ID / Serial (Press Enter)..." onkeydown="if(event.keyCode===13) UI_Audit.submitScan(\'' + s.id + '\')" autofocus /></div>' +
          '<button class="btn btn-primary" onclick="UI_Audit.submitScan(\'' + s.id + '\')">Verify Item</button>' +
        '</div>' +
        '<div id="stocktake-scan-msg" style="font-size:12px; margin-top:6px; min-height:16px;"></div>' +
      '</div>');
    }

    // Expected Items Checklist Table
    html.push('<div class="card">' +
      '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">' +
        '<h4 style="margin:0;">Expected Inventory Checklist (' + (s.expectedAssets || []).length + ')</h4>' +
        '<span style="font-size:11px; color:var(--text-secondary);">Filter: Click Found / Toggle to verify manually</span>' +
      '</div>' +
      '<div class="data-table-container"><table class="data-table"><thead><tr>' +
        '<th style="width:50px; text-align:center;">Check</th><th>Asset ID</th><th>Name / Model</th><th>Serial</th><th>Expected Location</th><th>Assigned To</th><th>Status</th>' +
      '</tr></thead><tbody>');

    var exp = s.expectedAssets || [];
    var scnMap = {};
    for (var k = 0; k < (s.scannedAssets || []).length; k++) scnMap[s.scannedAssets[k].assetId] = s.scannedAssets[k];

    for (var j = 0; j < exp.length; j++) {
      var it = exp[j];
      var isFnd = !!scnMap[it.assetId];
      var chkBtn = isLive
        ? '<input type="checkbox" ' + (isFnd ? 'checked' : '') + ' onchange="UI_Audit.toggleFound(\'' + s.id + '\', \'' + it.assetId + '\', this.checked)" />'
        : (isFnd ? '<span style="color:green; font-weight:bold;">[Y]</span>' : '<span style="color:#d13438; font-weight:bold;">[-]</span>');

      html.push('<tr style="' + (isFnd ? 'background:rgba(16,185,129,0.05);' : '') + '">' +
        '<td style="text-align:center;">' + chkBtn + '</td>' +
        '<td style="font-family:var(--font-mono); font-weight:600;">' + it.assetId + '</td>' +
        '<td><strong>' + it.name + '</strong></td>' +
        '<td style="font-family:var(--font-mono); font-size:11px;">' + (it.serial || "-") + '</td>' +
        '<td>' + (it.location || "-") + '</td>' +
        '<td>' + (it.assignedTo || "-") + '</td>' +
        '<td>' + (isFnd ? '<span class="badge badge-available">Found</span>' : '<span class="badge badge-warning">Unchecked</span>') + '</td>' +
      '</tr>');
    }

    html.push('</tbody></table></div></div>');
    host.innerHTML = html.join("");

    var scanInput = document.getElementById("stocktake-scan-input");
    if (scanInput) scanInput.focus();
  }

  function submitScan(sessionId) {
    var input = document.getElementById("stocktake-scan-input");
    var msgEl = document.getElementById("stocktake-scan-msg");
    if (!input || !input.value.trim()) return;

    var code = input.value.trim();
    var res = StocktakeService.recordScan(sessionId, code);

    if (res.success) {
      if (res.alreadyScanned) {
        if (msgEl) msgEl.innerHTML = '<span style="color:#e67e22; font-weight:600;">[Notice] Item ' + res.item.assetId + ' was already scanned in this session.</span>';
      } else if (res.isSurplus) {
        if (msgEl) msgEl.innerHTML = '<span style="color:#e67e22; font-weight:600;">[Surplus] Uncataloged item recorded: ' + res.item.assetId + ' (' + res.item.name + ')</span>';
        renderWorkspace(sessionId);
      } else {
        if (msgEl) msgEl.innerHTML = '<span style="color:green; font-weight:600;">[Verified] ' + res.item.assetId + ' - ' + res.item.name + '</span>';
        renderWorkspace(sessionId);
      }
    } else {
      if (msgEl) msgEl.innerHTML = '<span style="color:red;">[Error] ' + res.error + '</span>';
    }

    input.value = "";
    input.focus();
  }

  function toggleFound(sessionId, assetId, checked) {
    StocktakeService.toggleItemFound(sessionId, assetId, checked);
    renderWorkspace(sessionId);
  }

  function confirmCloseSession(sessionId) {
    var recon = StocktakeService.getReconciliation(sessionId);
    if (!recon) return;
    var st = recon.stats;

    var msg = "Close Audit Session " + sessionId + "?\n" +
      "Matched: " + st.matchedCount + " | Missing: " + st.missingCount + " | Surplus: " + st.surplusCount + "\n\n" +
      (st.missingCount > 0 ? "Would you like to automatically update missing items (" + st.missingCount + ") to Retired status?" : "Proceed with closing session?");

    Notifications.confirm(msg, function () {
      StocktakeService.completeSession(sessionId, { syncStatus: (st.missingCount > 0) });
      Notifications.show("Audit session " + sessionId + " completed successfully!", "success");
      renderWorkspace(sessionId);
      if (typeof NavController !== "undefined") NavController.updateBadges();
    });
  }

  function viewReport(sessionId) {
    openSession(sessionId);
  }

  function openCreateModal() {
    var host = document.getElementById("modal-host") || document.body;
    var div = document.getElementById("stocktake-create-modal");
    if (!div) {
      div = document.createElement("div");
      div.id = "stocktake-create-modal";
      div.className = "modal-backdrop";
      div.innerHTML = '<div class="modal" style="width:520px; max-width:92vw;">' +
        '<div class="modal-header"><h3>Create New Audit Session</h3><button class="btn btn-sm" onclick="document.getElementById(\'stocktake-create-modal\').className=\'modal-backdrop\'">✕</button></div>' +
        '<div class="modal-body">' +
          '<div class="form-group"><label class="form-label">Session Name *:</label><input type="text" id="stk-input-name" class="form-input" placeholder="e.g. Q3 2026 Floor 2 Hardware Audit" /></div>' +
          '<div class="form-row">' +
            '<div class="form-group"><label class="form-label">Audit Scope Type:</label><select id="stk-input-scope-type" class="form-select" onchange="UI_Audit.onScopeTypeChange()"><option value="all">All Hardware Assets</option><option value="location">By Location</option><option value="department">By Department</option><option value="category">By Category</option></select></div>' +
            '<div class="form-group"><label class="form-label">Auditor Lead:</label><input type="text" id="stk-input-auditor" class="form-input" value="IT Administrator" /></div>' +
          '</div>' +
          '<div class="form-group" id="stk-scope-val-group" style="display:none;"><label class="form-label">Scope Filter Keyword / Value:</label><input type="text" id="stk-input-scope-val" class="form-input" placeholder="e.g. Floor 2 or Engineering or Laptop" /></div>' +
          '<div class="form-group"><label class="form-label">Notes / Objectives:</label><textarea id="stk-input-notes" class="form-textarea" rows="2" placeholder="Audit goals, target rooms, custodians..."></textarea></div>' +
        '</div>' +
        '<div class="modal-footer"><button class="btn" onclick="document.getElementById(\'stocktake-create-modal\').className=\'modal-backdrop\'">Cancel</button><button class="btn btn-primary" onclick="UI_Audit.submitCreate()">Start Audit Session</button></div>' +
      '</div>';
      host.appendChild(div);
    }
    document.getElementById("stk-input-name").value = "";
    document.getElementById("stk-input-scope-type").value = "all";
    document.getElementById("stk-input-scope-val").value = "";
    document.getElementById("stk-input-notes").value = "";
    onScopeTypeChange();
    div.className = "modal-backdrop open";
  }

  function onScopeTypeChange() {
    var t = document.getElementById("stk-input-scope-type");
    var grp = document.getElementById("stk-scope-val-group");
    if (t && grp) grp.style.display = (t.value === "all") ? "none" : "block";
  }

  function submitCreate() {
    var name = document.getElementById("stk-input-name").value.trim();
    if (!name) { Notifications.show("Please enter a session name.", "warning"); return; }
    var scopeType = document.getElementById("stk-input-scope-type").value;
    var scopeVal = document.getElementById("stk-input-scope-val").value.trim();
    var auditor = document.getElementById("stk-input-auditor").value.trim();
    var notes = document.getElementById("stk-input-notes").value.trim();

    var res = StocktakeService.createSession({ name: name, scopeType: scopeType, scopeValue: scopeVal, auditor: auditor, notes: notes });
    if (res.success) {
      document.getElementById("stocktake-create-modal").className = "modal-backdrop";
      Notifications.show("Session " + res.session.id + " created with " + res.session.expectedAssets.length + " assets.", "success");
      openSession(res.session.id);
    } else {
      Notifications.show(res.error, "error");
    }
  }

  return {
    render: render, openSession: openSession, closeWorkspace: closeWorkspace,
    openCreateModal: openCreateModal, onScopeTypeChange: onScopeTypeChange,
    submitCreate: submitCreate, submitScan: submitScan, toggleFound: toggleFound,
    confirmCloseSession: confirmCloseSession, viewReport: viewReport
  };
})();