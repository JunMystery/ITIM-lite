/**
 * Hardware Asset Management View (Pure Tailwind, Zero Emojis)
 */

import { HardwareAsset } from "../types/inventory";
import { InventoryService } from "../services/inventory-service";
import { Badge } from "../components/Badge";
import { FilterBar } from "../components/FilterBar";
import { Pagination } from "../components/Pagination";
import { ActionsMenu } from "../components/ActionsMenu";
import { Toast } from "../components/Toast";
import { AssetModal } from "./AssetModal";

export class AssetView {
  private static container: HTMLElement | null = null;
  private static searchQuery = "";
  private static selectedCategory = "ALL";
  private static currentPage = 1;
  private static pageSize = 10;

  public static mount(container: HTMLElement): void {
    this.container = container;
    this.currentPage = 1;
    this.render();
  }

  private static getFilteredAssets(): HardwareAsset[] {
    let list = InventoryService.getAll();
    if (this.selectedCategory !== "ALL") {
      list = list.filter((a) => a.category === this.selectedCategory);
    }
    if (this.searchQuery) {
      list = list.filter(
        (a) =>
          a.id.toLowerCase().includes(this.searchQuery) ||
          a.name.toLowerCase().includes(this.searchQuery) ||
          (a.model && a.model.toLowerCase().includes(this.searchQuery)) ||
          (a.serial && a.serial.toLowerCase().includes(this.searchQuery)) ||
          (a.assignedTo && a.assignedTo.toLowerCase().includes(this.searchQuery))
      );
    }
    return list;
  }

  public static render(): void {
    if (!this.container) return;

    const filtered = this.getFilteredAssets();
    const totalItems = filtered.length;
    const startIdx = (this.currentPage - 1) * this.pageSize;
    const pagedAssets = filtered.slice(startIdx, startIdx + this.pageSize);

    const categories = ["ALL", "Laptop", "Desktop", "Monitor", "Printer", "Network", "Server", "Mobile", "Other"];

    this.container.innerHTML = `
      <div class="space-y-4">
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h2 class="text-xl font-bold text-gray-900 tracking-tight">Hardware Assets</h2>
            <p class="text-xs text-gray-500 mt-0.5">Comprehensive physical equipment registry and assignment tracking</p>
          </div>
          <button type="button" id="btn-add-asset" class="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors">
            + New Asset
          </button>
        </div>

        <div id="asset-filter-host">
          ${FilterBar.render({
            searchPlaceholder: "Search tag, name, model, serial, user...",
            options: categories.map((c) => ({ value: c, label: c === "ALL" ? "All Categories" : c }))
          })}
        </div>

        <div class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead class="bg-gray-50 text-gray-500 uppercase text-[10px] tracking-wider border-b border-gray-200">
                <tr>
                  <th class="py-3 px-4">Tag</th>
                  <th class="py-3 px-4">Category</th>
                  <th class="py-3 px-4">Item Name / Model</th>
                  <th class="py-3 px-4">Serial No.</th>
                  <th class="py-3 px-4">Status</th>
                  <th class="py-3 px-4">Assigned User</th>
                  <th class="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                ${
                  pagedAssets.length === 0
                    ? `<tr><td colspan="7" class="py-8 text-center text-gray-400">No hardware assets match your filter criteria.</td></tr>`
                    : pagedAssets
                        .map(
                          (a) => `
                    <tr class="hover:bg-gray-50 transition-colors">
                      <td class="py-3 px-4 font-mono font-semibold text-blue-700">${a.id}</td>
                      <td class="py-3 px-4">${Badge.pill(a.category, "blue")}</td>
                      <td class="py-3 px-4">
                        <div class="font-medium text-gray-900">${a.name}</div>
                        ${a.model ? `<div class="text-[10px] text-gray-400 font-mono">${a.model}</div>` : ""}
                      </td>
                      <td class="py-3 px-4 font-mono text-gray-600">${a.serial || "-"}</td>
                      <td class="py-3 px-4">${Badge.status(a.status)}</td>
                      <td class="py-3 px-4 text-gray-800">${a.assignedTo || `<span class="text-gray-400 italic">Unassigned</span>`}</td>
                      <td class="py-3 px-4 text-right">
                        <button type="button" class="btn-action-trigger px-2 py-1 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded font-medium border border-gray-200" data-asset-id="${a.id}">
                          Actions &equiv;
                        </button>
                      </td>
                    </tr>
                  `
                        )
                        .join("")
                }
              </tbody>
            </table>
          </div>

          <div id="asset-pagination-host">
            ${Pagination.render({
              currentPage: this.currentPage,
              pageSize: this.pageSize,
              totalItems,
              onPageChange: () => {}
            })}
          </div>
        </div>
      </div>
    `;

    this.bindEvents(filtered);
  }

