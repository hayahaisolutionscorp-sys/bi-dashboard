export const AYAHAY_API_URL = process.env.NEXT_PUBLIC_API_V2_URL
export const AYAHAY_CLIENT_API = (typeof window !== 'undefined' ? localStorage.getItem("selectedBaseUrl") : "") || ""

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
	EXPENSES_REPORT_IMPORT_PREVIEW: "/bi/expenses-report/import/preview",
	EXPENSES_REPORT_IMPORT_CONFIRM: "/bi/expenses-report/import/confirm",
	PASSENGERS_PER_TRIP: "/bi/passengers-per-trip",
	CARGO_PER_TRIP: "/bi/cargo-per-trip",
	STATUS_REPORT: "/bi/status-report",
	VESSELS_REPORT: "/bi/vessels-report",
	ADVANCE_BOOKING: "/bi/advance-booking",
	ROUTE_MAP: "/bi/route-map",
	COMPARISON_TREND: "/bi/comparison-trend",
	REVENUE_PER_BOOKINGS: "/bi/sales-report/revenue-per-bookings",
	SALES_REPORT_CHARTS: "/bi/sales-report/charts",
} as const
