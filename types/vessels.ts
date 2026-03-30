export interface VesselsKpi {
  title: string;
  value: string | number;
  change: string;
  trend: "up" | "down" | "neutral";
  description: string;
  icon: string;
}

export interface FleetLoadFactor {
  vessel_name: string;
  pax_utilization: number;
  cargo_utilization: number;
}

export interface TripEfficiency {
  vessel_name: string;
  avg_revenue_per_trip: number;
  total_trips: number;
}

export interface TripDensity {
  vessel_name: string;
  date: string;
  trip_count: number;
}

export interface SuccessfulTrip {
  date: string;
  count: number;
}

export interface SuccessfulTripsCount {
  vessel_name: string;
  successful_trips: SuccessfulTrip[];
  cancelled_trips?: SuccessfulTrip[];
}

export interface VesselsResponse {
  data: {
    kpiData: VesselsKpi[];
    fleetLoadFactor: FleetLoadFactor[];
    tripEfficiency: TripEfficiency[];
    tripDensity?: TripDensity[];
    successfulTripsCount?: SuccessfulTripsCount[];
  };
}
