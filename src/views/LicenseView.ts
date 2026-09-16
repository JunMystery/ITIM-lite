/**
 * Software License Tracking View (Pure Tailwind, Zero Emojis)
 */

import { SoftwareLicense } from "../types/models";
import { LicensesService } from "../services/licenses-service";
import { FilterBar } from "../components/FilterBar";

export class LicenseView {
  private static container: HTMLElement | null = null;
  private static searchQuery = "";

  public static mount(container: HTMLElement): void {
    this.container = container;
    this.render();
  }

  private static getFiltered(): SoftwareLicense[] {
    const list = LicensesService.getAll();
    if (!this.searchQuery) return list;
    return list.filter(
      (l) =>
        l.software.toLowerCase().includes(this.searchQuery) ||
        (l.vendor && l.vendor.toLowerCase().includes(this.searchQuery)) ||
        (l.key && l.key.toLowerCase().includes(this.searchQuery))
    );
  }

  public static render(): void {
    if (!this.container) return;
    const items = this.getFiltered();

    this.container.innerHTML = `
      <div class="space-y-4">
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h2 class="text-xl font-bold text-gray-900 tracking-tight">Software Licenses</h2>
            <p class="text-xs text-gray-500 mt-0.5">Enterprise licenses, seat utilization, and expiration tracking</p>
          </div>
        </div>

        <div id="license-filter-host">
          ${FilterBar.render({ searchPlaceholder: "Search software name, vendor, license key..." })}
        </div>

        <div class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead class="bg-gray-50 text-gray-500 uppercase text-[10px] tracking-wider border-b border-gray-200">
                <tr>
                  <th class="py-3 px-4">License ID</th>
                  <th class="py-3 px-4">Software Name</th>
                  <th class="py-3 px-4">Vendor</th>
                  <th class="py-3 px-4">Type</th>
                  <th class="py-3 px-4">Seat Utilization</th>
                  <th class="py-3 px-4">Key Reference</th>
                  <th class="py-3 px-4">Expiry Date</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                ${
                  items.length === 0
                    ? `<tr><td colspan="7" class="py-8 text-center text-gray-400">No software licenses registered.</td></tr>`
                    : items
                        .map((l) => {
                          const percent = Math.round((l.assignedSeats / l.totalSeats) * 100);
                          const barColor = percent >= 90 ? "bg-rose-500" : percent >= 75 ? "bg-amber-500" : "bg-blue-600";
                          return `
                    <tr class="hover:bg-gray-50 transition-colors">
                      <td class="py-3 px-4 font-mono font-semibold text-blue-700">${l.id}</td>
                      <td class="py-3 px-4 font-semibold text-gray-900">${l.software}</td>
                      <td class="py-3 px-4 text-gray-600">${l.vendor || "-"}</td>
                      <td class="py-3 px-4 text-gray-600">${l.licenseType}</td>
                      <td class="py-3 px-4 min-w-[160px]">
                        <div class="flex justify-between text-[11px] mb-1">
                          <span class="font-medium text-gray-700">${l.assignedSeats} / ${l.totalSeats}</span>
                          <span class="text-gray-500 font-mono">${percent}%</span>
                        </div>
                        <div class="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                          <div class="${barColor} h-2 rounded-full" style="width: ${percent}%"></div>
                        </div>
                      </td>
                      <td class="py-3 px-4 font-mono text-gray-500 text-[11px]">${l.key || "-"}</td>
                      <td class="py-3 px-4 text-gray-600">${l.expiryDate || "-"}</td>
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

    const filterHost = this.container.querySelector<HTMLElement>("#license-filter-host");
    if (filterHost) {
      FilterBar.bind(filterHost, {
        onSearch: (q) => {
          this.searchQuery = q;
          this.render();
        }
      });
    }
  }
}
