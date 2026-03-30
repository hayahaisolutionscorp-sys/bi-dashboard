import { Ship, Anchor, Activity, BarChart3, TrendingUp, TrendingDown } from "lucide-react";

export const OPERATIONS_DATA = {
  kpiStats: [
    {
      title: "Total Revenue",
      value: "₱4.2M",
      icon: Ship, // Keeping generic for now, ideally specific icon
      trend: { value: 12.5, label: "vs. last year", direction: "up" as const },
    },
    {
      title: "Active Vessels",
      value: "86",
      icon: Activity,
      trend: { value: 4.0, label: "Current at sea", direction: "up" as const },
    },
  ],
  revenueByVesselType: [
    { label: "RoRo", value: 3500000, colorClass: "bg-sky-500" },
    { label: "FastCraft", value: 2100000, colorClass: "bg-sky-500" },
    { label: "LCT", value: 1200000, colorClass: "bg-sky-500" },
  ],
  revenueByRoute: [
    { name: "Alpha Harbor - Port Beta", value: "₱82.4k", percentage: 100, color: "bg-primary" },
    { name: "Delta Reef - Sigma Isle", value: "₱64.1k", percentage: 78, color: "bg-primary" },
    { name: "Coral Bay - North Point", value: "₱52.8k", percentage: 64, color: "bg-primary" },
    { name: "Eastern Dock - Reef Line", value: "₱41.2k", percentage: 50, color: "bg-primary" },
    { name: "South Marina - Blue Gulf", value: "₱38.9k", percentage: 47, color: "bg-primary" },
    { name: "West Coast - Sandy Beach", value: "₱35.6k", percentage: 43, color: "bg-primary" },
    { name: "Oceanic View - Palm Island", value: "₱33.2k", percentage: 40, color: "bg-primary" },
    { name: "Highland Port - Low Tide", value: "₱31.5k", percentage: 38, color: "bg-primary" },
    { name: "Sunny Bay - Cloudy Cove", value: "₱29.8k", percentage: 36, color: "bg-primary" },
    { name: "Mystic River - Golden Lake", value: "₱28.4k", percentage: 34, color: "bg-primary" },
    { name: "Silver Sands - Bronze Bay", value: "₱26.1k", percentage: 31, color: "bg-primary" },
    { name: "Emerald City - Ruby Port", value: "₱24.5k", percentage: 29, color: "bg-primary" },
    { name: "Sapphire Sea - Diamond Dock", value: "₱22.8k", percentage: 27, color: "bg-primary" },
    { name: "Pearl Harbor - Jade Jetty", value: "₱21.2k", percentage: 25, color: "bg-primary" },
    { name: "Crystal Cove - Amber Isle", value: "₱19.8k", percentage: 24, color: "bg-primary" },
    { name: "Opal Ocean - Topaz Town", value: "₱18.5k", percentage: 22, color: "bg-primary" },
    { name: "Garnet Grove - Onyx Outpost", value: "₱17.2k", percentage: 20, color: "bg-primary" },
    { name: "Quartz Quay - Zircon Zone", value: "₱16.8k", percentage: 20, color: "bg-primary" },
    { name: "Moonlight Bay - Star Port", value: "₱15.4k", percentage: 18, color: "bg-primary" },
    { name: "Sunrise Shore - Sunset Strip", value: "₱14.2k", percentage: 17, color: "bg-primary" },
  ],
  revenueSeasonalityByRoute: {
    "2024": [
      {
        route: "Manila - Cebu",
        data: [
          { month: "Jan", value: 150000 }, { month: "Feb", value: 180000 }, { month: "Mar", value: 250000 },
          { month: "Apr", value: 400000 }, { month: "May", value: 450000 }, { month: "Jun", value: 300000 },
          { month: "Jul", value: 280000 }, { month: "Aug", value: 250000 }, { month: "Sep", value: 200000 },
          { month: "Oct", value: 220000 }, { month: "Nov", value: 350000 }, { month: "Dec", value: 600000 }
        ]
      },
      {
        route: "Batangas - Calapan",
        data: [
          { month: "Jan", value: 80000 }, { month: "Feb", value: 90000 }, { month: "Mar", value: 120000 },
          { month: "Apr", value: 200000 }, { month: "May", value: 180000 }, { month: "Jun", value: 150000 },
          { month: "Jul", value: 140000 }, { month: "Aug", value: 130000 }, { month: "Sep", value: 100000 },
          { month: "Oct", value: 110000 }, { month: "Nov", value: 150000 }, { month: "Dec", value: 300000 }
        ]
      },
      {
        route: "Cebu - Bohol",
        data: [
          { month: "Jan", value: 100000 }, { month: "Feb", value: 110000 }, { month: "Mar", value: 150000 },
          { month: "Apr", value: 250000 }, { month: "May", value: 240000 }, { month: "Jun", value: 180000 },
          { month: "Jul", value: 170000 }, { month: "Aug", value: 160000 }, { month: "Sep", value: 140000 },
          { month: "Oct", value: 150000 }, { month: "Nov", value: 190000 }, { month: "Dec", value: 400000 }
        ]
      },
      {
        route: "Matnog - Allen",
        data: [
          { month: "Jan", value: 50000 }, { month: "Feb", value: 60000 }, { month: "Mar", value: 80000 },
          { month: "Apr", value: 150000 }, { month: "May", value: 140000 }, { month: "Jun", value: 100000 },
          { month: "Jul", value: 90000 }, { month: "Aug", value: 85000 }, { month: "Sep", value: 70000 },
          { month: "Oct", value: 75000 }, { month: "Nov", value: 90000 }, { month: "Dec", value: 200000 }
        ]
      },
      {
        route: "Davao - Samal",
        data: [
          { month: "Jan", value: 40000 }, { month: "Feb", value: 45000 }, { month: "Mar", value: 60000 },
          { month: "Apr", value: 100000 }, { month: "May", value: 95000 }, { month: "Jun", value: 80000 },
          { month: "Jul", value: 75000 }, { month: "Aug", value: 70000 }, { month: "Sep", value: 60000 },
          { month: "Oct", value: 65000 }, { month: "Nov", value: 80000 }, { month: "Dec", value: 150000 }
        ]
      }
    ],
    "2025": [
      {
        route: "Manila - Cebu",
        data: [
          { month: "Jan", value: 180000 }, { month: "Feb", value: 200000 }, { month: "Mar", value: 300000 },
          { month: "Apr", value: 500000 }, { month: "May", value: 550000 }, { month: "Jun", value: 350000 },
          { month: "Jul", value: 320000 }, { month: "Aug", value: 280000 }, { month: "Sep", value: 230000 },
          { month: "Oct", value: 250000 }, { month: "Nov", value: 400000 }, { month: "Dec", value: 700000 }
        ]
      },
      {
        route: "Batangas - Calapan",
        data: [
          { month: "Jan", value: 90000 }, { month: "Feb", value: 100000 }, { month: "Mar", value: 140000 },
          { month: "Apr", value: 220000 }, { month: "May", value: 200000 }, { month: "Jun", value: 170000 },
          { month: "Jul", value: 160000 }, { month: "Aug", value: 150000 }, { month: "Sep", value: 120000 },
          { month: "Oct", value: 130000 }, { month: "Nov", value: 170000 }, { month: "Dec", value: 350000 }
        ]
      },
      {
        route: "Cebu - Bohol",
        data: [
          { month: "Jan", value: 120000 }, { month: "Feb", value: 130000 }, { month: "Mar", value: 180000 },
          { month: "Apr", value: 300000 }, { month: "May", value: 280000 }, { month: "Jun", value: 220000 },
          { month: "Jul", value: 200000 }, { month: "Aug", value: 190000 }, { month: "Sep", value: 160000 },
          { month: "Oct", value: 170000 }, { month: "Nov", value: 220000 }, { month: "Dec", value: 500000 }
        ]
      },
      {
        route: "Matnog - Allen",
        data: [
          { month: "Jan", value: 60000 }, { month: "Feb", value: 70000 }, { month: "Mar", value: 100000 },
          { month: "Apr", value: 180000 }, { month: "May", value: 160000 }, { month: "Jun", value: 120000 },
          { month: "Jul", value: 110000 }, { month: "Aug", value: 100000 }, { month: "Sep", value: 80000 },
          { month: "Oct", value: 90000 }, { month: "Nov", value: 110000 }, { month: "Dec", value: 250000 }
        ]
      },
      {
        route: "Davao - Samal",
        data: [
          { month: "Jan", value: 50000 }, { month: "Feb", value: 55000 }, { month: "Mar", value: 75000 },
          { month: "Apr", value: 120000 }, { month: "May", value: 110000 }, { month: "Jun", value: 95000 },
          { month: "Jul", value: 90000 }, { month: "Aug", value: 85000 }, { month: "Sep", value: 75000 },
          { month: "Oct", value: 80000 }, { month: "Nov", value: 100000 }, { month: "Dec", value: 180000 }
        ]
      }
    ],
    "2026": [
      {
        route: "Manila - Cebu",
        data: [
          { month: "Jan", value: 220000 }, { month: "Feb", value: 250000 }, { month: "Mar", value: 400000 },
          { month: "Apr", value: 700000 }, { month: "May", value: 800000 }, { month: "Jun", value: 500000 },
          { month: "Jul", value: 450000 }, { month: "Aug", value: 400000 }, { month: "Sep", value: 300000 },
          { month: "Oct", value: 350000 }, { month: "Nov", value: 550000 }, { month: "Dec", value: 1000000 }
        ]
      },
      {
        route: "Batangas - Calapan",
        data: [
          { month: "Jan", value: 110000 }, { month: "Feb", value: 120000 }, { month: "Mar", value: 180000 },
          { month: "Apr", value: 300000 }, { month: "May", value: 280000 }, { month: "Jun", value: 220000 },
          { month: "Jul", value: 200000 }, { month: "Aug", value: 190000 }, { month: "Sep", value: 150000 },
          { month: "Oct", value: 160000 }, { month: "Nov", value: 200000 }, { month: "Dec", value: 450000 }
        ]
      },
      {
        route: "Cebu - Bohol",
        data: [
          { month: "Jan", value: 150000 }, { month: "Feb", value: 160000 }, { month: "Mar", value: 220000 },
          { month: "Apr", value: 400000 }, { month: "May", value: 380000 }, { month: "Jun", value: 300000 },
          { month: "Jul", value: 280000 }, { month: "Aug", value: 260000 }, { month: "Sep", value: 220000 },
          { month: "Oct", value: 230000 }, { month: "Nov", value: 300000 }, { month: "Dec", value: 700000 }
        ]
      },
      {
        route: "Matnog - Allen",
        data: [
          { month: "Jan", value: 80000 }, { month: "Feb", value: 90000 }, { month: "Mar", value: 130000 },
          { month: "Apr", value: 250000 }, { month: "May", value: 220000 }, { month: "Jun", value: 160000 },
          { month: "Jul", value: 150000 }, { month: "Aug", value: 140000 }, { month: "Sep", value: 110000 },
          { month: "Oct", value: 120000 }, { month: "Nov", value: 150000 }, { month: "Dec", value: 350000 }
        ]
      },
      {
        route: "Davao - Samal",
        data: [
          { month: "Jan", value: 60000 }, { month: "Feb", value: 70000 }, { month: "Mar", value: 100000 },
          { month: "Apr", value: 180000 }, { month: "May", value: 160000 }, { month: "Jun", value: 140000 },
          { month: "Jul", value: 130000 }, { month: "Aug", value: 120000 }, { month: "Sep", value: 100000 },
          { month: "Oct", value: 110000 }, { month: "Nov", value: 130000 }, { month: "Dec", value: 300000 }
        ]
      }
    ],
  },
  vesselFleet: [
    { name: "Oceanic Star", status: "At Sea", statusColor: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400", type: "Container", load: 88, eta: "Jun 12, 08:30" },
    { name: "Global Carrier", status: "Docked", statusColor: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", type: "Dry Bulk", load: 42, eta: "--" },
    { name: "Atlantic Pioneer", status: "Maintenance", statusColor: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400", type: "Liquid", load: 5, eta: "Jun 25, 14:00" },
    { name: "Pacific Zenith", status: "At Sea", statusColor: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400", type: "Ro-Ro", load: 95, eta: "Jun 09, 21:15" },
  ],
  vesselFleetStatus: [
    { value: 65, name: "Active", itemStyle: { color: "#22c55e" } }, // Green-500
    { value: 12, name: "Inactive", itemStyle: { color: "#64748b" } }, // Slate-500
    { value: 8, name: "Maintenance", itemStyle: { color: "#eab308" } }, // Yellow-500
    { value: 1, name: "Decommissioned", itemStyle: { color: "#ef4444" } }, // Red-500
  ]
};

// End of Operations Mock Data
