/* ==========================================================================
   ITIM-lite - Transaction History View & Multi-Item Action Controller
   ========================================================================== */

var UI_History = (function () {
  var selectedAssetIds = [];
  var currentPage = 1;
  var currentPageSize = 10;
  var picker = null;
  var currentParentTxnId = null;

  function ensureModal() {
    if (document.getElementById("transaction-modal")) return;
    var host = document.getElementById("modal-host") || document.body;
    var div = document.createElement("div");
    div.id = "transaction-modal"; div.className = "modal-backdrop";
    div.onclick = function (e) { e = e || window.event; if ((e.target || e.srcElement) === div) closeModal(); };
    div.innerHTML = '<div class="modal" style="width:640px; max-width:92vw;">' +
      '<div class="modal-header"><h3 id="txn-modal-title">Multi-Item Transaction</h3><button class="btn btn-sm" onclick="UI_History.closeModal()">✕</button></div>' +
      '<div class="modal-body">' +
        '<div class="form-row">' +
          '<div class="form-group"><label class="form-label">Transaction Type:</label>' + (typeof UI_ComboBox !== "undefined" ? UI_ComboBox.renderHtml("txn-input-type", [{value:"CHECKOUT",label:"Check-out (Assign to Staff)"},{value:"CHECKIN",label:"Check-in (Return / Disposal)"},{value:"repair",label:"Send to Repair"},{value:"retired",label:"Retire / Dispose"}], "CHECKOUT", "", 'onchange="UI_History.onTypeChange()"') : '<select id="txn-input-type" class="form-select combo-box" onchange="UI_History.onTypeChange()"><option value="CHECKOUT">Check-out</option><option value="CHECKIN">Check-in</option><option value="repair">Send to Repair</option><option value="retired">Retire / Dispose</option></select>') + '</div>' +
          '<div class="form-group"><label class="form-label">Issuing IT Officer:</label><input type="text" id="txn-input-officer" class="form-input" value="IT Administrator" /></div>' +
        '</div>' +
        '<div id="txn-picker-host" style="margin-bottom:10px;"></div>' +
        '<div id="txn-checkin-fields" style="display:none; background:var(--bg-surface-secondary); padding:8px; border-radius:4px; margin-bottom:10px; border:1px solid var(--border-subtle);">' +
          '<div style="font-size:12px; font-weight:600; margin-bottom:6px;">Check-in Item Dispositions:</div>' +
          '<div id="txn-checkin-list"></div>' +
        '</div>' +
        '<div id="txn-checkout-fields">' +
          '<div class="form-row"><div class="form-group"><label class="form-label">Recipient Employee *:</label><input type="text" id="txn-input-employee" class="form-input" placeholder="Full Name" /></div><div class="form-group"><label class="form-label">Department:</label><input type="text" id="txn-input-dept" class="form-input" placeholder="Department" /></div></div>' +
          '<div class="form-row"><div class="form-group"><label class="form-label">Expected Return Date:</label><input type="date" id="txn-input-expected" class="form-input" /></div><div class="form-group"><label class="form-label">Condition at Handover:</label><input type="text" id="txn-input-condition" class="form-input" value="Good / Functional" /></div></div>' +
        '</div>' +
        '<div class="form-group"><label class="form-label">Transaction Notes / Reference:</label><textarea id="txn-input-notes" class="form-textarea" rows="2" placeholder="Ticket number, project, reason..."></textarea></div>' +
      '</div>' +
      '<div class="modal-footer"><button class="btn" onclick="UI_History.closeModal()">Cancel</button><button class="btn btn-primary" onclick="UI_History.submitTransaction()">Execute Transaction</button></div></div>';
    host.appendChild(div);
  }

  function initFilterBar() {
    if (typeof UI_FilterBar === "undefined") return;
    UI_FilterBar.init("history", {
      title: "Transaction History & Handover",
      placeholder: "Search Txn ID, party, notes, items...",
      fields: [
        {
          id: "type", label: "Transaction Type", type: "select",
          options: [
            { value: "all", label: "All Types" },
            { value: "ACTIVE_HANDOVER", label: "Active Handover" },
            { value: "CHECKOUT", label: "CHECKOUT" },
            { value: "CHECKIN", label: "CHECKIN" },
            { value: "INBOUND", label: "INBOUND" },
            { value: "STATUS_CHANGE", label: "STATUS_CHANGE" }
          ]
        },
        { id: "party", label: "Party / Employee", type: "text", placeholder: "e.g. Sarah, Warehouse" }
      ],
      onFilter: function () { currentPage = 1; render(); }
    });
  }

  function render() {
    initFilterBar();
    var curSearch = "", curType = "all", curParty = "";
    if (typeof UI_FilterBar !== "undefined") {
      UI_FilterBar.render("history-filter-bar", "history");
      var crit = UI_FilterBar.getCriteria("history");
      curSearch = (crit.search || "").toLowerCase();
      curType = (crit.filters && crit.filters.type) ? crit.filters.type : "all";
      curParty = (crit.filters && crit.filters.party) ? crit.filters.party.toLowerCase() : "";
    }

    var list = TransactionsService.getAll();
    if (curType === "ACTIVE_HANDOVER") {
      list = list.filter(function (t) { return t.type === "CHECKOUT" && t.status === "active"; });
    } else if (curType !== "all") {
      list = list.filter(function (t) { return t.type === curType; });
    }
    if (curParty) list = list.filter(function (t) { return (t.employeeName || "").toLowerCase().indexOf(curParty) !== -1 || (t.department || "").toLowerCase().indexOf(curParty) !== -1; });
    if (curSearch) {
      list = list.filter(function (t) {
        var str = (t.id + " " + t.type + " " + (t.employeeName || "") + " " + (t.notes || "")).toLowerCase();
        if (t.items) { for (var k = 0; k < t.items.length; k++) str += " " + (t.items[k].assetId || "") + " " + (t.items[k].name || ""); }
        return str.indexOf(curSearch) !== -1;
      });
    }
    var tbody = document.getElementById("history-table-tbody");
    if (!tbody) return;

    var paged = (typeof UIPagination !== "undefined")
      ? UIPagination.paginate(list, currentPage, currentPageSize)
      : { pagedItems: list, totalItems: list.length, totalPages: 1, currentPage: 1, pageSize: list.length, startItem: (list.length ? 1 : 0), endItem: list.length };

    currentPage = paged.currentPage;

    if (list.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:var(--text-tertiary); padding:30px;">No transaction history recorded yet.</td></tr>';
      if (typeof UIPagination !== "undefined") {
        UIPagination.renderBar("history-pagination-container", paged, "UI_History.setPage", "UI_History.setPageSize");
      }
      return;
    }

    var html = [];
    for (var i = 0; i < paged.pagedItems.length; i++) {
      var txn = paged.pagedItems[i];
      var badgeClass = "badge-inuse";
      if (txn.type === "CHECKIN") badgeClass = "badge-available";
      else if (txn.type === "STATUS_CHANGE" || txn.type === "retired") badgeClass = "badge-retired";

      var itemsSnippet = [];
      for (var j = 0; j < Math.min(3, txn.items.length); j++) {
        itemsSnippet.push('<span style="font-family:var(--font-mono); font-size:10px; background:var(--bg-surface-secondary); padding:1px 5px; border-radius:3px; border:1px solid var(--border-subtle);">' + txn.items[j].assetId + '</span>');
      }
      if (txn.items.length > 3) {
        itemsSnippet.push('<span style="font-size:10px; color:var(--text-tertiary);">+' + (txn.items.length - 3) + ' more</span>');
      }

      html.push('<tr class="clickable-row" onclick="UI_ActionsMenu.onRowClick(event, \'history\', \'' + txn.id + '\')" oncontextmenu="UI_ActionsMenu.show(event, \'history\', \'' + txn.id + '\')">' +
        '<td style="font-family:var(--font-mono); font-weight:700; width:100px;"><a href="javascript:void(0)" onclick="UI_History.openDetail(\'' + txn.id + '\')" style="color:var(--color-primary); text-decoration:underline;">' + txn.id + '</a></td>' +
        '<td style="width:110px;"><span class="badge ' + badgeClass + '">' + txn.type + '</span></td>' +
        '<td><strong>' + (txn.employeeName || "Stock / Internal") + '</strong><br><span style="font-size:11px; color:var(--text-secondary);">' + (txn.department || "") + '</span></td>' +
        '<td><div style="margin-bottom:3px; font-weight:600;">' + txn.itemCount + ' item' + (txn.itemCount > 1 ? 's' : '') + '</div><div style="display:flex; gap:4px; flex-wrap:wrap;">' + itemsSnippet.join(" ") + '</div></td>' +
        '<td style="font-family:var(--font-mono); font-size:11px; width:140px;">' + txn.timestamp + '</td>' +
        '<td style="text-align:right;">' +
          '<button class="btn btn-icon btn-sm action-menu-trigger" onclick="UI_ActionsMenu.show(event, \'history\', \'' + txn.id + '\')" title="Actions">⋮</button>' +
        '</td>' +
      "</tr>");
    }
    tbody.innerHTML = html.join("");

    if (typeof UIPagination !== "undefined") {
      UIPagination.renderBar("history-pagination-container", paged, "UI_History.setPage", "UI_History.setPageSize");
    }
  }

  function updateCheckinList() {
    var listEl = document.getElementById("txn-checkin-list");
    if (!listEl || !picker) return;
    var items = picker.getItems();
    if (items.length === 0) {
      listEl.innerHTML = '<span style="font-size:11px; color:var(--text-tertiary);">Select items above to configure return / disposal.</span>';
      return;
    }
    var html = [];
    var optRet = (typeof I18N !== "undefined" ? I18N.t("action_return_stock") : "Return to Stock");
    var optDisp = (typeof I18N !== "undefined" ? I18N.t("action_set_disposal") : "Set Disposal / Consumed");
    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      html.push('<div style="display:flex; justify-content:space-between; align-items:center; font-size:11px; margin-bottom:4px; background:#fff; padding:4px 8px; border-radius:3px; border:1px solid var(--border-subtle);">' +
        '<span><strong>' + it.id + '</strong> - ' + (it.name || it.id) + ' (' + (it.itemType || "asset") + (it.quantity > 1 ? " x" + it.quantity : "") + ')</span>' +
        '<select id="txn-disp-' + it.id + '" class="form-select" style="width:160px; font-size:11px; padding:1px 4px;">' +
          '<option value="return">' + optRet + '</option>' +
          '<option value="disposal">' + optDisp + '</option>' +
        '</select>' +
      '</div>');
    }
    listEl.innerHTML = html.join("");
  }

  function openCreateModal(initType) {
    currentParentTxnId = null; ensureModal();
    if (typeof UI_ItemPicker !== "undefined") picker = UI_ItemPicker.init("txn-picker-host", { onChange: updateCheckinList });
    var t = initType || "CHECKOUT";
    if (typeof UI_ComboBox !== "undefined") UI_ComboBox.setValue("txn-input-type", t);
    else if (document.getElementById("txn-input-type")) document.getElementById("txn-input-type").value = t;
    onTypeChange();
    var ids = ["employee", "dept", "expected", "notes"];
    for (var i = 0; i < ids.length; i++) { var el = document.getElementById("txn-input-" + ids[i]); if (el) el.value = ""; }
    document.getElementById("transaction-modal").className = "modal-backdrop open";
  }

  function openBulkModal(assetIds, initType) {
    openCreateModal(initType || "CHECKOUT");
    if (picker && assetIds) { for (var i = 0; i < assetIds.length; i++) picker.addItem("asset", assetIds[i]); }
  }

  function openCheckinForTxn(txnId) {
    var txn = TransactionsService.getById(txnId);
    if (!txn) return;
    openCreateModal("CHECKIN");
    currentParentTxnId = txnId;
    if (picker && txn.items) {
      for (var i = 0; i < txn.items.length; i++) {
        var it = txn.items[i];
        picker.addItem(it.itemType || "asset", it.assetId || it.id, it.quantity || 1);
      }
    }
    var notesEl = document.getElementById("txn-input-notes");
    if (notesEl) notesEl.value = "Return for " + txnId;
  }

  function openForAsset(assetId) {
    var txn = (typeof TransactionsService !== "undefined") ? TransactionsService.getActiveByAsset(assetId) : null;
    if (txn) { openCheckinForTxn(txn.id); return; }
    var a = (typeof InventoryService !== "undefined") ? InventoryService.getById(assetId) : null;
    openBulkModal([assetId], (a && a.status === "inuse") ? "CHECKIN" : "CHECKOUT");
  }

  function closeModal() {
    var modal = document.getElementById("transaction-modal");
    if (modal) modal.className = "modal-backdrop";
  }

  function onTypeChange() {
    var type = UI_ComboBox.getValue("txn-input-type") || (document.getElementById("txn-input-type") ? document.getElementById("txn-input-type").value : "CHECKOUT");
    var fCo = document.getElementById("txn-checkout-fields");
    var fCi = document.getElementById("txn-checkin-fields");
    if (fCo) fCo.style.display = (type === "CHECKOUT") ? "block" : "none";
    if (fCi) {
      fCi.style.display = (type === "CHECKIN") ? "block" : "none";
      if (type === "CHECKIN") updateCheckinList();
    }
  }

  function openDetail(txnId) { if (typeof UI_Detail !== "undefined") UI_Detail.open(txnId); }
  function closeDetailModal() { if (typeof UI_Detail !== "undefined") UI_Detail.close(); }

  function submitTransaction() {
    var items = picker ? picker.getItems() : [];
    if (items.length === 0) {
      Notifications.show("Please select at least one item for this transaction.", "warning");
      return;
    }
    var type = UI_ComboBox.getValue("txn-input-type") || document.getElementById("txn-input-type").value;
    var officer = document.getElementById("txn-input-officer").value.trim();
    var notes = document.getElementById("txn-input-notes").value.trim();
    var res;

    if (type === "CHECKOUT") {
      var emp = document.getElementById("txn-input-employee").value.trim();
      if (!emp) { Notifications.show("Please enter recipient employee name.", "warning"); return; }
      res = TransactionsService.checkoutBulk({
        items: items,
        employeeName: emp,
        department: document.getElementById("txn-input-dept").value.trim(),
        expectedReturnDate: document.getElementById("txn-input-expected").value,
        condition: document.getElementById("txn-input-condition").value.trim(),
        notes: notes,
        officer: officer
      });
    } else if (type === "CHECKIN") {
      var disps = {};
      for (var i = 0; i < items.length; i++) {
        var el = document.getElementById("txn-disp-" + items[i].id);
        disps[items[i].id] = el ? el.value : "return";
      }
      res = TransactionsService.checkinBulk({ items: items, dispositions: disps, notes: notes, officer: officer, parentTxnId: currentParentTxnId });
    } else {
      var aIds = [];
      for (var k = 0; k < items.length; k++) if (items[k].itemType === "asset") aIds.push(items[k].id);
      res = TransactionsService.changeStatusBulk(aIds.length > 0 ? aIds : items.map(function(x){ return x.id; }), type, notes);
    }

    if (res && res.success) {
      Notifications.show("Transaction " + res.transaction.id + " executed successfully with " + res.transaction.itemCount + " items!", "success");
      closeModal();
      if (typeof UI_Assets !== "undefined") { UI_Assets.clearSelection(); UI_Assets.render(); }
      render();
      NavController.updateBadges();
      if (type === "CHECKOUT" || type === "CHECKIN") {
        Notifications.confirm("Transaction " + res.transaction.id + " complete. Would you like to print the official sign-off receipt now?", function () {
          TransactionsService.printTransactionReceipt(res.transaction.id);
        });
      }
    } else {
      Notifications.show((res && res.error) ? res.error : "Transaction failed.", "error");
    }
  }

  function setPage(p) { currentPage = parseInt(p, 10) || 1; render(); }
  function setPageSize(s) { currentPageSize = parseInt(s, 10) || 10; currentPage = 1; render(); }

  return {
    render: render, openCreateModal: openCreateModal, openBulkModal: openBulkModal,
    openCheckinForTxn: openCheckinForTxn, openForAsset: openForAsset,
    closeModal: closeModal, openDetail: openDetail, closeDetailModal: closeDetailModal,
    onTypeChange: onTypeChange, submitTransaction: submitTransaction,
    setPage: setPage, setPageSize: setPageSize
  };
})();
