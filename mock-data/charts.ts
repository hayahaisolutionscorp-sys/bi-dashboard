import { LucideIcon } from "lucide-react";

// --- Types ---
export interface ChartDataSeries {
  name?: string;
  data: number[];
  color?: string;
  type?: 'line' | 'bar';
  smooth?: boolean;
  areaStyle?: any;
}

export interface TrendData {
  title: string;
  description?: string;
  xAxis: string[];
  series: ChartDataSeries[];
}

// --- BOOKING REVENUE TREND ---

export const REVENUE_TREND_DATA_TODAY: TrendData = {
  title: "Revenue Trend (Today)",
  description: "Hourly performance",
  xAxis: ["12 AM", "1 AM", "2 AM", "3 AM", "4 AM", "5 AM", "6 AM", "7 AM", "8 AM", "9 AM", "10 AM", "11 AM", "12 PM", "1 PM", "2 PM", "3 PM", "4 PM", "5 PM", "6 PM", "7 PM", "8 PM", "9 PM", "10 PM", "11 PM"],
  series: [{
    name: "Revenue",
    data: [
      2000, 1500, 1000, 800, 500, 1200, 3500, 5000, 8000, 12000, 15000, 18000, // AM
      22000, 20000, 18000, 21000, 24000, 28000, 25000, 20000, 15000, 10000, 6000, 3000 // PM
    ], // Distributed hourly data ~250k
    color: "#0284c7",
    smooth: true,
    areaStyle: { opacity: 0.2 }
  }]
};

export const REVENUE_TREND_DATA_MTD: TrendData = {
  title: "Revenue Trend (MTD)",
  description: "Daily performance",
  xAxis: Array.from({ length: 30 }, (_, i) => `${i + 1}`),
  series: [{
    name: "Revenue",
    data: Array.from({ length: 30 }, () => Math.floor(Math.random() * (1000000 - 600000) + 600000)), // Avg 800k * 30 = ~24M
    color: "#0284c7",
    smooth: true,
    areaStyle: { opacity: 0.2 }
  }]
};

export const REVENUE_TREND_DATA_YTD: TrendData = {
  title: "Revenue Trend (YTD)",
  description: "Annual performance",
  xAxis: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  series: [{
    name: "Revenue",
    data: [7500000, 6800000, 8200000, 7900000, 8500000, 9100000, 9500000, 8800000, 8200000, 8900000, 9200000, 9800000], // Total ~100M
    color: "#0284c7",
    smooth: true,
    areaStyle: { opacity: 0.2 }
  }]
};

// Default export alias
export const REVENUE_TREND_DATA = {
    title: REVENUE_TREND_DATA_YTD.title,
    description: REVENUE_TREND_DATA_YTD.description,
    data: REVENUE_TREND_DATA_YTD.series[0].data.map((val, i) => ({ month: REVENUE_TREND_DATA_YTD.xAxis[i], value: val })) // Adapter for existing components
};


// --- REVENUE BY ROUTE ---

export const REVENUE_BY_ROUTE_DATA_TODAY = {
  title: "Revenue by Route (Today)",
  items: [
    { label: "Manila - Cebu", value: 105000 },
    { label: "Batangas - Calapan", value: 85000 },
    { label: "Cebu - Ormoc", value: 45000 },
    { label: "Iloilo - Bacolod", value: 15000 },
  ],
};

export const REVENUE_BY_ROUTE_DATA_MTD = {
  title: "Revenue by Route (MTD)",
  items: [
    { label: "Manila - Cebu", value: 10500000 },
    { label: "Batangas - Calapan", value: 8200000 },
    { label: "Cebu - Ormoc", value: 4100000 },
    { label: "Iloilo - Bacolod", value: 2200000 },
  ],
};

export const REVENUE_BY_ROUTE_DATA_YTD = {
  title: "Revenue by Route (YTD)",
  items: [
    { label: "Manila - Cebu", value: 42000000 },
    { label: "Batangas - Calapan", value: 38000000 },
    { label: "Cebu - Ormoc", value: 15000000 },
    { label: "Iloilo - Bacolod", value: 5000000 },
  ],
};

// Default alias
export const REVENUE_BY_ROUTE_DATA = REVENUE_BY_ROUTE_DATA_YTD;


// --- REVENUE PER VESSEL ---

export const REVENUE_PER_VESSEL_DATA_TODAY = {
  title: "Revenue per Vessel (Today)",
  data: [
    { name: "Ocean Explorer", value: 85000 },
    { name: "Sea Voyager", value: 72000 },
    { name: "Island Ferry", value: 54000 },
    { name: "Coastal Liner", value: 28000 },
    { name: "Harbor Express", value: 11000 },
  ],
};

export const REVENUE_PER_VESSEL_DATA_MTD = {
  title: "Revenue per Vessel (MTD)",
  data: [
    { name: "Ocean Explorer", value: 8500000 },
    { name: "Sea Voyager", value: 7200000 },
    { name: "Island Ferry", value: 5400000 },
    { name: "Coastal Liner", value: 2800000 },
    { name: "Harbor Express", value: 1100000 },
  ],
};

export const REVENUE_PER_VESSEL_DATA_YTD = {
  title: "Revenue per Vessel (YTD)",
  data: [
    { name: "Ocean Explorer", value: 35000000 },
    { name: "Sea Voyager", value: 28000000 },
    { name: "Island Ferry", value: 20000000 },
    { name: "Coastal Liner", value: 12000000 },
    { name: "Harbor Express", value: 5000000 },
  ],
};

// Default alias
export const REVENUE_PER_VESSEL_DATA = REVENUE_PER_VESSEL_DATA_YTD;


// --- PASSENGER VS CARGO SPLIT ---

export const PASSENGER_CARGO_SPLIT_DATA_TODAY = {
  title: "Passenger vs Cargo (Today)",
  total: "₱250k",
  data: [
    { name: "Passenger Revenue", value: 162500, color: "#0284c7" },
    { name: "Cargo Revenue", value: 87500, color: "#10b981" },
  ],
};

export const PASSENGER_CARGO_SPLIT_DATA_MTD = {
  title: "Passenger vs Cargo (MTD)",
  total: "₱25M",
  data: [
    { name: "Passenger Revenue", value: 16250000, color: "#0284c7" },
    { name: "Cargo Revenue", value: 8750000, color: "#10b981" },
  ],
};

export const PASSENGER_CARGO_SPLIT_DATA_YTD = {
  title: "Passenger vs Cargo (YTD)",
  total: "₱100M",
  data: [
    { name: "Passenger Revenue", value: 65000000, color: "#0284c7" },
    { name: "Cargo Revenue", value: 35000000, color: "#10b981" },
  ],
};

// Default alias
export const PASSENGER_CARGO_SPLIT_DATA = PASSENGER_CARGO_SPLIT_DATA_YTD;
