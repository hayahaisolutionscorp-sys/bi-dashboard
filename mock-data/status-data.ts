import { DateRange } from "react-day-picker";

export interface StatusRecord {
  date: string;
  fleet_utilization: number;
  completion_rate: number;
  cancellation_rate: number;
  under_maintenance: number;
  revenue_at_risk: number;
  passenger_economy: number;
  passenger_tourist: number;
  passenger_business: number;
  passenger_vip: number;
  confirmed_bookings: number;
  cancelled_bookings: number;
}

const generateStatusData = (): StatusRecord[] => {
  const data: StatusRecord[] = [];
  const start = new Date("2025-12-01T00:00:00Z");
  
  for (let i = 0; i < 62; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split("T")[0];
    
    // Add random variations
    const dayOfWeek = d.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const loadFactor = isWeekend ? 0.9 + Math.random() * 0.1 : 0.6 + Math.random() * 0.3;
    
    data.push({
      date: dateStr,
      fleet_utilization: Math.round(loadFactor * 1000) / 10,
      completion_rate: 90 + Math.random() * 10,
      cancellation_rate: Math.random() * 5,
      under_maintenance: Math.floor(Math.random() * 5) + 8,
      revenue_at_risk: Math.random() * 3000000,
      passenger_economy: Math.round(400 * loadFactor),
      passenger_tourist: Math.round(300 * loadFactor),
      passenger_business: Math.round(200 * loadFactor),
      passenger_vip: Math.round(100 * loadFactor),
      confirmed_bookings: Math.round(200 * loadFactor),
      cancelled_bookings: Math.round(10 * (1 - loadFactor))
    });
  }
  return data;
};

export const RAW_STATUS_DATA = generateStatusData();

export const getFilteredStatusData = (dateRange: DateRange | undefined) => {
  const filtered = RAW_STATUS_DATA.filter(row => {
    let keep = true;
    if (dateRange?.from) {
      keep = keep && new Date(row.date) >= dateRange.from;
    }
    if (dateRange?.to) {
      keep = keep && new Date(row.date) <= dateRange.to;
    }
    return keep;
  });

  // Calculate Aggregated KPIs for the selected range
  const avgUtilization = filtered.length ? filtered.reduce((acc, curr) => acc + curr.fleet_utilization, 0) / filtered.length : 0;
  const avgCompletion = filtered.length ? filtered.reduce((acc, curr) => acc + curr.completion_rate, 0) / filtered.length : 0;
  const avgCancellation = filtered.length ? filtered.reduce((acc, curr) => acc + curr.cancellation_rate, 0) / filtered.length : 0;
  const currentMaintenance = filtered.length ? filtered[filtered.length - 1].under_maintenance : 0;
  const totalRisk = filtered.length ? filtered[filtered.length - 1].revenue_at_risk : 0;

  const STATUS_KPI_DATA = [
    { title: "Fleet Utilization", value: `${avgUtilization.toFixed(1)}%`, change: "+2.4%", trend: "up", description: "for selected period", icon: "ship" },
    { title: "Completion Rate", value: `${avgCompletion.toFixed(1)}%`, change: "+1.2%", trend: "up", description: "for selected period", icon: "check-circle" },
    { title: "Cancellation Rate", value: `${avgCancellation.toFixed(1)}%`, change: "-0.8%", trend: "down", description: "for selected period", icon: "x-circle" },
    { title: "Under Maintenance", value: currentMaintenance.toString(), change: "Active Docking", trend: "neutral", description: "Vessels currently", icon: "wrench" },
    { title: "Revenue at Risk", value: `₱${(totalRisk / 1000000).toFixed(1)}M`, change: "High Priority", trend: "down", description: "Due to delays", icon: "alert-triangle" },
  ];

  // Aggregate Passenger Distribution
  const totalEconomy = filtered.reduce((acc, curr) => acc + curr.passenger_economy, 0);
  const totalTourist = filtered.reduce((acc, curr) => acc + curr.passenger_tourist, 0);
  const totalBusiness = filtered.reduce((acc, curr) => acc + curr.passenger_business, 0);
  const totalVip = filtered.reduce((acc, curr) => acc + curr.passenger_vip, 0);

  const PASSENGER_CLASS_DIST_DATA = [
    { value: totalEconomy, name: "Economy", color: "#3b82f6" },
    { value: totalTourist, name: "Tourist", color: "#10b981" },
    { value: totalBusiness, name: "Business", color: "#f59e0b" },
    { value: totalVip, name: "VIP", color: "#8b5cf6" },
  ];

  // Booking Performance Trend
  const sortedDates = filtered.map(d => d.date).sort();
  const confirmedSeries = filtered.map(d => d.confirmed_bookings);
  const cancelledSeries = filtered.map(d => d.cancelled_bookings);

  return {
    STATUS_KPI_DATA,
    PASSENGER_CLASS_DIST_DATA,
    bookingTrend: {
      dates: sortedDates,
      confirmed: confirmedSeries,
      cancelled: cancelledSeries
    }
  };
};

export const ON_TIME_PERFORMANCE_DATA = {
  value: 92.4,
  name: "On-Time",
};

export const ONGOING_TRIPS_DATA = [
  { id: "TR-101", vessel: "Ferry Alpha", route: "Manila - Cebu", departure: "08:30", arrival: "10:15", status: "On Time", progress: 75 },
  { id: "TR-102", vessel: "Ferry Beta", route: "Cebu - Ormoc", departure: "09:00", arrival: "11:30", status: "Delayed", progress: 45 },
  { id: "TR-103", vessel: "Ferry Gamma", route: "Batangas - Calapan", departure: "10:30", arrival: "12:45", status: "On Time", progress: 20 },
  { id: "TR-104", vessel: "FastCat 1", route: "Iloilo - Bacolod", departure: "11:00", arrival: "12:30", status: "On Time", progress: 10 },
  { id: "TR-105", vessel: "Ocean Jet 5", route: "Cebu - Tagbilaran", departure: "11:15", arrival: "13:15", status: "Arriving", progress: 90 },
];

export const VESSEL_PERFORMANCE_RANKING = [
  { name: "MV Atlantic", route: "Manila - Cebu", performance: 98, revenue: "₱2.4M", status: "Active", trend: "up" },
  { name: "MV Pacific", route: "Batangas - Calapan", performance: 95, revenue: "₱1.8M", status: "Active", trend: "up" },
  { name: "MV Explorer", route: "Cebu - Ormoc", performance: 92, revenue: "₱1.5M", status: "Active", trend: "down" },
  { name: "MV Horizon", route: "Iloilo - Bacolod", performance: 88, revenue: "₱1.2M", status: "Maintenance", trend: "neutral" },
];
