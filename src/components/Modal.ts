/**
 * Reusable Centered Modal Dialog Component (Pure Tailwind Classes)
 */

export interface ModalConfig {
  id: string;
  title: string;
  width?: string;
  bodyHtml: string;
  footerHtml?: string;
  onClose?: () => void;
}

export class Modal {
  public static render(config: ModalConfig): string {
    const maxWidth = config.width || "max-w-lg";
    return `
      <div id="${config.id}" class="fixed inset-0 w-full h-full z-50 text-center overflow-y-auto p-4 box-border before:content-[''] before:inline-block before:h-full before:align-middle before:-mr-1" style="background-color: rgba(0, 0, 0, 0.5);" onclick="if ((event.target || event.srcElement) === this) Modal.close('${config.id}')">
        <div class="inline-block align-middle text-left bg-white rounded-xl shadow-2xl overflow-hidden border border-gray-200 w-full ${maxWidth} my-6">
          <div class="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-white">
            <h3 class="text-base font-semibold text-gray-900">${config.title}</h3>
            <button type="button" class="text-gray-400 hover:text-gray-600 p-1 text-sm font-bold" onclick="Modal.close('${config.id}')">&times;</button>
          </div>
          <div class="px-6 py-5 max-h-[65vh] overflow-y-auto">
            ${config.bodyHtml}
          </div>
          ${
            config.footerHtml
              ? `
            <div class="px-6 py-3.5 bg-gray-50 border-t border-gray-200 flex justify-end items-center space-x-3">
              ${config.footerHtml}
            </div>
          `
              : ""
          }
        </div>
      </div>
    `;
  }

  public static show(config: ModalConfig): void {
    let host = document.getElementById("modal-host");
    if (!host) {
      host = document.createElement("div");
      host.id = "modal-host";
      document.body.appendChild(host);
    }
    const existing = document.getElementById(config.id);
    if (existing && existing.parentNode) {
      existing.parentNode.removeChild(existing);
    }
    const div = document.createElement("div");
    div.innerHTML = this.render(config);
    if (div.firstElementChild) {
      host.appendChild(div.firstElementChild);
    }
  }

  public static close(id: string): void {
    const el = document.getElementById(id);
    if (el && el.parentNode) {
      el.parentNode.removeChild(el);
    }
  }
}

if (typeof window !== "undefined") {
  (window as any).Modal = Modal;
}
