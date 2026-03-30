"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { CalendarDays, FilterX, Users, Wallet, TrendingUp, User, MapPin, AlertCircle, Activity } from "lucide-react";
import { SimpleKpiCard } from "@/components/charts/simple-kpi-card";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";
import { Skeleton } from "@/components/ui/skeleton";
import { NoDataPlaceholder } from "@/components/charts/no-data-placeholder";

import { ShadcnLineChartRegular } from "@/components/charts/shadcn-line-chart-regular";
import { ShadcnBarChartMultiple } from "@/components/charts/shadcn-bar-chart-multiple";
import { ShadcnPieChartLegend } from "@/components/charts/shadcn-pie-chart-legend";

import { passengersService } from "@/services/passengers.service";
import { PassengersReportResponse } from "@/types/passengers";

export default function PassengersPerTripPage() {
  const params = useParams();
  const tenantSlug = params.tenant_slug as string;

  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    const now = new Date();
    return { from: new Date(now.getFullYear(), 0, 1), to: now };
  });

  const [data, setData] = useState<PassengersReportResponse["data"] | null>(null);
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
        const result = await passengersService.getPassengersReport(tenantSlug, from, to);
        setData(result);
        if (isInitialLoad) {
          setTimeout(() => setIsInitialLoad(false), 500);
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load passengers report. Please try again.");
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
    setDateRange({ from: new Date(now.getFullYear(), 0, 1), to: now });
  };

  const getTrendDirection = (trend: string): "up" | "down" | "neutral" => {
    return trend === "up" ? "up" : trend === "down" ? "down" : "neutral";
  };

  const getSimpleIconName = (iconName: string): any => {
    switch (iconName) {
      case "users":
        return Users;
      case "wallet":
        return Wallet;
      case "trending-up":
        return TrendingUp;
      case "user":
        return User;
      case "map-pin":
        return MapPin;
      case "alert-circle":
        return AlertCircle;
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
        ? "grid-cols-1 sm:grid-cols-2"
        : "grid-cols-[repeat(auto-fit,minmax(210px,1fr))]";

  if (error) {
    return (
      <div className="flex h-[400px] items-center justify-center text-rose-500">
        <p className="font-medium text-lg">{error}</p>
      </div>
    );
  }

  const getLineData = () => {
    if (!data?.trendData) return [];
    return data.trendData.xAxis.map((x, i) => ({
      date: x,
      revenue: data.trendData.series[i]
    }));
  };

  const getBarData = () => {
    if (!data?.bookingChannelTrendData) return { mappedData: [], config: {} };
    const { xAxis, series } = data.bookingChannelTrendData;
    
    const mappedData = xAxis.map((x, i) => {
      const item: any = { date: x };
      series.forEach(s => {
        item[s.name] = s.data[i];
      });
      return item;
    });

    const config: any = {};
    const colors = ["#8b5cf6", "#f43f5e", "#10b981", "#f59e0b"];
    series.forEach((s, i) => {
      config[s.name] = { label: s.name, color: colors[i % colors.length] };
    });

    return { mappedData, config };
  };

  const getPieData = () => {
    if (!data?.discountDemographicsData) return { mappedData: [], config: {} };
    const mappedData = data.discountDemographicsData;
    const config: any = {};
    const colors = ["#8b5cf6", "#10b981", "#f59e0b", "#f43f5e", "#2563eb"];
    mappedData.forEach((d, i) => {
      config[d.name] = { label: d.name, color: colors[i % colors.length] };
    });
    return { mappedData, config };
  };

  return (
    <div className="bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-slate-100">
      <div className="mx-auto w-full max-w-[1120px] space-y-4 px-3 py-3 sm:px-4 sm:py-4 lg:px-6 lg:py-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-end">
          <div className="flex items-center gap-2 text-sm">
            <CalendarDays className="h-4 w-4 text-slate-500 dark:text-slate-400" />
            <span className="text-slate-600 dark:text-slate-300">Date Range:</span>
            <DateRangePicker date={dateRange} onDateChange={setDateRange} />
          </div>
          <button
            type="button"
            onClick={handleClearFilter}
            className="inline-flex h-9 items-center gap-1.5 self-start rounded-md border border-sky-300 bg-sky-500 px-3 text-sm font-medium text-white transition-colors hover:bg-sky-600 md:self-auto"
          >
            <FilterX className="h-4 w-4" />
            Clear Filter
          </button>
        </div>

        <section className={`grid ${kpiGridClass} gap-3 md:auto-rows-fr`}>
          {isInitialLoad || !data ? (
            <>
              <Skeleton className="h-[120px] w-full rounded-xl" />
              <Skeleton className="h-[120px] w-full rounded-xl" />
              <Skeleton className="h-[120px] w-full rounded-xl" />
            </>
          ) : (
            data.kpiData.map((kpi, index) => {
              const colors = ["text-blue-500", "text-green-500", "text-orange-500", "text-purple-500", "text-yellow-500", "text-red-500"];
              return (
                <SimpleKpiCard
                  key={index}
                  label={kpi.title}
                  value={String(kpi.value)}
                  icon={getSimpleIconName(kpi.icon)}
                  colorClass={colors[index % colors.length]}
                  indicatorText={kpi.change}
                  subtext={kpi.description}
                />
              );
            })
          )}
        </section>

        <section className="grid grid-cols-1 gap-4">
          <div className="rounded-xl border border-slate-300 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-950 p-2 min-h-[350px]">
            {isLoading || !data ? (
              <Skeleton className="h-[320px] w-full rounded-xl" />
            ) : getLineData().length === 0 ? (
              <NoDataPlaceholder height="320px" />
            ) : (
              <ShadcnLineChartRegular
                title="Passenger Trend Revenue"
                description="Daily revenue driven by passengers"
                data={getLineData()}
                dataKey="revenue"
                labelKey="date"
                color="#3b82f6"
                height="320px"
                dateRange={dateRange}
                config={{
                  revenue: { label: "Revenue (₱)", color: "#3b82f6" }
                }}
              />
            )}
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-slate-300 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-950 p-2 min-h-[350px]">
            {isLoading || !data ? (
              <Skeleton className="h-[320px] w-full rounded-xl" />
            ) : getBarData().mappedData.length === 0 ? (
              <NoDataPlaceholder height="320px" />
            ) : (
              <ShadcnBarChartMultiple
                title="Booking Channels"
                description="Ticket volume by booking channel"
                data={getBarData().mappedData}
                config={getBarData().config}
                labelKey="date"
                height="320px"
                dateRange={dateRange}
              />
            )}
          </div>

          <div className="rounded-xl border border-slate-300 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-950 p-2 min-h-[350px]">
             {isLoading || !data ? (
               <Skeleton className="h-[320px] w-full rounded-xl" />
             ) : getPieData().mappedData.length === 0 ? (
               <NoDataPlaceholder height="320px" />
             ) : (
               <ShadcnPieChartLegend
                 title="Passenger Demographic"
                 description="Breakdown by passenger type"
                 data={getPieData().mappedData}
                 config={getPieData().config}
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

