/**
 * Left Sidebar Navigation (Pure Tailwind, Zero Emojis)
 */

export interface NavItem {
  id: string;
  hash: string;
  label: string;
}

export const NAV_ITEMS: NavItem[] = [
  { id: "dashboard", hash: "#dashboard", label: "Dashboard" },
  { id: "assets", hash: "#assets", label: "Hardware Assets" },
  { id: "licenses", hash: "#licenses", label: "Software Licenses" },
  { id: "consumables", hash: "#consumables", label: "Consumables" },
  { id: "inbound", hash: "#inbound", label: "Inbound Intake" },
  { id: "catalog", hash: "#catalog", label: "Master Catalog" },
  { id: "categories", hash: "#categories", label: "Categories" },
  { id: "assignments", hash: "#assignments", label: "Active Custody" },
  { id: "history", hash: "#history", label: "Audit Trail" },
  { id: "settings", hash: "#settings", label: "Settings" }
];

export class Sidebar {
  public static render(activeId: string): string {
    return `
      <aside class="w-60 bg-white border-r border-gray-200 flex flex-col justify-between shrink-0 h-screen sticky top-0">
        <div>
          <!-- App Header -->
          <div class="h-14 flex items-center px-5 border-b border-gray-200">
            <div class="w-2.5 h-2.5 rounded bg-blue-600 mr-2.5"></div>
            <div>
              <h1 class="text-sm font-bold text-gray-900 tracking-tight leading-none">ITIM-lite</h1>
              <p class="text-[10px] text-gray-400 mt-0.5">Asset &amp; Inventory Suite</p>
            </div>
          </div>

          <!-- Navigation Links -->
          <nav class="p-3 space-y-1">
            ${NAV_ITEMS.map((item) => {
              const isActive = item.id === activeId;
              return `
                <a
                  href="${item.hash}"
                  class="flex items-center px-3 py-2 text-xs rounded-lg transition-colors ${
                    isActive
                      ? "bg-blue-50 text-blue-700 font-semibold border-l-2 border-blue-600"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 font-medium"
                  }"
                  data-nav="${item.id}"
                >
                  <span>${item.label}</span>
                </a>
              `;
            }).join("")}
          </nav>
        </div>

        <div class="p-4 border-t border-gray-200 bg-gray-50">
          <div class="text-[11px] text-gray-500 font-medium">Enterprise Edition</div>
          <div class="text-[10px] text-gray-400">Pure Tailwind + TypeScript</div>
        </div>
      </aside>
    `;
  }

  public static setActive(activeId: string): void {
    const links = document.querySelectorAll<HTMLAnchorElement>("[data-nav]");
    links.forEach((link) => {
      const id = link.getAttribute("data-nav");
      if (id === activeId) {
        link.className =
          "flex items-center px-3 py-2 text-xs rounded-lg transition-colors bg-blue-50 text-blue-700 font-semibold border-l-2 border-blue-600";
      } else {
        link.className =
          "flex items-center px-3 py-2 text-xs rounded-lg transition-colors text-gray-600 hover:bg-gray-50 hover:text-gray-900 font-medium";
      }
    });
  }
}
