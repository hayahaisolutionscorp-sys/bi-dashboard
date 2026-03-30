import { Ship, Activity, Zap, AlertTriangle } from "lucide-react";

export const TRIP_OPERATIONS_DATA = {
  kpiStats: [
    {
      title: "Total Trips Today",
      value: "142",
      icon: Ship,
      trend: { value: 5.2, label: "", direction: "up" as const },
    },
    {
      title: "Active Vessels",
      value: "84",
      icon: Activity,
      trend: { value: 2.1, label: "", direction: "up" as const },
    },
    {
      title: "Average Efficiency",
      value: "92.5%",
      icon: Zap,
      trend: { value: 1.4, label: "", direction: "down" as const },
    },
    {
      title: "Pending Conflicts",
      value: "12",
      icon: AlertTriangle,
      iconColorClass: "text-orange-500",
      iconBgClass: "bg-orange-500/10",
      trend: { value: 8.0, label: "", direction: "up" as const },
    },
  ],
  tripStatus: {
    value: 88,
    name: "Departed",
  },
  departureDelays: {
    // Mocking Scatter Data: [Time (Hour), Delay (Mins), Severity(0=Minor, 1=Sig, 2=Crit)]
    data: [
      [2, 10, 0], [5, 15, 0], [8, 12, 0], 
      [10, 45, 1], // Significant
      [14, 20, 0], [16, 35, 1], [18, 55, 2], // Critical 
      [20, 10, 0], [22, 5, 0]
    ]
  },
  shipUtilization: [
    { name: "Vessel Alpha-01", value: 98 },
    { name: "Vessel Beta-22", value: 84 },
    { name: "Oceanic-X", value: 72 },
    { name: "CargoMax 500", value: 55 },
  ],
  conflicts: [
    { value: 45, name: "Berth Conflict", itemStyle: { color: "#3f68e4" } },
    { value: 25, name: "Crew Shortage", itemStyle: { color: "#fb923c" } },
    { value: 15, name: "Maintenance", itemStyle: { color: "#ef4444" } },
    { value: 15, name: "Weather", itemStyle: { color: "#94a3b8" } },
  ],
  tripTable: [
    {
      id: "MAR-592-A",
      origin: "Rotterdam (RTM)",
      destination: "Singapore (SIN)",
      window: "Oct 14, 08:00 - 11:30",
      risk: "Low",
      riskColor: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      status: "On Time",
      statusColor: "bg-green-500",
    },
    {
      id: "GIGA-240-B",
      origin: "Hamburg (HAM)",
      destination: "New York (NYC)",
      window: "Oct 14, 14:15 - 16:45",
      risk: "Critical",
      riskColor: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
      status: "Delayed (+4h)",
      statusColor: "bg-red-500",
    },
    {
      id: "SKY-009-L",
      origin: "Los Angeles (LAX)",
      destination: "Shanghai (SHA)",
      window: "Oct 15, 04:00 - 06:00",
      risk: "Moderate",
      riskColor: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
      status: "Re-Routing",
      statusColor: "bg-orange-500",
    },
  ],
};
