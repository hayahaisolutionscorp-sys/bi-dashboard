"use client";

import { useState, useEffect } from "react";
import { 
  Wallet, 
  Calendar, 
  TrendingUp, 
  User, 
  Package, 
  XCircle, 
  Route, 
  PhilippinePeso,
  Ship,
  AlertTriangle,
  CheckCircle,
  Info,
} from "lucide-react";

// Components
import { KpiCard } from "@/components/charts/kpi-card";
import { Skeleton } from "@/components/ui/skeleton";

// Services & Types
import { overviewService } from "@/services/overview.service";
import { dashboardWidgetsService } from "@/services/dashboard-widgets.service";
import { OverviewData } from "@/types/overview";
import {
  RecentActivityItem,
  ScheduleTripItem,
  CapacityHeatmapCell,
  TopAgentItem,
} from "@/types/dashboard-widgets";
import { RecentActivityFeed } from "@/components/charts/recent-activity-feed";
import { TodayScheduleTimeline } from "@/components/charts/today-schedule-timeline";
import { CapacityHeatmap } from "@/components/charts/capacity-heatmap";
import { TopAgentsTable } from "@/components/charts/top-agents-table";
import { ShadcnOverviewBarChartHorizontal } from "@/components/charts/shadcn-overview-bar-chart-horizontal";
import { ShadcnOverviewBarChartVertical } from "@/components/charts/shadcn-overview-bar-chart-vertical";
import { ShadcnOverviewRegularLineChart } from "@/components/charts/shadcn-overview-regular-line-chart";
import { ShadnOverviewStackedPieChart } from "@/components/charts/shadn-overview-stacked-pie-chart";
import { ChartConfig } from "@/components/ui/chart";
import { useTenant } from "@/components/providers/tenant-provider";

function PeriodComparisonCard({
  title,
  currentLabel,
  currentValue,
  referenceLabel,
  referenceValue,
  format,
}: {
  title: string;
  currentLabel: string;
  currentValue: number;
  referenceLabel: string;
  referenceValue: number;
  format: (n: number) => string;
}) {
  const max = Math.max(currentValue, referenceValue, 1);
  const currentPct = (currentValue / max) * 100;
  const refPct = (referenceValue / max) * 100;
  const delta = referenceValue > 0 ? ((currentValue - referenceValue) / referenceValue) * 100 : 0;
  const isUp = delta > 1;
  const isDown = delta < -1;

  return (
    <div className="rounded-md border border-border bg-card p-3 space-y-2">
      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
      <div className="space-y-2">
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{currentLabel}</span>
            <span className="text-sm font-semibold tabular-nums">{format(currentValue)}</span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-[var(--primary)] transition-all duration-500"
              style={{ width: `${currentPct}%` }}
            />
          </div>
        </div>
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{referenceLabel}</span>
            <span className="text-sm font-medium tabular-nums text-muted-foreground">{format(referenceValue)}</span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-muted-foreground/40 transition-all duration-500"
              style={{ width: `${refPct}%` }}
            />
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        {isUp ? (
          <span className="px-2 py-0.5 text-[11px] font-medium rounded bg-green-100 dark:bg-green-950/60 text-green-700 dark:text-green-400">
            +{delta.toFixed(1)}% above
          </span>
        ) : isDown ? (
          <span className="px-2 py-0.5 text-[11px] font-medium rounded bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400">
            {Math.abs(delta).toFixed(1)}% below
          </span>
        ) : (
          <span className="px-2 py-0.5 text-[11px] font-medium rounded bg-muted text-muted-foreground">
            On track
          </span>
        )}
        <span className="text-xs text-muted-foreground">vs {referenceLabel}</span>
      </div>
    </div>
  );
}

function computeTrend(
  current: number,
  reference: number,
  label: string
): { direction: "up" | "down" | "neutral"; value: string; label: string } | undefined {
  if (!reference || !current) return undefined;
  const pct = ((current - reference) / reference) * 100;
  const direction = pct > 1 ? "up" : pct < -1 ? "down" : "neutral";
  return { direction, value: `${Math.abs(pct).toFixed(1)}%`, label };
}

