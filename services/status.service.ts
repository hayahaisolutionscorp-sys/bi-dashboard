import { API_ENDPOINTS } from "@/constants";
import { StatusReportResponse } from "@/types/status";

export const statusService = {
  getStatusReport: async (
    baseUrl: string,
    from?: string,
    to?: string,
    routeName?: string,
    serviceKey?: string
  ): Promise<StatusReportResponse["data"]> => {
    try {
      const url = new URL(`${baseUrl}${API_ENDPOINTS.STATUS_REPORT}`);
      
      if (from) url.searchParams.append("from", from);
      if (to) url.searchParams.append("to", to);
      if (routeName) url.searchParams.append("route_name", routeName);

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
        throw new Error(errorData.message || `Failed to fetch status report (${response.status})`);
      }

      const json: StatusReportResponse = await response.json();
      return json.data;
    } catch (error) {
      console.error(`Status report fetch error:`, error);
      throw error;
    }
  },
};
