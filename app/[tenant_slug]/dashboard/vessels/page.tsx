"use client";

import { useState, useEffect } from "react";
import { SimpleKpiCard } from "@/components/charts/simple-kpi-card";
import { VesselsService } from "@/services/vessels.service";
import { VesselsResponse } from "@/types/vessels";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";
import { useParams } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { NoDataPlaceholder } from "@/components/charts/no-data-placeholder";
import { Ship, TrendingUp, Users, Banknote, Wrench, Compass } from "lucide-react";
import { useTenant } from "@/components/providers/tenant-provider";

// Shadcn Charts
import { ShadcnBarChartHorizontal } from "@/components/charts/shadcn-bar-chart.horizontal";
import { ShadcnBarChartMultiple } from "@/components/charts/shadcn-bar-chart-multiple";
import { ShadcnBarChartVertical } from "@/components/charts/shadcn-bar-chart-vertical";
import { ShadcnLineChartRegular } from "@/components/charts/shadcn-line-chart-regular";
import { Heatmap } from "@/components/charts/heatmap";
import { ChartConfig } from "@/components/ui/chart";

export default function VesselsPage() {
  const { activeTenant, isLoading: isTenantLoading } = useTenant();
  const params = useParams();
  const tenant_slug = params.tenant_slug as string;

  const [data, setData] = useState<VesselsResponse["data"] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isInitialLoad, setIsInitialLoad] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    const now = new Date();
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(now.getMonth() - 2);
    return { from: threeMonthsAgo, to: now };
  });

  const [fleetPage, setFleetPage] = useState(0);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchData = async () => {
      if (!activeTenant?.api_base_url) return;
      setIsLoading(true);
      setError(null);
      try {
        const response = await VesselsService.getVesselsDashboard(
          activeTenant.api_base_url, 
          tenant_slug, 
          dateRange, 
          activeTenant.service_key
        );
        setData(response.data);
        if (isInitialLoad) {
          setTimeout(() => setIsInitialLoad(false), 500);
        }
      } catch (err) {
        setError("Failed to load vessels report. Please try again.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    if (tenant_slug) fetchData();
  }, [tenant_slug, dateRange, activeTenant]);

  const handleClearFilter = () => {
    const now = new Date();
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(now.getMonth() - 2);
    setDateRange({ from: threeMonthsAgo, to: now });
  };

  const mapIcon = (iconName: string): any => {
    const map: Record<string, any> = {
      ship: Ship,
      activity: TrendingUp,
      users: Users,
      banknote: Banknote,
      wrench: Wrench,
      navigation: Compass,
    };
    return map[iconName] || TrendingUp;
  };

  const getTrendData = () => {
    if (!data?.tripDensity) return [];
    const aggregated = data.tripDensity.reduce((acc, curr) => {
      if (!acc[curr.date]) acc[curr.date] = { date: curr.date, trip_count: 0 };
      acc[curr.date].trip_count += curr.trip_count;
      return acc;
    }, {} as Record<string, { date: string; trip_count: number }>);

    return Object.values(aggregated).sort((a, b) => a.date.localeCompare(b.date));
  };

  const getPaginatedFleetData = () => {
    if (!data?.fleetLoadFactor) return [];
    const sorted = [...data.fleetLoadFactor].sort((a, b) => 
      a.vessel_name.localeCompare(b.vessel_name)
    );
    const start = fleetPage * itemsPerPage;
    return sorted.slice(start, start + itemsPerPage);
  };

  const totalFleetPages = data?.fleetLoadFactor ? Math.ceil(data.fleetLoadFactor.length / itemsPerPage) : 0;


  if (error) {
    return (
      <div className="flex h-[400px] items-center justify-center text-rose-500">
        <p className="font-medium text-lg">{error}</p>
      </div>
    );
  }


  return (
    <div className="bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-slate-100">
      <div className="mx-auto w-full max-w-[1120px] space-y-4 px-3 py-3 sm:px-4 sm:py-4 lg:px-6 lg:py-5">
        
        {/* Header Section */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-end">
          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
            <span className="font-medium">Date Range:</span>
            <DateRangePicker date={dateRange} onDateChange={setDateRange} />
          </div>

          <button
            type="button"
            onClick={handleClearFilter}
            className="inline-flex h-9 items-center gap-1.5 rounded-md border border-sky-300 bg-sky-500 px-3 text-sm font-medium text-white transition-colors hover:bg-sky-600 self-end sm:self-auto"
          >
            Reset Filter
          </button>
        </div>

        {/* KPI Row */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-3">
          {isInitialLoad || !data ? (
            Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-[120px] w-full rounded-xl" />
            ))
          ) : (
            (data.kpiData || []).map((kpi, idx) => {
              const colors = ["text-blue-500", "text-green-500", "text-orange-500", "text-purple-500", "text-yellow-500", "text-red-500"];
              return (
                <SimpleKpiCard
                  key={idx}
                  label={kpi.title}
                  value={String(kpi.value)}
                  icon={mapIcon(kpi.icon)}
                  colorClass={colors[idx % colors.length]}
                  indicatorText={kpi.change}
                  indicatorDirection={kpi.trend}
                  subtext={kpi.description}
                />
              );
            })
          )}
        </section>
        
        {/* Charts Section */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          
          <div className="lg:col-span-2 rounded-xl border border-slate-300 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-950 p-4">
            {isLoading ? (
              <Skeleton className="h-[500px] w-full rounded-xl" />
            ) : !data || !data.fleetLoadFactor || data.fleetLoadFactor.length === 0 ? (
              <NoDataPlaceholder height="500px" />
            ) : (
              <div className="flex h-[500px] min-h-0 flex-col">
                <ShadcnBarChartVertical
                  title="Fleet Load Factor"
                  description="Passenger utilization per vessel"
                  data={getPaginatedFleetData()}
                  labelKey="vessel_name"
                  dataKey="pax_utilization"
                  config={{
                    pax_utilization: { label: "Passenger %", color: "#3b82f6" }
                  }}
                  minPointSize={5}
                  pagination={{
                    currentPage: fleetPage,
                    totalPages: totalFleetPages,
                    onNext: () => setFleetPage(p => Math.min(totalFleetPages - 1, p + 1)),
                    onPrev: () => setFleetPage(p => Math.max(0, p - 1)),
                  }}
                />
              </div>
            )}
          </div>
          
          {/* Trip Efficiency (Revenue per Trip) */}
          {/* <div className="rounded-xl border border-slate-300 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-950 p-2 min-h-[400px]">
            {isLoading ? (
              <Skeleton className="h-[380px] w-full rounded-xl" />
            ) : !data || !data.tripEfficiency || data.tripEfficiency.length === 0 ? (
              <NoDataPlaceholder height="380px" />
            ) : (
              <ShadcnBarChartHorizontal
                title="Trip Efficiency"
                description="Average revenue generated per trip by vessel"
                data={data.tripEfficiency}
                dataKey="avg_revenue_per_trip"
                labelKey="vessel_name"
                hideYAxis={false}
                config={{
                  avg_revenue_per_trip: { label: "Avg Revenue", color: "#f59e0b" }
                }}
              />
            )}
          </div> */}

          {/* Trip Density Heatmap */}
          <div className="grid grid-cols-1 lg:col-span-2 gap-4 mt-4">
            <div className="rounded-xl border border-slate-300 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-950 p-2 min-h-[400px]">
              {isLoading ? (
                <Skeleton className="h-[380px] w-full rounded-xl" />
              ) : !data || !data.successfulTripsCount || data.successfulTripsCount.length === 0 ? (
                <NoDataPlaceholder height="380px" />
              ) : (
                <Heatmap
                  title="Trip Density Heatmap"
                  description="Daily completed trips per vessel"
                  data={data.successfulTripsCount}
                  dateRange={dateRange as { from: Date; to: Date }}
                />
              )}
            </div>
          </div>

        </section>
      </div>
    </div>
  );
}
