import { DateRange } from "react-day-picker";

export interface SalesKpiItem {
  label: string;
  value: string;
  icon: string;
  color: string;
  colorClass: string;
  valueClass?: string;
  indicatorText: string;
  indicatorDirection: "up" | "down" | "neutral";
  indicatorSubtext: string;
}

export interface RawSalesRecord {
  report_date: string;
  report_month: string;
  report_week: string;
  booking_source: string;
  route_name: string;
  payment_method: string;
  current_status: string;
  payload_category: string;
  total_revenue: number;
  base_revenue: number;
  total_booking_transactions: number;
  total_headcount: number;
  total_cargo_units: number;
}

const generateMockData = (): RawSalesRecord[] => {
  const data: RawSalesRecord[] = [];
  const routes = [
    { name: "Cebu - Tagbilaran", baseRev: 80000, baseBook: 120 },
    { name: "Cebu - Lapu-Lapu", baseRev: 50000, baseBook: 80 },
    { name: "Cebu - Manila", baseRev: 70000, baseBook: 50 },
    { name: "Cebu - Palawan", baseRev: 40000, baseBook: 35 },
  ];
  const sources = ["otc", "mobile_app", "travel_agency", "website", "walk_in"];
  const payloads = ["Passenger Only", "Cargo Only", "Mixed (Passenger & Cargo)"];
  const payments = ["CASH", "EPAYMENT", "CHEQUE"];
  const statuses = ["Confirmed", "Invalid", "Requested"];
  
  const addDays = (startDate: Date, days: number) => {
    const d = new Date(startDate);
    d.setDate(d.getDate() + days);
    return d;
  };

  const getWeekString = (dateObj: Date) => {
    const d = new Date(Date.UTC(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return `${d.getUTCFullYear()}-W${weekNo.toString().padStart(2, '0')}`;
  };

  const start = new Date("2025-12-01T00:00:00Z");
  // 120 days to ensure data exists for current date ranges
  for (let i = 0; i < 120; i++) {
    const currentDate = addDays(start, i);
    const dateStr = currentDate.toISOString().split("T")[0];
    const monthStr = dateStr.slice(0, 7);
    const weekStr = getWeekString(currentDate);
    
    routes.forEach((route, index) => {
      const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6;
      const variationBase = isWeekend ? 1.2 : 0.8;
      const variation = variationBase + (Math.random() * 0.4);
      
      const rev = Math.round(route.baseRev * variation);
      const book = Math.round(route.baseBook * variation);
      
      const source = sources[(i + index) % sources.length];
      const payload = payloads[(i * index) % payloads.length];
      const status = statuses[i % 10 === 0 ? 1 : 0]; // roughly 10% invalid
      
      data.push({
        report_date: dateStr,
        report_month: monthStr,
        report_week: weekStr,
        booking_source: source,
        route_name: route.name,
        payment_method: payments[i % payments.length],
        current_status: status,
        payload_category: payload,
        total_revenue: rev,
        base_revenue: rev * 0.8,
        total_booking_transactions: book,
        total_headcount: Math.round(book * 1.5),
        total_cargo_units: payload === "Passenger Only" ? 0 : Math.round(book * 0.5)
      });
    });
  }
  return data;
};

export const RAW_SALES_DATA: RawSalesRecord[] = generateMockData();

// Filter for unique routes, ignoring missing routes
export const UNIQUE_ROUTES = Array.from(new Set(RAW_SALES_DATA.map(d => d.route_name).filter(Boolean))).sort();

// Helper to format currency
const formatCurrency = (val: number) => {
  if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
  if (val >= 1000) return `$${(val / 1000).toFixed(0)}K`;
  return `$${val}`;
};

export const getFilteredSalesData = (selectedRoute: string, dateRange: DateRange | undefined) => {
  // 1. Filter Data
  const filtered = RAW_SALES_DATA.filter(row => {
    let keep = true;
    if (selectedRoute !== "All") {
      keep = keep && row.route_name === selectedRoute;
    }
    // Simple date filter (for demo purposes)
    if (dateRange?.from) {
      keep = keep && new Date(row.report_date) >= dateRange.from;
    }
    if (dateRange?.to) {
      keep = keep && new Date(row.report_date) <= dateRange.to;
    }
    // Only count Valid/Confirmed bookings for KPI calculations
    keep = keep && row.current_status === "Confirmed";
    return keep;
  });

  // 2. Aggregate KPIs
  let totalRevenue = 0;
  let totalBookings = 0;
  
  const dateRevenueMap: Record<string, { rev: number; book: number }> = {};
  const sourceRevenueMap: Record<string, number> = {};
  const payloadRevenueMap: Record<string, number> = {};

  filtered.forEach(row => {
    totalRevenue += Number(row.total_revenue);
    totalBookings += Number(row.total_booking_transactions);

    sourceRevenueMap[row.booking_source] = (sourceRevenueMap[row.booking_source] || 0) + Number(row.total_revenue);
    payloadRevenueMap[row.payload_category] = (payloadRevenueMap[row.payload_category] || 0) + Number(row.total_revenue);
    
    if (!dateRevenueMap[row.report_date]) dateRevenueMap[row.report_date] = { rev: 0, book: 0 };
    dateRevenueMap[row.report_date].rev += Number(row.total_revenue);
    dateRevenueMap[row.report_date].book += Number(row.total_booking_transactions);
  });

  const kpiData: SalesKpiItem[] = [
    { 
      label: "Total Revenue", value: formatCurrency(totalRevenue), icon: "payments", 
      color: "primary", colorClass: "text-black", indicatorText: "+12.5%", indicatorDirection: "up", indicatorSubtext: "vs prev",
    },
    { 
      label: "Net Revenue", value: formatCurrency(totalRevenue * 0.8), icon: "trending_up", 
      color: "emerald", colorClass: "text-black", indicatorText: "+5.1%", indicatorDirection: "up", indicatorSubtext: "vs prev",
    },
    { 
      label: "Total Bookings", value: totalBookings.toLocaleString(), icon: "confirmation_number", 
      color: "blue", colorClass: "text-black", indicatorText: "+12.5%", indicatorDirection: "up", indicatorSubtext: "vs prev",
    },
  ];

  // 3. Trend Chart
  const sortedDates = Object.keys(dateRevenueMap).sort();
  const revenueSeries = sortedDates.map(d => dateRevenueMap[d].rev);
  const bookingsSeries = sortedDates.map(d => dateRevenueMap[d].book);

  const revenueTrendData = {
    title: "Revenue vs Bookings Trend",
    xAxisData: sortedDates, // Simple representation
    series: [
      {
        name: "Revenue (₱)", type: "line" as const, data: revenueSeries,
        smooth: true, lineStyle: { width: 3 }, itemStyle: { color: "#2563eb" },
      },
      {
        name: "Total Bookings", type: "bar" as const, data: bookingsSeries,
        itemStyle: { color: "#94a3b8" }, barWidth: '40%'
      },
    ],
  };

  // 4. Sales by Source
  const sourceColors: Record<string, string> = { "otc": "#10b981", "mobile_app": "#3b82f6", "travel_agency": "#f59e0b", "website": "#fb7185", "walk_in": "#8b5cf6" };
  const salesBySourceData = {
    title: "Sales by Booking Source",
    data: Object.entries(sourceRevenueMap).map(([name, value]) => ({
      name: name.replace("_", " ").toUpperCase(),
      value,
      itemStyle: { color: sourceColors[name] || "#94a3b8" }
    })).sort((a, b) => b.value - a.value)
  };

  // 5. Cargo Pie
  const payloadColors: Record<string, string> = { "Passenger Only": "#2563eb", "Cargo Only": "#6366f1", "Mixed (Passenger & Cargo)": "#38bdf8" };
  const cargoTypeData = {
    title: "Revenue by Payload Category",
    data: Object.entries(payloadRevenueMap).map(([name, value]) => ({
      name,
      value,
      itemStyle: { color: payloadColors[name] || "#cbd5e1" }
    })).sort((a, b) => b.value - a.value)
  };

  return {
    kpiData,
    revenueTrendData,
    salesBySourceData,
    cargoTypeData,
    vesselPerformanceData: [] // Ignoring this for the refactor to keep it simple, or we can restore hardcoded
  };
};

export const INITIAL_SALES_STATE = getFilteredSalesData("All", undefined);
export const SALES_KPI_DATA = INITIAL_SALES_STATE.kpiData;
export const REVENUE_TREND_DATA = INITIAL_SALES_STATE.revenueTrendData;
export const SALES_BY_SOURCE_DATA = INITIAL_SALES_STATE.salesBySourceData;
export const CARGO_TYPE_DATA = INITIAL_SALES_STATE.cargoTypeData;
export const VESSEL_PERFORMANCE_DATA: any[] = [];
