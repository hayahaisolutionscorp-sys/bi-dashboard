export interface ExpenseReportData {
  report_date: string;
  report_month: string;
  report_week: string;
  expense_category: string;
  expense_code: string | null;
  payee: string;
  trip_status: string;
  source_port_name: string;
  destination_port_name: string;
  route_name: string;
  ship_name: string;
  total_expense: number;
  total_disbursement_transactions: number;
}

export const mockExpenseReportData: ExpenseReportData[] = [
  {
    report_date: "2026-02-18",
    report_month: "2026-02",
    report_week: "2026-08",
    expense_category: "Commissions",
    expense_code: null,
    payee: "Kal",
    trip_status: "pending",
    source_port_name: "Cebu",
    destination_port_name: "Dumaguete Port",
    route_name: "Cebu - Dumaguete Port",
    ship_name: "MV Aeron",
    total_expense: 455000,
    total_disbursement_transactions: 1
  },
  {
    report_date: "2026-02-18",
    report_month: "2026-02",
    report_week: "2026-08",
    expense_category: "Commissions",
    expense_code: null,
    payee: "Rodel",
    trip_status: "pending",
    source_port_name: "Cebu",
    destination_port_name: "Sibulan",
    route_name: "Cebu - Sibulan",
    ship_name: "MV Bery",
    total_expense: 153000,
    total_disbursement_transactions: 1
  },
  {
    report_date: "2026-02-18",
    report_month: "2026-02",
    report_week: "2026-08",
    expense_category: "Repairs & Maintenance",
    expense_code: null,
    payee: "Jomalia Shipping",
    trip_status: "pending",
    source_port_name: "Cebu",
    destination_port_name: "Dumaguete Port",
    route_name: "Cebu - Dumaguete Port",
    ship_name: "MV Bery",
    total_expense: 140000,
    total_disbursement_transactions: 1
  },
  {
    report_date: "2026-02-19",
    report_month: "2026-02",
    report_week: "2026-08",
    expense_category: "Fuel & Oils",
    expense_code: null,
    payee: "Shell",
    trip_status: "pending",
    source_port_name: "Cebu",
    destination_port_name: "Dumaguete Port",
    route_name: "Cebu - Dumaguete Port",
    ship_name: "MV Aeron",
    total_expense: 650000,
    total_disbursement_transactions: 2
  },
  {
    report_date: "2026-02-19",
    report_month: "2026-02",
    report_week: "2026-08",
    expense_category: "Port Fees",
    expense_code: null,
    payee: "Cebu Port Authority",
    trip_status: "completed",
    source_port_name: "Cebu",
    destination_port_name: "Dumaguete Port",
    route_name: "Cebu - Dumaguete Port",
    ship_name: "MV Aeron",
    total_expense: 45000,
    total_disbursement_transactions: 1
  },
  {
    report_date: "2026-02-20",
    report_month: "2026-02",
    report_week: "2026-08",
    expense_category: "Crew Wages",
    expense_code: null,
    payee: "Various",
    trip_status: "completed",
    source_port_name: "Cebu",
    destination_port_name: "Sibulan",
    route_name: "Cebu - Sibulan",
    ship_name: "MV Bery",
    total_expense: 180000,
    total_disbursement_transactions: 15
  },
  {
    report_date: "2026-02-20",
    report_month: "2026-02",
    report_week: "2026-08",
    expense_category: "Provisions",
    expense_code: null,
    payee: "SM Supermarket",
    trip_status: "completed",
    source_port_name: "Cebu",
    destination_port_name: "Dumaguete Port",
    route_name: "Cebu - Dumaguete Port",
    ship_name: "MV Aeron",
    total_expense: 25000,
    total_disbursement_transactions: 3
  },
  {
    report_date: "2026-02-21",
    report_month: "2026-02",
    report_week: "2026-08",
    expense_category: "Fuel & Oils",
    expense_code: null,
    payee: "Petron",
    trip_status: "scheduled",
    source_port_name: "Dumaguete Port",
    destination_port_name: "Cebu",
    route_name: "Dumaguete Port - Cebu",
    ship_name: "MV Aeron",
    total_expense: 620000,
    total_disbursement_transactions: 1
  },
  {
    report_date: "2026-02-21",
    report_month: "2026-02",
    report_week: "2026-08",
    expense_category: "Insurance",
    expense_code: null,
    payee: "Malayan Insurance",
    trip_status: "scheduled",
    source_port_name: "Cebu",
    destination_port_name: "Sibulan",
    route_name: "Cebu - Sibulan",
    ship_name: "MV Bery",
    total_expense: 85000,
    total_disbursement_transactions: 1
  }
];

