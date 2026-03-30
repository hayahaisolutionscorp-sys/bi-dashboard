"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { CalendarDays, FilterX, Box, Banknote, TrendingUp, BarChart3, Container, Star, Activity } from "lucide-react";
import { SimpleKpiCard } from "@/components/charts/simple-kpi-card";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";
import { Skeleton } from "@/components/ui/skeleton";
import { NoDataPlaceholder } from "@/components/charts/no-data-placeholder";

import { ShadcnBarChartMultiple } from "@/components/charts/shadcn-bar-chart-multiple";
import { ShadcnPieChartLegend } from "@/components/charts/shadcn-pie-chart-legend";

import { cargoService } from "@/services/cargo.service";
import { CargoReportResponse } from "@/types/cargo";

export default function CargoPerTripPage() {
  const params = useParams();
  const tenantSlug = params.tenant_slug as string;

  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    const now = new Date();
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(now.getMonth() - 2);
    return { from: threeMonthsAgo, to: now };
  });

  const [data, setData] = useState<CargoReportResponse["data"] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      if (!tenantSlug) return;

      setIsLoading(true);
      setError(null);
      try {
        const from = dateRange?.from?.toISOString().split("T")[0];
        const to = dateRange?.to?.toISOString().split("T")[0];
        const result = await cargoService.getCargoReport(tenantSlug, from, to);
        setData(result);
        if (isInitialLoad) {
          setTimeout(() => setIsInitialLoad(false), 500);
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load cargo report. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }

    if (dateRange?.from && dateRange?.to && tenantSlug) {
      fetchData();
    }
  }, [dateRange, tenantSlug]);

  const handleClearFilter = () => {
    const now = new Date();
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(now.getMonth() - 2);
    setDateRange({ from: threeMonthsAgo, to: now });
  };

  const getTrendDirection = (trend: string): "up" | "down" | "neutral" => {
    return trend === "up" ? "up" : trend === "down" ? "down" : "neutral";
  };

  const getSimpleIconName = (iconName: string): any => {
    switch (iconName) {
      case "box":
        return Box;
      case "banknote":
        return Banknote;
      case "trending-up":
        return TrendingUp;
      case "bar-chart-3":
        return BarChart3;
      case "container":
        return Container;
      case "star":
        return Star;
      default:
        return Activity;
    }
  };

  const getIconColorClass = (trend: string): string => {
    if (trend === "up") return "text-[#3f8600]";
    if (trend === "down") return "text-[#cf1322]";
    return "text-[#1890ff]";
  };
  
  const kpiCount = data?.kpiData.length || 0;
  const kpiGridClass =
    kpiCount >= 5
      ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3"
      : kpiCount === 4
        ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
        : "grid-cols-[repeat(auto-fit,minmax(210px,1fr))]";

  if (error) {
    return (
      <div className="flex h-[400px] items-center justify-center text-rose-500">
        <p className="font-medium text-lg">{error}</p>
      </div>
    );
  }

  const getBarData = () => {
    if (!data?.volumeVsRevenueData) return { mappedData: [], config: {} };
    const { xAxis, series } = data.volumeVsRevenueData;
    
    const mappedData = xAxis.map((x, i) => {
      const item: any = { date: x };
      series.forEach(s => {
        item[s.name] = s.data[i];
      });
      return item;
    });

    const config: any = {};
    const fallbackColors = ["#2563eb", "#10b981", "#f59e0b", "#8b5cf6"];
    series.forEach((s, i) => {
      let color = fallbackColors[i % fallbackColors.length];
      const nameLower = s.name.toLowerCase();
      if (nameLower.includes("revenue")) {
        color = "#10b981"; // Green for Revenue
      } else if (nameLower.includes("volume") || nameLower.includes("weight")) {
        color = "#3b82f6"; // Blue for Volume
      }
      config[s.name] = { label: s.name, color };
    });

    return { mappedData, config };
  };

  const getMapData = (sourceArray: any[]) => {
    if (!sourceArray || sourceArray.length === 0) return { mappedData: [], config: {} };
    const mappedData = [...sourceArray];
    const config: any = {};
    const colors = ["#8b5cf6", "#10b981", "#f59e0b", "#f43f5e", "#2563eb", "#0ea5e9", "#6366f1"];
    mappedData.forEach((d, i) => {
      config[d.name] = { label: d.name, color: colors[i % colors.length] };
    });
    return { mappedData, config };
  };

  const revenueContributionData = getMapData(data?.revenueContributionData || []);
  const cargoClassesData = getMapData(data?.cargoClassesData || []);

  return (
    <div className="bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-slate-100">
      <div className="mx-auto w-full max-w-[1120px] space-y-4 px-3 py-3 sm:px-4 sm:py-4 lg:px-6 lg:py-5">
        {/* Toolbar */}
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2 text-sm w-full sm:w-auto">
              <CalendarDays className="h-4 w-4 shrink-0 text-slate-500 dark:text-slate-400" />
              <span className="hidden sm:inline-block shrink-0 text-slate-600 dark:text-slate-300">Date Range:</span>
              <div className="w-full sm:w-auto">
                <DateRangePicker date={dateRange} onDateChange={setDateRange} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:flex sm:flex-row sm:items-center sm:gap-2">
            <button
              type="button"
              className="inline-flex h-9 w-full sm:w-auto justify-center items-center gap-1.5 rounded-md border border-sky-300 bg-sky-500 px-3 text-sm font-medium text-white transition-colors hover:bg-sky-600"
              onClick={handleClearFilter}
            >
              <FilterX className="h-4 w-4 shrink-0" />
              <span className="truncate">Clear Filter</span>
            </button>
          </div>
        </div>

        {/* KPIs */}
        <section className={`grid ${kpiGridClass} gap-3 md:auto-rows-fr`}>
          {isInitialLoad || !data ? (
            <>
              <Skeleton className="h-[120px] w-full rounded-xl" />
              <Skeleton className="h-[120px] w-full rounded-xl" />
              <Skeleton className="h-[120px] w-full rounded-xl" />
              <Skeleton className="h-[120px] w-full rounded-xl" />
            </>
          ) : (
            data.kpiData.map((kpi, index) => {
              const colors = ["text-blue-500", "text-green-500", "text-orange-500", "text-purple-500", "text-yellow-500", "text-red-500"];
              return (
                <SimpleKpiCard
                  key={kpi.title}
                  label={kpi.title}
                  value={String(kpi.value)}
                  icon={getSimpleIconName(kpi.icon)}
                  colorClass={colors[index % colors.length]}
                  indicatorText={kpi.change}
                  indicatorDirection={getTrendDirection(kpi.trend)}
                  subtext={kpi.description}
                />
              );
            })
          )}
        </section>

        {/* Primary Trend Chart */}
        <section className="col-span-1">
          <div className="rounded-xl border border-slate-300 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-950 p-2 min-h-[350px]">
             {isLoading || !data ? (
               <Skeleton className="h-[320px] w-full rounded-xl" />
             ) : getBarData().mappedData.length === 0 ? (
               <NoDataPlaceholder height="320px" />
             ) : (
               <ShadcnBarChartMultiple
                 title="Volume vs Revenue Trend"
                 description="Correlation between Weight and Revenue"
                 data={getBarData().mappedData}
                 config={getBarData().config}
                 labelKey="date"
                 height="340px"
                 dateRange={dateRange}
               />
             )}
          </div>
        </section>

        {/* Pies / Donuts */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-slate-300 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-950 p-2 min-h-[350px]">
             {isLoading || !data ? (
               <Skeleton className="h-[320px] w-full rounded-xl" />
             ) : revenueContributionData.mappedData.length === 0 ? (
               <NoDataPlaceholder height="320px" />
             ) : (
               <ShadcnPieChartLegend
                 title="Revenue by Commodity"
                 description="Distribution of revenue across major cargo commodities"
                 data={revenueContributionData.mappedData}
                 config={revenueContributionData.config}
                 dataKey="value"
                 nameKey="name"
                 height="320px"
               />
             )}
          </div>

          <div className="rounded-xl border border-slate-300 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-950 p-2 min-h-[350px]">
             {isLoading || !data ? (
               <Skeleton className="h-[320px] w-full rounded-xl" />
             ) : cargoClassesData.mappedData.length === 0 ? (
               <NoDataPlaceholder height="320px" />
             ) : (
               <ShadcnPieChartLegend
                 title="Revenue by Cargo Classes"
                 description="Revenue breakdown by vehicle or freight classification"
                 data={cargoClassesData.mappedData}
                 config={cargoClassesData.config}
                 dataKey="value"
                 nameKey="name"
                 height="320px"
               />
             )}
          </div>
        </section>

      </div>
    </div>
  );
}
