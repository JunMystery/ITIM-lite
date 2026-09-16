/**
 * Context Actions Menu (Pure Tailwind, Zero Emojis)
 */

export interface ActionMenuItem {
  label: string;
  danger?: boolean;
  onClick: () => void;
}

export class ActionsMenu {
  private static menuEl: HTMLElement | null = null;
  private static currentItems: ActionMenuItem[] = [];

  private static ensureMenu(): HTMLElement {
    if (!this.menuEl) {
      this.menuEl = document.createElement("div");
      this.menuEl.id = "global-actions-menu";
      this.menuEl.className = "fixed z-50 bg-white border border-gray-200 rounded-lg shadow-xl py-1 min-w-[160px] hidden";
      document.body.appendChild(this.menuEl);

      document.addEventListener("click", () => this.hide());
    }
    return this.menuEl;
  }

  public static show(e: MouseEvent, items: ActionMenuItem[]): void {
    if (e) {
      if (e.preventDefault) e.preventDefault();
      if (e.stopPropagation) e.stopPropagation();
      (e as any).cancelBubble = true;
    }

    const menu = this.ensureMenu();
    this.currentItems = items;

    menu.innerHTML = items
      .map(
        (item, idx) => `
          <button type="button" class="w-full text-left px-4 py-2 text-xs font-medium ${
            item.danger ? "text-red-600 hover:bg-red-50" : "text-gray-700 hover:bg-blue-50 hover:text-blue-700"
          } transition-colors block" data-idx="${idx}">
            ${item.label}
          </button>
        `
      )
      .join("");

    const buttons = menu.querySelectorAll("button");
    buttons.forEach((btn) => {
      btn.onclick = (ev) => {
        if (ev) {
          if (ev.stopPropagation) ev.stopPropagation();
          (ev as any).cancelBubble = true;
        }
        const idx = parseInt(btn.getAttribute("data-idx") || "0", 10);
        this.hide();
        if (this.currentItems[idx]) {
          this.currentItems[idx].onClick();
        }
      };
    });

    menu.style.display = "block";
    const x = Math.min(e.clientX, window.innerWidth - 180);
    const y = Math.min(e.clientY, window.innerHeight - (items.length * 36 + 20));
    menu.style.left = `${Math.max(10, x)}px`;
    menu.style.top = `${Math.max(10, y)}px`;
  }

  public static hide(): void {
    if (this.menuEl) {
      this.menuEl.style.display = "none";
    }
  }
}
