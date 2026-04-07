export interface KpiDataRow {
  title: string;
  value: string;
  change: string;
  trend: "up" | "down" | "neutral";
  description: string;
  icon: string;
}

export interface ChartSeriesData {
  name: string;
  value: number;
  percentage?: number;
}

export interface CargoClassRevenue {
  class: string;
  revenue: number;
}

export interface RevenuePerCargoTrendItem {
  date: string;
  "cargo-type-rolling": CargoClassRevenue[];
  "cargo-type-loose": CargoClassRevenue[];
}

export interface CargoReportResponse {
  data: {
    kpiData: KpiDataRow[];
    cargoClassesData: ChartSeriesData[];
    revenueContributionData: ChartSeriesData[];
    revenuepercargotrend: RevenuePerCargoTrendItem[];
    sourceDistributionData: ChartSeriesData[];
  };
}
