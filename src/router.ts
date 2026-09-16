/**
 * Hash-Based SPA Router (Zero Dependencies, Pure TypeScript)
 */

import { Navbar } from "./components/Navbar";
import { Sidebar } from "./components/Sidebar";
import { DashboardView } from "./views/DashboardView";
import { AssetView } from "./views/AssetView";
import { LicenseView } from "./views/LicenseView";
import { ConsumableView } from "./views/ConsumableView";
import { InboundView } from "./views/InboundView";
import { CatalogView } from "./views/CatalogView";
import { CategoryView } from "./views/CategoryView";
import { AssignmentView } from "./views/AssignmentView";
import { HistoryView } from "./views/HistoryView";
import { SettingsView } from "./views/SettingsView";

export class Router {
  private static contentHost: HTMLElement | null = null;

  public static init(contentHost: HTMLElement): void {
    this.contentHost = contentHost;
    window.addEventListener("hashchange", () => this.navigate());
    this.navigate();
  }

  public static navigate(): void {
    if (!this.contentHost) return;

    const rawHash = window.location.hash || "#dashboard";
    const route = rawHash.replace(/^#\/?/, "").toLowerCase() || "dashboard";

    Sidebar.setActive(route);

    switch (route) {
      case "dashboard":
        Navbar.setTitle("System Dashboard");
        this.contentHost.innerHTML = DashboardView.render();
        break;

      case "assets":
        Navbar.setTitle("Hardware Assets");
        AssetView.mount(this.contentHost);
        break;

      case "licenses":
        Navbar.setTitle("Software Licenses");
        LicenseView.mount(this.contentHost);
        break;

      case "consumables":
        Navbar.setTitle("Consumables & Peripherals");
        ConsumableView.mount(this.contentHost);
        break;

      case "inbound":
        Navbar.setTitle("Inbound Procurement");
        InboundView.mount(this.contentHost);
        break;

      case "catalog":
        Navbar.setTitle("Master Catalog");
        CatalogView.mount(this.contentHost);
        break;

      case "categories":
        Navbar.setTitle("Equipment Categories");
        CategoryView.mount(this.contentHost);
        break;

      case "assignments":
        Navbar.setTitle("Active Custody");
        AssignmentView.mount(this.contentHost);
        break;

      case "history":
        Navbar.setTitle("Transaction History");
        HistoryView.mount(this.contentHost);
        break;

      case "settings":
        Navbar.setTitle("Settings & Diagnostics");
        SettingsView.mount(this.contentHost);
        break;

      default:
        window.location.hash = "#dashboard";
        break;
    }
  }
}
