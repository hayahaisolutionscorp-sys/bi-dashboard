import { API_ENDPOINTS, AYAHAY_API_URL } from "@/constants";
import {
  RecentActivityItem,
  ScheduleTripItem,
  CapacityHeatmapCell,
  TopAgentItem,
} from "@/types/dashboard-widgets";

async function apiFetch<T>(
  baseUrl: string,
  path: string,
  params: Record<string, string | number | undefined>,
  serviceKey?: string
): Promise<T> {
  const url = new URL(`${baseUrl}${path}`);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined) url.searchParams.set(k, String(v));
  }
  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(serviceKey ? { "x-service-key": serviceKey } : {}),
    },
    credentials: "include",
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || `Request failed (${response.status})`);
  }
  const json = await response.json();
  return json.data as T;
}

export const dashboardWidgetsService = {
  getRecentActivity: (
    baseUrl: string,
    limit = 20,
    serviceKey?: string
  ): Promise<RecentActivityItem[]> =>
    apiFetch<RecentActivityItem[]>(
      baseUrl,
      API_ENDPOINTS.RECENT_ACTIVITY,
      { limit },
      serviceKey
    ),

  getTodaySchedule: (
    baseUrl: string,
    serviceKey?: string
  ): Promise<ScheduleTripItem[]> =>
    apiFetch<ScheduleTripItem[]>(
      baseUrl,
      API_ENDPOINTS.TODAY_SCHEDULE,
      {},
      serviceKey
    ),

  getCapacityHeatmap: (
    baseUrl: string,
    from?: string,
    to?: string,
    serviceKey?: string
  ): Promise<CapacityHeatmapCell[]> =>
    apiFetch<CapacityHeatmapCell[]>(
      baseUrl,
      API_ENDPOINTS.CAPACITY_HEATMAP,
      { from, to },
      serviceKey
    ),

  getTopAgents: (
    baseUrl: string,
    from?: string,
    to?: string,
    limit = 10,
    serviceKey?: string
  ): Promise<TopAgentItem[]> =>
    apiFetch<TopAgentItem[]>(
      baseUrl,
      API_ENDPOINTS.TOP_AGENTS,
      { from, to, limit },
      serviceKey
    ),
};
