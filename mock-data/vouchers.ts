import { Ticket, Activity, Users, DollarSign } from "lucide-react";

export const VOUCHER_DATA = {
  activeVouchers: {
    title: "Active Vouchers",
    value: "1,284",
    change: "+14.2%",
    utilizationRate: 72,
  },
  revenueImpact: {
    title: "Revenue Impact Comparison",
    description: "Revenue trend: Gross vs. Net (After Discounts)",
    data: {
      xAxis: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"],
      gross: [280000, 260000, 200000, 220000, 190000, 270000, 150000, 180000],
      net: [180000, 160000, 120000, 140000, 110000, 170000, 105000, 120000]
    }
  },
  topVouchers: [
    { name: "EARLYBIRD2024", usages: "4.2k uses", capacity: 85, color: "bg-primary" },
    { name: "SUMMER_SALES", usages: "3.8k uses", capacity: 72, color: "bg-primary/80" },
    { name: "FIRST_VOYAGE", usages: "2.1k uses", capacity: 45, color: "bg-primary/60" },
    { name: "PARTNER_GIFT", usages: "1.4k uses", capacity: 28, color: "bg-primary/40" },
  ],
  discountDistribution: [
    { name: "Senior Citizens", value: 45, itemStyle: { color: "#3f68e4" } }, // Primary
    { name: "Students", value: 30, itemStyle: { color: "#0d9488" } }, // Teal-accent
    { name: "PWD", value: 25, itemStyle: { color: "#fbbf24" } }, // Amber-400
  ],
  rules: [
    {
      code: "MARITIME-EX-24",
      type: "Route Based",
      typeColor: "bg-blue-100 text-blue-700",
      target: "North Sea Express (R01, R04)",
      value: "20% Flat",
      status: "Active",
      statusColor: "bg-green-100 text-green-700",
      statusDot: "bg-green-700"
    },
    {
      code: "HEAVY-LOAD-15",
      type: "Cargo Volume",
      typeColor: "bg-amber-100 text-amber-700",
      target: "Bulk Freight > 50 Tons",
      value: "₱500 Off",
      status: "Active",
      statusColor: "bg-green-100 text-green-700",
      statusDot: "bg-green-700"
    },
    {
      code: "STUDENT-S3-DISC",
      type: "Passenger Type",
      typeColor: "bg-purple-100 text-purple-700",
      target: "ID Validated Students",
      value: "15% Off",
      status: "Draft",
      statusColor: "bg-gray-100 text-gray-500",
      statusDot: "bg-gray-500"
    },
    {
      code: "OFF-SEASON-LO",
      type: "Seasonal",
      typeColor: "bg-indigo-100 text-indigo-700",
      target: "All Routes (Nov - Jan)",
      value: "30% Flat",
      status: "Expired",
      statusColor: "bg-red-100 text-red-700",
      statusDot: "bg-red-700"
    },
  ]
};
