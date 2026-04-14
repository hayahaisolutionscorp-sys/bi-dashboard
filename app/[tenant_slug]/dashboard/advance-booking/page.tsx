"use client";

import { useState, useEffect } from "react";
import { 
  TrendingUp, 
  CalendarDays, 
  FilterX, 
  Clock,
  AlertCircle,
  BarChart3,
  Users,
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  Banknote,
  AlertTriangle,
  Activity
} from "lucide-react";
import { SimpleKpiCard } from "@/components/charts/simple-kpi-card";
import { ChartBuilder } from "@/components/charts/factory/ChartBuilder";
import { AdvanceBookingService } from "@/services/advance-booking.service";
import { AdvanceBookingResponse } from "@/types/advance-booking";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useParams } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useTenant } from "@/components/providers/tenant-provider";

export default function AdvanceBookingPage() {
  const { activeTenant, isLoading: isTenantLoading } = useTenant();
  const params = useParams();
  const tenant_slug = params.tenant_slug as string;

  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    const from = new Date();
    const to = new Date();
    to.setDate(to.getDate() + 60);
    return { from, to };
  });

  const [loading, setLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [data, setData] = useState<AdvanceBookingResponse | null>(null);
  const [alertsPage, setAlertsPage] = useState(0);
  const ALERTS_PAGE_SIZE = 3;

  useEffect(() => {
    const fetchData = async () => {
      if (!activeTenant?.api_base_url) return;
      setLoading(true);
      const response = await AdvanceBookingService.getAdvanceDashboard(
        activeTenant.api_base_url, 
        tenant_slug, 
        dateRange, 
        activeTenant.service_key
      );
      setData(response);
      if (isInitialLoad) {
        setTimeout(() => setIsInitialLoad(false), 500);
      }
      setLoading(false);
    };
    fetchData();
  }, [tenant_slug, dateRange, activeTenant]);

  const resetFilter = () => {
    const from = new Date();
    const to = new Date();
    to.setDate(to.getDate() + 60);
    setDateRange({ from, to });
  };

  if (!isInitialLoad && !data) return null;

  return (
    <div className="bg-background text-foreground">
      <div className="mx-auto w-full max-w-[1120px] space-y-4 px-3 py-3 sm:px-4 sm:py-4 lg:px-6 lg:py-5">
        
        {/* Header & Date Filter */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-3 md:ml-auto">
            <div className="flex items-center gap-2 text-sm">
              <CalendarDays className="h-4 w-4 text-slate-500 dark:text-slate-400" />
              <span className="text-slate-600 dark:text-slate-300">Date Range:</span>
              <DateRangePicker date={dateRange} onDateChange={setDateRange} allowFuture={true} />
            </div>
            <button
              onClick={resetFilter}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-xs font-medium text-foreground hover:bg-secondary"
            >
              <FilterX className="h-4 w-4" />
              <span>Reset Filter</span>
            </button>
          </div>
        </div>

        {/* Executive KPI Row */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {isInitialLoad || !data ? (
            <>
              <Skeleton className="h-32 w-full rounded-xl" />
              <Skeleton className="h-32 w-full rounded-xl" />
              <Skeleton className="h-32 w-full rounded-xl" />
              <Skeleton className="h-32 w-full rounded-xl" />
            </>
          ) : (
            <>
              <SimpleKpiCard
                label="Total Forward Revenue"
                value={`₱${(data.overall_metrics.total_forward_revenue / 1000000).toFixed(2)}M`}
                icon={Banknote}
                colorClass="text-blue-500"
                indicatorText="+18%"
                indicatorDirection="up"
                subtext="vs actual target"
              />
              <SimpleKpiCard
                label="Avg Booking Window"
                value={`${data.overall_metrics.avg_advance_window} Days`}
                icon={Clock}
                colorClass="text-green-500"
                indicatorText="+1.2d"
                indicatorDirection="up"
                subtext="Lead time trend"
              />
              <SimpleKpiCard
                label="Peak Demand"
                value={new Date(data.overall_metrics.peak_demand_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                icon={TrendingUp}
                colorClass="text-orange-500"
                indicatorText="High"
                indicatorDirection="neutral"
                subtext="Forecasted peak"
              />
              <SimpleKpiCard
                label="Capacity Alerts"
                value={data.overall_metrics.critical_voyages_count.toString()}
                icon={AlertTriangle}
                colorClass="text-purple-500"
                indicatorText="Action Req."
                indicatorDirection="down"
                subtext="Critical voyages"
              />
            </>
          )}
        </section>

        {/* Main Strategic Charts */}
        {!data ? (
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
             <Skeleton className="h-[400px] lg:col-span-3 rounded-xl" />
             <Skeleton className="h-[300px] lg:col-span-3 rounded-xl" />
           </div>
        ) : (
          <>
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              {/* Yield Projection Chart - Full Width */}
              <div className="lg:col-span-3">
            {new ChartBuilder("yield-projection", "bar")
              .withClassName("rounded-xl border border-border bg-card p-2")
              .withTitle("Forward Yield Projection", "Confirmed Revenue vs Capacity %")
              .withAxis("x", {
                type: "category",
                data: data.daily_projections.map(d => d.date),
                axisLabel: { 
                  fontSize: 10, 
                  interval: 7,
                  formatter: (value: string) => {
                    const d = new Date(value + "T00:00:00Z");
                    return !isNaN(d.getTime()) ? `${d.getUTCMonth() + 1}/${d.getUTCDate()}` : value;
                  }
                }
              })
              .withAxis("y", [
                {
                  type: "value",
                  name: "Revenue",
                  nameGap: 35,
                  axisLabel: { 
                    fontSize: 10,
                    formatter: (val: number) => `₱${(val / 1000).toFixed(0)}K`
                  }
                },
                {
                  type: "value",
                  name: "Capacity %",
                  position: "right",
                  nameGap: 35,
                  max: 100,
                  axisLabel: { fontSize: 10, formatter: '{value}%' },
                  splitLine: { show: false }
                }
              ] as any)
              .addSeries({
                name: "Revenue",
                type: "bar",
                data: data.daily_projections.map(d => d.confirmed_revenue),
                color: "#3b82f6",
                itemStyle: { borderRadius: [2, 2, 0, 0] },
                barGap: '10%',
                barCategoryGap: '30%',
                tooltip: { valueFormatter: (val: number) => `₱${Number(val).toLocaleString()}` }
              } as any)
              .addSeries({
                name: "Capacity %",
                type: "bar",
                yAxisIndex: 1,
                data: data.daily_projections.map(d => parseFloat(Number(d.capacity_utilization).toFixed(2))),
                color: "#f43f5e",
                itemStyle: { borderRadius: [2, 2, 0, 0] },
                aggregation: 'avg',
                tooltip: { valueFormatter: (val: number) => `${val}%` }
              } as any)
              .withHeight("400px")
              .withLegend(true, "top")
              .withGrid({ top: 80, bottom: 40, left: 65, right: 65 })
              .withTimeToggle(true)
              .withTheme(null)
              .build()}
          </div>
        </section>

        {/* Second Row: Lead Time */}
        <section className="grid grid-cols-1 lg:grid-cols-1 gap-3">
          {/* Booking Window Distribution */}
          <div>
            {new ChartBuilder("booking-window", "bar")
              .withClassName("rounded-xl border border-border bg-card p-2")
              .withTitle("Booking Lead Time", "Days before departure")
              .withAxis("x", {
                type: "category",
                data: data.lead_time_distribution.map(d => `${d.days_ahead} Day`),
                axisLabel: { fontSize: 10 }
              })
              .withAxis("y", {
                type: "value",
                axisLabel: { fontSize: 10 }
              })
              .addSeries({
                name: "Bookings",
                type: "bar",
                data: data.lead_time_distribution.map(d => d.booking_count),
                color: "#0ea5e9",
                itemStyle: { borderRadius: [4, 4, 0, 0] }
              } as any)
              .withHeight("300px")
              .withTheme(null)
              .build()}
          </div>
        </section>

        {/* Secondary Insights Row */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {/* Revenue Source Breakdown */}
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="text-lg font-semibold mb-2 text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Users className="h-5 w-5 text-sky-500" />
              Revenue Channel Distribution
            </h3>
            {new ChartBuilder("revenue-channel-pie", "pie")
              .addSeries({
                name: "Revenue Channel",
                type: "pie",
                radius: ["40%", "70%"],
                avoidLabelOverlap: true,
                itemStyle: {
                  borderRadius: 6,
                  borderColor: 'transparent',
                  borderWidth: 2
                },
                label: {
                  show: false,
                  position: 'center'
                },
                emphasis: {
                  label: {
                    show: true,
                    fontSize: 12,
                    fontWeight: 'bold',
                    formatter: '{b}\n{d}%'
                  }
                },
                data: data.source_distribution
                  .filter(item => item.source.toLowerCase() !== 'unknown')
                  .map((item, idx) => ({
                  name: item.source,
                  value: item.revenue,
                  itemStyle: {
                    color: ["#3b82f6", "#0ea5e9", "#6366f1", "#8b5cf6", "#f43f5e"][idx % 5]
                  }
                }))
              } as any)
              .withLegend(true, "bottom")
              .withGrid({ top: 0, bottom: 0, left: 0, right: 0 })
              .withHeight("250px")
              .withTheme(null)
              .build()}
          </div>

          {/* Capacity Sell-out Alerts */}
          <div className="rounded-xl border border-border bg-card p-0 overflow-hidden">
             <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    {/* <AlertCircle className="h-5 w-5 text-rose-500" /> */}
                    Critical Capacity Alerts
                  </h3>
                </div>
                {data.capacity_alerts.length > ALERTS_PAGE_SIZE && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setAlertsPage(p => Math.max(0, p - 1))}
                      disabled={alertsPage === 0}
                      className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="text-xs font-medium text-slate-500 min-w-[3rem] text-center">
                      {alertsPage + 1} / {Math.ceil(data.capacity_alerts.length / ALERTS_PAGE_SIZE)}
                    </span>
                    <button
                      onClick={() => setAlertsPage(p => Math.min(Math.ceil(data.capacity_alerts.length / ALERTS_PAGE_SIZE) - 1, p + 1))}
                      disabled={alertsPage >= Math.ceil(data.capacity_alerts.length / ALERTS_PAGE_SIZE) - 1}
                      className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                )}
                {/* <span className="text-xs font-medium text-rose-500 bg-rose-50 dark:bg-rose-900/30 px-2 py-1 rounded-full animate-pulse">
                  Action Required
                </span> */}
             </div>
             <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {data.capacity_alerts
                  .slice(alertsPage * ALERTS_PAGE_SIZE, (alertsPage + 1) * ALERTS_PAGE_SIZE)
                  .map((alert) => (
                  <div key={alert.trip_id} className="p-4 hover:bg-secondary/50 transition-colors flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="font-bold text-slate-800 dark:text-slate-200">{alert.vessel_name}</p>
                      <p className="text-xs text-slate-500 flex items-center gap-1">
                        <CalendarCheck className="h-3 w-3" />
                        Departure: {new Date(alert.departure_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                      <div className="flex gap-2 mt-1">
                         <span className="text-[10px] bg-sky-100 text-sky-700 dark:bg-sky-900/30 px-1.5 rounded">
                           Pax: {alert.pax_utilization_pct || alert.utilization_pct}%
                         </span>
                         {alert.cargo_utilization_pct > 0 && (
                           <span className="text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-900/30 px-1.5 rounded">
                             Cargo: {alert.cargo_utilization_pct}%
                           </span>
                         )}
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <p className="text-sm font-bold text-rose-600 dark:text-rose-400">
                        {Math.max(alert.pax_utilization_pct || 0, alert.utilization_pct || 0)}% Full
                      </p>
                      <p className="text-xs text-slate-400">{alert.remaining_capacity} seats left</p>
                    </div>
                  </div>
                ))}
             </div>
          </div>
        </section>
         </>
       )}

      </div>
    </div>
  );
}
