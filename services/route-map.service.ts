import { AYAHAY_CLIENT_API, API_ENDPOINTS } from "@/constants";

export interface RouteMapTrip {
  trip_id: string;               // Use this as your React key prop
  vessel_name: string;
  route_name: string;            // Format: "Source Port - Dest Port"
  scheduled_departure: string;   // ISO Date String
  scheduled_arrival: string;     // ISO Date String
  eta_minutes: number;           // Configured vessel travel time
  status: string;                // e.g., "scheduled", "departed"
  boarded_count: number;         // Real-time scanned passengers
  total_seats: number;           // Vessel Pax capacity
  pax_utilization_pct: number;   // Boarded / Total Seats (%)
  trip_revenue: number;          // Total confirmed revenue for this specific trip
  route_ytd_revenue: number;     // Cumulative revenue for this entire route this year
}

export interface RouteMapResponse {
  trips: RouteMapTrip[];
}

export const RouteMapService = {
  getRouteMapData: async (): Promise<RouteMapResponse> => {
    try {
      const response = await fetch(`${AYAHAY_CLIENT_API}${API_ENDPOINTS.ROUTE_MAP}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // Authentication: BI session/cookie authorization is handled by the browser
        },
        credentials: 'include', // equivalent to withCredentials: true
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch route map data: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data as RouteMapResponse;
    } catch (error) {
      console.error("Route Map fetch error:", error);
      throw error;
    }
  }
};
