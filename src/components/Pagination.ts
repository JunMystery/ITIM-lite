/**
 * Reusable Pagination Component (Pure Tailwind)
 */

export interface PaginationConfig {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (newPage: number) => void;
}

export class Pagination {
  public static render(config: PaginationConfig): string {
    const totalPages = Math.max(1, Math.ceil(config.totalItems / config.pageSize));
    const startItem = config.totalItems === 0 ? 0 : (config.currentPage - 1) * config.pageSize + 1;
    const endItem = Math.min(config.totalItems, config.currentPage * config.pageSize);

    return `
      <div class="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6">
        <div class="text-xs text-gray-700">
          Showing <span class="font-semibold text-gray-900">${startItem}</span> to <span class="font-semibold text-gray-900">${endItem}</span> of <span class="font-semibold text-gray-900">${config.totalItems}</span> results
        </div>
        <div class="flex items-center space-x-2">
          <button
            type="button"
            class="px-2.5 py-1 text-xs font-medium rounded border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            id="pagination-btn-prev"
            ${config.currentPage <= 1 ? "disabled" : ""}
          >
            &lsaquo; Prev
          </button>
          <span class="text-xs text-gray-600 px-1">
            Page ${config.currentPage} of ${totalPages}
          </span>
          <button
            type="button"
            class="px-2.5 py-1 text-xs font-medium rounded border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            id="pagination-btn-next"
            ${config.currentPage >= totalPages ? "disabled" : ""}
          >
            Next &rsaquo;
          </button>
        </div>
      </div>
    `;
  }

  public static bind(container: HTMLElement, config: PaginationConfig): void {
    const prevBtn = container.querySelector<HTMLButtonElement>("#pagination-btn-prev");
    const nextBtn = container.querySelector<HTMLButtonElement>("#pagination-btn-next");

    if (prevBtn) {
      prevBtn.onclick = () => {
        if (config.currentPage > 1) {
          config.onPageChange(config.currentPage - 1);
        }
      };
    }
    if (nextBtn) {
      nextBtn.onclick = () => {
        const totalPages = Math.max(1, Math.ceil(config.totalItems / config.pageSize));
        if (config.currentPage < totalPages) {
          config.onPageChange(config.currentPage + 1);
        }
      };
    }
  }
}
