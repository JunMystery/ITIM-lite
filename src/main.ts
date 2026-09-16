import "./style.css";
import { Sidebar } from "./components/Sidebar";
import { Navbar } from "./components/Navbar";
import { Router } from "./router";

function bootstrap(): void {
  const app = document.getElementById("app");
  if (!app) {
    console.error("Target host element #app not found.");
    return;
  }

  app.className = "flex h-screen w-screen overflow-hidden bg-gray-100 font-sans text-gray-900";
  app.innerHTML = `
    ${Sidebar.render("dashboard")}
    <div class="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
      ${Navbar.render()}
      <main id="main-content" class="flex-1 p-6 overflow-y-auto bg-gray-50">
        <!-- Views dynamically mounted by Router -->
      </main>
    </div>
  `;

  const mainContent = document.getElementById("main-content");
  if (mainContent) {
    Router.init(mainContent);
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootstrap);
} else {
  bootstrap();
}
