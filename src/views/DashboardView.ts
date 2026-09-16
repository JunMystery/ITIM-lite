/**
 * Dashboard View (Pure Tailwind, Zero Emojis)
 */

import { InventoryService } from "../services/inventory-service";
import { TransactionsService } from "../services/transactions-service";
import { Badge } from "../components/Badge";

export class DashboardView {
  public static render(): string {
    const metrics = InventoryService.getMetrics();
    const transactions = TransactionsService.getAll().slice(-5).reverse();

    return `
      <div class="space-y-6">
        <div>
          <h2 class="text-xl font-bold text-gray-900 tracking-tight">System Overview</h2>
          <p class="text-xs text-gray-500 mt-1">Real-time hardware inventory and operational state</p>
        </div>

        <!-- Metric Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <span class="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Assets</span>
            <div class="text-2xl font-bold text-gray-900 mt-2">${metrics.total}</div>
            <div class="text-xs text-blue-600 mt-1">Tracked hardware items</div>
          </div>
          <div class="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <span class="text-xs font-medium text-gray-500 uppercase tracking-wider">In Use</span>
            <div class="text-2xl font-bold text-emerald-600 mt-2">${metrics.inuse}</div>
            <div class="text-xs text-gray-500 mt-1">Assigned to active users</div>
          </div>
          <div class="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <span class="text-xs font-medium text-gray-500 uppercase tracking-wider">Available</span>
            <div class="text-2xl font-bold text-sky-600 mt-2">${metrics.available}</div>
            <div class="text-xs text-gray-500 mt-1">Ready in stock room</div>
          </div>
          <div class="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <span class="text-xs font-medium text-gray-500 uppercase tracking-wider">Maintenance / Retired</span>
            <div class="text-2xl font-bold text-amber-600 mt-2">${metrics.repair + metrics.retired}</div>
            <div class="text-xs text-gray-500 mt-1">${metrics.repair} in repair, ${metrics.retired} decommissioned</div>
          </div>
        </div>

        <!-- Quick Actions & Recent Transactions -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div class="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
            <div>
              <h3 class="text-sm font-semibold text-gray-900">Quick Operations</h3>
              <p class="text-xs text-gray-500 mt-1">Accelerated workflows for inventory managers</p>
            </div>
            <div class="space-y-2.5 mt-4">
              <button type="button" class="w-full text-left px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50 hover:bg-blue-50 hover:border-blue-300 transition-colors text-xs font-medium text-gray-800" onclick="window.location.hash='#assets'">
                <span class="font-semibold text-blue-700 block">Manage Hardware Inventory</span>
                <span class="text-gray-500 text-[11px]">View full registry, assign assets, update specs</span>
              </button>
              <button type="button" class="w-full text-left px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50 hover:bg-emerald-50 hover:border-emerald-300 transition-colors text-xs font-medium text-gray-800" onclick="window.location.hash='#inbound'">
                <span class="font-semibold text-emerald-700 block">Purchase Orders &amp; Inbound Intake</span>
                <span class="text-gray-500 text-[11px]">Receive new PO shipments and auto-generate assets</span>
              </button>
              <button type="button" class="w-full text-left px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50 hover:bg-sky-50 hover:border-sky-300 transition-colors text-xs font-medium text-gray-800" onclick="window.location.hash='#assignments'">
                <span class="font-semibold text-sky-700 block">Active Custody &amp; Checkouts</span>
                <span class="text-gray-500 text-[11px]">Audit user equipment and handle check-ins</span>
              </button>
            </div>
          </div>

          <div class="lg:col-span-2 bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <div class="flex justify-between items-center mb-4">
              <div>
                <h3 class="text-sm font-semibold text-gray-900">Recent Transactions</h3>
                <p class="text-xs text-gray-500">Latest audit activity log</p>
              </div>
              <button type="button" class="text-xs font-medium text-blue-600 hover:text-blue-800" onclick="window.location.hash='#history'">View Full History &rsaquo;</button>
            </div>
            ${
              transactions.length === 0
                ? `<p class="text-xs text-gray-400 py-6 text-center">No transaction records logged yet.</p>`
                : `
              <div class="overflow-x-auto">
                <table class="w-full text-left text-xs">
                  <thead class="bg-gray-50 text-gray-500 uppercase text-[10px] tracking-wider border-b border-gray-200">
                    <tr>
                      <th class="py-2.5 px-3">Date</th>
                      <th class="py-2.5 px-3">Type</th>
                      <th class="py-2.5 px-3">Items</th>
                      <th class="py-2.5 px-3">User / Target</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-100">
                    ${transactions
                      .map(
                        (t) => `
                      <tr class="hover:bg-gray-50">
                        <td class="py-2 px-3 text-gray-500">${t.timestamp.substring(0, 10)}</td>
                        <td class="py-2 px-3">${Badge.status(t.type)}</td>
                        <td class="py-2 px-3 font-medium text-gray-900">${t.itemCount || 1} item(s)</td>
                        <td class="py-2 px-3 text-gray-700">${t.employeeName || "-"}</td>
                      </tr>
                    `
                      )
                      .join("")}
                  </tbody>
                </table>
              </div>
            `
            }
          </div>
        </div>
      </div>
    `;
  }
}
