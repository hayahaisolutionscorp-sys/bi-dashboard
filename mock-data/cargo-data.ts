

export interface CargoPerTripDataRow {
  report_date: string;
  report_month: string;
  trip_id: string;
  trip_status: string;
  route_name: string;
  vessel_name: string;
  total_ship_cargo_capacity: number | string;
  cargo_class_name: 'rolling' | 'loose' | string;
  booking_source: string;
  commodity_or_type: string;
  cargo_booking_status: string;
  cargo_count: number | string;
  cargo_total_weight: number | string;
  cargo_revenue: number | string;
}

export const mockCargoPerTripApi: CargoPerTripDataRow[] = [
  {
    report_date: "2026-02-26T16:00:00.000Z",
    report_month: "Feb 2026",
    trip_id: "714bcf7a-ae13-492e-98c8-a6567a0b6b83",
    trip_status: "scheduled",
    route_name: "Bogo, Cebu - Cordova, Cebu",
    vessel_name: "MV Ceven",
    total_ship_cargo_capacity: 70000,
    cargo_class_name: "rolling",
    booking_source: "otc",
    commodity_or_type: "Honda Acty",
    cargo_booking_status: "Confirmed",
    cargo_count: 2,
    cargo_total_weight: 0,
    cargo_revenue: 6686.08
  },
  {
    report_date: "2026-02-26T16:00:00.000Z",
    report_month: "Feb 2026",
    trip_id: "714bcf7a-ae13-492e-98c8-a6567a0b6b83",
    trip_status: "scheduled",
    route_name: "Bogo, Cebu - Cordova, Cebu",
    vessel_name: "MV Ceven",
    total_ship_cargo_capacity: 70000,
    cargo_class_name: "rolling",
    booking_source: "otc",
    commodity_or_type: "Ford Ranger",
    cargo_booking_status: "Confirmed",
    cargo_count: 2,
    cargo_total_weight: 0,
    cargo_revenue: 7780
  },
  {
    report_date: "2026-02-26T16:00:00.000Z",
    report_month: "Feb 2026",
    trip_id: "714bcf7a-ae13-492e-98c8-a6567a0b6b83",
    trip_status: "scheduled",
    route_name: "Bogo, Cebu - Cordova, Cebu",
    vessel_name: "MV Ceven",
    total_ship_cargo_capacity: 70000,
    cargo_class_name: "loose",
    booking_source: "otc",
    commodity_or_type: "Nails",
    cargo_booking_status: "Confirmed",
    cargo_count: 2,
    cargo_total_weight: 0,
    cargo_revenue: 525.0
  },
  {
    report_date: "2026-02-26T16:00:00.000Z",
    report_month: "Feb 2026",
    trip_id: "714bcf7a-ae13-492e-98c8-a6567a0b6b83",
    trip_status: "scheduled",
    route_name: "Bogo, Cebu - Cordova, Cebu",
    vessel_name: "MV Ceven",
    total_ship_cargo_capacity: 70000,
    cargo_class_name: "loose",
    booking_source: "otc",
    commodity_or_type: "Chickens or Ducks in transport crates.",
    cargo_booking_status: "Confirmed",
    cargo_count: 2,
    cargo_total_weight: 0,
    cargo_revenue: 80
  },
  {
    report_date: "2026-02-25T16:00:00.000Z",
    report_month: "Feb 2026",
    trip_id: "bc4145b2-b3c4-4453-9834-692ce489e40b",
    trip_status: "scheduled",
    route_name: "Bogo, Cebu - Cordova, Cebu",
    vessel_name: "MV Ceven",
    total_ship_cargo_capacity: 70000,
    cargo_class_name: "loose",
    booking_source: "otc",
    commodity_or_type: "Fresh eggs in trays or crates. Fragile.",
    cargo_booking_status: "Confirmed",
    cargo_count: 2,
    cargo_total_weight: 0,
    cargo_revenue: 15450
  },
  // Adding some older dates to show trend
  {
    report_date: "2026-01-15T16:00:00.000Z",
    report_month: "Jan 2026",
    trip_id: "trip-jan-1",
    trip_status: "completed",
    route_name: "Bogo, Cebu - Cordova, Cebu",
    vessel_name: "MV Ceven",
    total_ship_cargo_capacity: 70000,
    cargo_class_name: "rolling",
    booking_source: "online",
    commodity_or_type: "Toyota Hilux",
    cargo_booking_status: "Completed",
    cargo_count: 1,
    cargo_total_weight: 2000,
    cargo_revenue: 8500
  },
  {
    report_date: "2026-01-20T16:00:00.000Z",
    report_month: "Jan 2026",
    trip_id: "trip-jan-2",
    trip_status: "completed",
    route_name: "Bogo, Cebu - Cordova, Cebu",
    vessel_name: "MV Ceven",
    total_ship_cargo_capacity: 70000,
    cargo_class_name: "loose",
    booking_source: "agent",
    commodity_or_type: "Electronics",
    cargo_booking_status: "Completed",
    cargo_count: 50,
    cargo_total_weight: 1500,
    cargo_revenue: 12000
  },
  {
    report_date: "2025-12-10T16:00:00.000Z",
    report_month: "Dec 2025",
    trip_id: "trip-dec-1",
    trip_status: "completed",
    route_name: "Bogo, Cebu - Cordova, Cebu",
    vessel_name: "MV Ceven",
    total_ship_cargo_capacity: 70000,
    cargo_class_name: "rolling",
    booking_source: "agent",
    commodity_or_type: "Honda Wave 125",
    cargo_booking_status: "Completed",
    cargo_count: 1,
    cargo_total_weight: 200,
    cargo_revenue: 1200
  },
  {
    report_date: "2025-12-23T16:00:00.000Z",
    report_month: "Dec 2025",
    trip_id: "trip-dec-xmas-cargo",
    trip_status: "completed",
    route_name: "Bogo, Cebu - Cordova, Cebu",
    vessel_name: "MV Ceven",
    total_ship_cargo_capacity: 70000,
    cargo_class_name: "loose",
    booking_source: "online",
    commodity_or_type: "Toys & Holiday Supplies",
    cargo_booking_status: "Completed",
    cargo_count: 150,
    cargo_total_weight: 4500,
    cargo_revenue: 25000
  },
  {
    report_date: "2025-12-28T16:00:00.000Z",
    report_month: "Dec 2025",
    trip_id: "trip-dec-nye-cargo",
    trip_status: "completed",
    route_name: "Bogo, Cebu - Cordova, Cebu",
    vessel_name: "MV Ceven",
    total_ship_cargo_capacity: 70000,
    cargo_class_name: "rolling",
    booking_source: "otc",
    commodity_or_type: "Isuzu Elf Delivery Truck",
    cargo_booking_status: "Completed",
    cargo_count: 2,
    cargo_total_weight: 5000,
    cargo_revenue: 14000
  },
  {
    report_date: "2026-01-05T16:00:00.000Z",
    report_month: "Jan 2026",
    trip_id: "trip-jan-new-year",
    trip_status: "completed",
    route_name: "Bogo, Cebu - Cordova, Cebu",
    vessel_name: "MV Ceven",
    total_ship_cargo_capacity: 70000,
    cargo_class_name: "loose",
    booking_source: "otc",
    commodity_or_type: "Construction Materials",
    cargo_booking_status: "Completed",
    cargo_count: 300,
    cargo_total_weight: 12000,
    cargo_revenue: 85000
  },
  {
    report_date: "2026-01-25T16:00:00.000Z",
    report_month: "Jan 2026",
    trip_id: "trip-jan-late",
    trip_status: "completed",
    route_name: "Bogo, Cebu - Cordova, Cebu",
    vessel_name: "MV Ceven",
    total_ship_cargo_capacity: 70000,
    cargo_class_name: "rolling",
    booking_source: "online",
    commodity_or_type: "Mitsubishi Montero",
    cargo_booking_status: "Completed",
    cargo_count: 3,
    cargo_total_weight: 6000,
    cargo_revenue: 21000
  }
];

