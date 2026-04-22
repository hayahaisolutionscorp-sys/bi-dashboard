import { API_ENDPOINTS, AYAHAY_API_URL } from "@/constants";

const CLIENT_API_URL = process.env.NEXT_PUBLIC_CLIENT_API_URL || "http://localhost:3000";

function normalizeBaseUrl(url: string): string {
  if (!url) return url;
  if (!/^https?:\/\//i.test(url)) return `https://${url}`;
  return url;
}

export interface RouteMapTrip {
  trip_id: string;               // Use this as your React key prop
  vessel_name: string;
  route_name: string;            // Format: "Source Port - Dest Port"
  scheduled_departure: string;   // ISO Date String
  scheduled_arrival: string | null; // ISO Date String
  actual_departure: string | null; // When the trip actually departed (null if not yet departed)
  eta_minutes: number;           // Configured vessel travel time
  status: string;                // e.g., "scheduled", "departed"
  boarded_count: number;         // Real-time scanned passengers
  total_seats: number;           // Vessel Pax capacity
  pax_utilization_pct: number;   // Boarded / Total Seats (%)
  trip_revenue: number;          // Total confirmed revenue for this specific trip
  route_ytd_revenue: number;     // Cumulative revenue for this entire route this year
  src_port_latitude: number | null;
  src_port_longitude: number | null;
  dest_port_latitude: number | null;
  dest_port_longitude: number | null;
  /** Sea route coordinates [[lng, lat], ...] computed by searoute-js */
  route_coords: number[][] | null;
  /** Sea route distance in nautical miles */
  distance_nm: number | null;
}

export interface RouteMapRoute {
  route_name: string;
  src_port_id: number | null;
  dest_port_id: number | null;
  src_port_latitude: number | null;
  src_port_longitude: number | null;
  dest_port_latitude: number | null;
  dest_port_longitude: number | null;
  /** Sea route coordinates [[lng, lat], ...] computed by searoute-js */
  route_coords: number[][] | null;
  /** Sea route distance in nautical miles */
  distance_nm: number | null;
}

export interface RouteMapResponse {
  trips: RouteMapTrip[];
  /** All routes configured for this tenant, regardless of trip activity on the selected date */
  routes: RouteMapRoute[];
}

function normalizeRouteMapResponse(payload: unknown): RouteMapResponse {
  if (!payload || typeof payload !== 'object') {
    return { trips: [], routes: [] };
  }

  const record = payload as Record<string, unknown>;
  const data = (record.data && typeof record.data === 'object'
    ? record.data
    : record) as Record<string, unknown>;

  return {
    trips: Array.isArray(data.trips) ? (data.trips as RouteMapTrip[]) : [],
    routes: Array.isArray(data.routes) ? (data.routes as RouteMapRoute[]) : [],
  };
}

function hasRenderableGeometry(data: RouteMapResponse): boolean {
  return [...data.trips, ...data.routes].some((item) => {
    const coords = item.route_coords;
    return (
      (Array.isArray(coords) && coords.length >= 2) ||
      (item.src_port_latitude != null &&
        item.src_port_longitude != null &&
        item.dest_port_latitude != null &&
        item.dest_port_longitude != null)
    );
  });
}

async function fetchRouteMapFromUrl(
  rawUrl: string,
  serviceKey?: string,
  date?: string,
): Promise<RouteMapResponse | null> {
  try {
    const url = new URL(rawUrl);
    if (date) url.searchParams.set('date', date);
    if (!url.searchParams.has('include')) {
      url.searchParams.set('include', 'liveStatus,routePath');
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(serviceKey ? { 'x-service-key': serviceKey } : {}),
      },
      credentials: 'include',
    });

    if (!response.ok) {
      return null;
    }

    return normalizeRouteMapResponse(await response.json());
  } catch {
    return null;
  }
}

export const RouteMapService = {
  getRouteMapData: async (
    baseUrl?: string,
    serviceKey?: string,
    date?: string,
  ): Promise<RouteMapResponse> => {
    // Primary: unified hub endpoint on ayahay-api-v2 (AYAHAY_API_URL).
    // Tenant isolation is enforced server-side via x-service-key — not by URL.
    const primary = await fetchRouteMapFromUrl(
      `${AYAHAY_API_URL}${API_ENDPOINTS.ROUTE_MAP}`,
      serviceKey,
      date,
    );

    if (
      primary &&
      (primary.trips.length > 0 || primary.routes.length > 0)
    ) {
      return primary;
    }

    // Fallback: tenant-local /bi/route-map on ayahay-client-api.
    // Only attempted when a real tenant baseUrl is available — never falls back
    // to CLIENT_API_URL (which resolves to localhost when the env var is unset).
    if (baseUrl) {
      const tenantBaseUrl = normalizeBaseUrl(baseUrl);
      const fallbackUrl = `${tenantBaseUrl}/bi/route-map`;
      const fallback = await fetchRouteMapFromUrl(fallbackUrl, serviceKey, date);

      if (
        fallback &&
        (fallback.trips.length > 0 || fallback.routes.length > 0)
      ) {
        return fallback;
      }
    }

    return primary ?? { trips: [], routes: [] };
  }
};
