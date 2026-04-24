"use client";
// ─── Executive Overview Dashboard (Finance-Accurate Redesign) ────────────────
// Source of truth: booking.booking_payment_items (ledger-based)
// Endpoint: GET /bi/overview/finance/:period
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from "react";
import {
  Wallet,
  Calendar,
  TrendingUp,
  TrendingDown,
  RotateCcw,
  ShieldAlert,
  Route,
  Users,
  Ship,
  XCircle,
  Minus,
  RefreshCw,
} from "lucide-react";

// Types
import { FinanceOverviewData, OverviewData } from "@/types/overview";
import {
  RecentActivityItem,
  ScheduleTripItem,
  CapacityHeatmapCell,
  TopAgentItem,
} from "@/types/dashboard-widgets";

// Services
import { overviewService } from "@/services/overview.service";
import { dashboardWidgetsService } from "@/services/dashboard-widgets.service";

// Components
import { KpiCard } from "@/components/charts/kpi-card";
import { Skeleton } from "@/components/ui/skeleton";
import { RecentActivityFeed } from "@/components/charts/recent-activity-feed";
import { TodayScheduleTimeline } from "@/components/charts/today-schedule-timeline";
import { CapacityHeatmap } from "@/components/charts/capacity-heatmap";
import { TopAgentsTable } from "@/components/charts/top-agents-table";
import { ShadcnOverviewBarChartHorizontal } from "@/components/charts/shadcn-overview-bar-chart-horizontal";
import { RevenueTrendChart } from "@/components/charts/revenue-trend-chart";
import { RouteProfitabilityTable } from "@/components/charts/route-profitability-table";
import { ChannelRevenuePanel } from "@/components/charts/channel-revenue-panel";
import { ReconciliationAlerts } from "@/components/charts/reconciliation-alerts";
import { ForecastPacingCard } from "@/components/charts/forecast-pacing-card";
import { ChartConfig } from "@/components/ui/chart";
import { useTenant } from "@/components/providers/tenant-provider";
import { cn } from "@/lib/utils";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmtCurrency = (n?: number | null) => `₱${(n ?? 0).toLocaleString()}`;

function computeTrend(
  current: number,
  reference: number,
  label: string,
): { direction: "up" | "down" | "neutral"; value: string; label: string } | undefined {
  if (!reference) return undefined;
  const pct = ((current - reference) / reference) * 100;
  return {
    direction: pct > 1 ? "up" : pct < -1 ? "down" : "neutral",
    value: `${Math.abs(pct).toFixed(1)}%`,
    label,
  };
}

// ─── Comparison Strip ─────────────────────────────────────────────────────────

