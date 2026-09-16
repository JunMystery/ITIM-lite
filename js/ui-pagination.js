/* ==========================================================================
   ITIM-lite - Reusable Table Pagination Engine & UI Controller
   Handles slicing, page-size selection, and navigation controls
   ========================================================================== */

var UIPagination = (function () {
  var DEFAULT_PAGE_SIZES = [10, 25, 50, 100];

  function paginate(items, page, pageSize) {
    items = items || [];
    pageSize = parseInt(pageSize, 10) || 10;
    if (pageSize <= 0) pageSize = 10;

    var totalItems = items.length;
    var totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    var currentPage = parseInt(page, 10) || 1;
    if (currentPage < 1) currentPage = 1;
    if (currentPage > totalPages) currentPage = totalPages;

    var startIndex = (currentPage - 1) * pageSize;
    var endIndex = Math.min(startIndex + pageSize, totalItems);
    var pagedItems = items.slice(startIndex, endIndex);

    return {
      pagedItems: pagedItems,
      totalItems: totalItems,
      totalPages: totalPages,
      currentPage: currentPage,
      pageSize: pageSize,
      startItem: totalItems === 0 ? 0 : startIndex + 1,
      endItem: endIndex
    };
  }

  function renderBar(containerId, meta, onPageChangeCall, onSizeChangeCall) {
    var container = typeof containerId === "string" ? document.getElementById(containerId) : containerId;
    if (!container) return;

    var sizeOpts = [];
    for (var i = 0; i < DEFAULT_PAGE_SIZES.length; i++) {
      var s = DEFAULT_PAGE_SIZES[i];
      var isSel = (s === meta.pageSize) ? " selected" : "";
      sizeOpts.push('<option value="' + s + '"' + isSel + '>' + s + '</option>');
    }

    var showingText = "Showing " + meta.startItem + "–" + meta.endItem + " of " + meta.totalItems;
    var perPageText = "per page";
    var pageText = "Page " + meta.currentPage + " of " + meta.totalPages;

    if (typeof I18N !== "undefined" && typeof I18N.t === "function") {
      showingText = (I18N.t("showing_items") || "Showing") + " " + meta.startItem + "–" + meta.endItem + " " + (I18N.t("of") || "of") + " " + meta.totalItems;
      perPageText = I18N.t("per_page") || "per page";
      pageText = (I18N.t("page") || "Page") + " " + meta.currentPage + " " + (I18N.t("of") || "of") + " " + meta.totalPages;
    }

    var isFirst = meta.currentPage <= 1;
    var isLast = meta.currentPage >= meta.totalPages;

    var html = '<div class="pagination-bar">' +
      '<div class="pagination-info">' +
        '<span>' + showingText + '</span>' +
        '<div class="pagination-size-wrap">' +
          (typeof UI_ComboBox !== "undefined"
            ? '<div style="width:75px;">' + UI_ComboBox.renderHtml("page-size-" + (typeof containerId === "string" ? containerId : "wrap"), DEFAULT_PAGE_SIZES, meta.pageSize, "searchable-combo-sm", 'onchange="' + onSizeChangeCall + '(this.value)"') + '</div>'
            : '<select class="form-select combo-box combo-box-sm" style="width:70px;" onchange="' + onSizeChangeCall + '(this.value)">' + sizeOpts.join("") + '</select>') +
          '<span>' + perPageText + '</span>' +
        '</div>' +
      '</div>' +
      '<div class="pagination-controls">' +
        '<button class="btn btn-sm" onclick="' + onPageChangeCall + '(1)"' + (isFirst ? " disabled" : "") + ' title="First Page">«</button>' +
        '<button class="btn btn-sm" onclick="' + onPageChangeCall + '(' + (meta.currentPage - 1) + ')"' + (isFirst ? " disabled" : "") + ' title="Previous Page">‹</button>' +
        '<span style="margin:0 6px; font-weight:600;">' + pageText + '</span>' +
        '<button class="btn btn-sm" onclick="' + onPageChangeCall + '(' + (meta.currentPage + 1) + ')"' + (isLast ? " disabled" : "") + ' title="Next Page">›</button>' +
        '<button class="btn btn-sm" onclick="' + onPageChangeCall + '(' + meta.totalPages + ')"' + (isLast ? " disabled" : "") + ' title="Last Page">»</button>' +
      '</div>' +
    '</div>';

    container.innerHTML = html;
  }

  return {
    paginate: paginate,
    renderBar: renderBar,
    PAGE_SIZES: DEFAULT_PAGE_SIZES
  };
})();
