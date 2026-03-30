export interface StatusKpiData {
  title: string;
  value: string;
  change: string;
  trend: "up" | "down" | "neutral";
  description: string;
  icon: string;
}

export interface PassengerClassData {
  name: string;
  value: number;
}

export interface BookingTrendItem {
  date: string;
  confirm: number;
  cancelled: number;
}

export type BookingTrendData = BookingTrendItem[];

export interface StatusReportResponse {
  data: {
    kpiData: StatusKpiData[];
    passengerClassData: PassengerClassData[];
    bookingTrendData: BookingTrendData;
  };
}
