// ─── Legacy Overview (overview_view-based) ───────────────────────────────────
export interface OverviewKpi {
  total_revenue: number;
  passenger_revenue: number;
  cargo_revenue: number;
  total_passengers: number;
  total_cargo_units: number;
  total_trips: number;
  total_expenses: number;
  canceled_count: number;
}

export interface RevenueTrendItem {
  label: string;
  total_revenue: number;
}

export interface RevenueByRouteItem {
  canonical_route_name?: string;
  route_name?: string;
  total_revenue: number;
}

export interface RevenueByVesselItem {
  vessel_name: string;
  vessel_type: string;
  total_revenue: number;
}

export interface PaxBreakdown {
  adult: number;
  student: number;
  child: number;
  senior: number;
  pwd: number;
  regular: number;
  driver: number;
  helper: number;
}

export interface CargoBreakdown {
  loose: number;
  rolling: number;
}

export interface PassengerVsCargo {
  passenger_revenue: number;
  cargo_revenue: number;
  pax_breakdown: PaxBreakdown;
  cargo_breakdown: CargoBreakdown;
  by_source?: Record<string, {
    pax?: Record<string, { revenue: number }>;
    cargo?: Record<string, { revenue: number }>;
  }>;
  cargo_class_breakdown?: {
    rolling?: Record<string, number>;
    loose?: Record<string, number>;
  };
}

export interface OverviewData {
  kpi: OverviewKpi;
  today_total_revenue: number;
  mtd_total_revenue: number;
  ytd_total_revenue: number;
  revenue_trend: RevenueTrendItem[];
  revenue_by_route: RevenueByRouteItem[];
  revenue_by_vessel: RevenueByVesselItem[];
  passenger_vs_cargo: PassengerVsCargo;
}

export interface OverviewApiResponse {
  data: OverviewData;
}

// ─── Finance-Accurate Overview (ledger-based) ────────────────────────────────

export type ProfitClass = 'high' | 'low' | 'loss';

export interface RouteMetric {
  route_name: string;
  gross_revenue: number;
  refund_amount: number;
  net_revenue: number;
  expenses: number;
  profit_margin: number;   // 0-1 ratio
  profit_class: ProfitClass;
  booking_count: number;
}

export interface ChannelMetric {
  channel: string;           // OTC | Online | OTA | Travel Agency
  gross_revenue: number;
  net_revenue: number;
  booking_count: number;
  avg_ticket_size: number;
  revenue_share_pct: number; // 0-100
}

export interface ComparisonMetric {
  gross_revenue: number;
  net_revenue: number;
  booking_count: number;
  delta_pct: number;
}

export interface ForecastData {
  today_projection: number;
  mtd_projection: number;
  pacing_status: 'ahead' | 'behind' | 'on-track';
  elapsed_pct: number;       // 0-1 fraction of current period elapsed
}

export interface ReconciliationData {
  payment_mismatch_count: number;
  refund_mismatch_amount: number;
  webhook_failures: number;
  unmatched_items_count: number;
}

export interface FinanceOverviewKpi {
  gross_revenue: number;
  net_revenue: number;
  refund_amount: number;
  profit_margin: number;     // 0-1
  booking_count: number;
  total_passengers: number;
  total_trips: number;
}

export interface FinanceTrendItem {
  label: string;
  bucket_index: number;
  gross_revenue: number;
  net_revenue: number;
  /** Refund credit sum for this bucket */
  refund_amount: number;
  /** Net revenue for the same bucket in the previous period (yesterday / last month / last year) */
  comparison_net: number | null;
}

export interface FinanceOverviewData {
  kpi: FinanceOverviewKpi;
  kpi_today: FinanceOverviewKpi;
  kpi_mtd: FinanceOverviewKpi;
  kpi_ytd: FinanceOverviewKpi;
  revenue_by_route: RouteMetric[];
  revenue_by_channel: ChannelMetric[];
  comparisons: {
    yesterday: ComparisonMetric;
    last_week: ComparisonMetric;
    last_month: ComparisonMetric;
  };
  forecast: ForecastData;
  reconciliation: ReconciliationData;
  revenue_trend: FinanceTrendItem[];
}

export interface FinanceOverviewApiResponse {
  data: FinanceOverviewData;
}

