"use client";

import { Bell, Calendar, Search, Plus } from "lucide-react";
import { TRIP_OPERATIONS_DATA } from "@/mock-data/trip-operations";

// Components
import { KpiCard } from "@/components/charts/kpi-card";
import { GaugeChart } from "@/components/charts/gauge-chart";
import { ScatterPlot } from "@/components/charts/scatter-plot";
import { BarGraph } from "@/components/charts/bar-graph";
import { PieChart } from "@/components/charts/pie-chart";
import { TripTable } from "@/components/tables/trip-table";
import { Header } from "@/components/ui/header";

export default function TripOperationsPage() {
  return (
    <div className="flex-1 flex flex-col min-h-full max-w-[1700px] mx-auto w-full">
      <div className="px-8 pt-10 pb-2">
        <Header 
            title="Trip Operations" 
            subtitle="Real-time monitoring of trip scheduling, delays, and vessel utilization."
        />
      </div>
      <div className="px-8 pb-8 pt-6 space-y-8">
        {/* KPI Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
             {TRIP_OPERATIONS_DATA.kpiStats.slice(1).map((stat, i) => (
                <KpiCard key={i} {...stat} />
             ))}
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Trip Status Gauge */}

            {/* Delay Analysis Scatter */}
            <ScatterPlot 
                title="Departure Delay Analysis (Scatter)"
                data={TRIP_OPERATIONS_DATA.departureDelays.data}
            />
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Ship Utilization Bar */}
            <BarGraph 
                title="Ship Utilization - Bookings per ship"
                data={TRIP_OPERATIONS_DATA.shipUtilization}
            />
            {/* Conflict Analysis Pie */}
             <PieChart 
                 title="Scheduling Conflict Analysis"
                 description=""
                 data={TRIP_OPERATIONS_DATA.conflicts}
             />
        </div>

        {/* Connecting Trip Monitor Table */}
        <TripTable 
            title="Connecting Trip Monitor"
            items={TRIP_OPERATIONS_DATA.tripTable}
        />
      </div>
      </div>
  );
}
