import { DateRange } from "react-day-picker";
import { AdvanceBookingResponse } from "../types/advance-booking";
import { API_ENDPOINTS, AYAHAY_CLIENT_API } from "@/constants";

export const AdvanceBookingService = {
  getAdvanceDashboard: async (tenant_slug: string, dateRange: DateRange | undefined): Promise<AdvanceBookingResponse> => {
    const queryParams = new URLSearchParams();
    
    if (dateRange?.from) {
      queryParams.append('from', dateRange.from.toISOString().split('T')[0]);
    }
    
    if (dateRange?.to) {
      queryParams.append('to', dateRange.to.toISOString().split('T')[0]);
    }

    try {
      const response = await fetch(`${AYAHAY_CLIENT_API}${API_ENDPOINTS.ADVANCE_BOOKING}?${queryParams.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // Authentication: BI session/cookie authorization is usually handled by the browser
        },
        credentials: 'include', // equivalent to withCredentials: true
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
