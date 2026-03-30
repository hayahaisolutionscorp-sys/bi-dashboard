import { Ship, Users, Wallet, Calendar, TrendingUp, User, Package, XCircle, Route, PhilippinePeso } from "lucide-react";

export const OVERVIEW_DATA = {
  kpiStats: [
    {
      title: "Sales Today",
      value: "₱250,000",
      icon: Wallet,
      iconColorClass: "text-primary",
      iconBgColor: "bg-sky-50 dark:bg-sky-900/20",
      trend: {
        value: 12.5,
        label: "vs yesterday",
        direction: "up" as const,
      },
      breakdown: [
        { label: "Passengers", value: "1,247", icon: User },
        { label: "Cargo", value: "200 units", icon: Package },
        { label: "Canceled", value: "100", icon: XCircle, valueColor: "text-rose-500" },
        { label: "Total Trips", value: "156", icon: Route },
        { label: "Expenses", value: "₱ 24,580", icon: PhilippinePeso },
      ]
    },
    {
      title: "MTD Revenue",
      value: "₱25,000,000",
      icon: Calendar,
      iconColorClass: "text-teal-600",
      iconBgColor: "bg-teal-50 dark:bg-teal-900/20",
      trend: {
        value: 12.5,
        label: "vs last month",
        direction: "up" as const,
      },
      breakdown: [
        { label: "Passengers", value: "32,450", icon: User },
        { label: "Cargo", value: "4,800 units", icon: Package },
        { label: "Canceled", value: "842", icon: XCircle, valueColor: "text-rose-500" },
        { label: "Total Trips", value: "4,102", icon: Route },
        { label: "Expenses", value: "₱ 682,000", icon: PhilippinePeso },
      ]
    },
    {
      title: "YTD Revenue",
      value: "₱100,000,000",
      icon: TrendingUp,
      iconColorClass: "text-blue-600",
      iconBgColor: "bg-blue-50 dark:bg-blue-900/20",
      trend: {
        value: 12.5,
        label: "vs 2023",
        direction: "up" as const,
      },
      breakdown: [
        { label: "Passengers", value: "125,900", icon: User },
        { label: "Cargo", value: "18,200 units", icon: Package },
        { label: "Canceled", value: "2,140", icon: XCircle, valueColor: "text-rose-500" },
        { label: "Total Trips", value: "12,500", icon: Route },
        { label: "Expenses", value: "₱ 2,145,000", icon: PhilippinePeso },
      ]
    },
  ],
  revenueTrend: {
    title: "Booking Revenue Trend",
    description: "Annual performance overview",
    // Data tailored for ECharts
    data: {
        "2024": {
            xAxis: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
            series: [320000, 310000, 305000, 290000, 280000, 275000, 290000, 310000, 330000, 340000, 360000, 380000]
        },
        "2025": {
            xAxis: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
            series: [385000, 360000, 330000, 300000, 264000, 279000, 300000, 292000, 480000, 354000, 480000, 540000]
        }
    }
  },
  topRoutes: [
    { name: "Alpha Harbor - Port Beta", value: 82400, percentage: 100, color: "bg-primary" },
    { name: "Delta Reef - Sigma Isle", value: 64100, percentage: 78, color: "bg-primary" },
    { name: "Coral Bay - North Point", value: 52800, percentage: 64, color: "bg-primary" },
    { name: "Eastern Dock - Reef Line", value: 41200, percentage: 50, color: "bg-primary" },
    { name: "South Marina - Blue Gulf", value: 38900, percentage: 47, color: "bg-primary" },
    { name: "West Coast - Sandy Beach", value: 35600, percentage: 43, color: "bg-primary" },
    { name: "Oceanic View - Palm Island", value: 33200, percentage: 40, color: "bg-primary" },
    { name: "Highland Port - Low Tide", value: 31500, percentage: 38, color: "bg-primary" },
    { name: "Sunny Bay - Cloudy Cove", value: 29800, percentage: 36, color: "bg-primary" },
    { name: "Mystic River - Golden Lake", value: 28400, percentage: 34, color: "bg-primary" },
    { name: "Silver Sands - Bronze Bay", value: 26100, percentage: 31, color: "bg-primary" },
    { name: "Emerald City - Ruby Port", value: 24500, percentage: 29, color: "bg-primary" },
    { name: "Sapphire Sea - Diamond Dock", value: 22800, percentage: 27, color: "bg-primary" },
    { name: "Pearl Harbor - Jade Jetty", value: 21200, percentage: 25, color: "bg-primary" },
    { name: "Crystal Cove - Amber Isle", value: 19800, percentage: 24, color: "bg-primary" },
    { name: "Opal Ocean - Topaz Town", value: 18500, percentage: 22, color: "bg-primary" },
    { name: "Garnet Grove - Onyx Outpost", value: 17200, percentage: 20, color: "bg-primary" },
    { name: "Quartz Quay - Zircon Zone", value: 16800, percentage: 20, color: "bg-primary" },
    { name: "Moonlight Bay - Star Port", value: 15400, percentage: 18, color: "bg-primary" },
    { name: "Sunrise Shore - Sunset Strip", value: 14200, percentage: 17, color: "bg-primary" },
  ],
  bookingDistribution: {
    title: "Booking Type Distribution",
    description: "Digital vs. Physical channels",
    data: [
      { value: 68, name: "Online Bookings", itemStyle: { color: "#3f68e4" } }, // Primary
      { value: 32, name: "Walk-in Purchases", itemStyle: { color: "#14b8a6" } }, // Teal
    ],
  },
};

