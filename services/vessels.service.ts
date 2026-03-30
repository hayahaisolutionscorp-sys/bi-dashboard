import { DateRange } from "react-day-picker";
import { VesselsResponse } from "../types/vessels";
import { API_ENDPOINTS, AYAHAY_CLIENT_API } from "@/constants";

export class VesselsService {
  static async getVesselsDashboard(tenant: string, dateRange?: DateRange): Promise<VesselsResponse> {
    const url = new URL(`${AYAHAY_CLIENT_API}${API_ENDPOINTS.VESSELS_REPORT}`);

    const from = dateRange?.from?.toISOString().split("T")[0];
    const to = dateRange?.to?.toISOString().split("T")[0];

    if (from) url.searchParams.append("from", from);
    if (to) url.searchParams.append("to", to);

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to fetch vessels report (${response.status})`);
    }

    return await response.json() as VesselsResponse;
  }
}

