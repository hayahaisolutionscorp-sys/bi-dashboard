export interface RecentActivityItem {
  id: string;
  created_at: string;
  type: "passenger" | "cargo" | "mixed";
  route_name: string;
  vessel_name: string;
  amount: number;
  source: string;
  pax_count: number;
  cargo_count: number;
  status: string;
}

export interface ScheduleTripItem {
  trip_id: string;
  vessel_name: string;
  route_name: string;
  departure_time: string;
  arrival_time: string | null;
  pax_booked: number;
  pax_capacity: number;
  pax_utilization_pct: number;
  status: string;
}

export interface CapacityHeatmapCell {
  route_name: string;
  period_label: string;
  utilization_pct: number;
  booked: number;
  capacity: number;
}

export interface TopAgentItem {
  agent_id: string;
  agent_name: string;
  agent_email: string;
  total_bookings: number;
  total_revenue: number;
  pax_bookings: number;
  cargo_bookings: number;
}
