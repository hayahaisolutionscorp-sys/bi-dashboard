"use client";

import { useState, useEffect, useMemo } from "react";
import { format, parseISO } from "date-fns";
import { useParams } from "next/navigation";
import { CalendarDays, FilterX, Users, Wallet, TrendingUp, User, MapPin, AlertCircle, Activity } from "lucide-react";
import { SimpleKpiCard } from "@/components/charts/simple-kpi-card";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";
import { Skeleton } from "@/components/ui/skeleton";
import { NoDataPlaceholder } from "@/components/charts/no-data-placeholder";
import { ServerError } from "@/components/ui/server-error";
import { useTenant } from "@/components/providers/tenant-provider";

import { ShadcnLineChartRegular } from "@/components/charts/shadcn-line-chart-regular";
import { ShadcnBarChartMultiple } from "@/components/charts/shadcn-bar-chart-multiple";
import { ShadcnPieChartLegend } from "@/components/charts/shadcn-pie-chart-legend";

import { passengersService } from "@/services/passengers.service";
import { PassengersReportResponse } from "@/types/passengers";

export default function PassengersPerTripPage() {
  const { activeTenant, isLoading: isTenantLoading } = useTenant();
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
      if (!activeTenant?.api_base_url) return;
      
      setIsLoading(true);
      setError(null);
      try {
        const from = dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : undefined;
        const to = dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : undefined;
        const result = await passengersService.getPassengersReport(
          activeTenant.api_base_url, 
          tenantSlug, 
          from, 
          to, 
          activeTenant.service_key
        );
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
    
    if (dateRange?.from && dateRange?.to && activeTenant?.api_base_url) {
      fetchData();
    }
  }, [dateRange, tenantSlug, activeTenant]);

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

  const filteredKpiData = data?.kpiData?.filter(
    (kpi) => !["Best Route", "Least Route", "Load Factor"].some(hidden => kpi.title.includes(hidden))
  ) || [];

  const kpiCount = filteredKpiData.length;
  const kpiGridClass =
    kpiCount >= 5
      ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3"
      : kpiCount === 4
        ? "grid-cols-1 sm:grid-cols-2"
        : "grid-cols-[repeat(auto-fit,minmax(210px,1fr))]";

  const lineData = useMemo(() => {
    if (!data?.trendData || !dateRange?.from || !dateRange?.to) return [];

    const filled: { date: string; count: number }[] = [];
    const current = new Date(dateRange.from);
    current.setHours(0, 0, 0, 0);
    const end = new Date(dateRange.to);
    end.setHours(0, 0, 0, 0);

    const dataMap = new Map();
    data.trendData.forEach(item => {
      try {
        const d = item.date.includes("-") ? parseISO(item.date) : new Date(item.date);
        const normalized = format(d, "yyyy-MM-dd");
        dataMap.set(normalized, Number(item["passenger-count"] || 0));
      } catch (e) {
        console.warn("Invalid date in trendData:", item.date);
      }
    });

    while (current <= end) {
      const dateStr = format(current, "yyyy-MM-dd");
      filled.push({
        date: dateStr,
        count: dataMap.get(dateStr) ?? 0
      });
      current.setDate(current.getDate() + 1);
    }
    return filled;
  }, [data, dateRange]);


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

  const getBookingChannelPieData = () => {
    if (!data?.bookingChannelTrendData) return { mappedData: [], config: {} };
    const { series } = data.bookingChannelTrendData;
    
    const mappedData = series.map(s => ({
      name: s.name,
      value: s.data.reduce((acc, curr) => acc + (curr || 0), 0)
    }));

    const config: any = {};
    const colors = ["#8b5cf6", "#f43f5e", "#10b981", "#f59e0b", "#2563eb"];
    mappedData.forEach((d, i) => {
      config[d.name] = { label: d.name, color: colors[i % colors.length] };
    });
    
    return { mappedData, config };
  };

  if (error) {
    return (
      <div className="bg-background text-foreground min-h-[calc(100vh-200px)]">
        <div className="mx-auto w-full max-w-[1120px] p-4 lg:p-6">
          <ServerError message={error} onRetry={() => window.location.reload()} />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background text-foreground">
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
            className="inline-flex h-8 items-center gap-1.5 self-start rounded-lg border border-border bg-card px-3 text-xs font-medium text-foreground hover:bg-secondary md:self-auto"
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
            filteredKpiData.map((kpi, index) => {
              const colors = ["text-blue-500", "text-green-500", "text-orange-500", "text-purple-500", "text-yellow-500", "text-red-500"];
              return (
                <SimpleKpiCard
                  key={index}
                  label={
                    kpi.title === "Avg Pax/Trip" ? "Average Passenger per Trip" :
                    kpi.title === "Rev / Passenger" ? "Revenue per Passenger" :
                    kpi.title
                  }
                  value={String(kpi.value)}
                  icon={getSimpleIconName(kpi.icon)}
                  colorClass={colors[index % colors.length]}
                  indicatorText={kpi.change}
                  subtext={"for selected period"}
                />
              );
            })
          )}
        </section>

        <section className="grid grid-cols-1 gap-4">
          <div className="rounded-xl border border-border bg-card p-2 min-h-[350px]">
            {isLoading || !data ? (
              <Skeleton className="h-[320px] w-full rounded-xl" />
            ) : lineData.length === 0 ? (
              <NoDataPlaceholder height="320px" />
            ) : (
              <ShadcnLineChartRegular
                title="Passenger Count Trend"
                description="Daily trend of passengers"
                data={lineData}
                dataKey="count"
                labelKey="date"
                color="#3b82f6"
                height="320px"
                dateRange={dateRange}
                isCurrency={false}
                config={{
                  count: { label: "Passenger Count", color: "#3b82f6" }
                }}
              />
            )}
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-border bg-card p-2 min-h-[350px]">
            {isLoading || !data ? (
              <Skeleton className="h-[320px] w-full rounded-xl" />
            ) : getBookingChannelPieData().mappedData.length === 0 ? (
              <NoDataPlaceholder height="320px" />
            ) : (
              <ShadcnPieChartLegend
                title="Booking Channels"
                description="Ticket volume distribution"
                data={getBookingChannelPieData().mappedData}
                config={getBookingChannelPieData().config}
                dataKey="value"
                nameKey="name"
                height="320px"
              />
            )}
          </div>

          <div className="rounded-xl border border-border bg-card p-2 min-h-[350px]">
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

