/**
 * Tailwind Badge Component for Statuses and Categories
 */

export class Badge {
  public static status(status: string): string {
    const s = (status || "").toLowerCase();
    let colorClass = "bg-gray-100 text-gray-800";
    let label = status;

    if (s === "available") {
      colorClass = "bg-emerald-50 text-emerald-700 border border-emerald-200";
      label = "Available";
    } else if (s === "inuse") {
      colorClass = "bg-blue-50 text-blue-700 border border-blue-200";
      label = "In Use";
    } else if (s === "repair") {
      colorClass = "bg-amber-50 text-amber-700 border border-amber-200";
      label = "In Repair";
    } else if (s === "retired") {
      colorClass = "bg-rose-50 text-rose-700 border border-rose-200";
      label = "Retired";
    } else if (s === "received") {
      colorClass = "bg-emerald-50 text-emerald-700 border border-emerald-200";
      label = "Received";
    } else if (s === "pending") {
      colorClass = "bg-sky-50 text-sky-700 border border-sky-200";
      label = "Pending";
    } else if (s === "partial") {
      colorClass = "bg-purple-50 text-purple-700 border border-purple-200";
      label = "Partial";
    }

    return `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}">${label}</span>`;
  }

  public static pill(text: string, color: "gray" | "blue" | "green" | "amber" | "purple" = "gray"): string {
    const colors: Record<string, string> = {
      gray: "bg-gray-100 text-gray-700",
      blue: "bg-blue-100 text-blue-700",
      green: "bg-green-100 text-green-700",
      amber: "bg-amber-100 text-amber-700",
      purple: "bg-purple-100 text-purple-700"
    };
    return `<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colors[color] || colors.gray}">${text}</span>`;
  }
}
