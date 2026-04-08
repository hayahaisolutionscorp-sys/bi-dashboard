import { DateRange } from "react-day-picker";
import { AdvanceBookingResponse } from "../types/advance-booking";
import { API_ENDPOINTS } from "@/constants";

export const AdvanceBookingService = {
  getAdvanceDashboard: async (baseUrl: string, tenant_slug: string, dateRange: DateRange | undefined, serviceKey?: string): Promise<AdvanceBookingResponse> => {
    const queryParams = new URLSearchParams();
    
    if (dateRange?.from) {
      queryParams.append('from', dateRange.from.toISOString().split('T')[0]);
    }
    
    if (dateRange?.to) {
      queryParams.append('to', dateRange.to.toISOString().split('T')[0]);
    }

    try {
      const response = await fetch(`${baseUrl}${API_ENDPOINTS.ADVANCE_BOOKING}?${queryParams.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(serviceKey ? { "x-service-key": serviceKey } : {})
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch advance booking data: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data as AdvanceBookingResponse;
    } catch (error) {
      console.error("Advance Booking fetch error:", error);
      throw error;
    }
  }
};