function ComparisonStrip({
  label,
  metric,
  currentNet,
}: {
  label: string;
  metric: FinanceOverviewData["comparisons"]["yesterday"];
  currentNet: number;
}) {
  const delta = metric.delta_pct;
  const isUp = delta > 1;
  const isDown = delta < -1;
  const fmtShort = (n: number) => {
    if (n >= 1_000_000) return `₱${(n / 1_000_000).toFixed(2)}M`;
    if (n >= 1_000) return `₱${(n / 1_000).toFixed(0)}K`;
    return `₱${n.toLocaleString()}`;
  };
  return (
    <div className="rounded-md border border-border bg-card p-3 space-y-1.5">
      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
      <div className="flex items-end justify-between gap-2">
        <div>
          <p className="text-sm font-bold tabular-nums">{fmtShort(metric.net_revenue)}</p>
          <p className="text-[10px] text-muted-foreground">net revenue</p>
        </div>
        <p className="text-xs tabular-nums text-muted-foreground">{metric.booking_count.toLocaleString()} bookings</p>
      </div>
      <div className="h-1 rounded-full bg-muted overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            isUp ? "bg-green-500" : isDown ? "bg-rose-500" : "bg-muted-foreground/50",
          )}
          style={{
            width: `${
              Math.max(currentNet, metric.net_revenue) > 0
                ? (Math.min(currentNet, metric.net_revenue) / Math.max(currentNet, metric.net_revenue)) * 100
                : 0
            }%`,
          }}
        />
      </div>
      <div className="flex items-center gap-1.5">
        {isUp ? (
          <>
            <TrendingUp className="h-3 w-3 text-green-500" />
            <span className="text-[11px] font-medium text-green-600 dark:text-green-400">
              +{delta.toFixed(1)}% vs {label.toLowerCase()}
            </span>
          </>
        ) : isDown ? (
          <>
            <TrendingDown className="h-3 w-3 text-rose-500" />
            <span className="text-[11px] font-medium text-rose-600 dark:text-rose-400">
              {delta.toFixed(1)}% vs {label.toLowerCase()}
            </span>
          </>
        ) : (
          <>
            <Minus className="h-3 w-3 text-muted-foreground" />
            <span className="text-[11px] text-muted-foreground">On track</span>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="px-3 pt-3 pb-2">
      <h2 className="text-xs font-semibold">{title}</h2>
      {subtitle && <p className="text-[11px] text-muted-foreground">{subtitle}</p>}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { activeTenant } = useTenant();

  const [period, setPeriod] = useState<"today" | "mtd" | "ytd">("today");

  // Finance-accurate data (ledger-based)
  const [financeData, setFinanceData] = useState<FinanceOverviewData | null>(null);
  const [legacyData, setLegacyData]   = useState<OverviewData | null>(null);
  const [isLoading, setIsLoading]     = useState(true);
  const [error, setError]             = useState<string | null>(null);

  // Operational widgets
  const [recentActivity, setRecentActivity]   = useState<RecentActivityItem[]>([]);
  const [todaySchedule, setTodaySchedule]     = useState<ScheduleTripItem[]>([]);
  const [capacityHeatmap, setCapacityHeatmap] = useState<CapacityHeatmapCell[]>([]);
  const [topAgents, setTopAgents]             = useState<TopAgentItem[]>([]);
  const [widgetsLoading, setWidgetsLoading]   = useState(true);

  // Route table pagination
  const [routePage, setRoutePage] = useState(0);
  const ROUTES_PER_PAGE = 6;

  // Trend chart pagination
  const [trendPage, setTrendPage] = useState(0);
  const TREND_PER_PAGE = 12;

  // Channel panel pagination
  const [channelPage, setChannelPage] = useState(0);
  const CHANNELS_PER_PAGE = 4;

  // ── Fetch overview ──────────────────────────────────────────────────────────
  const fetchOverview = useCallback(async () => {
    if (!activeTenant?.api_base_url) return;
    setIsLoading(true);
    setError(null);
    setRoutePage(0);
    setTrendPage(0);
    setChannelPage(0);
    try {
      const [finance, legacy] = await Promise.allSettled([
        overviewService.getFinanceOverview(
          activeTenant.api_base_url, period, activeTenant.service_key,
        ),
        overviewService.getOverview(
          activeTenant.api_base_url, period, activeTenant.service_key,
        ),
      ]);
      if (finance.status === "fulfilled") setFinanceData(finance.value);
      if (legacy.status  === "fulfilled") setLegacyData(legacy.value);
      if (finance.status === "rejected")  console.error("Finance overview error:", finance.reason);
    } catch (err) {
      setError("Failed to load dashboard data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [activeTenant, period]);

  useEffect(() => { fetchOverview(); }, [fetchOverview]);

  // ── Fetch widgets ───────────────────────────────────────────────────────────
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
        if (heatmap.status  === "fulfilled") setCapacityHeatmap(heatmap.value);
        if (agents.status   === "fulfilled") setTopAgents(agents.value);
      } finally {
        setWidgetsLoading(false);
      }
    }
    fetchWidgets();
  }, [activeTenant]);

  // ── Derived values ──────────────────────────────────────────────────────────
  const fd  = financeData;
  const kpi = fd?.kpi;

  const today_net = fd?.kpi_today.net_revenue ?? 0;
  const mtd_net   = fd?.kpi_mtd.net_revenue   ?? 0;
  const ytd_net   = fd?.kpi_ytd.net_revenue   ?? 0;

  const daysElapsed   = new Date().getDate();
  const monthsElapsed = new Date().getMonth() + 1;
  const dailyMtdAvg   = daysElapsed   > 0 ? mtd_net / daysElapsed   : 0;
  const monthlyYtdAvg = monthsElapsed > 0 ? ytd_net / monthsElapsed : 0;

  const sortedRoutes    = [...(fd?.revenue_by_route ?? [])].sort((a, b) => b.net_revenue - a.net_revenue);
  const totalRoutePages = Math.ceil(sortedRoutes.length / ROUTES_PER_PAGE);
  const validRoutePage  = Math.min(routePage, Math.max(0, totalRoutePages - 1));
  const paginatedRoutes = sortedRoutes.slice(
    validRoutePage * ROUTES_PER_PAGE,
    (validRoutePage + 1) * ROUTES_PER_PAGE,
  );

  const recon = fd?.reconciliation;
  const reconIssues =
    (recon?.payment_mismatch_count ?? 0) +
    (recon?.webhook_failures        ?? 0) +
    (recon?.unmatched_items_count   ?? 0);

  // Trend pagination
  const allTrend        = fd?.revenue_trend ?? [];
  const totalTrendPages = Math.ceil(allTrend.length / TREND_PER_PAGE);
  const validTrendPage  = Math.min(trendPage, Math.max(0, totalTrendPages - 1));
  const paginatedTrend  = allTrend.slice(
    validTrendPage * TREND_PER_PAGE,
    (validTrendPage + 1) * TREND_PER_PAGE,
  );

  // Channel pagination
  const allChannels        = fd?.revenue_by_channel ?? [];
  const totalChannelPages  = Math.ceil(allChannels.length / CHANNELS_PER_PAGE);
  const validChannelPage   = Math.min(channelPage, Math.max(0, totalChannelPages - 1));
  const paginatedChannels  = allChannels.slice(
    validChannelPage * CHANNELS_PER_PAGE,
    (validChannelPage + 1) * CHANNELS_PER_PAGE,
  );

  // ── Error state ─────────────────────────────────────────────────────────────
  if (error && !financeData) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <XCircle className="h-10 w-10 text-rose-500" />
          <p className="font-semibold">Failed to load dashboard data</p>
          <p className="text-sm text-muted-foreground">{error}</p>
          <button
            onClick={fetchOverview}
            className="flex items-center gap-1.5 text-sm text-primary hover:underline"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Retry
          </button>
        </div>
      </div>
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-2 p-2 sm:p-3 lg:p-4 2xl:p-5 2xl:gap-3">

      {/* ── SECTION 1: Finance KPI Row ──────────────────────────────────────── */}
      <section className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5 2xl:gap-3">

        {(["today", "mtd", "ytd"] as const).map((p) => {
          const netVal   = p === "today" ? today_net : p === "mtd" ? mtd_net   : ytd_net;
          const grossVal = p === "today" ? fd?.kpi_today.gross_revenue  ?? 0
                         : p === "mtd"   ? fd?.kpi_mtd.gross_revenue    ?? 0
                         :                 fd?.kpi_ytd.gross_revenue    ?? 0;
          const refundVal = p === "today" ? fd?.kpi_today.refund_amount ?? 0
                          : p === "mtd"   ? fd?.kpi_mtd.refund_amount   ?? 0
                          :                 fd?.kpi_ytd.refund_amount   ?? 0;
          const margin = grossVal > 0 ? (netVal / grossVal) * 100 : 0;

          const titles: Record<string, string> = {
            today: "Net Revenue Today", mtd: "MTD Net Revenue", ytd: "YTD Net Revenue",
          };
          const trends: Record<string, ReturnType<typeof computeTrend>> = {
            today: computeTrend(today_net, dailyMtdAvg,   "vs daily avg"),
            mtd:   computeTrend(mtd_net,   monthlyYtdAvg, "vs monthly avg"),
            ytd:   undefined,
          };
          const colors: Record<string, string> = {
            today: "text-primary", mtd: "text-teal-600", ytd: "text-blue-600",
          };
          const bgs: Record<string, string> = {
            today: "bg-red-50 dark:bg-red-950/20",
            mtd:   "bg-teal-50 dark:bg-teal-900/20",
            ytd:   "bg-blue-50 dark:bg-blue-900/20",
          };
          const icons: Record<string, typeof Wallet> = {
            today: Wallet, mtd: Calendar, ytd: TrendingUp,
          };
          const periodKpiCount = (p === "today" ? fd?.kpi_today : p === "mtd" ? fd?.kpi_mtd : fd?.kpi_ytd);

          return (
            <KpiCard
              key={p}
              title={titles[p]}
              value={isLoading && period === p ? "…" : fmtCurrency(netVal)}
              icon={icons[p]}
              iconColorClass={colors[p]}
              iconBgColor={bgs[p]}
              trend={trends[p]}
              variant="reference"
              isActive={period === p}
              showDetails={period === p}
              onClick={() => setPeriod(p)}
              breakdown={
                period === p
                  ? [
                      { label: "Gross Revenue", value: fmtCurrency(grossVal), icon: Wallet },
                      {
                        label: "Refunds",
                        value: refundVal > 0 ? `-${fmtCurrency(refundVal)}` : "None",
                        icon: RotateCcw,
                        valueColor: refundVal > 0 ? "text-rose-500" : undefined,
                      },
                      {
                        label: "Profit Margin",
                        value: `${margin.toFixed(1)}%`,
                        icon: TrendingUp,
                        valueColor:
                          margin < 0 ? "text-rose-500" : margin < 10 ? "text-amber-500" : "text-green-600",
                      },
                      {
                        label: "Bookings",
                        value: periodKpiCount?.booking_count.toLocaleString() ?? "—",
                        icon: Route,
                      },
                      {
                        label: "Passengers",
                        value: periodKpiCount?.total_passengers.toLocaleString() ?? "—",
                        icon: Users,
                      },
                    ]
                  : []
              }
            />
          );
        })}

        {/* Active Vessels */}
        {(() => {
          const activeVessels = (legacyData?.revenue_by_vessel ?? []).filter(
            (v) => v.total_revenue > 0,
          );
          return (
            <KpiCard
              title="Active Vessels"
              value={isLoading ? "…" : activeVessels.length.toString()}
              icon={Ship}
              iconColorClass="text-violet-500"
              iconBgColor="bg-violet-50 dark:bg-violet-950/20"
              variant="reference"
              breakdown={
                activeVessels.length
                  ? [...activeVessels]
                      .sort((a, b) => b.total_revenue - a.total_revenue)
                      .slice(0, 3)
                      .map((v) => ({ label: v.vessel_name, value: fmtCurrency(v.total_revenue), icon: Ship }))
                  : []
              }
            />
          );
        })()}

        {/* Data Health */}
        <KpiCard
          title="Data Health"
          value={isLoading ? "…" : reconIssues === 0 ? "Clean" : `${reconIssues} issues`}
          icon={ShieldAlert}
          iconColorClass={
            reconIssues === 0 ? "text-green-600" : reconIssues < 5 ? "text-amber-500" : "text-rose-500"
          }
          iconBgColor={
            reconIssues === 0
              ? "bg-green-50 dark:bg-green-950/20"
              : reconIssues < 5
              ? "bg-amber-50 dark:bg-amber-950/20"
              : "bg-rose-50 dark:bg-rose-950/20"
          }
          variant="reference"
          breakdown={
            recon
              ? [
                  {
                    label: "Payment mismatches",
                    value: recon.payment_mismatch_count.toString(),
                    icon: ShieldAlert,
                    valueColor: recon.payment_mismatch_count > 0 ? "text-rose-500" : undefined,
                  },
                  {
                    label: "Refund gap",
                    value: fmtCurrency(recon.refund_mismatch_amount),
                    icon: RotateCcw,
                    valueColor: recon.refund_mismatch_amount > 0 ? "text-amber-500" : undefined,
                  },
                  {
                    label: "Webhook failures",
                    value: recon.webhook_failures.toString(),
                    icon: ShieldAlert,
                    valueColor: recon.webhook_failures > 0 ? "text-rose-500" : undefined,
                  },
                ]
              : []
          }
        />
      </section>

      {/* ── SECTION 2: Period Comparisons + Forecast ───────────────────────── */}
      {!isLoading && fd && (
        <section className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
          <ComparisonStrip label="Yesterday"  metric={fd.comparisons.yesterday}  currentNet={kpi?.net_revenue ?? 0} />
          <ComparisonStrip label="Last Week"  metric={fd.comparisons.last_week}  currentNet={kpi?.net_revenue ?? 0} />
          <ComparisonStrip label="Last Month" metric={fd.comparisons.last_month} currentNet={kpi?.net_revenue ?? 0} />
          <ForecastPacingCard forecast={fd.forecast} kpiNetToday={today_net} kpiNetMtd={mtd_net} />
        </section>
      )}

      {/* ── SECTION 3: Revenue Trend + Channel Performance ─────────────────── */}
      <section className="grid grid-cols-1 gap-2 md:grid-cols-2">
        <div className="rounded-md border border-border bg-card overflow-hidden">
          <div className="flex items-center justify-between px-3 pt-3 pb-1.5">
            <div>
              <h2 className="text-xs font-semibold">Revenue Trend (Gross vs Net)</h2>
              <p className="text-[11px] text-muted-foreground">Ledger-sourced — includes refund impact</p>
            </div>
            {totalTrendPages > 1 && (
              <div className="flex items-center gap-1 shrink-0">
                <button
                  disabled={validTrendPage === 0}
                  onClick={() => setTrendPage((p) => Math.max(0, p - 1))}
                  className="px-2 py-1 text-xs rounded border border-border disabled:opacity-40 hover:bg-muted transition-colors"
                >‹</button>
                <span className="text-[11px] text-muted-foreground px-1">
                  {validTrendPage + 1}/{totalTrendPages}
                </span>
                <button
                  disabled={validTrendPage >= totalTrendPages - 1}
                  onClick={() => setTrendPage((p) => Math.min(totalTrendPages - 1, p + 1))}
                  className="px-2 py-1 text-xs rounded border border-border disabled:opacity-40 hover:bg-muted transition-colors"
                >›</button>
              </div>
            )}
          </div>
          {isLoading ? (
            <div className="p-4"><Skeleton className="h-60 w-full rounded" /></div>
          ) : (
            <RevenueTrendChart data={paginatedTrend} period={period} />
          )}
        </div>

        <div className="rounded-md border border-border bg-card overflow-hidden">
          <div className="flex items-center justify-between px-3 pt-3 pb-1.5">
            <div>
              <h2 className="text-xs font-semibold">Revenue by Channel</h2>
              <p className="text-[11px] text-muted-foreground">Normalised sources — revenue, bookings &amp; avg ticket size</p>
            </div>
            {totalChannelPages > 1 && (
              <div className="flex items-center gap-1 shrink-0">
                <button
                  disabled={validChannelPage === 0}
                  onClick={() => setChannelPage((p) => Math.max(0, p - 1))}
                  className="px-2 py-1 text-xs rounded border border-border disabled:opacity-40 hover:bg-muted transition-colors"
                >‹</button>
                <span className="text-[11px] text-muted-foreground px-1">
                  {validChannelPage + 1}/{totalChannelPages}
                </span>
                <button
                  disabled={validChannelPage >= totalChannelPages - 1}
                  onClick={() => setChannelPage((p) => Math.min(totalChannelPages - 1, p + 1))}
                  className="px-2 py-1 text-xs rounded border border-border disabled:opacity-40 hover:bg-muted transition-colors"
                >›</button>
              </div>
            )}
          </div>
          {isLoading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full rounded" />)}
            </div>
          ) : (
            <ChannelRevenuePanel channels={paginatedChannels} allChannels={allChannels} />
          )}
        </div>
      </section>

      {/* ── SECTION 4: Route Profitability ─────────────────────────────────── */}
      <section>
        <div className="rounded-md border border-border bg-card overflow-hidden">
          <div className="flex items-center justify-between px-3 pt-3 pb-1.5">
            <div>
              <h2 className="text-xs font-semibold">Route Profitability</h2>
              <p className="text-[11px] text-muted-foreground">
                Gross → Net margin · 🟢 &gt;25% · 🟡 10–25% · 🔴 loss
              </p>
            </div>
            {totalRoutePages > 1 && (
              <div className="flex items-center gap-1">
                <button
                  disabled={validRoutePage === 0}
                  onClick={() => setRoutePage((p) => Math.max(0, p - 1))}
                  className="px-2 py-1 text-xs rounded border border-border disabled:opacity-40 hover:bg-muted transition-colors"
                >‹</button>
                <span className="text-[11px] text-muted-foreground px-1">
                  {validRoutePage + 1}/{totalRoutePages}
                </span>
                <button
                  disabled={validRoutePage >= totalRoutePages - 1}
                  onClick={() => setRoutePage((p) => Math.min(totalRoutePages - 1, p + 1))}
                  className="px-2 py-1 text-xs rounded border border-border disabled:opacity-40 hover:bg-muted transition-colors"
                >›</button>
              </div>
            )}
          </div>
          {isLoading ? (
            <div className="p-4 space-y-2">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full rounded" />)}
            </div>
          ) : (
            <RouteProfitabilityTable routes={paginatedRoutes} maxRows={ROUTES_PER_PAGE} />
          )}
        </div>
      </section>

      {/* ── SECTION 5: Reconciliation & Data Health ────────────────────────── */}
      <section>
        <div className="rounded-md border border-border bg-card overflow-hidden">
          <SectionHeader
            title="Reconciliation & Data Health"
            subtitle="Financial integrity checks — mismatches trigger accounting risk"
          />
          {isLoading ? (
            <div className="p-4 grid grid-cols-4 gap-2">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded" />)}
            </div>
          ) : recon ? (
            <ReconciliationAlerts data={recon} />
          ) : null}
        </div>
      </section>

      {/* ── SECTION 6: Vessel Revenue Bar Chart ────────────────────────────── */}
      {!isLoading && legacyData?.revenue_by_vessel && (
        <section>
          <div className="rounded-md border border-border bg-card overflow-hidden">
            <SectionHeader title="Revenue per Vessel" subtitle="Gross revenue from BI view" />
            {(() => {
              const sorted = [...legacyData.revenue_by_vessel]
                .filter((d) => d.total_revenue > 0)
                .sort((a, b) => b.total_revenue - a.total_revenue)
                .slice(0, 8);

              if (sorted.length === 0) {
                return (
                  <div className="flex items-center justify-center h-16 text-sm text-muted-foreground px-4 pb-4">
                    No vessel revenue recorded for this period
                  </div>
                );
              }

              const max = sorted[0].total_revenue;
              const colors = ["bg-chart-1", "bg-chart-2", "bg-chart-3", "bg-chart-4", "bg-chart-5"];
              return (
                <div className="px-5 pb-5 space-y-3">
                  {sorted.map((d, i) => {
                    const pct = max > 0 ? (d.total_revenue / max) * 100 : 0;
                    return (
                      <div key={d.vessel_name} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-foreground truncate max-w-[60%]">{d.vessel_name}</span>
                          <span className="text-muted-foreground font-mono">{fmtCurrency(d.total_revenue)}</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                          <div
                            className={`h-full rounded-full ${colors[i % colors.length]}`}
                            style={{ width: `${pct}%`, backgroundColor: `var(--chart-${(i % 5) + 1})` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        </section>
      )}

      {/* ── SECTION 7: Live Activity + Today's Schedule ────────────────────── */}
      <section className="grid grid-cols-1 gap-2 md:grid-cols-2 2xl:gap-3">
        <div className="rounded-md border border-border bg-card overflow-hidden flex flex-col">
          <SectionHeader title="Live Activity Feed" subtitle="Recent bookings across all routes" />
          {widgetsLoading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded" />)}
            </div>
          ) : (
            <RecentActivityFeed items={recentActivity} />
          )}
        </div>

        <div className="rounded-md border border-border bg-card overflow-hidden flex flex-col">
          <SectionHeader title="Today's Schedule" subtitle="All trips departing today" />
          {widgetsLoading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded" />)}
            </div>
          ) : (
            <TodayScheduleTimeline trips={todaySchedule} />
          )}
        </div>
      </section>

      {/* ── SECTION 8: Capacity Heatmap ────────────────────────────────────── */}
      <section>
        <div className="rounded-md border border-border bg-card overflow-hidden">
          <SectionHeader
            title="Capacity Utilization Heatmap"
            subtitle="Passenger load by route and date (current month)"
          />
          {widgetsLoading ? (
            <div className="p-4"><Skeleton className="h-40 w-full rounded" /></div>
          ) : (
            <CapacityHeatmap cells={capacityHeatmap} />
          )}
        </div>
      </section>

      {/* ── SECTION 9: Top Travel Agents ───────────────────────────────────── */}
      <section>
        <div className="rounded-md border border-border bg-card overflow-hidden">
          <SectionHeader title="Top Travel Agents" subtitle="Agents ranked by revenue (current month)" />
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
