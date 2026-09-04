/** Runtime data-mode gate. Demo fixtures must never be mistaken for live analysis. */
export type DashboardDataMode = "demo" | "live";

export const dashboardDataMode: DashboardDataMode =
  import.meta.env.VITE_DATA_MODE === "mock" ? "demo" : "live";

export const isDemoMode = dashboardDataMode === "demo";
