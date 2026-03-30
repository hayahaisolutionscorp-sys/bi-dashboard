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
  canonical_route_name: string;
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

