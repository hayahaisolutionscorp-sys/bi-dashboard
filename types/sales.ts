// KPIs
export interface SalesReportKpis {
  total_gross_revenue: number;
  total_net_revenue: number;
  total_bookings: number;
  total_refund_deductions: number;
  total_disbursements: number;
}

// Trend chart
export interface SalesTrendItem {
  transaction_date: string;
  gross_revenue: number;
  net_revenue: number;
  bookings: number;
}

// Booking source chart
export interface BookingSourceItem {
  source: string;
  gross_revenue: number;
  net_revenue: number;
  bookings: number;
}

// Revenue mix – type split (used for Pie slices)
export interface RevenueMixTypeSplit {
  type: string;        // "CARGO" | "PASSENGER"
  gross: number;
  net: number;
  percentage: number;
}

// Revenue mix – sub categories (shown in tooltip)
export interface RevenueMixSubCategory {
  payload_type: string;   // "CARGO" | "PASSENGER"
  category: string;
  gross: number;
  net: number;
  count: number;
  percentage: number;
}

export interface RevenueMix {
  type_split: RevenueMixTypeSplit[];
  sub_categories: RevenueMixSubCategory[];
}

// Full route data
export interface SalesReportRoute {
  route_name: string;
  kpis: SalesReportKpis;
  charts: {
    trend: SalesTrendItem[];
    booking_source: BookingSourceItem[];
    revenue_mix: RevenueMix;
  };
}

// API wrappers
export interface SalesReportData {
  routes: SalesReportRoute[];
}

export interface SalesReportApiResponse {
  data: SalesReportData;
}

export interface SalesRoutesApiResponse {
  data: {
    routes: string[];
  };
}

// Comparison Trend
export interface ComparisonTrendParams {
  from: string;
  to: string;
  compareBy: string; // 'route' | 'vessel' | 'trip'
  entityIds?: string | string[];
  granularity?: 'day' | 'week' | 'month';
}

export interface ComparisonTrendEntitiesParams {
  compareBy: 'route' | 'vessel' | 'trip';
  from?: string;
  to?: string;
  q?: string;
}

export interface ComparisonPoint {
  date: string; // "YYYY-MM-DD"
  totalSales: number;
  grossRevenue: number;
  totalBookings: number;
  totalPassengers: number;
  loadFactor?: number | null;
}

export interface ComparisonTrendSeries {
  id: string; // The specific route name, vessel name, or trip UUID
  data: ComparisonPoint[];
}

export interface ComparisonTrendData {
  granularity: 'hourly' | 'daily' | 'weekly' | 'monthly';
  series: ComparisonTrendSeries[];
}

export interface ComparisonTrendApiResponse {
  data: ComparisonTrendData;
}

// New KPI Endpoint Types — Simplified
export interface SalesKpiItem {
  value: number;
  label: string;
}

export interface SalesKpiResponse {
  data: {
    totalSales: SalesKpiItem;
    grossRevenue: SalesKpiItem;
    totalBookings: SalesKpiItem;
  };
}

export interface RevenueTrendItem {
  date: string;
  grossRevenue: number;
  sources: {
    api_v2: number;
    mobile_app: number;
    online: number;
    otc: number;
    travel_agency: number;
    walk_in: number;
    website: number;
    total?: number; // Optional, can be calculated on the fly
  };
}

export interface RevenueVsBookingTrendsResponse {
  data: {
    revenueTrends: RevenueTrendItem[];
  };
}

export interface SalesChartsResponse {
  data: {
    salesByRoute: { label: string; value: number }[];
    salesByVessel: { label: string; value: number }[];
  };
}
