import type {
  BiAnalyticsFilter,
  ExecutiveOverviewResponse,
  ExecutiveKpiResponse,
  ExecutiveForecastResponse,
  RevenueResponse,
  ProfitabilityResponse,
  ExpensesResponse,
  ReconciliationResponse,
  SalesOverviewResponse,
  SalesChannelsResponse,
  SalesInsightsResponse,
  PassengerDemandResponse,
  CargoDemandResponse,
  DemandTrendsResponse,
  ScheduleResponse,
  LiveResponse,
  VesselsResponse,
} from "./bi.types";

const ANALYTICS_BASE = "/bi/analytics";

// ─── Low-level fetch ──────────────────────────────────────────────────────────

async function apiFetch<T>(
  baseUrl: string,
  path: string,
  filter?: BiAnalyticsFilter,
  extraParams?: Record<string, string>,
  serviceKey?: string,
): Promise<T> {
  const url = new URL(`${baseUrl}${ANALYTICS_BASE}${path}`);

  if (filter) {
    if (filter.from) url.searchParams.set("from", filter.from);
    if (filter.to) url.searchParams.set("to", filter.to);
    if (filter.route_name) url.searchParams.set("route_name", filter.route_name);
    if (filter.ship_ids?.length) {
      filter.ship_ids.forEach((id) => url.searchParams.append("ship_ids", String(id)));
    }
    if (filter.route_ids?.length) {
      filter.route_ids.forEach((id) => url.searchParams.append("route_ids", String(id)));
    }
    if (filter.src_port_ids?.length) {
      filter.src_port_ids.forEach((id) => url.searchParams.append("src_port_ids", String(id)));
    }
    if (filter.dest_port_ids?.length) {
      filter.dest_port_ids.forEach((id) => url.searchParams.append("dest_port_ids", String(id)));
    }
    if (filter.date_type) url.searchParams.set("date_type", filter.date_type);
  }

  if (extraParams) {
    for (const [k, v] of Object.entries(extraParams)) {
      url.searchParams.set(k, v);
    }
  }

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(serviceKey ? { "x-service-key": serviceKey } : {}),
    },
    credentials: "include",
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any).message ?? `API error ${res.status} on ${path}`);
  }

  return res.json() as Promise<T>;
}

// ─── Bi Analytics Service ─────────────────────────────────────────────────────

export const biService = {
  // ── Executive ────────────────────────────────────────────────────────────────
  getExecutiveOverview: (baseUrl: string, filter?: BiAnalyticsFilter, serviceKey?: string) =>
    apiFetch<ExecutiveOverviewResponse>(baseUrl, "/executive/overview", filter, undefined, serviceKey),

  getExecutiveKpis: (baseUrl: string, filter?: BiAnalyticsFilter, serviceKey?: string) =>
    apiFetch<ExecutiveKpiResponse>(baseUrl, "/executive/kpis", filter, undefined, serviceKey),

  getExecutiveForecast: (baseUrl: string, filter?: BiAnalyticsFilter, serviceKey?: string) =>
    apiFetch<ExecutiveForecastResponse>(baseUrl, "/executive/forecast", filter, undefined, serviceKey),

  // ── Financials ───────────────────────────────────────────────────────────────
  getRevenue: (
    baseUrl: string,
    filter?: BiAnalyticsFilter,
    groupBy: "route" | "vessel" | "method" | "trip" = "route",
    serviceKey?: string,
  ) =>
    apiFetch<RevenueResponse>(baseUrl, "/financials/revenue", filter, { group_by: groupBy }, serviceKey),

  getProfitability: (
    baseUrl: string,
    filter?: BiAnalyticsFilter,
    groupBy: "route" | "vessel" | "trip" = "route",
    serviceKey?: string,
  ) =>
    apiFetch<ProfitabilityResponse>(baseUrl, "/financials/profitability", filter, { group_by: groupBy }, serviceKey),

  getExpenses: (baseUrl: string, filter?: BiAnalyticsFilter, serviceKey?: string) =>
    apiFetch<ExpensesResponse>(baseUrl, "/financials/expenses", filter, undefined, serviceKey),

  getReconciliation: (baseUrl: string, filter?: BiAnalyticsFilter, serviceKey?: string) =>
    apiFetch<ReconciliationResponse>(baseUrl, "/financials/reconciliation", filter, undefined, serviceKey),

  // ── Sales ─────────────────────────────────────────────────────────────────────
  getSalesOverview: (baseUrl: string, filter?: BiAnalyticsFilter, serviceKey?: string) =>
    apiFetch<SalesOverviewResponse>(baseUrl, "/sales/overview", filter, undefined, serviceKey),

  getSalesChannels: (baseUrl: string, filter?: BiAnalyticsFilter, serviceKey?: string) =>
    apiFetch<SalesChannelsResponse>(baseUrl, "/sales/channels", filter, undefined, serviceKey),

  getSalesInsights: (baseUrl: string, filter?: BiAnalyticsFilter, serviceKey?: string) =>
    apiFetch<SalesInsightsResponse>(baseUrl, "/sales/insights", filter, undefined, serviceKey),

  // ── Demand ────────────────────────────────────────────────────────────────────
  getPassengerDemand: (baseUrl: string, filter?: BiAnalyticsFilter, serviceKey?: string) =>
    apiFetch<PassengerDemandResponse>(baseUrl, "/demand/passengers", filter, undefined, serviceKey),

  getCargoDemand: (baseUrl: string, filter?: BiAnalyticsFilter, serviceKey?: string) =>
    apiFetch<CargoDemandResponse>(baseUrl, "/demand/cargo", filter, undefined, serviceKey),

  getDemandTrends: (baseUrl: string, filter?: BiAnalyticsFilter, serviceKey?: string) =>
    apiFetch<DemandTrendsResponse>(baseUrl, "/demand/trends", filter, undefined, serviceKey),

  // ── Operations ────────────────────────────────────────────────────────────────
  getSchedule: (baseUrl: string, filter?: BiAnalyticsFilter, serviceKey?: string) =>
    apiFetch<ScheduleResponse>(baseUrl, "/operations/schedule", filter, undefined, serviceKey),

  getLive: (baseUrl: string, serviceKey?: string) =>
    apiFetch<LiveResponse>(baseUrl, "/operations/live", undefined, undefined, serviceKey),

  // ── Assets ────────────────────────────────────────────────────────────────────
  getVessels: (baseUrl: string, filter?: BiAnalyticsFilter, serviceKey?: string) =>
    apiFetch<VesselsResponse>(baseUrl, "/assets/vessels", filter, undefined, serviceKey),
};
