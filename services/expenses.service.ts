import { API_ENDPOINTS } from "@/constants";
import { ExpensesReportApiResponse, ExpensesReportData } from "@/types/expenses";

export const expensesService = {
  getExpensesReport: async (baseUrl: string, from?: string, to?: string, serviceKey?: string): Promise<ExpensesReportData> => {
    try {
      const url = new URL(`${baseUrl}${API_ENDPOINTS.EXPENSES_REPORT}`);
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
        throw new Error(errorData.message || `Failed to fetch expenses report (${response.status})`);
      }

      const json: ExpensesReportApiResponse = await response.json();
      return json.data;
    } catch (error) {
      console.error(`Expenses report fetch error [${from} - ${to}]:`, error);
      throw error;
    }
  },

  downloadExpensesReportExcel: async (baseUrl: string, from?: string, to?: string, serviceKey?: string): Promise<void> => {
    const url = new URL(`${baseUrl}${API_ENDPOINTS.EXPENSES_REPORT_EXPORT}`);
    if (from) url.searchParams.append("from", from);
    if (to) url.searchParams.append("to", to);

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

  downloadExpensesReportTemplateExcel: async (baseUrl: string, serviceKey?: string): Promise<void> => {
    const url = new URL(`${baseUrl}${API_ENDPOINTS.EXPENSES_REPORT_TEMPLATE}`);

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

  previewExpensesImport: async (baseUrl: string, file: File, serviceKey?: string): Promise<any> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${baseUrl}${API_ENDPOINTS.EXPENSES_REPORT_IMPORT_PREVIEW}`, {
      method: "POST",
      body: formData,
      headers: {
        ...(serviceKey ? { "x-service-key": serviceKey } : {})
      },
      credentials: "include",
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to preview expenses import");
    }

    return response.json();
  },

  confirmExpensesImport: async (baseUrl: string, file: File, serviceKey?: string): Promise<any> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${baseUrl}${API_ENDPOINTS.EXPENSES_REPORT_IMPORT_CONFIRM}`, {
      method: "POST",
      body: formData,
      headers: {
        ...(serviceKey ? { "x-service-key": serviceKey } : {})
      },
      credentials: "include",
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to confirm expenses import");
    }

    return response.json();
  },

  previewExpensesImportJson: async (baseUrl: string, rows: any[], serviceKey?: string): Promise<any> => {
    const response = await fetch(`${baseUrl}${API_ENDPOINTS.EXPENSES_REPORT_IMPORT_PREVIEW}-json`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        ...(serviceKey ? { "x-service-key": serviceKey } : {})
      },
      body: JSON.stringify({ rows }),
      credentials: "include",
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to re-validate expenses import");
    }

    return response.json();
  },
};