  private static bindEvents(filtered: HardwareAsset[]): void {
    if (!this.container) return;

    const addBtn = this.container.querySelector<HTMLButtonElement>("#btn-add-asset");
    if (addBtn) {
      addBtn.onclick = () => {
        AssetModal.show(undefined, () => this.render());
      };
    }

    const filterHost = this.container.querySelector<HTMLElement>("#asset-filter-host");
    if (filterHost) {
      FilterBar.bind(filterHost, {
        onSearch: (q) => {
          this.searchQuery = q;
          this.currentPage = 1;
          this.render();
        },
        onFilterChange: (cat) => {
          this.selectedCategory = cat;
          this.currentPage = 1;
          this.render();
        }
      });
    }

    const pagHost = this.container.querySelector<HTMLElement>("#asset-pagination-host");
    if (pagHost) {
      Pagination.bind(pagHost, {
        currentPage: this.currentPage,
        pageSize: this.pageSize,
        totalItems: filtered.length,
        onPageChange: (newPage) => {
          this.currentPage = newPage;
          this.render();
        }
      });
    }

    const actionBtns = this.container.querySelectorAll<HTMLButtonElement>(".btn-action-trigger");
    actionBtns.forEach((btn) => {
      btn.onclick = (e) => {
        const id = btn.getAttribute("data-asset-id");
        if (!id) return;
        const asset = InventoryService.getById(id);
        if (!asset) return;

        ActionsMenu.show(e, [
          {
            label: "Edit Specifications",
            onClick: () => AssetModal.show(asset, () => this.render())
          },
          {
            label: asset.status === "inuse" ? "Check In to Stock" : "Check Out to User",
            onClick: () => {
              if (asset.status === "inuse") {
                InventoryService.update(asset.id, { status: "available", assignedTo: undefined });
                Toast.success(`Asset ${asset.id} returned to available stock.`);
              } else {
                const user = prompt("Assign asset to user name:");
                if (user && user.trim()) {
                  InventoryService.update(asset.id, { status: "inuse", assignedTo: user.trim() });
                  Toast.success(`Asset ${asset.id} checked out to ${user.trim()}.`);
                }
              }
              this.render();
            }
          },
          {
            label: asset.status === "repair" ? "Mark Repair Completed" : "Send for Repair",
            onClick: () => {
              const newStatus = asset.status === "repair" ? "available" : "repair";
              InventoryService.update(asset.id, { status: newStatus });
              Toast.info(`Status updated to ${newStatus}`);
              this.render();
            }
          },
          {
            label: "Retire Asset",
            onClick: () => {
              if (confirm(`Are you sure you want to decommission ${asset.id}?`)) {
                InventoryService.update(asset.id, { status: "retired", assignedTo: undefined });
                Toast.warning(`Asset ${asset.id} marked as retired.`);
                this.render();
              }
            }
          },
          {
            label: "Delete Asset",
            danger: true,
            onClick: () => {
              if (confirm(`Permanently delete asset ${asset.id}? This cannot be undone.`)) {
                InventoryService.delete(asset.id);
                Toast.error(`Asset ${asset.id} deleted.`);
                this.render();
              }
            }
          }
        ]);
      };
    });
  }
}
