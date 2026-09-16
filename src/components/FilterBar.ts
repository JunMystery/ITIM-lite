/**
 * Reusable FilterBar Component (Pure Tailwind)
 */

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterBarConfig {
  searchPlaceholder?: string;
  options?: FilterOption[];
  onSearch?: (query: string) => void;
  onFilterChange?: (value: string) => void;
}

export class FilterBar {
  public static render(config: FilterBarConfig): string {
    const placeholder = config.searchPlaceholder || "Search...";
    const options = config.options || [];

    return `
      <div class="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-3 rounded-lg border border-gray-200 shadow-sm mb-4">
        <div class="relative w-full sm:w-80">
          <input
            type="text"
            id="filter-search-input"
            class="w-full pl-3 pr-8 py-1.5 text-sm bg-gray-50 border border-gray-300 rounded-md focus:bg-white focus:border-blue-500 focus:outline-none"
            placeholder="${placeholder}"
          />
        </div>
        ${
          options.length > 0
            ? `
          <div class="w-full sm:w-48">
            <select
              id="filter-select-input"
              class="w-full py-1.5 px-2.5 text-sm bg-gray-50 border border-gray-300 rounded-md focus:bg-white focus:border-blue-500 focus:outline-none"
            >
              ${options.map((opt) => `<option value="${opt.value}">${opt.label}</option>`).join("")}
            </select>
          </div>
        `
            : ""
        }
      </div>
    `;
  }

  public static bind(container: HTMLElement, config: FilterBarConfig): void {
    const searchInput = container.querySelector<HTMLInputElement>("#filter-search-input");
    if (searchInput && config.onSearch) {
      searchInput.addEventListener("input", () => {
        config.onSearch!(searchInput.value.trim().toLowerCase());
      });
    }

    const select = container.querySelector<HTMLSelectElement>("#filter-select-input");
    if (select && config.onFilterChange) {
      select.addEventListener("change", () => {
        config.onFilterChange!(select.value);
      });
    }
  }
}
