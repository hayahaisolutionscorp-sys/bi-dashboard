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

export interface VolumeVsRevenueSeries {
  name: string;
  type: string;
  data: number[];
  yAxisIndex?: number;
}

export interface VolumeVsRevenueData {
  xAxis: string[];
  series: VolumeVsRevenueSeries[];
}

export interface CargoReportResponse {
  data: {
    kpiData: KpiDataRow[];
    cargoClassesData: ChartSeriesData[];
    revenueContributionData: ChartSeriesData[];
    volumeVsRevenueData: VolumeVsRevenueData;
    sourceDistributionData: ChartSeriesData[];
  };
}
