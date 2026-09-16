/* ==========================================================================
   ITIM-lite - Assignments & Equipment Handover Controller
   ========================================================================== */

var UI_Assignments = (function () {
  function ensureModals() {
    var host = document.getElementById("modal-host") || document.body;
    if (!document.getElementById("checkout-modal")) {
      var co = document.createElement("div");
      co.id = "checkout-modal";
      co.className = "modal-backdrop";
      co.onclick = function (e) { e = e || window.event; if ((e.target || e.srcElement) === co) closeCheckoutModal(); };
      co.innerHTML = '<div class="modal"><div class="modal-header"><h3>Check-out Equipment</h3><button class="btn btn-sm" onclick="UI_Assignments.closeCheckoutModal()">✕</button></div>' +
        '<div class="modal-body">' +
          '<div class="form-group"><label class="form-label">Select Available Asset *:</label>' + (typeof UI_ComboBox !== "undefined" ? UI_ComboBox.renderHtml("checkout-input-asset", [], "") : '<select id="checkout-input-asset" class="form-select"></select>') + '</div>' +
          '<div class="form-row"><div class="form-group"><label class="form-label">Employee Name *:</label><input type="text" id="checkout-input-employee" class="form-input" /></div><div class="form-group"><label class="form-label">Employee Email:</label><input type="email" id="checkout-input-email" class="form-input" /></div></div>' +
          '<div class="form-row"><div class="form-group"><label class="form-label">Department:</label><input type="text" id="checkout-input-dept" class="form-input" /></div><div class="form-group"><label class="form-label">Checkout Date:</label><input type="date" id="checkout-input-date" class="form-input" /></div></div>' +
          '<div class="form-row"><div class="form-group"><label class="form-label">Expected Return:</label><input type="date" id="checkout-input-expected" class="form-input" /></div><div class="form-group"><label class="form-label">Condition at Issue:</label><input type="text" id="checkout-input-condition" class="form-input" /></div></div>' +
          '<div class="form-group"><label class="form-label">Notes:</label><textarea id="checkout-input-notes" class="form-textarea" rows="2"></textarea></div>' +
        '</div>' +
        '<div class="modal-footer"><button class="btn" onclick="UI_Assignments.closeCheckoutModal()">Cancel</button><button class="btn btn-primary" onclick="UI_Assignments.submitCheckout()">Issue Equipment</button></div></div>';
      host.appendChild(co);
    }
    if (!document.getElementById("checkin-modal")) {
      var ci = document.createElement("div");
      ci.id = "checkin-modal";
      ci.className = "modal-backdrop";
      ci.onclick = function (e) { e = e || window.event; if ((e.target || e.srcElement) === ci) closeCheckinModal(); };
      ci.innerHTML = '<div class="modal"><div class="modal-header"><h3>Check-in Returned Equipment</h3><button class="btn btn-sm" onclick="UI_Assignments.closeCheckinModal()">✕</button></div>' +
        '<div class="modal-body"><input type="hidden" id="checkin-asg-id" /><p id="checkin-asset-title" style="font-weight:600; margin-bottom:14px;"></p>' +
          '<div class="form-group"><label class="form-label">Condition upon Return:</label><input type="text" id="checkin-input-condition" class="form-input" /></div>' +
          '<div class="form-group"><label class="form-label">Return Notes:</label><textarea id="checkin-input-notes" class="form-textarea" rows="2"></textarea></div>' +
        '</div>' +
        '<div class="modal-footer"><button class="btn" onclick="UI_Assignments.closeCheckinModal()">Cancel</button><button class="btn btn-primary" onclick="UI_Assignments.submitCheckin()">Confirm Return</button></div></div>';
      host.appendChild(ci);
    }
  }

  function initFilterBar() {
    if (typeof UI_FilterBar === "undefined") return;
    UI_FilterBar.init("assignments", {
      title: "Handover Records",
      placeholder: "Search employee, asset, department, notes...",
      fields: [
        {
          id: "status", label: "Assignment Status", type: "select",
          options: [
            { value: "all", label: "All Statuses" },
            { value: "active", label: "Active (Checked Out)" },
            { value: "returned", label: "Returned" }
          ]
        },
        { id: "department", label: "Department", type: "text", placeholder: "e.g. Engineering, Finance" }
      ],
      onFilter: function () { render(); }
    });
  }

  function render() {
    initFilterBar();
    var curSearch = "", curStatus = "all", curDept = "";
    if (typeof UI_FilterBar !== "undefined") {
      UI_FilterBar.render("assignments-filter-bar", "assignments");
      var crit = UI_FilterBar.getCriteria("assignments");
      curSearch = (crit.search || "").toLowerCase();
      curStatus = (crit.filters && crit.filters.status) ? crit.filters.status : "all";
      curDept = (crit.filters && crit.filters.department) ? crit.filters.department.toLowerCase() : "";
    }

    var list = AssignmentsService.getAll();
    if (curStatus !== "all") list = list.filter(function (a) { return a.status === curStatus; });
    if (curDept) list = list.filter(function (a) { return a.department && a.department.toLowerCase().indexOf(curDept) !== -1; });
    if (curSearch) {
      list = list.filter(function (a) {
        var s = (a.id + " " + (a.assetName || "") + " " + a.employeeName + " " + (a.department || "") + " " + (a.notes || "")).toLowerCase();
        return s.indexOf(curSearch) !== -1;
      });
    }
    var tbody = document.getElementById("assignments-table-tbody");
    if (!tbody) return;

    if (list.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:var(--text-tertiary); padding:30px;">No equipment assignments recorded.</td></tr>';
      return;
    }

    var html = [];
    for (var i = 0; i < list.length; i++) {
      var asg = list[i];
      var isActive = asg.status === "active";
      var statusBadge = isActive ? '<span class="badge badge-inuse">Active</span>' : '<span class="badge badge-available">Returned</span>';

      html.push('<tr class="clickable-row" onclick="UI_ActionsMenu.onRowClick(event, \'assignment\', \'' + asg.id + '\')" oncontextmenu="UI_ActionsMenu.show(event, \'assignment\', \'' + asg.id + '\')">' +
        '<td style="font-family:var(--font-mono); font-weight:600; width:90px;">' + asg.id + '</td>' +
        '<td><strong>' + asg.assetName + '</strong><br><span style="font-family:var(--font-mono); font-size:11px; color:var(--text-secondary);">' + asg.assetId + '</span></td>' +
        '<td><strong>' + asg.employeeName + '</strong><br><span style="font-size:11px; color:var(--text-secondary);">' + (asg.department || "") + '</span></td>' +
        '<td style="font-family:var(--font-mono); font-size:11px;">' + asg.checkoutDate + '</td>' +
        '<td style="font-family:var(--font-mono); font-size:11px;">' + (isActive ? (asg.expectedReturnDate || "Indefinite") : asg.returnDate) + '</td>' +
        '<td>' + statusBadge + '</td>' +
        '<td style="text-align:right; white-space:nowrap;">' +
          '<button class="btn btn-icon btn-sm action-menu-trigger" onclick="UI_ActionsMenu.show(event, \'assignment\', \'' + asg.id + '\')" title="Actions">⋮</button>' +
        '</td>' +
      "</tr>");
    }
    tbody.innerHTML = html.join("");
  }

  function openCheckoutModal(preselectedAssetId) {
    ensureModals();
    var assets = InventoryService.getAll();
    var assetItems = [];
    var hasAvailable = false;
    for (var i = 0; i < assets.length; i++) {
      var a = assets[i];
      if (a.status === "available" || a.id === preselectedAssetId) {
        assetItems.push({ value: a.id, label: a.id + " - " + a.name + " (" + a.category + ")" });
        hasAvailable = true;
      }
    }

    if (!hasAvailable) {
      Notifications.show("No available hardware assets in stock to check out.", "warning");
      return;
    }
    if (typeof UI_ComboBox !== "undefined") {
      UI_ComboBox.populate("checkout-input-asset", assetItems, preselectedAssetId || (assetItems.length > 0 ? assetItems[0].value : ""));
    }

    document.getElementById("checkout-input-employee").value = "";
    document.getElementById("checkout-input-email").value = "";
    document.getElementById("checkout-input-dept").value = "";
    document.getElementById("checkout-input-date").value = new Date().toISOString().split("T")[0];
    document.getElementById("checkout-input-expected").value = "";
    document.getElementById("checkout-input-condition").value = "Good / Functional";
    document.getElementById("checkout-input-notes").value = "";
    modal.className = "modal-backdrop open";
  }

  function closeCheckoutModal() {
    var modal = document.getElementById("checkout-modal");
    if (modal) modal.className = "modal-backdrop";
  }

  function openCheckinModal(assignmentId) {
    ensureModals();
    var asg = AssignmentsService.getById(assignmentId);
    if (!asg) return;

    var modal = document.getElementById("checkin-modal");
    document.getElementById("checkin-asg-id").value = asg.id;
    document.getElementById("checkin-asset-title").innerText = asg.assetName + " (" + asg.assetId + ") - Assigned to " + asg.employeeName;
    document.getElementById("checkin-input-condition").value = "Good / Normal Wear";
    document.getElementById("checkin-input-notes").value = "";
    modal.className = "modal-backdrop open";
  }

  function closeCheckinModal() {
    var modal = document.getElementById("checkin-modal");
    if (modal) modal.className = "modal-backdrop";
  }

  function submitCheckout() {
    var assetId = document.getElementById("checkout-input-asset").value;
    var employee = document.getElementById("checkout-input-employee").value.trim();
    if (!employee) {
      Notifications.show("Please specify employee name.", "warning");
      return;
    }

    var res = AssignmentsService.checkout({
      assetId: assetId,
      employeeName: employee,
      employeeEmail: document.getElementById("checkout-input-email").value.trim(),
      department: document.getElementById("checkout-input-dept").value.trim(),
      checkoutDate: document.getElementById("checkout-input-date").value,
      expectedReturnDate: document.getElementById("checkout-input-expected").value,
      conditionOut: document.getElementById("checkout-input-condition").value.trim(),
      notes: document.getElementById("checkout-input-notes").value.trim()
    });

    if (res.success) {
      Notifications.show("Asset " + assetId + " checked out to " + employee, "success");
      closeCheckoutModal();
      render();
      if (typeof UI_Assets !== "undefined") UI_Assets.render();
      NavController.updateBadges();
    } else {
      Notifications.show(res.error, "error");
    }
  }

  function submitCheckin() {
    var asgId = document.getElementById("checkin-asg-id").value;
    var condition = document.getElementById("checkin-input-condition").value.trim();
    var notes = document.getElementById("checkin-input-notes").value.trim();

    var res = AssignmentsService.checkin(asgId, condition, notes);
    if (res.success) {
      Notifications.show("Asset returned successfully.", "success");
      closeCheckinModal();
      render();
      if (typeof UI_Assets !== "undefined") UI_Assets.render();
      NavController.updateBadges();
    } else {
      Notifications.show(res.error, "error");
    }
  }

  function openForAsset(assetId) {
    var asset = InventoryService.getById(assetId);
    if (!asset) return;

    if (asset.status === "inuse") {
      var asgs = AssignmentsService.getActive();
      for (var i = 0; i < asgs.length; i++) {
        if (asgs[i].assetId === assetId) {
          openCheckinModal(asgs[i].id);
          return;
        }
      }
      InventoryService.update(assetId, { status: "available", assignedTo: "" });
      Notifications.show("Asset set to Available.", "info");
      UI_Assets.render();
    } else {
      openCheckoutModal(assetId);
    }
  }

  function printHandover(assignmentId) {
    var asg = AssignmentsService.getById(assignmentId);
    if (!asg) return;
    var asset = InventoryService.getById(asg.assetId);

    var printWindow = window.open("", "_blank", "width=800,height=700");
    if (!printWindow) {
      alert("Popup blocked. Please allow popups to print handover receipt.");
      return;
    }

    var html = "<!DOCTYPE html><html><head><title>Equipment Handover Receipt - " + asg.id + "</title>" +
      "<style>body { font-family: Arial, sans-serif; margin: 30px; line-height: 1.5; color: #222; } .header { border-bottom: 2px solid #000; padding-bottom: 12px; margin-bottom: 24px; } .title { font-size: 20px; font-weight: bold; margin: 0; text-transform: uppercase; } .meta { font-size: 12px; color: #555; } table { width: 100%; border-collapse: collapse; margin: 20px 0; } th, td { border: 1px solid #ccc; padding: 10px; text-align: left; font-size: 13px; } th { background: #f5f5f5; width: 25%; font-weight: bold; } .policy { font-size: 11px; color: #444; margin-top: 30px; border: 1px solid #ddd; padding: 12px; background: #fafafa; } .signatures { display: flex; justify-content: space-between; margin-top: 60px; } .sig-block { width: 45%; border-top: 1px solid #000; padding-top: 8px; font-size: 12px; }</style></head><body>" +
      '<div class="header"><div class="title">IT Equipment Handover & Acknowledgement</div><div class="meta">Document Ref: ' + asg.id + ' | Date: ' + asg.checkoutDate + '</div></div>' +
      '<table>' +
        '<tr><th>Employee Name</th><td>' + asg.employeeName + '</td></tr>' +
        '<tr><th>Department</th><td>' + (asg.department || "N/A") + '</td></tr>' +
        '<tr><th>Asset ID / Tag</th><td>' + asg.assetId + '</td></tr>' +
        '<tr><th>Hardware Name</th><td>' + asg.assetName + '</td></tr>' +
        '<tr><th>Serial Number</th><td>' + (asset ? (asset.serial || "N/A") : "N/A") + '</td></tr>' +
        '<tr><th>Model / Specs</th><td>' + (asset ? (asset.model || "N/A") : "N/A") + '</td></tr>' +
        '<tr><th>Condition at Issue</th><td>' + asg.conditionOut + '</td></tr>' +
        '<tr><th>Notes</th><td>' + (asg.notes || "None") + '</td></tr>' +
      '</table>' +
      '<div class="policy"><strong>Employee Acceptance:</strong> By signing below, I acknowledge receipt of the IT asset listed above in the condition stated. I agree to exercise reasonable care to safeguard the equipment and to promptly report any loss, damage, or malfunction to Corporate IT Services.</div>' +
      '<div class="signatures">' +
        '<div class="sig-block"><strong>Employee Signature:</strong><br><br><br>Name: ' + asg.employeeName + '<br>Date: _______________</div>' +
        '<div class="sig-block"><strong>IT Officer Signature:</strong><br><br><br>Name: ______________________<br>Date: _______________</div>' +
      '</div>' +
      "<script>window.onload = function() { window.print(); };<\/script>" +
      "</body></html>";

    printWindow.document.write(html);
    printWindow.document.close();
  }

  return {
    render: render,
    openCheckoutModal: openCheckoutModal,
    closeCheckoutModal: closeCheckoutModal,
    openCheckinModal: openCheckinModal,
    closeCheckinModal: closeCheckinModal,
    submitCheckout: submitCheckout,
    submitCheckin: submitCheckin,
    openForAsset: openForAsset,
    printHandover: printHandover
  };
})();
