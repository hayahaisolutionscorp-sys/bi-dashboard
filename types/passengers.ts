export interface KpiDataRow {
  title: string;
  value: string;
  change: string;
  trend: "up" | "down" | "neutral";
  description: string;
  icon: string;
}

export interface TrendData {
  xAxis: string[];
  series: number[];
}

export interface ChartSeriesData {
  name: string;
  value: number;
}

export interface BookingTrendSeries {
  name: string;
  type: "bar" | "line" | "pie";
  data: number[];
}

export interface BookingTrendData {
  xAxis: string[];
  series: BookingTrendSeries[];
}

export interface RouteEfficiencyData {
  label: string;
  value: number;
}

export interface PassengersReportResponse {
  data: {
    kpiData: KpiDataRow[];
    trendData: TrendData;
    bookingChannelsData: ChartSeriesData[];
    discountDemographicsData: ChartSeriesData[];
    bookingTypeDemographics: ChartSeriesData[];
    bookingChannelTrendData: BookingTrendData;
    routeEfficiencyData: RouteEfficiencyData[];
  };
}
