/**
 * Reusable Toast Notification System (Pure Tailwind)
 */

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastOptions {
  message: string;
  type?: ToastType;
  durationMs?: number;
}

export class Toast {
  private static host: HTMLElement | null = null;

  private static ensureHost(): HTMLElement {
    if (!this.host) {
      this.host = document.getElementById("toast-host");
      if (!this.host) {
        this.host = document.createElement("div");
        this.host.id = "toast-host";
        this.host.className = "fixed bottom-5 right-5 z-50 flex flex-col space-y-2 pointer-events-none";
        document.body.appendChild(this.host);
      }
    }
    return this.host;
  }

  public static show(message: string, type: ToastType = "info", durationMs: number = 3000): void {
    const host = this.ensureHost();

    const colors: Record<ToastType, { bg: string; text: string; border: string; icon: string }> = {
      success: { bg: "bg-emerald-50", text: "text-emerald-800", border: "border-emerald-300", icon: "&#10003;" },
      error: { bg: "bg-rose-50", text: "text-rose-800", border: "border-rose-300", icon: "&#10005;" },
      warning: { bg: "bg-amber-50", text: "text-amber-800", border: "border-amber-300", icon: "&#33;" },
      info: { bg: "bg-blue-50", text: "text-blue-800", border: "border-blue-300", icon: "i" }
    };

    const c = colors[type] || colors.info;

    const toastEl = document.createElement("div");
    toastEl.className = `pointer-events-auto flex items-center space-x-2.5 px-4 py-2.5 rounded-lg border shadow-lg text-xs font-medium ${c.bg} ${c.text} ${c.border} transition-opacity duration-200`;
    toastEl.innerHTML = `
      <span class="inline-flex items-center justify-center w-4 h-4 rounded-full font-bold text-xs">${c.icon}</span>
      <span>${message}</span>
    `;

    host.appendChild(toastEl);

    setTimeout(() => {
      toastEl.style.opacity = "0";
      setTimeout(() => {
        if (toastEl.parentNode) {
          toastEl.parentNode.removeChild(toastEl);
        }
      }, 200);
    }, durationMs);
  }

  public static success(msg: string): void {
    this.show(msg, "success");
  }

  public static error(msg: string): void {
    this.show(msg, "error");
  }

  public static warning(msg: string): void {
    this.show(msg, "warning");
  }

  public static info(msg: string): void {
    this.show(msg, "info");
  }
}

if (typeof window !== "undefined") {
  (window as any).Toast = Toast;
}
