/**
 * Consumable Stock Management View (Pure Tailwind, Zero Emojis)
 */

import { ConsumablesService } from "../services/consumables-service";
import { FilterBar } from "../components/FilterBar";
import { Toast } from "../components/Toast";

export class ConsumableView {
  private static container: HTMLElement | null = null;
  private static searchQuery = "";

  public static mount(container: HTMLElement): void {
    this.container = container;
    this.render();
  }

  public static render(): void {
    if (!this.container) return;

    let items = ConsumablesService.getAll();
    if (this.searchQuery) {
      items = items.filter(
        (c) =>
          c.name.toLowerCase().includes(this.searchQuery) ||
          c.category.toLowerCase().includes(this.searchQuery) ||
          (c.location && c.location.toLowerCase().includes(this.searchQuery))
      );
    }

    this.container.innerHTML = `
      <div class="space-y-4">
        <div>
          <h2 class="text-xl font-bold text-gray-900 tracking-tight">Consumables &amp; Peripherals</h2>
          <p class="text-xs text-gray-500 mt-0.5">Track bulk stock, cables, toners, and replenish thresholds</p>
        </div>

        <div id="consumable-filter-host">
          ${FilterBar.render({ searchPlaceholder: "Search consumable item, category, shelf..." })}
        </div>

        <div class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead class="bg-gray-50 text-gray-500 uppercase text-[10px] tracking-wider border-b border-gray-200">
                <tr>
                  <th class="py-3 px-4">Item ID</th>
                  <th class="py-3 px-4">Description</th>
                  <th class="py-3 px-4">Category</th>
                  <th class="py-3 px-4">Current Stock</th>
                  <th class="py-3 px-4">Threshold</th>
                  <th class="py-3 px-4">Storage Location</th>
                  <th class="py-3 px-4 text-center">Quick Adjust</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                ${
                  items.length === 0
                    ? `<tr><td colspan="7" class="py-8 text-center text-gray-400">No consumable items registered.</td></tr>`
                    : items
                        .map((c) => {
                          const isLow = ConsumablesService.isLowStock(c);
                          return `
                    <tr class="hover:bg-gray-50 transition-colors">
                      <td class="py-3 px-4 font-mono font-semibold text-blue-700">${c.id}</td>
                      <td class="py-3 px-4 font-medium text-gray-900">${c.name}</td>
                      <td class="py-3 px-4 text-gray-600">${c.category}</td>
                      <td class="py-3 px-4">
                        <span class="font-bold text-sm ${isLow ? "text-rose-600" : "text-gray-900"}">${c.quantity}</span>
                        ${
                          isLow
                            ? `<span class="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-100 text-rose-800">LOW STOCK</span>`
                            : ""
                        }
                      </td>
                      <td class="py-3 px-4 text-gray-500 font-mono">Min: ${c.minQuantity}</td>
                      <td class="py-3 px-4 text-gray-600">${c.location || "-"}</td>
                      <td class="py-3 px-4 text-center">
                        <div class="inline-flex rounded-md shadow-sm" role="group">
                          <button type="button" class="btn-adjust px-2.5 py-1 text-xs font-bold text-gray-700 bg-white border border-gray-300 rounded-l hover:bg-gray-100" data-id="${c.id}" data-delta="-1">-</button>
                          <button type="button" class="btn-adjust px-2.5 py-1 text-xs font-bold text-gray-700 bg-white border-t border-b border-r border-gray-300 rounded-r hover:bg-gray-100" data-id="${c.id}" data-delta="1">+</button>
                        </div>
                      </td>
                    </tr>
                  `;
                        })
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

    const filterHost = this.container.querySelector<HTMLElement>("#consumable-filter-host");
    if (filterHost) {
      FilterBar.bind(filterHost, {
        onSearch: (q) => {
          this.searchQuery = q;
          this.render();
        }
      });
    }

    const adjustBtns = this.container.querySelectorAll<HTMLButtonElement>(".btn-adjust");
    adjustBtns.forEach((btn) => {
      btn.onclick = () => {
        const id = btn.getAttribute("data-id");
        const delta = parseInt(btn.getAttribute("data-delta") || "0", 10);
        if (id && delta) {
          const updated = ConsumablesService.adjustStock(id, delta);
          if (updated) {
            Toast.info(`Updated stock for ${updated.name}: ${updated.quantity}`);
            this.render();
          }
        }
      };
    });
  }
}
