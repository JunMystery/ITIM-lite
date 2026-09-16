/* ==========================================================================
   ITIM-lite - Physical Inventory Audit & Stocktake Service
   ========================================================================== */

var StocktakeService = (function () {
  function getDb() { return AppState.db; }

  function getAll() {
    var db = getDb();
    if (!db.stocktakeSessions) db.stocktakeSessions = [];
    return db.stocktakeSessions;
  }

  function getById(id) {
    var list = getAll();
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) return list[i];
    }
    return null;
  }

  function generateNextId() {
    var list = getAll(), maxNum = 7000;
    for (var i = 0; i < list.length; i++) {
      var match = (list[i].id || "").match(/STK-(\d+)/i);
      if (match) { var n = parseInt(match[1], 10); if (n > maxNum) maxNum = n; }
    }
    return "STK-" + (maxNum + 1);
  }

  function getNowTimestamp() {
    var d = new Date(), pad = function (n) { return n < 10 ? "0" + n : "" + n; };
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()) +
      " " + pad(d.getHours()) + ":" + pad(d.getMinutes()) + ":" + pad(d.getSeconds());
  }

  function createSession(params) {
    if (!params.name) return { success: false, error: "Session name is required." };
    var scopeType = params.scopeType || "all";
    var scopeVal = (params.scopeValue || "").trim().toLowerCase();

    var allAssets = (typeof InventoryService !== "undefined") ? InventoryService.getAll() : [];
    var expected = [];
    for (var i = 0; i < allAssets.length; i++) {
      var a = allAssets[i];
      if (scopeType === "location") {
        if ((a.location || "").toLowerCase().indexOf(scopeVal) !== -1) expected.push(snapshotAsset(a));
      } else if (scopeType === "department") {
        if ((a.department || "").toLowerCase().indexOf(scopeVal) !== -1) expected.push(snapshotAsset(a));
      } else if (scopeType === "category") {
        if ((a.category || "").toLowerCase() === scopeVal) expected.push(snapshotAsset(a));
      } else {
        expected.push(snapshotAsset(a));
      }
    }

    var session = {
      id: generateNextId(),
      name: params.name.trim(),
      scope: { type: scopeType, value: params.scopeValue || "All Assets" },
      status: "in_progress",
      createdAt: getNowTimestamp(),
      closedAt: "",
      auditor: params.auditor || "IT Auditor",
      notes: params.notes || "",
      expectedAssets: expected,
      scannedAssets: []
    };

    getAll().unshift(session);
    if (typeof AuditService !== "undefined") {
      AuditService.log("STOCKTAKE_START", "Started inventory audit " + session.id + " (" + session.name + ") with " + expected.length + " expected assets");
    }
    AppState.save();
    return { success: true, session: session };
  }

  function snapshotAsset(a) {
    return { assetId: a.id, name: a.name, category: a.category, serial: a.serial || "", status: a.status || "available", location: a.location || "", department: a.department || "", assignedTo: a.assignedTo || "" };
  }

  function recordScan(sessionId, code, actualData) {
    var session = getById(sessionId);
    if (!session) return { success: false, error: "Session not found." };
    if (session.status !== "in_progress") return { success: false, error: "Session is already closed." };
    if (!code) return { success: false, error: "Scan code is empty." };

    var cleanCode = code.trim();
    for (var s = 0; s < session.scannedAssets.length; s++) {
      var sc = session.scannedAssets[s];
      if (sc.assetId.toLowerCase() === cleanCode.toLowerCase() || (sc.serial && sc.serial.toLowerCase() === cleanCode.toLowerCase())) {
        return { success: true, alreadyScanned: true, item: sc, message: "Asset already scanned in this session." };
      }
    }

    var asset = null;
    var allAssets = (typeof InventoryService !== "undefined") ? InventoryService.getAll() : [];
    for (var i = 0; i < allAssets.length; i++) {
      if (allAssets[i].id.toLowerCase() === cleanCode.toLowerCase() || (allAssets[i].serial && allAssets[i].serial.toLowerCase() === cleanCode.toLowerCase())) {
        asset = allAssets[i];
        break;
      }
    }

    actualData = actualData || {};
    var record = {
      assetId: asset ? asset.id : cleanCode,
      serial: asset ? (asset.serial || "") : cleanCode,
      name: asset ? asset.name : ("Unregistered Item (" + cleanCode + ")"),
      category: asset ? asset.category : "Unknown",
      timestamp: getNowTimestamp(),
      actualLocation: actualData.actualLocation || (asset ? asset.location : ""),
      actualCondition: actualData.actualCondition || "Good / Functional",
      isSurplus: !asset || !isInExpected(session, asset.id),
      note: actualData.note || ""
    };

    session.scannedAssets.push(record);
    AppState.save();
    return { success: true, alreadyScanned: false, item: record, isSurplus: record.isSurplus };
  }

  function isInExpected(session, assetId) {
    for (var i = 0; i < (session.expectedAssets || []).length; i++) if (session.expectedAssets[i].assetId === assetId) return true;
    return false;
  }

  function toggleItemFound(sessionId, assetId, found) {
    var session = getById(sessionId);
    if (!session || session.status !== "in_progress") return { success: false };
    var scanned = session.scannedAssets;
    var idx = -1;
    for (var i = 0; i < scanned.length; i++) {
      if (scanned[i].assetId === assetId) { idx = i; break; }
    }

    if (found && idx === -1) {
      var asset = (typeof InventoryService !== "undefined") ? InventoryService.getById(assetId) : null;
      scanned.push({
        assetId: assetId, serial: asset ? (asset.serial || "") : "",
        name: asset ? asset.name : assetId, category: asset ? asset.category : "",
        timestamp: getNowTimestamp(), actualLocation: asset ? (asset.location || "") : "",
        actualCondition: "Good", isSurplus: !isInExpected(session, assetId), note: "Checked manually"
      });
    } else if (!found && idx !== -1) {
      scanned.splice(idx, 1);
    }
    AppState.save();
    return { success: true };
  }

  function getReconciliation(sessionId) {
    var session = getById(sessionId);
    if (!session) return null;

    var expectedMap = {}, scannedMap = {};
    for (var i = 0; i < (session.expectedAssets || []).length; i++) expectedMap[session.expectedAssets[i].assetId] = session.expectedAssets[i];
    for (var j = 0; j < (session.scannedAssets || []).length; j++) scannedMap[session.scannedAssets[j].assetId] = session.scannedAssets[j];

    var matched = [], missing = [], surplus = [], locMismatch = [];

    for (var eId in expectedMap) {
      var exp = expectedMap[eId];
      if (scannedMap[eId]) {
        var scn = scannedMap[eId];
        matched.push({ expected: exp, actual: scn });
        if (scn.actualLocation && exp.location && scn.actualLocation.toLowerCase() !== exp.location.toLowerCase()) {
          locMismatch.push({ assetId: exp.assetId, expectedLoc: exp.location, actualLoc: scn.actualLocation });
        }
      } else {
        missing.push(exp);
      }
    }

    for (var sId in scannedMap) {
      if (!expectedMap[sId]) surplus.push(scannedMap[sId]);
    }

    return {
      session: session,
      matched: matched,
      missing: missing,
      surplus: surplus,
      locationMismatch: locMismatch,
      stats: {
        expectedCount: (session.expectedAssets || []).length,
        scannedCount: (session.scannedAssets || []).length,
        matchedCount: matched.length,
        missingCount: missing.length,
        surplusCount: surplus.length,
        mismatchCount: locMismatch.length
      }
    };
  }

  function completeSession(sessionId, options) {
    var session = getById(sessionId);
    if (!session) return { success: false, error: "Session not found." };
    options = options || {};

    var recon = getReconciliation(sessionId);
    session.status = "completed";
    session.closedAt = getNowTimestamp();
    if (options.notes) session.notes = (session.notes ? session.notes + " | " : "") + options.notes;

    if (options.syncStatus && recon.missing.length > 0) {
      for (var i = 0; i < recon.missing.length; i++) {
        var miss = recon.missing[i];
        InventoryService.update(miss.assetId, {
          status: "retired",
          notes: "Missing in audit " + session.id + " on " + session.closedAt
        });
      }
    }

    if (typeof AuditService !== "undefined") {
      AuditService.log("STOCKTAKE_COMPLETE", "Closed audit " + session.id + ": " + recon.stats.matchedCount + " matched, " + recon.stats.missingCount + " missing, " + recon.stats.surplusCount + " surplus");
    }
    AppState.save();
    return { success: true, reconciliation: recon };
  }

  function generateReportHtml(sessionId) {
    var recon = getReconciliation(sessionId);
    if (!recon) return "";
    var s = recon.session, st = recon.stats;

    var mkRows = function (list, colsFn) {
      if (!list || list.length === 0) return '<tr><td colspan="6" style="text-align:center; color:#888;">None recorded.</td></tr>';
      var r = [];
      for (var i = 0; i < list.length; i++) r.push("<tr><td>" + (i + 1) + "</td>" + colsFn(list[i]) + "</tr>");
      return r.join("");
    };

    var matchedHtml = mkRows(recon.matched, function (m) {
      return "<td><strong>" + m.expected.assetId + "</strong></td><td>" + m.expected.name + "</td><td>" + (m.expected.serial || "-") + "</td><td>" + (m.expected.location || "-") + "</td><td><span style='color:green;'>Found (" + (m.actual.actualCondition || "Good") + ")</span></td>";
    });

    var missingHtml = mkRows(recon.missing, function (m) {
      return "<td><strong>" + m.assetId + "</strong></td><td>" + m.name + "</td><td>" + (m.serial || "-") + "</td><td>" + (m.location || "-") + "</td><td><span style='color:red; font-weight:bold;'>NOT FOUND</span></td>";
    });

    var surplusHtml = mkRows(recon.surplus, function (su) {
      return "<td><strong>" + su.assetId + "</strong></td><td>" + su.name + "</td><td>" + (su.serial || "-") + "</td><td>" + (su.actualLocation || "-") + "</td><td><span style='color:#e67e22;'>Surplus / Unexpected</span></td>";
    });

    return "<!DOCTYPE html><html><head><title>Stocktake Report - " + s.id + "</title>" +
      "<style>body { font-family: Arial, sans-serif; margin: 30px; line-height: 1.4; color: #222; } .header { border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 16px; } .title { font-size: 20px; font-weight: bold; text-transform: uppercase; margin: 0; } .meta { font-size: 12px; color: #555; } .kpi-box { display: flex; gap: 12px; margin: 16px 0; } .kpi { flex: 1; border: 1px solid #ccc; background: #f9f9f9; padding: 10px; text-align: center; border-radius: 4px; } .kpi-val { font-size: 22px; font-weight: bold; } table { width: 100%; border-collapse: collapse; margin: 8px 0 16px 0; } th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: left; font-size: 11px; } th { background: #f0f0f0; } .sec-title { font-size: 13px; font-weight: bold; margin-top: 14px; text-transform: uppercase; border-left: 4px solid #0067b8; padding-left: 8px; } .signatures { display: flex; justify-content: space-between; margin-top: 40px; } .sig-block { width: 30%; border-top: 1px solid #000; padding-top: 6px; font-size: 11px; text-align: center; }</style></head><body>" +
      '<div class="header"><div class="title">Physical Inventory Stocktake &amp; Audit Report</div><div class="meta">Audit ID: <strong>' + s.id + '</strong> | Session: <strong>' + s.name + '</strong> | Scope: ' + s.scope.value + ' | Created: ' + s.createdAt + ' | Closed: ' + (s.closedAt || "In-Progress") + '</div></div>' +
      '<div class="kpi-box">' +
        '<div class="kpi"><div>Expected</div><div class="kpi-val">' + st.expectedCount + '</div></div>' +
        '<div class="kpi"><div style="color:green;">Matched</div><div class="kpi-val" style="color:green;">' + st.matchedCount + '</div></div>' +
        '<div class="kpi"><div style="color:red;">Missing</div><div class="kpi-val" style="color:red;">' + st.missingCount + '</div></div>' +
        '<div class="kpi"><div style="color:#e67e22;">Surplus</div><div class="kpi-val" style="color:#e67e22;">' + st.surplusCount + '</div></div>' +
      '</div>' +
      '<div class="sec-title" style="color:red;">1. Missing Hardware Assets (' + recon.missing.length + ')</div>' +
      '<table><thead><tr><th style="width:30px;">#</th><th style="width:90px;">Asset ID</th><th>Name / Model</th><th>Serial No</th><th>Expected Loc</th><th>Audit Result</th></tr></thead><tbody>' + missingHtml + '</tbody></table>' +
      '<div class="sec-title" style="color:#e67e22;">2. Surplus / Uncataloged Items (' + recon.surplus.length + ')</div>' +
      '<table><thead><tr><th style="width:30px;">#</th><th style="width:90px;">Asset ID</th><th>Name / Description</th><th>Serial No</th><th>Location Found</th><th>Audit Result</th></tr></thead><tbody>' + surplusHtml + '</tbody></table>' +
      '<div class="sec-title" style="color:green;">3. Matched Hardware Assets (' + recon.matched.length + ')</div>' +
      '<table><thead><tr><th style="width:30px;">#</th><th style="width:90px;">Asset ID</th><th>Name / Model</th><th>Serial No</th><th>Location</th><th>Condition</th></tr></thead><tbody>' + matchedHtml + '</tbody></table>' +
      '<div class="signatures">' +
        '<div class="sig-block"><strong>Auditor / Lead</strong><br><br><br><br>Name: ' + s.auditor + '</div>' +
        '<div class="sig-block"><strong>IT Operations Manager</strong><br><br><br><br>Signature: _______________</div>' +
        '<div class="sig-block"><strong>Director / Stock Custodian</strong><br><br><br><br>Signature: _______________</div>' +
      '</div>' +
      "<script>window.onload = function() { window.print(); };<\/script></body></html>";
  }

  function printReport(sessionId) {
    var w = window.open("", "_blank", "width=850,height=750");
    if (!w) { alert("Popup blocked. Please allow popups to print."); return; }
    w.document.write(generateReportHtml(sessionId));
    w.document.close();
  }

  return {
    getAll: getAll, getById: getById, createSession: createSession,
    recordScan: recordScan, toggleItemFound: toggleItemFound,
    getReconciliation: getReconciliation, completeSession: completeSession,
    generateReportHtml: generateReportHtml, printReport: printReport
  };
})();