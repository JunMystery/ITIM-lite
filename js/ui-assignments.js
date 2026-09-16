/* ==========================================================================
   ITIM-lite - Assignments Backward Compatibility Proxy (Delegates to UI_History)
   ========================================================================== */

var UI_Assignments = (function () {
  function render() {
    if (typeof UI_History !== "undefined") UI_History.render();
  }

  function openCheckoutModal(preselectedAssetId) {
    if (typeof UI_History !== "undefined") {
      UI_History.openBulkModal(preselectedAssetId ? [preselectedAssetId] : null, "CHECKOUT");
    }
  }

  function closeCheckoutModal() {
    if (typeof UI_History !== "undefined") UI_History.closeModal();
  }

  function openCheckinModal(assignmentId) {
    if (typeof UI_History !== "undefined") {
      var asg = (typeof AssignmentsService !== "undefined") ? AssignmentsService.getById(assignmentId) : null;
      if (asg && asg.txnId) UI_History.openCheckinForTxn(asg.txnId);
      else if (asg && asg.assetId) UI_History.openForAsset(asg.assetId);
      else UI_History.openCreateModal("CHECKIN");
    }
  }

  function closeCheckinModal() {
    if (typeof UI_History !== "undefined") UI_History.closeModal();
  }

  function openForAsset(assetId) {
    if (typeof UI_History !== "undefined") UI_History.openForAsset(assetId);
  }

  function printHandover(assignmentId) {
    var asg = (typeof AssignmentsService !== "undefined") ? AssignmentsService.getById(assignmentId) : null;
    if (asg && asg.txnId && typeof TransactionsService !== "undefined") {
      TransactionsService.printTransactionReceipt(asg.txnId);
    }
  }

  return {
    render: render,
    openCheckoutModal: openCheckoutModal,
    closeCheckoutModal: closeCheckoutModal,
    openCheckinModal: openCheckinModal,
    closeCheckinModal: closeCheckinModal,
    openForAsset: openForAsset,
    printHandover: printHandover,
    submitCheckout: function () {},
    submitCheckin: function () {}
  };
})();
