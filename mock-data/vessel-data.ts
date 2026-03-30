import { DateRange } from "react-day-picker";

export interface VesselDailyRecord {
  date: string;
  vessel_id: string;
  vessel_name: string;
  revenue: number;
  trips_count: number;
  passengers_count: number;
  cancellations: number;
  maintenance_day: boolean;
}

const VESSELS = [
  { id: "V-001", name: "MV Atlantic", gross: 900, net: 600 },
  { id: "V-002", name: "MV Pacific", gross: 850, net: 550 },
  { id: "V-003", name: "MV Explorer", gross: 400, net: 250 },
  { id: "V-004", name: "MV Horizon", gross: 1200, net: 800 },
  { id: "V-005", name: "MV Navigator", gross: 750, net: 500 },
];

const generateVesselData = (): VesselDailyRecord[] => {
  const data: VesselDailyRecord[] = [];
  const start = new Date("2025-12-01T00:00:00Z");
  
  for (let i = 0; i < 62; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split("T")[0];
    
    VESSELS.forEach(vessel => {
      const isWeekend = d.getDay() === 0 || d.getDay() === 6;
      const baseRevenue = vessel.id === "V-001" ? 150000 : 
                          vessel.id === "V-004" ? 200000 : 100000;
      const variation = Math.random() * 0.4 + 0.8; // 80% to 120%
      const weekendBoost = isWeekend ? 1.3 : 1.0;
      
      const revenue = Math.round(baseRevenue * variation * weekendBoost);
      const trips = Math.floor(Math.random() * 2) + 2; 
      const passengers = Math.round(revenue / 500);
      const cancellations = Math.random() > 0.9 ? Math.floor(Math.random() * 3) : 0;
      const maintenance = Math.random() > 0.97; // ~3% chance of maintenance day
      
      data.push({
        date: dateStr,
        vessel_id: vessel.id,
        vessel_name: vessel.name,
        revenue: maintenance ? 0 : revenue,
        trips_count: maintenance ? 0 : trips,
        passengers_count: maintenance ? 0 : passengers,
        cancellations: maintenance ? 0 : cancellations,
        maintenance_day: maintenance
      });
    });
  }
  return data;
};

export const RAW_VESSEL_DATA = generateVesselData();

export const getFilteredVesselsData = (dateRange: DateRange | undefined) => {
  const filtered = RAW_VESSEL_DATA.filter(row => {
    let keep = true;
    if (dateRange?.from) {
      keep = keep && new Date(row.date) >= dateRange.from;
    }
    if (dateRange?.to) {
      keep = keep && new Date(row.date) <= dateRange.to;
    }
    return keep;
  });

  // Aggregate Metrics
  const totalRevenue = filtered.reduce((acc, curr) => acc + curr.revenue, 0);
  const totalMaintenanceDays = filtered.filter(f => f.maintenance_day).length;
  
  const vesselIds = Array.from(new Set(filtered.map(f => f.vessel_id)));
  const avgRevenuePerVessel = vesselIds.length ? totalRevenue / vesselIds.length : 0;

  const metrics = {
    total_vessels: VESSELS.length,
    active_vessels: vesselIds.length,
    avg_revenue_per_vessel: avgRevenuePerVessel,
    avg_load_factor: 75 + (Math.random() * 10 - 5), // Mock stable load factor
    maintenance_count: totalMaintenanceDays,
  };

  // Vessel Performance Ranking
  const vesselPerformance = VESSELS.map(v => {
    const vesselData = filtered.filter(f => f.vessel_id === v.id);
    const vRevenue = vesselData.reduce((acc, curr) => acc + curr.revenue, 0);
    const vTrips = vesselData.reduce((acc, curr) => acc + curr.trips_count, 0);
    const vCancellations = vesselData.reduce((acc, curr) => acc + curr.cancellations, 0);
    const vMaintenance = vesselData.filter(f => f.maintenance_day).length;
    
    return {
      vessel_id: v.id,
      vessel_name: v.name,
      total_revenue: vRevenue,
      revenue_per_trip: vTrips ? vRevenue / vTrips : 0,
      load_factor: 70 + Math.random() * 20,
      cancellation_rate: vTrips ? (vCancellations / (vTrips + vCancellations)) * 100 : 0,
      maintenance_days: vMaintenance,
      total_trips: vTrips,
      gross_tonnage: v.gross,
      net_tonnage: v.net,
      vessel_score: 85 + Math.random() * 10,
      rank: 0
    };
  }).sort((a, b) => b.total_revenue - a.total_revenue)
    .map((v, i) => ({ ...v, rank: i + 1 }));

  // Revenue Trend (Daily aggregated)
  const dates = Array.from(new Set(filtered.map(f => f.date))).sort();
  const revenue_trend = dates.map(date => {
    const dayData = filtered.filter(f => f.date === date);
    return {
      date,
      revenue: dayData.reduce((acc, curr) => acc + curr.revenue, 0)
    };
  });

  return {
    metrics,
    vessel_performance: vesselPerformance,
    revenue_trend
  };
};

// Original static data for backward compatibility if needed (but we'll refactor)
export const VESSEL_KPI_DATA = []; 
export const REVENUE_BY_VESSEL_DATA = [];
export const REVENUE_PER_TRIP_TREND = { xAxis: { data: [] }, series: [] };
export const CANCELLATION_BY_VESSEL_DATA = [];
export const LOAD_FACTOR_BY_VESSEL_DATA = [];
export const MAINTENANCE_DAYS_DATA = [];
