import { API_ENDPOINTS } from "@/constants";
import { CargoReportResponse } from "@/types/cargo";

export const cargoService = {
  getCargoReport: async (
    baseUrl: string,
    tenantSlug: string,
    from?: string,
    to?: string,
    routeName?: string,
    serviceKey?: string
  ): Promise<CargoReportResponse["data"]> => {
    try {
      const url = new URL(`${baseUrl}${API_ENDPOINTS.CARGO_PER_TRIP}`);
      
      if (from) url.searchParams.append("from", from);
      if (to) url.searchParams.append("to", to);
      if (routeName && routeName !== "All Routes") {
        url.searchParams.append("route_name", routeName);
      }

      const response = await fetch(url.toString(), {
        method: "GET",
        headers: { 
          "Content-Type": "application/json",
          ...(serviceKey ? { "x-service-key": serviceKey } : {})
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to fetch cargo report (${response.status})`);
      }

      const json: CargoReportResponse = await response.json();
      return json.data;
    } catch (error) {
      console.error(`Cargo report fetch error:`, error);
      throw error;
    }
  },
};
