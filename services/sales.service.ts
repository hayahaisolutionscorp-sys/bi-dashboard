import { API_ENDPOINTS } from "@/constants";
import {
  SalesReportApiResponse,
  SalesReportRoute,
  SalesRoutesApiResponse,
  ComparisonTrendParams,
  ComparisonTrendData,
  ComparisonTrendApiResponse,
  SalesKpiResponse,
  RevenueVsBookingTrendsResponse,
  SalesChartsResponse,
} from "@/types/sales";

export const salesService = {
  /** Fetch trends for Revenue vs Booking. */
  getRevenueVsBookingTrends: async (baseUrl: string, from?: string, to?: string, serviceKey?: string): Promise<RevenueVsBookingTrendsResponse> => {
    try {
      const url = new URL(`${baseUrl}${API_ENDPOINTS.REVENUE_PER_BOOKINGS}`);
      if (from) url.searchParams.append("from", from);
      if (to) url.searchParams.append("to", to);

      const response = await fetch(url.toString(), {
        method: "GET",
        headers: { 
          "Content-Type": "application/json",
          ...(serviceKey ? { "x-service-key": serviceKey } : {})
        },
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch trend records (${response.status})`);
      }

      return await response.json();
    } catch (error) {
      console.error("Revenue vs Booking trend fetch error:", error);
      throw error;
    }
  },

  /** Fetch breakdown charts for the Sales Report. */
  getSalesReportCharts: async (baseUrl: string, from?: string, to?: string, serviceKey?: string): Promise<SalesChartsResponse> => {
    try {
      const url = new URL(`${baseUrl}${API_ENDPOINTS.SALES_REPORT_CHARTS}`);
      if (from) url.searchParams.append("from", from);
      if (to) url.searchParams.append("to", to);

      const response = await fetch(url.toString(), {
        method: "GET",
        headers: { 
          "Content-Type": "application/json",
          ...(serviceKey ? { "x-service-key": serviceKey } : {})
        },
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch breakdown charts (${response.status})`);
      }

      return await response.json();
    } catch (error) {
      console.error("Sales charts fetch error:", error);
      throw error;
    }
  },

  /** Fetch only the list of route names (no KPI/chart data). */
  getRoutes: async (baseUrl: string, serviceKey?: string): Promise<string[]> => {
    try {
      const url = `${baseUrl}${API_ENDPOINTS.SALES_REPORT_ROUTES}`;
      const response = await fetch(url, {
        method: "GET",
        headers: { 
          "Content-Type": "application/json",
          ...(serviceKey ? { "x-service-key": serviceKey } : {})
        },
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message ||
            `Failed to fetch sales routes (${response.status})`
        );
      }

      const json: SalesRoutesApiResponse = await response.json();
      return json.data.routes;
    } catch (error) {
      console.error("Sales routes fetch error:", error);
      throw error;
    }
  },

  /**
   * Fetch KPI + chart data for a specific route & date range.
   * Returns the first (and only) route entry from the response.
   */
  getSalesReport: async (
    baseUrl: string,
    from?: string,
    to?: string,
    routeName?: string,
    serviceKey?: string
  ): Promise<SalesReportRoute | null> => {
    try {
      const url = new URL(`${baseUrl}${API_ENDPOINTS.SALES_REPORT}`);
      if (from) url.searchParams.append("from", from);
      if (to) url.searchParams.append("to", to);
      if (routeName) url.searchParams.append("route_name", routeName);

      const response = await fetch(url.toString(), {
        method: "GET",
        headers: { 
          "Content-Type": "application/json",
          ...(serviceKey ? { "x-service-key": serviceKey } : {})
        },
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message ||
            `Failed to fetch sales report (${response.status})`
        );
      }

      const json: SalesReportApiResponse = await response.json();
      return json.data.routes[0] ?? null;
    } catch (error) {
      console.error(`Sales report fetch error [${from} - ${to}]:`, error);
      throw error;
    }
  },

  /** Fetch comparison trend data for the Dashboard. */
  getComparisonTrend: async (
    baseUrl: string,
    params: ComparisonTrendParams,
    serviceKey?: string
  ): Promise<ComparisonTrendData> => {
    try {
      const url = new URL(`${baseUrl}${API_ENDPOINTS.COMPARISON_TREND}`);
      if (params.from) url.searchParams.append("from", params.from);
      if (params.to) url.searchParams.append("to", params.to);
      if (params.compareBy) url.searchParams.append("compareBy", params.compareBy);
      
      if (Array.isArray(params.entityIds)) {
        params.entityIds.forEach(id => url.searchParams.append("entityIds", id));
      } else if (params.entityIds) {
        url.searchParams.append("entityIds", params.entityIds);
      }

      const response = await fetch(url.toString(), {
        method: "GET",
        headers: { 
          "Content-Type": "application/json",
          ...(serviceKey ? { "x-service-key": serviceKey } : {})
        },
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message ||
            `Failed to fetch comparison trend (${response.status})`
        );
      }

      const json: ComparisonTrendApiResponse = await response.json();
      return json.data;
    } catch (error) {
      console.error("Comparison trend fetch error:", error);
      throw error;
    }
  },

  /**
   * Downloads the Sales Report as an .xlsx file generated server-side by ExcelJS.
   * Mirrors V1's downloadDailySalesExcel blob-download pattern exactly:
   *  1. GET /bi/sales-report/export  (responseType: blob)
   *  2. Wrap in Blob + createObjectURL
   *  3. Mount hidden <a>, click, revoke
   */
  downloadSalesReportExcel: async (
    baseUrl: string,
    from?: string,
    to?: string,
    routeName?: string,
    serviceKey?: string,
  ): Promise<void> => {
    const url = new URL(`${baseUrl}${API_ENDPOINTS.SALES_REPORT_EXPORT}`);
    if (from)      url.searchParams.append("from",       from);
    if (to)        url.searchParams.append("to",         to);
    if (routeName) url.searchParams.append("route_name", routeName);

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        ...(serviceKey ? { "x-service-key": serviceKey } : {})
      },
      credentials: "include",
    });

    if (!response.ok) {
      const msg = await response.text().catch(() => `HTTP ${response.status}`);
      throw new Error(msg || "Failed to download Excel report");
    }

    const blob = new Blob([await response.arrayBuffer()], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    // Extract filename from Content-Disposition header, or fall back to default
    const disposition = response.headers.get("content-disposition") ?? "";
    const match       = disposition.match(/filename="?([^"]+)"?/);
    const filename    = match?.[1] ?? "sales-report.xlsx";

    const downloadUrl = window.URL.createObjectURL(blob);
    const a           = document.createElement("a");
    a.href            = downloadUrl;
    a.download        = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(downloadUrl);
  },

  /**
   * Downloads an empty structural .xlsx template of the Sales Report.
   */
  downloadSalesReportTemplateExcel: async (baseUrl: string, serviceKey?: string): Promise<void> => {
    const url = new URL(`${baseUrl}${API_ENDPOINTS.SALES_REPORT_TEMPLATE}`);

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        ...(serviceKey ? { "x-service-key": serviceKey } : {})
      },
      credentials: "include",
    });

    if (!response.ok) {
      const msg = await response.text().catch(() => `HTTP ${response.status}`);
      throw new Error(msg || "Failed to download Excel template");
    }

    const blob = new Blob([await response.arrayBuffer()], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const disposition = response.headers.get("content-disposition") ?? "";
    const match       = disposition.match(/filename="?([^"]+)"?/);
    const filename    = match?.[1] ?? "sales-report-template.xlsx";

    const downloadUrl = window.URL.createObjectURL(blob);
    const a           = document.createElement("a");
    a.href            = downloadUrl;
    a.download        = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(downloadUrl);
  },

  /** 
   * Fetch top-level KPIs for the sales report from the local /bi endpoint.
   * Requested by user: http://localhost:3000/bi/sales-report/kpi
   */
  getKpis: async (baseUrl: string, from?: string, to?: string, serviceKey?: string): Promise<SalesKpiResponse> => {
    try {
      const url = new URL(`${baseUrl}/bi/sales-report/kpi`);
      if (from) url.searchParams.append("from", from);
      if (to) url.searchParams.append("to", to);

      const response = await fetch(url.toString(), {
        method: "GET",
        headers: { 
          "Content-Type": "application/json",
          ...(serviceKey ? { "x-service-key": serviceKey } : {})
        },
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch local KPIs (${response.status})`);
      }

      return await response.json();
    } catch (error) {
      console.error("Local KPI fetch error:", error);
      throw error
    }
  },
};
