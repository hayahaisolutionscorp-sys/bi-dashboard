import { API_ENDPOINTS, AYAHAY_CLIENT_API } from "@/constants";
import { ExpensesReportApiResponse, ExpensesReportData } from "@/types/expenses";

export const expensesService = {
  getExpensesReport: async (from?: string, to?: string): Promise<ExpensesReportData> => {
    try {
      const url = new URL(`${AYAHAY_CLIENT_API}${API_ENDPOINTS.EXPENSES_REPORT}`);
      if (from) url.searchParams.append("from", from);
      if (to) url.searchParams.append("to", to);

      const response = await fetch(url.toString(), {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to fetch expenses report (${response.status})`);
      }

      const json: ExpensesReportApiResponse = await response.json();
      return json.data;
    } catch (error) {
      console.error(`Expenses report fetch error [${from} - ${to}]:`, error);
      throw error;
    }
  },

  downloadExpensesReportExcel: async (from?: string, to?: string): Promise<void> => {
    const url = new URL(`${AYAHAY_CLIENT_API}${API_ENDPOINTS.EXPENSES_REPORT_EXPORT}`);
    if (from) url.searchParams.append("from", from);
    if (to) url.searchParams.append("to", to);

    const response = await fetch(url.toString(), {
      method: "GET",
      credentials: "include",
    });

    if (!response.ok) {
      const msg = await response.text().catch(() => `HTTP ${response.status}`);
      throw new Error(msg || "Failed to download Excel report");
    }

    const blob = new Blob([await response.arrayBuffer()], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const disposition = response.headers.get("content-disposition") ?? "";
    const match       = disposition.match(/filename="?([^"]+)"?/);
    const filename    = match?.[1] ?? "expenses-report.xlsx";

    const downloadUrl = window.URL.createObjectURL(blob);
    const a           = document.createElement("a");
    a.href            = downloadUrl;
    a.download        = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(downloadUrl);
  },

  downloadExpensesReportTemplateExcel: async (): Promise<void> => {
    const url = new URL(`${AYAHAY_CLIENT_API}${API_ENDPOINTS.EXPENSES_REPORT_TEMPLATE}`);

    const response = await fetch(url.toString(), {
      method: "GET",
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
    const filename    = match?.[1] ?? "expenses-report-template.xlsx";

    const downloadUrl = window.URL.createObjectURL(blob);
    const a           = document.createElement("a");
    a.href            = downloadUrl;
    a.download        = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(downloadUrl);
  },
};