export function generateCargoDashboardData(rows: CargoPerTripDataRow[], dateRange?: { from?: Date; to?: Date }) {
  const filteredRows = rows.filter(row => {
    if (!dateRange || !dateRange.from) return true;
    const rowDate = new Date(row.report_date);
    const fromDate = new Date(dateRange.from);
    fromDate.setHours(0,0,0,0);
    const toDate = dateRange.to ? new Date(dateRange.to) : undefined;
    if (toDate) toDate.setHours(23,59,59,999);

    if (rowDate < fromDate) return false;
    if (toDate && rowDate > toDate) return false;
    return true;
  });

  let totalRevenue = 0;
  let totalWeight = 0;
  let totalCapacity = 0;
  const uniqueTrips = new Set<string>();
  const seenTripCapacity = new Set<string>();

  const cargoClasses: Record<string, number> = {};
  const commodityRevenue: Record<string, number> = {};
  
  // For Volume vs Revenue trend
  const dailyVolume: Record<string, number> = {};
  const dailyRevenue: Record<string, number> = {};
  const bookingSources: Record<string, number> = {};

  filteredRows.forEach(row => {
    totalRevenue += Number(row.cargo_revenue);
    totalWeight += Number(row.cargo_total_weight) || Number(row.cargo_count) * 1000; // rough fallback if weight is 0
    uniqueTrips.add(row.trip_id);
    
    if (!seenTripCapacity.has(row.trip_id)) {
      totalCapacity += Number(row.total_ship_cargo_capacity);
      seenTripCapacity.add(row.trip_id);
    }

    const className = row.cargo_class_name === 'rolling' ? 'Rolling Cargo' : 'Loose Cargo';
    cargoClasses[className] = (cargoClasses[className] || 0) + 1;

    const commodity = row.commodity_or_type || 'Unknown';
    commodityRevenue[commodity] = (commodityRevenue[commodity] || 0) + Number(row.cargo_revenue);

    const dateStr = row.report_date;
    dailyVolume[dateStr] = (dailyVolume[dateStr] || 0) + (Number(row.cargo_total_weight) || Number(row.cargo_count) * 1000);
    dailyRevenue[dateStr] = (dailyRevenue[dateStr] || 0) + Number(row.cargo_revenue);

    const source = row.booking_source || 'OTC';
    bookingSources[source] = (bookingSources[source] || 0) + Number(row.cargo_revenue);
  });

  const avgRevPerTrip = uniqueTrips.size > 0 ? (totalRevenue / uniqueTrips.size).toFixed(2) : "0";
  // Assuming totalCapacity is in roughly same unit as weight/volume
  const loadFactor = totalCapacity > 0 ? ((totalWeight / totalCapacity) * 100).toFixed(1) : "0";

  const kpiData = [
    { title: "Load Factor (Est.)", value: `${loadFactor}%`, change: "0%", trend: "neutral", description: "vs last month", icon: "box" },
    { title: "Total Revenue", value: `₱${totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 2 })}`, change: "0%", trend: "neutral", description: "vs last month", icon: "banknote" },
    { title: "Avg Rev/Trip", value: `₱${Number(avgRevPerTrip).toLocaleString(undefined, { maximumFractionDigits: 2 })}`, change: "0%", trend: "neutral", description: "vs last month", icon: "bar-chart-3" },
    { title: "Est. Total Cargo Wt", value: `${totalWeight.toLocaleString()} kg`, change: "0%", trend: "neutral", description: "vs last month", icon: "container" },
  ];

  const colors = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#6366f1"];

  const cargoClassesData = Object.entries(cargoClasses)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value], i) => ({ name, value, color: colors[i % colors.length] }));

  const revenueContributionData = Object.entries(commodityRevenue)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5) // top 5
    .map(([name, value], i) => ({ name, value, color: colors[i % colors.length] }));
    
  // Volume vs Revenue Trend
  const sortedDates = Object.keys(dailyVolume).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
  
  const volumeVsRevenueData = {
    xAxis: sortedDates,
    series: [
      {
        name: "Volume (kg)",
        type: "bar" as const,
        data: sortedDates.map(date => dailyVolume[date] || 0),
        yAxisIndex: 1,
        color: "#3b82f6"
      },
      {
        name: "Revenue (₱)",
        type: "bar" as const,
        data: sortedDates.map(date => dailyRevenue[date] || 0),
        yAxisIndex: 0,
        color: "#10b981"
      }
    ]
  };

  const sourceDistributionData = Object.entries(bookingSources).map(([source, revenue]) => ({
    name: source.toUpperCase(),
    value: revenue,
    percentage: totalRevenue > 0 ? Math.round((revenue / totalRevenue) * 100) : 0
  })).sort((a, b) => b.value - a.value);

  return {
    kpiData,
    cargoClassesData,
    revenueContributionData,
    volumeVsRevenueData,
    sourceDistributionData
  };
}
