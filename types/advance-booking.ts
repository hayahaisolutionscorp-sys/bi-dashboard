export interface AdvanceBookingMetric {
  date: string;                   // YYYY-MM-DD
  confirmed_revenue: number;      // Confirmed revenue for that specific day
  capacity_utilization: number;   // Average Pax utilization percentage for that day
}

export interface LeadTimeData {
  days_ahead: number;             // X days before departure
  booking_count: number;          // Number of bookings made in this window
}

export interface RevenueSourceDistribution {
  source: string;                 // 'online', 'otc', 'travel_agency'
  revenue: number;                // Total revenue from this source
  percentage: number;             // % of total forward revenue
}

export interface CapacityAlert {
  trip_id: string;                 // Primary identifier for the trip
  vessel_name: string;
  vessel_status: string;           // 'active' (maintenance trips are filtered out)
  departure_date: string;          // YYYY-MM-DD
  pax_utilization_pct: number;     // Current passenger load %
  max_pax_capacity: number;        // Max seats (from cabins)
  cargo_utilization_pct: number;   // Current cargo load %
  max_cargo_capacity: number;      // Max cargo (from trip capacities)
  utilization_pct: number;         // Aliased to pax (for backward compatibility)
  remaining_capacity: number;      // Aliased to pax (for backward compatibility)
}

export interface AdvanceBookingResponse {
  overall_metrics: {
    total_forward_revenue: number;   // Total confirmed revenue for the period
    avg_advance_window: number;     // Average days booked before departure
    peak_demand_date: string;       // The date with highest confirmed revenue
    critical_voyages_count: number; // Count of ACTIVE trips with >80% utilization
  };
  daily_projections: AdvanceBookingMetric[];
  lead_time_distribution: LeadTimeData[];
  source_distribution: RevenueSourceDistribution[];
  capacity_alerts: CapacityAlert[];
}
