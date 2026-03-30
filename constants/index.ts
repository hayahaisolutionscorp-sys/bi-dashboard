export const AYAHAY_API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002"
export const AYAHAY_CLIENT_API = typeof window !== "undefined" ? localStorage.getItem("seletedBaseUrl") || "http://localhost:3000" : "http://localhost:3000"

export const API_ENDPOINTS = {
	AUTH: "/bi/auth",
	OVERVIEW: "/bi/overview",
	SALES_REPORT: "/bi/sales-report",
	SALES_REPORT_ROUTES: "/bi/sales-report/routes",
	SALES_REPORT_EXPORT: "/bi/sales-report/export",
	SALES_REPORT_TEMPLATE: "/bi/sales-report/template",
	EXPENSES_REPORT: "/bi/expenses-report",
	EXPENSES_REPORT_EXPORT: "/bi/expenses-report/export",
	EXPENSES_REPORT_TEMPLATE: "/bi/expenses-report/template",
	PASSENGERS_PER_TRIP: "/bi/passengers-per-trip",
	CARGO_PER_TRIP: "/bi/cargo-per-trip",
	STATUS_REPORT: "/bi/status-report",
	VESSELS_REPORT: "/bi/vessels-report",
	ADVANCE_BOOKING: "/bi/advance-booking",
	ROUTE_MAP: "/bi/route-map",
	COMPARISON_TREND: "/bi/comparison-trend",
} as const
