// ─── Shared ──────────────────────────────────────────────────────────────────

export interface AnalyticsMeta {
  filters_applied: Record<string, unknown>;
  generated_at: string;
  trip_count: number;
}

export interface AnalyticsResponse<TSummary, TBreakdown = unknown, TTrend = unknown> {
  summary: TSummary;
  breakdown: TBreakdown[];
  trends: TTrend[];
  meta: AnalyticsMeta;
}

export interface BiAnalyticsFilter {
  from?: string;
  to?: string;
  ship_ids?: number[];
  route_ids?: number[];
  src_port_ids?: number[];
  dest_port_ids?: number[];
  route_name?: string;
  date_type?: 'booking' | 'departure';
}

// ─── Executive ────────────────────────────────────────────────────────────────

export interface ExecutiveOverviewSummary {
  total_revenue: number;
  gross_revenue: number;
  refund_total: number;
  net_revenue: number;
  total_expenses: number;
  net_income: number;
  total_passengers: number;
  total_cargo: number;
  total_trips: number;
  refunded_passengers: number;
  refunded_cargo: number;
}

export interface ExecutiveOverviewBreakdown {
  route_name: string;
  net_revenue: number;
  trip_count: number;
}

export interface ExecutiveOverviewTrend {
  date: string;
  gross_revenue: number;
  net_revenue: number;
  passengers: number;
}

export type ExecutiveOverviewResponse = AnalyticsResponse<
  ExecutiveOverviewSummary,
  ExecutiveOverviewBreakdown,
  ExecutiveOverviewTrend
>;

// ─── Executive KPIs ───────────────────────────────────────────────────────────

export interface ExecutiveKpiSummary {
  avg_revenue_per_trip: number;
  avg_passengers_per_trip: number;
  avg_cargo_per_trip: number;
  refund_rate: number;
  expense_ratio: number;
  profit_margin: number;
}

export type ExecutiveKpiResponse = AnalyticsResponse<ExecutiveKpiSummary>;

// ─── Executive Forecast ───────────────────────────────────────────────────────

export interface ForecastSummary {
  months_analyzed: number;
  avg_monthly_revenue: number;
}

export interface ForecastTrend {
  month: string;
  actual_revenue: number;
  trip_count: number;
  projected_revenue: number | null;
  growth_rate: number | null;
}

export type ExecutiveForecastResponse = AnalyticsResponse<ForecastSummary, never, ForecastTrend>;

// ─── Financials – Revenue ─────────────────────────────────────────────────────

export interface RevenueSummary {
  gross_revenue: number;
  refund_total: number;
  net_revenue: number;
}

export interface RevenueBreakdownItem {
  label: string;
  gross_revenue: number;
  refund_total: number;
  net_revenue: number;
  trip_count: number;
  pax_revenue: number;
  cargo_revenue: number;
}

export type RevenueResponse = AnalyticsResponse<RevenueSummary, RevenueBreakdownItem>;

// ─── Financials – Profitability ───────────────────────────────────────────────

export interface ProfitabilitySummary {
  net_revenue: number;
  total_expenses: number;
  net_income: number;
  profit_margin: number;
}

export interface ProfitabilityBreakdownItem {
  label: string;
  net_revenue: number;
  total_expenses: number;
  net_income: number;
  profit_margin: number;
  trip_count: number;
}

export type ProfitabilityResponse = AnalyticsResponse<ProfitabilitySummary, ProfitabilityBreakdownItem>;

// ─── Financials – Expenses ────────────────────────────────────────────────────

export interface ExpensesSummary {
  total_expenses: number;
  expense_line_count: number;
}

export interface ExpenseBreakdownItem {
  purpose: string;
  teller: string;
  trip_id: string;
  route_name: string;
  vessel_name: string;
  scheduled_departure: string;
  amount: number;
}

export interface ExpenseTrend {
  purpose: string;
  total: number;
}

export type ExpensesResponse = AnalyticsResponse<ExpensesSummary, ExpenseBreakdownItem, ExpenseTrend>;

// ─── Financials – Reconciliation ──────────────────────────────────────────────

export interface ReconciliationSummary {
  total_bookings_checked: number;
  matched: number;
  discrepancy_count: number;
  total_payment_amount: number;
  total_item_amount: number;
  net_discrepancy: number;
  affected_booking_ids: string[];
}

export interface ReconciliationDiscrepancy {
  booking_id: string;
  payment_total: number;
  item_total: number;
  delta: number;
}

export interface ReconciliationResponse {
  summary: ReconciliationSummary;
  discrepancies: ReconciliationDiscrepancy[];
  meta: AnalyticsMeta;
}

// ─── Sales – Overview ─────────────────────────────────────────────────────────

