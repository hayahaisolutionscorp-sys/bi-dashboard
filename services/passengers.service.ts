import { API_ENDPOINTS } from "@/constants";
import { PassengersReportResponse } from "@/types/passengers";

export const passengersService = {
  getPassengersReport: async (
    baseUrl: string,
    tenantSlug: string,
    from?: string,
    to?: string,
    serviceKey?: string
  ): Promise<PassengersReportResponse["data"]> => {
    try {
      const url = new URL(`${baseUrl}${API_ENDPOINTS.PASSENGERS_PER_TRIP}`);
      
      if (from) url.searchParams.append("from", from);
      if (to) url.searchParams.append("to", to);

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
        throw new Error(errorData.message || `Failed to fetch passengers report (${response.status})`);
      }

      const json: PassengersReportResponse = await response.json();
      return json.data;
    } catch (error) {
      console.error(`Passengers report fetch error [${tenantSlug} | ${from} - ${to}]:`, error);
      throw error;
    }
  },
};
