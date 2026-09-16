/**
 * Master Catalog View (Pure Tailwind, Zero Emojis)
 */

import { CatalogItem } from "../types/models";
import { CatalogService } from "../services/catalog-service";
import { Badge } from "../components/Badge";
import { FilterBar } from "../components/FilterBar";
import { Modal } from "../components/Modal";
import { Toast } from "../components/Toast";

export class CatalogView {
  private static container: HTMLElement | null = null;
  private static searchQuery = "";

  public static mount(container: HTMLElement): void {
    this.container = container;
    this.render();
  }

  public static render(): void {
    if (!this.container) return;

    let items = CatalogService.getCatalog();
    if (this.searchQuery) {
      items = items.filter(
        (it) =>
          it.name.toLowerCase().includes(this.searchQuery) ||
          it.category.toLowerCase().includes(this.searchQuery) ||
          (it.model && it.model.toLowerCase().includes(this.searchQuery))
      );
    }

    this.container.innerHTML = `
      <div class="space-y-4">
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h2 class="text-xl font-bold text-gray-900 tracking-tight">Master Catalog</h2>
            <p class="text-xs text-gray-500 mt-0.5">Standardized hardware models, specifications, and hardware templates</p>
          </div>
          <button type="button" id="btn-add-catalog" class="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors">
            + New Catalog Item
          </button>
        </div>

        <div id="catalog-filter-host">
          ${FilterBar.render({ searchPlaceholder: "Search catalog item, model, category..." })}
        </div>

        <div class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead class="bg-gray-50 text-gray-500 uppercase text-[10px] tracking-wider border-b border-gray-200">
                <tr>
                  <th class="py-3 px-4">Item ID</th>
                  <th class="py-3 px-4">Item Name</th>
                  <th class="py-3 px-4">Category</th>
                  <th class="py-3 px-4">Model Description</th>
                  <th class="py-3 px-4">Type</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                ${
                  items.length === 0
                    ? `<tr><td colspan="5" class="py-8 text-center text-gray-400">No catalog models registered.</td></tr>`
                    : items
                        .map(
                          (it) => `
                    <tr class="hover:bg-gray-50 transition-colors">
                      <td class="py-3 px-4 font-mono font-semibold text-blue-700">${it.id}</td>
                      <td class="py-3 px-4 font-medium text-gray-900">${it.name}</td>
                      <td class="py-3 px-4">${Badge.pill(it.category, "blue")}</td>
                      <td class="py-3 px-4 text-gray-600">${it.model || "-"}</td>
                      <td class="py-3 px-4 font-mono text-[11px] text-gray-500 uppercase">${it.type}</td>
                    </tr>
                  `
                        )
                        .join("")
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  private static bindEvents(): void {
    if (!this.container) return;

    const filterHost = this.container.querySelector<HTMLElement>("#catalog-filter-host");
    if (filterHost) {
      FilterBar.bind(filterHost, {
        onSearch: (q) => {
          this.searchQuery = q;
          this.render();
        }
      });
    }

    const addBtn = this.container.querySelector<HTMLButtonElement>("#btn-add-catalog");
    if (addBtn) {
      addBtn.onclick = () => {
        this.showAddModal();
      };
    }
  }

  private static showAddModal(): void {
    const modalId = "catalog-add-modal";
    const categories = CatalogService.getCategories();

    const bodyHtml = `
      <form id="catalog-add-form" class="space-y-4">
        <div>
          <label class="block text-xs font-semibold text-gray-700 mb-1">Item Name *</label>
          <input type="text" id="cat-name" class="w-full px-3 py-1.5 text-xs bg-white border border-gray-300 rounded focus:border-blue-500 focus:outline-none" required placeholder="e.g. Dell XPS 15" />
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-semibold text-gray-700 mb-1">Category *</label>
            <select id="cat-category" class="w-full px-3 py-1.5 text-xs bg-white border border-gray-300 rounded focus:border-blue-500 focus:outline-none">
              ${categories.map((c) => `<option value="${c.name}">${c.name}</option>`).join("")}
            </select>
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-700 mb-1">Model / Specs</label>
            <input type="text" id="cat-model" class="w-full px-3 py-1.5 text-xs bg-white border border-gray-300 rounded focus:border-blue-500 focus:outline-none" placeholder="e.g. Core i7 32GB" />
          </div>
        </div>
      </form>
    `;

    const footerHtml = `
      <button type="button" class="px-4 py-1.5 text-xs font-medium rounded border border-gray-300 bg-white text-gray-700 hover:bg-gray-50" onclick="Modal.close('${modalId}')">
        Cancel
      </button>
      <button type="button" id="btn-save-catalog-item" class="px-4 py-1.5 text-xs font-semibold rounded bg-blue-600 text-white hover:bg-blue-700 shadow-sm">
        Save Item
      </button>
    `;

    Modal.show({
      id: modalId,
      title: "Add Standard Catalog Model",
      width: "max-w-md",
      bodyHtml,
      footerHtml
    });

    const saveBtn = document.getElementById("btn-save-catalog-item");
    if (saveBtn) {
      saveBtn.onclick = () => {
        const name = (document.getElementById("cat-name") as HTMLInputElement).value.trim();
        const category = (document.getElementById("cat-category") as HTMLSelectElement).value;
        const model = (document.getElementById("cat-model") as HTMLInputElement).value.trim();

        if (!name) {
          Toast.warning("Item name is required.");
          return;
        }

        CatalogService.addCatalogItem({
          name,
          category,
          type: "hardware",
          model: model || undefined
        });

        Toast.success("Catalog item added.");
        Modal.close(modalId);
        this.render();
      };
    }
  }
}