// ============================================================================
// API TRANSITION INTERFACES FOR OVERVIEW DASHBOARD
// ============================================================================

/**
 * This interface perfectly matches the SQL query output format you provided in `overview.csv`.
 * When you transition to a live API, your backend should return an array of objects matching this shape.
 */
export interface OverviewDataRow {
  report_date: string; // ISO Date String, e.g., "2027-07-31"
  route_name: string | null;
  vessel_name: string | null;
  booking_source: string | null;
  payload_category: string | null;
  total_revenue: number;
  total_passengers: number;
  total_cargo_units: number;
  canceled_bookings_count: number;
  total_trips: number;
  total_expenses: number;
}

/**
 * Example of how the raw API data translates directly from your SQL logic.
 * You can replace this array with a `fetch()` call later.
 */
export const MOCK_OVERVIEW_RAW_API_RESPONSE: OverviewDataRow[] = [
  {
    report_date: "2026-05-17",
    route_name: null,
    vessel_name: "MV Aeron",
    booking_source: null,
    payload_category: null,
    total_revenue: 0,
    total_passengers: 0,
    total_cargo_units: 0,
    canceled_bookings_count: 0,
    total_trips: 2,
    total_expenses: 657200
  },
  {
    report_date: "2026-05-08",
    route_name: "VAL-CAM",
    vessel_name: "MV LLVN",
    booking_source: null,
    payload_category: null,
    total_revenue: 0,
    total_passengers: 0,
    total_cargo_units: 0,
    canceled_bookings_count: 0,
    total_trips: 1,
    total_expenses: 0
  },
  {
    report_date: new Date().toISOString().split("T")[0], // Mocking "Today"
    route_name: "Alpha Harbor - Port Beta",
    vessel_name: "MV Test Ship",
    booking_source: "Online Bookings",
    payload_category: " пассажир ",
    total_revenue: 250000,
    total_passengers: 1247,
    total_cargo_units: 200,
    canceled_bookings_count: 100,
    total_trips: 156,
    total_expenses: 24580
  },
];

/**
 * Example aggregator outline: 
 * Once connected to the API, this function maps the raw `OverviewDataRow[]` 
 * directly into the structured `OVERVIEW_DATA` format needed by the Charts in `page.tsx`.
 */
export function buildOverviewViewData(apiRows: OverviewDataRow[]) {
  // Example logic:
  // 1. Filter rows by `timeFrame` (Today, MTD, YTD)
  // 2. Sum up total_revenue, total_passengers, etc. to build the KPI cards
  // 3. Group by route_name for the "Revenue by Route" chart
  // 4. Group by booking_source for "Booking Distribution" pie chart
  return OVERVIEW_DATA; // returning static data for now to keep UI working
}
