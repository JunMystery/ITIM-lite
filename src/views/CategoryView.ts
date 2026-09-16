/**
 * Categories Configuration View (Pure Tailwind, Zero Emojis)
 */

import { Category } from "../types/models";
import { CatalogService } from "../services/catalog-service";
import { Modal } from "../components/Modal";
import { Toast } from "../components/Toast";

export class CategoryView {
  private static container: HTMLElement | null = null;

  public static mount(container: HTMLElement): void {
    this.container = container;
    this.render();
  }

  public static render(): void {
    if (!this.container) return;

    const categories = CatalogService.getCategories();

    this.container.innerHTML = `
      <div class="space-y-4">
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h2 class="text-xl font-bold text-gray-900 tracking-tight">Equipment Categories</h2>
            <p class="text-xs text-gray-500 mt-0.5">Asset taxonomies, identification types, and attribute schemas</p>
          </div>
          <button type="button" id="btn-add-category" class="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors">
            + New Category
          </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          ${categories
            .map(
              (cat) => `
            <div class="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
              <div>
                <div class="flex justify-between items-center mb-2">
                  <h3 class="text-sm font-bold text-gray-900">${cat.name}</h3>
                  <span class="font-mono text-xs px-2 py-0.5 bg-blue-50 text-blue-700 font-semibold rounded uppercase">${cat.type}</span>
                </div>
                <p class="text-xs text-gray-500 mb-3">${cat.description || "Standard equipment category."}</p>
                <div class="border-t border-gray-100 pt-2 flex justify-between items-center text-[11px] text-gray-400">
                  <span>Registered Assets:</span>
                  <span class="font-bold text-gray-700">${cat.itemCount || 0}</span>
                </div>
              </div>
            </div>
          `
            )
            .join("")}
        </div>
      </div>
    `;

    this.bindEvents();
  }

  private static bindEvents(): void {
    if (!this.container) return;

    const addBtn = this.container.querySelector<HTMLButtonElement>("#btn-add-category");
    if (addBtn) {
      addBtn.onclick = () => {
        this.showAddModal();
      };
    }
  }

  private static showAddModal(): void {
    const modalId = "category-add-modal";

    const bodyHtml = `
      <form id="category-add-form" class="space-y-4">
        <div>
          <label class="block text-xs font-semibold text-gray-700 mb-1">Category Name *</label>
          <input type="text" id="cat-name" class="w-full px-3 py-1.5 text-xs bg-white border border-gray-300 rounded focus:border-blue-500 focus:outline-none" required placeholder="e.g. Tablets" />
        </div>
        <div>
          <label class="block text-xs font-semibold text-gray-700 mb-1">Category Domain *</label>
          <select id="cat-type" class="w-full px-3 py-1.5 text-xs bg-white border border-gray-300 rounded focus:border-blue-500 focus:outline-none">
            <option value="hardware">Hardware</option>
            <option value="software">Software</option>
            <option value="consumable">Consumable</option>
          </select>
        </div>
        <div>
          <label class="block text-xs font-semibold text-gray-700 mb-1">Description</label>
          <input type="text" id="cat-desc" class="w-full px-3 py-1.5 text-xs bg-white border border-gray-300 rounded focus:border-blue-500 focus:outline-none" placeholder="Short description" />
        </div>
      </form>
    `;

    const footerHtml = `
      <button type="button" class="px-4 py-1.5 text-xs font-medium rounded border border-gray-300 bg-white text-gray-700 hover:bg-gray-50" onclick="Modal.close('${modalId}')">
        Cancel
      </button>
      <button type="button" id="btn-save-cat" class="px-4 py-1.5 text-xs font-semibold rounded bg-blue-600 text-white hover:bg-blue-700 shadow-sm">
        Create Category
      </button>
    `;

    Modal.show({
      id: modalId,
      title: "Add Equipment Category",
      width: "max-w-sm",
      bodyHtml,
      footerHtml
    });

    const saveBtn = document.getElementById("btn-save-cat");
    if (saveBtn) {
      saveBtn.onclick = () => {
        const name = (document.getElementById("cat-name") as HTMLInputElement).value.trim();
        const type = (document.getElementById("cat-type") as HTMLSelectElement).value as "hardware" | "software" | "consumable";
        const desc = (document.getElementById("cat-desc") as HTMLInputElement).value.trim();

        if (!name) {
          Toast.warning("Category name is required.");
          return;
        }

        CatalogService.addCategory({
          name,
          type,
          description: desc || undefined
        });

        Toast.success(`Category '${name}' created.`);
        Modal.close(modalId);
        this.render();
      };
    }
  }
}
