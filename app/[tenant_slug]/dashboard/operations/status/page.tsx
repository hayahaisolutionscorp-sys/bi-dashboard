"use client";

import { useState, useMemo, useEffect } from "react";
import { 
  CalendarDays, 
  FilterX, 
  AlertTriangle,
  Navigation,
  Ship,
  CheckCircle2,
  XCircle,
  Wrench
} from "lucide-react";
import { SimpleKpiCard } from "@/components/charts/simple-kpi-card";
import { ShadcnLineChartMultiple } from "@/components/charts/shadcn-line-chart-multiple";
import { ShadcnPieChartLegend } from "@/components/charts/shadcn-pie-chart-legend";
import { NoDataPlaceholder } from "@/components/charts/no-data-placeholder";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";
import { Skeleton } from "@/components/ui/skeleton";
import { useTenant } from "@/components/providers/tenant-provider";

import { statusService } from "@/services/status.service";
import { StatusReportResponse } from "@/types/status";

export default function StatusPage() {
  const { activeTenant, isLoading: isTenantLoading } = useTenant();
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    const now = new Date();
    return { 
      from: new Date(now.getFullYear(), now.getMonth(), 1), 
      to: now 
    };
  });

  const [data, setData] = useState<StatusReportResponse["data"] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      if (!activeTenant?.api_base_url) return;
      setIsLoading(true);
      setError(null);
      try {
        const from = dateRange?.from?.toISOString().split("T")[0];
        const to = dateRange?.to?.toISOString().split("T")[0];
        const result = await statusService.getStatusReport(
          activeTenant.api_base_url, 
          from, 
          to, 
          undefined,
          activeTenant.service_key
        );
        setData(result);
        if (isInitialLoad) {
          setTimeout(() => setIsInitialLoad(false), 500);
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load status report. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }

    if (dateRange?.from && dateRange?.to) {
      fetchData();
    }
  }, [dateRange, activeTenant]);

  const handleClearFilter = () => {
    const now = new Date();
    setDateRange({ 
      from: new Date(now.getFullYear(), now.getMonth(), 1), 
      to: now 
    });
  };

  const kpis = useMemo(() => {
    if (!data) return [];
    return data.kpiData.map((kpi, index) => {
      const colors = ["text-blue-500", "text-green-500", "text-orange-500", "text-purple-500", "text-yellow-500", "text-red-500"];
      return {
        label: kpi.title,
        value: kpi.value,
        icon: kpi.icon === "ship" ? Ship : 
              kpi.icon === "check-circle" ? CheckCircle2 : 
              kpi.icon === "x-circle" ? XCircle : 
              kpi.icon === "wrench" ? Wrench : AlertTriangle,
        indicatorText: kpi.description,
        indicatorDirection: (kpi.trend === "up" ? "up" : kpi.trend === "down" ? "down" : "neutral") as "up" | "down" | "neutral",
        indicatorSubtext: kpi.change,
        colorClass: colors[index % colors.length]
      };
    });
  }, [data]);

  const getBookingTrendData = () => {
    // New structure: data.bookingTrendData is an array of objects
    // [{ "date": "...", "confirm": 0, "cancelled": 0 }, ...]
    const rawData = (data as any)?.bookingTrendData || [];
    
    // Ensure data is mapped correctly and non-null
    const mappedData = rawData.map((item: any) => ({
      date: item.date || "",
      confirm: item.confirm ?? 0,
      cancelled: item.cancelled ?? 0
    }));

    const config = {
      confirm: { label: "Confirmed", color: "#10b981" },
      cancelled: { label: "Cancelled", color: "#ef4444" }
    };

    const series = [
      { dataKey: "confirm", color: "#10b981", name: "Confirmed" },
      { dataKey: "cancelled", color: "#ef4444", name: "Cancelled" }
    ];

    return { 
      mappedData, 
      config, 
      series 
    };
  };

  const bookingTrend = useMemo(() => getBookingTrendData(), [data]);

  const passengerClassConfig = useMemo(() => {
    const config: any = {};
    const colors = ["#2563eb", "#10b981", "#f59e0b", "#8b5cf6", "#f43f5e"];
    data?.passengerClassData?.forEach((d, i) => {
      config[d.name] = { label: d.name, color: colors[i % colors.length] };
    });
    return config;
  }, [data]);

  if (error) {
    return (
      <div className="flex h-[400px] items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="h-12 w-12 rounded-full bg-rose-100 dark:bg-rose-950/40 flex items-center justify-center">
            <AlertTriangle className="h-6 w-6 text-rose-500" />
          </div>
          <p className="font-semibold text-slate-800 dark:text-slate-200">Failed to load data</p>
          <p className="text-sm text-slate-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 p-2 sm:p-3 lg:p-4 2xl:p-5 2xl:gap-3">
      {/* Header Section */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-end">
          <div className="flex items-center gap-2 text-sm">
            <CalendarDays className="h-4 w-4 text-slate-500 dark:text-slate-400" />
            <span className="text-slate-600 dark:text-slate-300">Date Range:</span>
            <DateRangePicker date={dateRange} onDateChange={setDateRange} />
          </div>
          <button
            type="button"
            onClick={handleClearFilter}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-xs font-medium text-foreground hover:bg-secondary"
          >
            <FilterX className="h-4 w-4" />
            Reset Filter
          </button>
        </div>

      {/* KPI Row */}
      <section className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 2xl:grid-cols-5">
        {isInitialLoad || !data ? (
           <>
             <Skeleton className="h-20 w-full rounded-xl" />
             <Skeleton className="h-20 w-full rounded-xl" />
             <Skeleton className="h-20 w-full rounded-xl" />
             <Skeleton className="h-20 w-full rounded-xl" />
             <Skeleton className="h-20 w-full rounded-xl col-span-2 sm:col-span-1" />
           </>
        ) : (
          kpis.map((kpi, index) => (
            <SimpleKpiCard
              key={index}
              label={kpi.label}
              value={String(kpi.value)}
              icon={kpi.icon as any}
              indicatorText={kpi.indicatorText}
              indicatorDirection={kpi.indicatorDirection}
              subtext={kpi.indicatorSubtext}
              colorClass={kpi.colorClass}
            />
          ))
        )}
      </section>

      {/* Booking Trend Chart */}
      <section>
        <div className="rounded-xl border border-border bg-card min-h-[220px] md:min-h-[260px] 2xl:min-h-[320px]">
          {isLoading || !data ? (
            <Skeleton className="h-[220px] w-full rounded-xl md:h-[260px] 2xl:h-[320px]" />
          ) : bookingTrend.mappedData.length === 0 ? (
            <NoDataPlaceholder height="260px" />
          ) : (
            <ShadcnLineChartMultiple
              title="Booking Performance Trend"
              description="Confirmed vs Cancelled bookings"
              data={bookingTrend.mappedData}
              config={bookingTrend.config}
              series={bookingTrend.series}
              labelKey="date"
              height="280px"
              dateRange={dateRange}
            />
          )}
        </div>
      </section>

        {/* Charts & Distribution */}
        {/* <section className="grid grid-cols-1 gap-3">
         
          <div className="rounded-xl border border-border bg-card p-2 min-h-[350px]">
            {isLoading || !data ? (
              <Skeleton className="h-[320px] w-full rounded-xl" />
            ) : !data.passengerClassData.length ? (
              <NoDataPlaceholder height="320px" />
            ) : (
              <ShadcnPieChartLegend
                title="Passenger Class Distribution"
                data={data.passengerClassData}
                config={passengerClassConfig}
                dataKey="value"
                nameKey="name"
                height="320px"
              />
            )}
          </div>
        </section> */}

        {/* Operational Monitoring Section */}
        <section className="grid grid-cols-1 lg:grid-cols-1 gap-3">
          {/* Alerts Card */}
          {/* <Card className="rounded-xl border border-border bg-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h2 className="text-lg font-semibold">Operational Alerts</h2>
              <AlertTriangle className="h-5 w-5 text-amber-500" />
            </CardHeader>
            <CardContent>
              ...
            </CardContent>
          </Card> */}

          {/* Fleet Pulse Table */}
          {/* <Card className="lg:col-span-2 rounded-xl border border-border bg-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h2 className="text-lg font-semibold">Active Fleet Pulse</h2>
              <Navigation className="h-5 w-5 text-sky-500" />
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-muted-foreground border-b border-border">
                      <th className="pb-2 font-medium">Vessel</th>
                      <th className="pb-2 font-medium">Route</th>
                      <th className="pb-2 font-medium text-right">Schedule</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y dark:divide-slate-800">
                    ...
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card> */}
        </section>
    </div>
  );
}
