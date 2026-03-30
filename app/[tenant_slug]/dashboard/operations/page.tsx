"use client";

import { Bell, Calendar, ChevronRight, Search, Download } from "lucide-react";
import { OPERATIONS_DATA } from "@/mock-data/operations";
import { TRIP_OPERATIONS_DATA } from "@/mock-data/trip-operations";

// Components
import { KpiCard } from "@/components/charts/kpi-card";
import { GaugeChart } from "@/components/charts/gauge-chart"; // New component
import { BarGraph } from "@/components/charts/bar-graph"; // ECharts BarGraph
import { AreaGraph } from "@/components/charts/area-graph";
import { BarList } from "@/components/charts/bar-list";
import { HeatmapGrid } from "@/components/charts/heatmap-grid";
import { PieChart } from "@/components/charts/pie-chart";

import { Header } from "@/components/ui/header";

export default function OperationsPage() {
    return (
        <div className="flex-1 flex flex-col min-h-full max-w-[1600px] mx-auto w-full">
            <div className="px-8 pt-10 pb-2">
                <Header 
                    title="Overview" 
                    subtitle="Executive dashboard for high-level performance metrics and revenue tracking."
                />
            </div>
            <div className="px-8 pb-8 pt-6 space-y-8">
                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Existing Operations KPIs */}
                    {OPERATIONS_DATA.kpiStats.map((stat, i) => (
                        <KpiCard key={i} {...stat} />
                    ))}
                    {/* Moved Trip KPIs */}
                     <KpiCard {...TRIP_OPERATIONS_DATA.kpiStats[0]} /> {/* Total Trips Today */}
                </div>

                 {/* Charts Section: Row 2 */}
                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    <div className="grid grid-cols-1 gap-6">
                        <BarGraph 
                            title="Revenue by Vessel Type"
                            items={OPERATIONS_DATA.revenueByVesselType}
                        />
                    </div>

                    <HeatmapGrid 
                        title="Revenue Seasonality"
                        data={OPERATIONS_DATA.revenueSeasonalityByRoute || {}}
                        years={OPERATIONS_DATA.revenueSeasonalityByRoute ? Object.keys(OPERATIONS_DATA.revenueSeasonalityByRoute) : []}
                    />
                 </div>

                 {/* Charts Section: Row 3 - Side by Side */}
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                     <GaugeChart 
                        title="Trip Status %"
                        data={TRIP_OPERATIONS_DATA.tripStatus}
                        description="88% of 142 scheduled trips have successfully departed port."
                    />
                    <PieChart 
                        title="Fleet Utilization"
                        description="Current status distribution of the fleet"
                        data={OPERATIONS_DATA.vesselFleetStatus}
                    />
                 </div>
        </div>
        </div>
    );
}