export interface SalesOverviewSummary {
  pax_revenue: number;
  cargo_revenue: number;
  pax_count: number;
  cargo_count: number;
  booking_count: number;
  avg_booking_value: number;
}

export interface SalesTopRoute {
  route_name: string;
  net_revenue: number;
  trip_count: number;
}

export interface SalesDailyRevenue {
  date: string;
  pax_revenue: number;
  cargo_revenue: number;
  total: number;
}

export type SalesOverviewResponse = AnalyticsResponse<SalesOverviewSummary, SalesTopRoute, SalesDailyRevenue>;

// ─── Sales – Channels ─────────────────────────────────────────────────────────

export interface ChannelsSummary {
  gross_revenue: number;
  net_revenue: number;
  booking_count: number;
}

export interface ChannelBreakdownItem {
  channel: string;
  booking_count: number;
  gross_revenue: number;
  refund_total: number;
  net_revenue: number;
  share_pct: number;
}

export type SalesChannelsResponse = AnalyticsResponse<ChannelsSummary, ChannelBreakdownItem>;

// ─── Sales – Insights ─────────────────────────────────────────────────────────

export interface BookingInsightSummary {
  total_bookings: number;
  avg_booking_value: number;
  multi_payment_rate: number;
  refund_rate: number;
}

export type SalesInsightsResponse = AnalyticsResponse<BookingInsightSummary>;

// ─── Demand – Passengers ──────────────────────────────────────────────────────

export interface PassengerDemandSummary {
  total_passengers: number;
  refunded_passengers: number;
  unique_accommodations: number;
  unique_discount_types: number;
}

export interface PassengerSegmentItem {
  segment: string;
  count: number;
  gross_revenue: number;
  refund_total: number;
  net_revenue: number;
  share_pct: number;
}

export type PassengerDemandResponse = AnalyticsResponse<
  PassengerDemandSummary,
  PassengerSegmentItem,
  PassengerSegmentItem
>;

// ─── Demand – Cargo ───────────────────────────────────────────────────────────

export interface CargoDemandSummary {
  total_cargo: number;
  refunded_cargo: number;
  unique_vehicle_types: number;
}

export interface CargoSegmentItem {
  vehicle_type: string;
  count: number;
  gross_revenue: number;
  refund_total: number;
  net_revenue: number;
  share_pct: number;
}

export type CargoDemandResponse = AnalyticsResponse<CargoDemandSummary, CargoSegmentItem>;

// ─── Demand – Trends ──────────────────────────────────────────────────────────

export interface DemandTrendSummary {
  total_passengers: number;
  total_cargo: number;
  peak_date: string | null;
}

export interface DailyDemandPoint {
  date: string;
  passengers: number;
  cargo: number;
  revenue: number;
}

export type DemandTrendsResponse = AnalyticsResponse<DemandTrendSummary, never, DailyDemandPoint>;

// ─── Operations – Schedule ────────────────────────────────────────────────────

export interface ScheduleSummary {
  total_trips: number;
  trips_per_day: number;
  avg_pax_per_trip: number;
  avg_cargo_per_trip: number;
}

export interface ScheduleRouteBreakdown {
  route_name: string;
  trip_count: number;
  avg_pax_per_trip: number;
  avg_cargo_per_trip: number;
}

export interface DailyTripPoint {
  date: string;
  trip_count: number;
  pax_count: number;
  cargo_count: number;
  gross_revenue: number;
}

export type ScheduleResponse = AnalyticsResponse<ScheduleSummary, ScheduleRouteBreakdown, DailyTripPoint>;

// ─── Operations – Live ────────────────────────────────────────────────────────

export interface LiveBooking {
  booking_reference: string;
  route_name: string;
  vessel_name: string;
  passenger_count: number;
  cargo_count: number;
  total_amount: number;
  booking_status: string;
  booked_at: string;
}

export interface LiveTripItem {
  trip_id: string;
  route_name: string;
  vessel_name: string;
  scheduled_departure: string;
  status: string;
}

export interface LiveResponse {
  bookings: LiveBooking[];
  trips: LiveTripItem[];
}

// ─── Assets – Vessels ─────────────────────────────────────────────────────────

export interface VesselAssetSummary {
  total_vessels: number;
  total_revenue: number;
  total_trips: number;
  total_passengers: number;
}

export interface VesselAssetItem {
  vessel_name: string;
  ship_id: number;
  trip_count: number;
  pax_count: number;
  cargo_count: number;
  gross_revenue: number;
  refund_total: number;
  net_revenue: number;
  total_expenses: number;
  net_income: number;
  avg_revenue_per_trip: number;
}

export type VesselsResponse = AnalyticsResponse<VesselAssetSummary, VesselAssetItem>;
