import { SoftwareLicense } from "@/types/models";
import { StorageEngine } from "./storage";

const SEED_LICENSES: SoftwareLicense[] = [
  { id: "LIC-2001", software: "Microsoft 365 E3", vendor: "Microsoft", licenseType: "Subscription", totalSeats: 50, assignedSeats: 42, key: "MS365-E3-SUB-CORP", expiryDate: "2024-12-31" },
  { id: "LIC-2002", software: "Adobe Creative Cloud", vendor: "Adobe", licenseType: "Subscription", totalSeats: 15, assignedSeats: 12, key: "ADBE-CC-ENT-2023", expiryDate: "2024-06-30" }
];

export class LicensesService {
  private static licenses: SoftwareLicense[] | null = null;

  public static getAll(): SoftwareLicense[] {
    if (!this.licenses) {
      this.licenses = StorageEngine.loadJson<SoftwareLicense[]>("licenses", SEED_LICENSES);
    }
    return this.licenses;
  }

  public static getById(id: string): SoftwareLicense | null {
    return this.getAll().find((l) => l.id === id) || null;
  }

  public static getAvailableSeats(license: SoftwareLicense): number {
    return Math.max(0, license.totalSeats - license.assignedSeats);
  }
}