export default function DashboardPage() {
  const { activeTenant, isLoading: isTenantLoading } = useTenant();
  const [period, setPeriod] = useState<"today" | "mtd" | "ytd">("today");
  const [data, setData] = useState<OverviewData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [routePage, setRoutePage] = useState(0);
  const [vesselPage, setVesselPage] = useState(0);

  // Widget states
  const [recentActivity, setRecentActivity] = useState<RecentActivityItem[]>([]);
  const [todaySchedule, setTodaySchedule] = useState<ScheduleTripItem[]>([]);
  const [capacityHeatmap, setCapacityHeatmap] = useState<CapacityHeatmapCell[]>([]);
  const [topAgents, setTopAgents] = useState<TopAgentItem[]>([]);
  const [widgetsLoading, setWidgetsLoading] = useState(true);

  // Persistent totals to keep cards stable when switching
  const [kpiTotals, setKpiTotals] = useState({
    today: 0,
    mtd: 0,
    ytd: 0
  });

  useEffect(() => {
    async function fetchData() {
      if (!activeTenant?.api_base_url) return;
      setIsLoading(true);
      setError(null);
      setRoutePage(0); // Reset page on period change
      setVesselPage(0); // Reset vessel page on period change
      try {
        const overview = await overviewService.getOverview(
          activeTenant.api_base_url, 
          period, 
          activeTenant.service_key
        );
        setData(overview);

        // Update persistent totals based on incoming data
        setKpiTotals(prev => ({
          today: period === "today" ? overview.kpi.total_revenue : (overview.today_total_revenue ?? prev.today),
          mtd: overview.mtd_total_revenue ?? (period === "mtd" ? overview.kpi.total_revenue : prev.mtd),
          ytd: overview.ytd_total_revenue ?? (period === "ytd" ? overview.kpi.total_revenue : prev.ytd)
        }));
      } catch (err) {
        setError("Failed to load dashboard data. Please try again later.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [period, activeTenant]);

  // Fetch widget data (once on mount, independent of period)
  useEffect(() => {
    async function fetchWidgets() {
      if (!activeTenant?.api_base_url) return;
      setWidgetsLoading(true);
      try {
        const [activity, schedule, heatmap, agents] = await Promise.allSettled([
          dashboardWidgetsService.getRecentActivity(activeTenant.api_base_url, 20, activeTenant.service_key),
          dashboardWidgetsService.getTodaySchedule(activeTenant.api_base_url, activeTenant.service_key),
          dashboardWidgetsService.getCapacityHeatmap(activeTenant.api_base_url, undefined, undefined, activeTenant.service_key),
          dashboardWidgetsService.getTopAgents(activeTenant.api_base_url, undefined, undefined, 10, activeTenant.service_key),
        ]);
        if (activity.status === "fulfilled") setRecentActivity(activity.value);
        if (schedule.status === "fulfilled") setTodaySchedule(schedule.value);
        if (heatmap.status === "fulfilled") setCapacityHeatmap(heatmap.value);
        if (agents.status === "fulfilled") setTopAgents(agents.value);
      } catch (err) {
        console.error("Widget fetch error:", err);
      } finally {
        setWidgetsLoading(false);
      }
    }
    fetchWidgets();
  }, [activeTenant]);

  if (error) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="h-12 w-12 rounded-full bg-rose-100 dark:bg-rose-950/40 flex items-center justify-center">
            <XCircle className="h-6 w-6 text-rose-500" />
          </div>
          <p className="font-semibold text-slate-800 dark:text-slate-200">Failed to load data</p>
          <p className="text-sm text-slate-500">{error}</p>
        </div>
      </div>
    );
  }

  const formatCurrency = (val?: number | null) => `₱${(val ?? 0).toLocaleString()}`;

  const daysElapsed = new Date().getDate();
  const monthsElapsed = new Date().getMonth() + 1;
  const dailyMtdAvg = daysElapsed > 0 ? kpiTotals.mtd / daysElapsed : 0;
  const monthlyYtdAvg = monthsElapsed > 0 ? kpiTotals.ytd / monthsElapsed : 0;
  const activeVessels = data?.revenue_by_vessel.length ?? 0;

  const insights: Array<{ type: "success" | "warning" | "info"; label: string; message: string }> = data ? (() => {
    const items: Array<{ type: "success" | "warning" | "info"; label: string; message: string }> = [];
    if (data.revenue_by_route.length > 0) {
      const top = [...data.revenue_by_route].sort((a, b) => b.total_revenue - a.total_revenue)[0];
      const routeName = (top as any).route_name ?? top.canonical_route_name ?? "Unknown Route";
      items.push({ type: "success", label: "Top Route", message: `${routeName} — ${formatCurrency(top.total_revenue)}` });
    }
    if (data.revenue_by_vessel.length > 0) {
      const top = [...data.revenue_by_vessel].sort((a, b) => b.total_revenue - a.total_revenue)[0];
      items.push({ type: "info", label: "Top Vessel", message: `${top.vessel_name} — ${formatCurrency(top.total_revenue)}` });
    }
    const totalTrips = data.kpi.total_trips + data.kpi.canceled_count;
    const cancelRate = totalTrips > 0 ? (data.kpi.canceled_count / totalTrips) * 100 : 0;
    items.push(cancelRate > 5
      ? { type: "warning", label: "High Cancellations", message: `${cancelRate.toFixed(1)}% of bookings canceled this period` }
      : { type: "success", label: "Cancellations", message: `${data.kpi.canceled_count} canceled — ${cancelRate.toFixed(1)}% rate` }
    );
    const totalRev = data.passenger_vs_cargo.passenger_revenue + data.passenger_vs_cargo.cargo_revenue;
    if (totalRev > 0) {
      const cargoShare = (data.passenger_vs_cargo.cargo_revenue / totalRev) * 100;
      items.push({ type: "info", label: "Revenue Mix", message: `Cargo ${cargoShare.toFixed(1)}% · Passengers ${(100 - cargoShare).toFixed(1)}%` });
    }
    return items;
  })() : [];

  const kpis = [
    { 
      id: "today", 
      title: "Sales Today", 
      icon: Wallet, 
      color: "text-primary", 
      bg: "bg-red-50 dark:bg-red-950/20",
      trend: computeTrend(kpiTotals.today, dailyMtdAvg, "vs daily avg"),
    },
    { 
      id: "mtd", 
      title: "MTD Revenue", 
      icon: Calendar, 
      color: "text-teal-600", 
      bg: "bg-teal-50 dark:bg-teal-900/20",
      trend: computeTrend(kpiTotals.mtd, monthlyYtdAvg, "vs monthly avg"),
    },
    { 
      id: "ytd", 
      title: "YTD Revenue", 
      icon: TrendingUp, 
      color: "text-blue-600", 
      bg: "bg-blue-50 dark:bg-blue-900/20",
      trend: undefined,
    }
  ];

  return (
    <div className="flex flex-col gap-2 p-2 sm:p-3 lg:p-4 2xl:p-5 2xl:gap-3">
      {/* KPI Section */}
      <section className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5 2xl:gap-3">
          {kpis.map((kpi) => {
            const isSelected = period === kpi.id;
            const displayValue = formatCurrency(kpiTotals[kpi.id as keyof typeof kpiTotals]);
            
            return (
              <KpiCard
                key={kpi.id}
                title={kpi.title}
                value={isLoading && isSelected ? "..." : displayValue}
                icon={kpi.icon}
                iconColorClass={kpi.color}
                iconBgColor={kpi.bg}
                trend={kpi.trend}
                variant="reference"
                isActive={isSelected}
                showDetails={isSelected}
                onClick={() => setPeriod(kpi.id as any)}
                breakdown={isSelected && data?.kpi ? [
                  { label: "Passengers", value: (data.kpi.total_passengers ?? 0).toLocaleString(), icon: User },
                  { label: "Cargo", value: `${(data.kpi.total_cargo_units ?? 0).toLocaleString()} units`, icon: Package },
                  { label: "Canceled", value: (data.kpi.canceled_count ?? 0).toLocaleString(), icon: XCircle, valueColor: "text-rose-500" },
                  { label: "Total Trips", value: (data.kpi.total_trips ?? 0).toLocaleString(), icon: Route },
                  { label: "Expenses", value: formatCurrency(data.kpi.total_expenses), icon: PhilippinePeso },
                ] : []}
              />
            );
          })}
          {/* Active Vessels Card */}
          <KpiCard
            title="Active Vessels"
            value={isLoading ? "..." : activeVessels.toString()}
            icon={Ship}
            iconColorClass="text-violet-500"
            iconBgColor="bg-violet-50 dark:bg-violet-950/20"
            variant="reference"
            breakdown={data?.revenue_by_vessel.length ? [...data.revenue_by_vessel]
              .sort((a, b) => b.total_revenue - a.total_revenue)
              .slice(0, 3)
              .map(v => ({ label: v.vessel_name, value: formatCurrency(v.total_revenue), icon: Ship })) : []}
          />
        </section>

      {/* Period Comparison */}
      {!isLoading && (
        <section>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3 2xl:grid-cols-3">
            <PeriodComparisonCard
              title="Today vs Daily Avg"
              currentLabel="Today"
              currentValue={kpiTotals.today}
              referenceLabel="MTD daily avg"
              referenceValue={dailyMtdAvg}
              format={formatCurrency}
            />
            <PeriodComparisonCard
              title="MTD vs Monthly Avg"
              currentLabel="This month"
              currentValue={kpiTotals.mtd}
              referenceLabel="YTD monthly avg"
              referenceValue={monthlyYtdAvg}
              format={formatCurrency}
            />
            {data && (
              <PeriodComparisonCard
                title="Passenger vs Cargo Revenue"
                currentLabel="Passengers"
                currentValue={data.passenger_vs_cargo.passenger_revenue}
                referenceLabel="Cargo"
                referenceValue={data.passenger_vs_cargo.cargo_revenue}
                format={formatCurrency}
              />
            )}
          </div>
        </section>
      )}

      {/* Charts Section */}
      <section className="grid grid-cols-1 gap-2 md:grid-cols-2 2xl:grid-cols-4">
          {isLoading || !data ? (
            <>
              <Skeleton className="h-[200px] w-full rounded-md md:h-[240px] 2xl:h-[280px]" />
              <Skeleton className="h-[200px] w-full rounded-md md:h-[240px] 2xl:h-[280px]" />
              <Skeleton className="h-[200px] w-full rounded-md md:h-[240px] 2xl:h-[280px]" />
              <Skeleton className="h-[200px] w-full rounded-md md:h-[240px] 2xl:h-[280px]" />
            </>
          ) : (
            <>
              {/* Revenue Trend */}
              <div className="h-full flex flex-col rounded-md border border-border bg-card overflow-hidden">
                <ShadcnOverviewRegularLineChart
                  title="Booking Revenue Trend"
                  description="Revenue performance over time"
                  data={data.revenue_trend}
                  config={{
                    total_revenue: {
                      label: "Revenue",
                      color: "var(--chart-1)",
                    },
                  }}
                  dataKey="total_revenue"
                  labelKey="label"
                  color="var(--chart-1)"
                />
              </div>

              {/* Revenue by Route */}
              {(() => {
                const filteredRoutes = [...data.revenue_by_route].sort((a, b) => b.total_revenue - a.total_revenue);
                const ROUTES_PER_PAGE = 3;
                const totalRoutePages = Math.ceil(filteredRoutes.length / ROUTES_PER_PAGE);
                
                const validRoutePage = Math.min(routePage, Math.max(0, totalRoutePages - 1));
                const paginatedRoutes = filteredRoutes
                  .slice(validRoutePage * ROUTES_PER_PAGE, (validRoutePage + 1) * ROUTES_PER_PAGE)
                  .map((d, i) => ({ ...d, fill: `var(--chart-${(i % 5) + 1})` }));

                const routeConfig = {
                  total_revenue: {
                    label: "Revenue",
                  },
                } satisfies ChartConfig;
                
                return (
                  <div className="h-full flex flex-col rounded-md border border-border bg-card overflow-hidden">
                    <ShadcnOverviewBarChartHorizontal
                      title="Revenue by Route"
                      description="Performance across different routes"
                      data={paginatedRoutes}
                      config={routeConfig}
                      dataKey="total_revenue"
                      labelKey="route_name"
                      colorKey="total_revenue"
                      hideYAxis={true}
                      pagination={{
                        currentPage: validRoutePage,
                        totalPages: totalRoutePages,
                        onNext: () => setRoutePage(validRoutePage + 1),
                        onPrev: () => setRoutePage(validRoutePage - 1),
                      }}
                    />
                  </div>
                );
              })()}

              {/* Revenue per Vessel */}
              {(() => {
                const filteredVessels = [...data.revenue_by_vessel].sort((a, b) => b.total_revenue - a.total_revenue);
                const VESSELS_PER_PAGE = 10;
                const totalVesselPages = Math.ceil(filteredVessels.length / VESSELS_PER_PAGE);

                const validVesselPage = Math.min(vesselPage, Math.max(0, totalVesselPages - 1));
                const paginatedVessels = filteredVessels
                  .slice(validVesselPage * VESSELS_PER_PAGE, (validVesselPage + 1) * VESSELS_PER_PAGE)
                  .map((d, i) => ({ ...d, fill: `var(--chart-${(i % 5) + 1})` }));

                const vesselConfig = {
                  total_revenue: {
                    label: "Revenue",
                  },
                } satisfies ChartConfig;

                return (
                  <div className="h-full flex flex-col rounded-md border border-border bg-card overflow-hidden">
                    <ShadcnOverviewBarChartVertical
                      title="Revenue per Vessel"
                      description="Performance breakdown by ship"
                      data={paginatedVessels}
                      config={vesselConfig}
                      dataKey="total_revenue"
                      labelKey="vessel_name"
                      colorKey="total_revenue"
                      pagination={{
                        currentPage: validVesselPage,
                        totalPages: totalVesselPages,
                        onNext: () => setVesselPage(validVesselPage + 1),
                        onPrev: () => setVesselPage(validVesselPage - 1),
                      }}
                    />
                  </div>
                );
              })()}

              {/* Revenue Split */}
              {(() => {
                const outerData = [
                  { 
                    name: "Passengers", 
                    value: data.passenger_vs_cargo.passenger_revenue, 
                    fill: "var(--chart-1)",
                    isInner: false,
                    category: 'pax',
                    sourceBreakdown: Object.entries(data.passenger_vs_cargo.by_source || {}).map(([source, sData]) => ({
                      source,
                      revenue: Object.values(sData.pax || {}).reduce((acc: number, curr) => acc + (curr.revenue || 0), 0)
                    })).filter(s => s.revenue > 0)
                  },
                  { 
                    name: "Cargo", 
                    value: data.passenger_vs_cargo.cargo_revenue, 
                    fill: "var(--chart-2)",
                    isInner: false,
                    category: 'cargo',
                    sourceBreakdown: [
                      ...Object.entries(data.passenger_vs_cargo.cargo_class_breakdown?.rolling || {}).map(([name, rev]) => ({
                        source: `Vehicle: ${name.replace(/\b\w/g, c => c.toUpperCase())}`,
                        revenue: rev as number
                      })),
                      ...Object.entries(data.passenger_vs_cargo.cargo_class_breakdown?.loose || {}).map(([name, rev]) => ({
                        source: `Goods: ${name.replace(/\b\w/g, c => c.toUpperCase())}`,
                        revenue: rev as number
                      }))
                    ]
                    .filter(s => s.revenue > 0)
                    .sort((a, b) => b.revenue - a.revenue)
                  }
                ];

                const paxColors: Record<string, string> = {
                  adult: "var(--chart-1)", student: "var(--chart-2)", child: "var(--chart-3)",
                  senior: "var(--chart-4)", pwd: "var(--chart-5)", regular: "var(--chart-1)",
                  driver: "var(--chart-2)", helper: "var(--chart-3)"
                };
                const cargoColors: Record<string, string> = { loose: "var(--chart-4)", rolling: "var(--chart-5)" };

                const innerData = [
                  ...Object.entries(data.passenger_vs_cargo.pax_breakdown || {})
                    .filter(([_, v]) => (v as number) > 0)
                    .map(([k, v]) => ({
                      name: k.charAt(0).toUpperCase() + k.slice(1).replace(/_/g, ' '),
                      value: v as number,
                      fill: paxColors[k.toLowerCase()] || "var(--chart-1)",
                      isInner: true,
                      category: 'pax',
                      sourceBreakdown: Object.entries(data.passenger_vs_cargo.by_source || {}).map(([source, sData]) => ({
                        source,
                        revenue: sData.pax?.[k]?.revenue || sData.pax?.[k.toUpperCase()]?.revenue || 0
                      })).filter(s => s.revenue > 0)
                    })),
                  ...Object.entries(data.passenger_vs_cargo.cargo_breakdown || {})
                    .filter(([_, v]) => (v as number) > 0)
                    .map(([k, v]) => ({
                      name: k === 'rolling' ? 'Rolling (Vehicles)' : k === 'loose' ? 'Loose Goods' : k.charAt(0).toUpperCase() + k.slice(1).replace(/_/g, ' '),
                      value: v as number,
                      fill: cargoColors[k.toLowerCase()] || "var(--chart-4)",
                      isInner: true,
                      category: 'cargo',
                      sourceBreakdown: Object.entries(data.passenger_vs_cargo.cargo_class_breakdown?.[k.toLowerCase() as 'rolling' | 'loose'] || {})
                        .map(([className, revenue]) => ({
                          source: k === 'rolling'
                            ? `Vehicle: ${className.replace(/\b\w/g, c => c.toUpperCase())}`
                            : `Goods: ${className.replace(/\b\w/g, c => c.toUpperCase())}`,
                          revenue: revenue as number
                        }))
                        .filter(s => s.revenue > 0)
                        .sort((a, b) => b.revenue - a.revenue)
                    }))
                ];

                const pieConfig = {
                  value: { label: "Revenue" },
                  Passengers: { label: "Passengers", color: "var(--chart-1)" },
                  Cargo: { label: "Cargo", color: "var(--chart-2)" },
                } satisfies ChartConfig;

                return (
                  <div className="h-full flex flex-col rounded-md border border-border bg-card overflow-visible">
                    <ShadnOverviewStackedPieChart
                      title="Revenue Source Breakdown"
                      description="Split between passengers and cargo types"
                      innerData={innerData}
                      outerData={outerData}
                      config={pieConfig}
                      innerDataKey="value"
                      outerDataKey="value"
                      nameKey="name"
                    />
                  </div>
                );
              })()}
            </>
          )}
        </section>

      {/* Operational Insights */}
      {!isLoading && insights.length > 0 && (
        <section>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 2xl:grid-cols-4">
            {insights.map((insight, i) => {
              const styles = {
                success: {
                  bg: "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900/50",
                  icon: CheckCircle,
                  iconColor: "text-green-600 dark:text-green-400",
                  badge: "bg-green-100 dark:bg-green-950/60 text-green-700 dark:text-green-400",
                },
                warning: {
                  bg: "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50",
                  icon: AlertTriangle,
                  iconColor: "text-amber-600 dark:text-amber-400",
                  badge: "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400",
                },
                info: {
                  bg: "bg-[var(--info-bg)] border-[var(--info-border)]",
                  icon: Info,
                  iconColor: "text-[var(--info-text)]",
                  badge: "bg-[var(--info-bg)] text-[var(--info-text)]",
                },
              }[insight.type];
              const InsightIcon = styles.icon;
              return (
                <div key={i} className={`flex items-start gap-2 rounded-md border p-3 ${styles.bg}`}>
                  <InsightIcon className={`h-4 w-4 mt-0.5 shrink-0 ${styles.iconColor}`} />
                  <div className="min-w-0">
                    <span className={`inline-block px-2 py-0.5 text-[11px] font-medium rounded mb-1 ${styles.badge}`}>
                      {insight.label}
                    </span>
                    <p className="text-sm text-foreground leading-snug">{insight.message}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Live Activity + Today's Schedule */}
      <section className="grid grid-cols-1 gap-2 md:grid-cols-2 2xl:gap-3">
        {/* Live Activity Feed */}
        <div className="rounded-md border border-border bg-card overflow-hidden flex flex-col">
          <div className="px-3 pt-3 pb-1.5 flex items-center justify-between">
            <div>
              <h2 className="text-xs font-semibold">Live Activity Feed</h2>
              <p className="text-[11px] text-muted-foreground">Recent bookings across all routes</p>
            </div>
          </div>
          {widgetsLoading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded" />)}
            </div>
          ) : (
            <RecentActivityFeed items={recentActivity} />
          )}
        </div>

        {/* Today's Schedule Timeline */}
        <div className="rounded-md border border-border bg-card overflow-hidden flex flex-col">
          <div className="px-3 pt-3 pb-1.5">
            <h2 className="text-xs font-semibold">Today's Schedule</h2>
            <p className="text-[11px] text-muted-foreground">All trips departing today</p>
          </div>
          {widgetsLoading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded" />)}
            </div>
          ) : (
            <TodayScheduleTimeline trips={todaySchedule} />
          )}
        </div>
      </section>

      {/* Capacity Heatmap */}
      <section>
        <div className="rounded-md border border-border bg-card overflow-hidden">
          <div className="px-3 pt-3 pb-1.5">
            <h2 className="text-xs font-semibold">Capacity Utilization Heatmap</h2>
            <p className="text-[11px] text-muted-foreground">Passenger load by route and date (current month)</p>
          </div>
          {widgetsLoading ? (
            <div className="p-4">
              <Skeleton className="h-40 w-full rounded" />
            </div>
          ) : (
            <CapacityHeatmap cells={capacityHeatmap} />
          )}
        </div>
      </section>

      {/* Top Travel Agents */}
      <section>
        <div className="rounded-md border border-border bg-card overflow-hidden">
          <div className="px-3 pt-3 pb-1.5">
            <h2 className="text-xs font-semibold">Top Travel Agents</h2>
            <p className="text-[11px] text-muted-foreground">Agents ranked by revenue (current month)</p>
          </div>
          {widgetsLoading ? (
            <div className="p-4 space-y-2">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded" />)}
            </div>
          ) : (
            <TopAgentsTable agents={topAgents} />
          )}
        </div>
      </section>
    </div>
  );
}
