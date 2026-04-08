import { format } from "date-fns";
import { DateRange } from "react-day-picker";
import { VesselsResponse } from "../types/vessels";
import { API_ENDPOINTS } from "@/constants";

export class VesselsService {
  static async getVesselsDashboard(baseUrl: string, tenant: string, dateRange?: DateRange, serviceKey?: string): Promise<VesselsResponse> {
    const url = new URL(`${baseUrl}${API_ENDPOINTS.VESSELS_REPORT}`);

    const from = dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : undefined;
    const to = dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : undefined;

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
      throw new Error(errorData.message || `Failed to fetch vessels report (${response.status})`);
    }

    return await response.json() as VesselsResponse;
  }
}