// --- KPI Calculations ---
const totalExpenses = mockExpenseReportData.reduce((sum, item) => sum + item.total_expense, 0);

// Calculate Top Cost Category
const categoryTotals: Record<string, number> = {};
mockExpenseReportData.forEach(item => {
  categoryTotals[item.expense_category] = (categoryTotals[item.expense_category] || 0) + item.total_expense;
});
const topCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];

const totalTransactions = mockExpenseReportData.reduce((sum, item) => sum + item.total_disbursement_transactions, 0);

// Unique trips assumption for Avg Cost demo
const uniqueTripCount = new Set(mockExpenseReportData.map(d => (d.ship_name || "") + d.route_name)).size;
const avgCostPerTrip = uniqueTripCount > 0 ? totalExpenses / uniqueTripCount : 0;

export const EXPENSES_KPI_DATA = [
  {
    label: "Total Expenses",
    value: `₱${totalExpenses.toLocaleString()}`,
    icon: "payments",
    indicatorText: "VS LAST MONTH",
    indicatorDirection: "up" as const,
    colorClass: "text-red-600 dark:text-red-400",
  },
  {
    label: "Top Cost Category",
    value: topCategory ? topCategory[0] : "-",
    icon: "category",
    indicatorText: topCategory ? `₱${topCategory[1].toLocaleString()}` : "",
    indicatorDirection: "neutral" as const,
    colorClass: "text-slate-700 dark:text-slate-300",
  },
  {
    label: "Avg Cost Per Trip",
    value: `₱${avgCostPerTrip.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
    icon: "directions_boat",
    indicatorText: "VS LAST MONTH",
    indicatorDirection: "down" as const,
    colorClass: "text-green-600 dark:text-green-400",
  },
  {
    label: "Transactions",
    value: totalTransactions.toLocaleString(),
    icon: "receipt_long",
    indicatorText: "DISBURSEMENTS",
    indicatorDirection: "neutral" as const,
    colorClass: "text-sky-600 dark:text-sky-400",
  },
];

// --- Chart Data Processing ---

// 1. Trend Line (Daily)
const dateTotals: Record<string, number> = {};
mockExpenseReportData.forEach(item => {
  dateTotals[item.report_date] = (dateTotals[item.report_date] || 0) + item.total_expense;
});
const sortedDates = Object.keys(dateTotals).sort();
const trendValues = sortedDates.map(date => dateTotals[date]);

export const EXPENSES_TREND_DATA = {
  xAxisData: sortedDates,
  seriesData: trendValues
};

// 2. Category Pie
export const EXPENSES_CATEGORY_DATA = Object.entries(categoryTotals)
  .sort((a, b) => b[1] - a[1])
  .map(([name, value]) => ({ name, value }));

// 3. Vendor/Payee Bar
const payeeTotals: Record<string, number> = {};
mockExpenseReportData.forEach(item => {
  payeeTotals[item.payee] = (payeeTotals[item.payee] || 0) + item.total_expense;
});
const sortedPayees = Object.entries(payeeTotals)
  .sort((a, b) => a[1] - b[1]) // Ascending for horizontal bar
  .slice(-5); // Top 5

export const EXPENSES_PAYEE_DATA = {
  payeeNames: sortedPayees.map(p => p[0]),
  payeeValues: sortedPayees.map(p => p[1])
};
