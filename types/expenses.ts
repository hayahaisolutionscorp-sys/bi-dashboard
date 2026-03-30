export interface ExpensesKpis {
  total_expenses: number;
  top_cost_category: string;
  avg_cost_per_trip: number;
  transactions: number;
}

export interface ExpensesTrend {
  xAxisData: string[];
  seriesData: number[];
}

export interface ExpensesCategoryItem {
  name: string;
  value: number;
}

export interface ExpensesPayees {
  payeeNames: string[];
  payeeValues: number[];
}

export interface ExpensesCharts {
  trend: ExpensesTrend;
  category: ExpensesCategoryItem[];
  payees: ExpensesPayees;
}

export interface ExpensesReportData {
  kpis: ExpensesKpis;
  charts: ExpensesCharts;
}

export interface ExpensesReportApiResponse {
  data: ExpensesReportData;
}
