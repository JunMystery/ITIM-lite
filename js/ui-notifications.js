/* ==========================================================================
   ITIM-lite - Toast Notifications & User Alerts
   ========================================================================== */

var Notifications = (function () {
  var container = null;

  function init() {
    container = document.getElementById("toast-container");
    if (!container) {
      container = document.createElement("div");
      container.id = "toast-container";
      container.className = "toast-container";
      document.body.appendChild(container);
    }
  }

  function show(message, type, duration) {
    if (!container) init();
    type = type || "info";
    duration = duration || 3500;

    var toast = document.createElement("div");
    toast.className = "toast toast-" + type;

    var prefix = "";
    if (type === "success") prefix = "✓ ";
    else if (type === "error") prefix = "✕ ";
    else if (type === "warning") prefix = "[!] ";

    toast.innerText = prefix + message;
    container.appendChild(toast);

    setTimeout(function () {
      if (toast.parentNode) {
        toast.style.opacity = "0";
        toast.style.transform = "translateX(50px)";
        toast.style.transition = "all 0.3s ease";
        setTimeout(function () {
          if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
          }
        }, 300);
      }
    }, duration);
  }

  function confirm(message, onYes, onNo) {
    var confirmed = window.confirm(message);
    if (confirmed) {
      if (typeof onYes === "function") onYes();
    } else {
      if (typeof onNo === "function") onNo();
    }
    return confirmed;
  }

  return {
    init: init,
    show: show,
    confirm: confirm
  };
})();
