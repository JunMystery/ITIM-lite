/**
 * Top Application Navbar (Pure Tailwind, Zero Emojis)
 */

export class Navbar {
  public static render(): string {
    const isHta = typeof window !== "undefined" && "ActiveXObject" in window;

    return `
      <header class="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 z-20 shadow-xs">
        <div class="flex items-center space-x-3">
          <span class="text-xs font-semibold text-gray-400 uppercase tracking-wider">Workspace</span>
          <span class="text-xs text-gray-300">/</span>
          <span class="text-xs font-medium text-gray-700" id="navbar-view-title">Dashboard</span>
        </div>

        <div class="flex items-center space-x-3">
          <span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${
            isHta ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"
          }">
            ${isHta ? "MSHTA ActiveX Mode" : "Browser Active"}
          </span>
          <span class="text-xs text-gray-400 font-mono">v2.0-TS</span>
        </div>
      </header>
    `;
  }

  public static setTitle(title: string): void {
    const el = document.getElementById("navbar-view-title");
    if (el) el.textContent = title;
  }
}
