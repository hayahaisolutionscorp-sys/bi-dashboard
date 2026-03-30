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
  entityIds?: string | string[]; // <--- Make it Optional
}

export interface ComparisonPoint {
  date: string; // "YYYY-MM-DD"
  totalSales: number;
  totalBookings: number;
  totalPassengers: number;
}

export interface ComparisonTrendSeries {
  id: string; // The specific route name, vessel name, or trip UUID
  data: ComparisonPoint[];
}

export interface ComparisonTrendData {
  granularity: 'hourly' | 'daily';
  series: ComparisonTrendSeries[];
}

export interface ComparisonTrendApiResponse {
  data: ComparisonTrendData;
}
