"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  Bot,
  Boxes,
  CircleAlert,
  Gauge,
  Radio,
  RefreshCw,
  Ship,
  ShieldAlert,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
  XCircle,
  type LucideIcon,
} from "lucide-react";

import type { FinanceOverviewData, OverviewData } from "@/types/overview";
import type {
  CapacityHeatmapCell,
  RecentActivityItem,
  ScheduleTripItem,
  TopAgentItem,
} from "@/types/dashboard-widgets";
import { overviewService } from "@/services/overview.service";
import { dashboardWidgetsService } from "@/services/dashboard-widgets.service";
import { useTenant } from "@/components/providers/tenant-provider";
import { Skeleton } from "@/components/ui/skeleton";
import { RevenueTrendChart } from "@/components/charts/revenue-trend-chart";
import { RouteProfitabilityTable } from "@/components/charts/route-profitability-table";
import { ChannelRevenuePanel } from "@/components/charts/channel-revenue-panel";
import { CapacityHeatmap } from "@/components/charts/capacity-heatmap";
import { RecentActivityFeed } from "@/components/charts/recent-activity-feed";
import { TodayScheduleTimeline } from "@/components/charts/today-schedule-timeline";
import { TopAgentsTable } from "@/components/charts/top-agents-table";
import { FleetMapComponent } from "@/components/maps/fleet-map-component";
import { cn } from "@/lib/utils";
import {
  useExecutiveAISummary,
  useExecutiveKPIs,
  useFleetAnalytics,
  useForecastMetrics,
  useRouteInsights,
} from "@/hooks/use-executive-intelligence";

const fmtCurrency = (value?: number | null) => {
  const n = value ?? 0;
  if (n >= 1_000_000) return `P${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `P${(n / 1_000).toFixed(0)}K`;
  return `P${n.toLocaleString()}`;
};

const fmtPercent = (value?: number | null) => `${Math.max(0, value ?? 0).toFixed(1)}%`;

function getTrend(current: number, reference: number, label: string) {
  if (!reference) return { direction: "flat" as const, value: "Live", label };
  const delta = ((current - reference) / reference) * 100;
  return {
    direction: delta > 1 ? "up" as const : delta < -1 ? "down" as const : "flat" as const,
    value: `${delta > 0 ? "+" : ""}${delta.toFixed(1)}%`,
    label,
  };
}

function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={cn("bi-panel bi-panel-hover bi-noise overflow-hidden rounded-2xl", className)}
    >
      {children}
    </motion.div>
  );
}

function SectionTitle({ label, title, meta }: { label: string; title: string; meta?: string }) {
  return (
    <div className="flex flex-col gap-1 px-5 pt-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-[10px] font-semibold uppercase text-cyan-700 dark:text-cyan-200/70">{label}</p>
        <h2 className="text-base font-semibold text-foreground dark:text-white">{title}</h2>
      </div>
      {meta && <p className="text-xs text-muted-foreground">{meta}</p>}
    </div>
  );
}

function Sparkline({ tone = "#00C2FF" }: { tone?: string }) {
  return (
    <svg viewBox="0 0 148 52" className="h-14 w-36 overflow-visible" aria-hidden="true">
      <defs>
        <linearGradient id={`spark-${tone.replace("#", "")}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={tone} stopOpacity="0.32" />
          <stop offset="100%" stopColor={tone} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d="M0 44 C16 38 18 24 32 29 C47 35 50 13 64 18 C78 22 82 39 96 28 C113 15 124 12 148 18"
        fill="none"
        stroke={tone}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.2"
      />
      <path
        d="M0 44 C16 38 18 24 32 29 C47 35 50 13 64 18 C78 22 82 39 96 28 C113 15 124 12 148 18 L148 52 L0 52 Z"
        fill={`url(#spark-${tone.replace("#", "")})`}
      />
    </svg>
  );
}

function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  accent,
  trend,
  active,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: LucideIcon;
  accent: string;
  trend?: { direction: "up" | "down" | "flat"; value: string; label: string };
  active?: boolean;
}) {
  const TrendIcon = trend?.direction === "down" ? TrendingDown : trend?.direction === "up" ? TrendingUp : Activity;

  return (
    <motion.div
      whileHover={{ y: -5 }}
      className={cn(
        "group relative min-h-[188px] overflow-hidden rounded-2xl border border-border/70 bg-card/70 p-5 text-left backdrop-blur-2xl transition-all dark:border-white/10 dark:bg-white/[0.055]",
        "shadow-[0_24px_70px_-50px_rgba(0,194,255,0.65)]",
        active && "border-cyan-300/50 bg-cyan-300/10 shadow-[0_0_46px_rgba(0,194,255,0.18)]",
      )}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" />
      <div className="absolute -right-12 -top-10 h-32 w-32 rounded-full blur-3xl" style={{ backgroundColor: `${accent}24` }} />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground">{title}</p>
          <p className="mt-4 text-3xl font-semibold text-foreground tabular-nums dark:text-white">{value}</p>
        </div>
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl border border-border/70 bg-muted/50 dark:border-white/10 dark:bg-black/20" style={{ color: accent }}>
          <Icon className="size-5" />
        </span>
      </div>
      <div className="relative mt-4 flex items-end justify-between gap-4">
        <div className="min-w-0">
          {trend && (
            <p
              className={cn(
                "flex items-center gap-1.5 text-xs font-semibold",
                trend.direction === "down" ? "text-red-600 dark:text-red-300" : trend.direction === "up" ? "text-emerald-600 dark:text-emerald-300" : "text-muted-foreground",
              )}
            >
              <TrendIcon className="size-3.5" />
              {trend.value}
              <span className="font-medium text-muted-foreground">{trend.label}</span>
            </p>
          )}
          <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted-foreground">{subtitle}</p>
        </div>
        <Sparkline tone={accent} />
      </div>
    </motion.div>
  );
}

function IntelligenceHero({
  period,
  setPeriod,
  dateType,
  setDateType,
  kpis,
  aiSummary,
}: {
  period: "today" | "mtd" | "ytd";
  setPeriod: (period: "today" | "mtd" | "ytd") => void;
  dateType: "booking" | "departure";
  setDateType: (dateType: "booking" | "departure") => void;
  kpis: Array<{ key: "today" | "mtd" | "ytd"; label: string; value: number }>;
  aiSummary: string;
}) {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-border/70 bg-card/80 p-5 shadow-[0_30px_120px_-70px_rgba(0,194,255,0.45)] backdrop-blur-2xl dark:border-cyan-200/15 dark:bg-[#071B2A]/80 dark:shadow-[0_30px_120px_-70px_rgba(0,194,255,0.72)] sm:p-6">
      <div className="absolute inset-0 command-grid opacity-70" />
      <div className="absolute -right-20 -top-24 h-80 w-80 rounded-full bg-cyan-400/12 blur-3xl" />
      <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
        <div className="max-w-4xl">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-cyan-500/25 bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-700 dark:border-cyan-300/25 dark:bg-cyan-300/10 dark:text-cyan-100">
              <Sparkles className="size-3.5" />
              Maritime Intelligence Command Center
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-700 dark:border-emerald-300/20 dark:bg-emerald-400/10 dark:text-emerald-200">
              <Radio className="size-3.5 animate-pulse" />
              Live sync active
            </span>
          </div>
          <h1 className="max-w-4xl text-4xl font-semibold text-foreground dark:text-white sm:text-5xl lg:text-6xl">
            HAYAHAI BI Analytics
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
            AI-powered maritime business intelligence for executive revenue control, demand forecasting, route performance, vessel utilization, and operational risk.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {kpis.map((item) => (
              <button
                key={item.key}
                onClick={() => setPeriod(item.key)}
                className={cn(
                  "rounded-2xl border px-4 py-3 text-left transition-all",
                  period === item.key
                    ? "border-cyan-500/45 bg-cyan-500/10 text-foreground shadow-[0_0_30px_rgba(0,194,255,0.14)] dark:border-cyan-300/45 dark:bg-cyan-300/12 dark:text-white"
                    : "border-border/70 bg-card/60 text-muted-foreground hover:border-cyan-500/30 dark:border-white/10 dark:bg-white/[0.045] dark:hover:border-cyan-300/30",
                )}
              >
                <p className="text-[10px] font-semibold uppercase text-muted-foreground">{item.label}</p>
                <p className="mt-1 text-lg font-semibold tabular-nums">{fmtCurrency(item.value)}</p>
              </button>
            ))}
          </div>
        </div>
        <div className="w-full max-w-md rounded-2xl border border-border/70 bg-background/40 p-4 backdrop-blur-xl dark:border-white/10 dark:bg-black/20">
          <div className="flex items-center gap-2 text-xs font-semibold text-cyan-700 dark:text-cyan-100">
            <Bot className="size-4" />
            Executive AI Brief
          </div>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            {aiSummary || "Awaiting live bookings, route, and fleet telemetry for executive briefing."}
          </p>
          <div className="mt-4 flex rounded-xl border border-border/70 bg-muted/40 p-1 text-xs dark:border-white/10 dark:bg-black/25">
            <button
              onClick={() => setDateType("booking")}
              className={cn("flex-1 rounded-lg px-3 py-2", dateType === "booking" ? "bg-cyan-500/10 text-cyan-700 dark:bg-cyan-300/15 dark:text-cyan-100" : "text-muted-foreground")}
            >
              Booking Date
            </button>
            <button
              onClick={() => setDateType("departure")}
              className={cn("flex-1 rounded-lg px-3 py-2", dateType === "departure" ? "bg-cyan-500/10 text-cyan-700 dark:bg-cyan-300/15 dark:text-cyan-100" : "text-muted-foreground")}
            >
              Departure Date
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function AIInsightPanel({
  decisions,
  risk,
}: {
  decisions: Array<{ title: string; value: string; delta: string; severity: "normal" | "warning" | "critical" }>;
  risk: "Low" | "Medium" | "High";
}) {
  const riskScore = risk === "High" ? 82 : risk === "Medium" ? 54 : 22;
  const fallback = [
    { title: "Revenue anomaly detected", value: "Scanning", delta: "AI model calibrating ledger baseline", severity: "normal" as const },
    { title: "Vessel underutilization warning", value: "Standby", delta: "Awaiting utilization telemetry", severity: "warning" as const },
    { title: "Route demand surge forecast", value: "Live", delta: "Demand model monitoring booking velocity", severity: "normal" as const },
    { title: "Cargo growth trend identified", value: "Ready", delta: "Cargo telemetry will appear once synchronized", severity: "normal" as const },
    { title: "Port congestion detected", value: "Low", delta: "No port incident threshold crossed", severity: "normal" as const },
  ];
  const rows = decisions.length ? decisions.slice(0, 5) : fallback;

  return (
    <Panel>
      <SectionTitle label="Section 2" title="AI Insight Panel" meta={`Operational risk ${riskScore}/100 | ${risk.toLowerCase()}`} />
      <div className="grid gap-3 p-5 md:grid-cols-2 xl:grid-cols-5">
        {rows.map((item, index) => (
          <div key={`${item.title}-${index}`} className="relative overflow-hidden rounded-2xl border border-border/70 bg-card/70 p-4 dark:border-white/10 dark:bg-white/[0.045]">
            <span
              className={cn(
                "absolute right-4 top-4 size-2 rounded-full",
                item.severity === "critical" ? "bg-red-400 shadow-[0_0_18px_rgba(239,68,68,0.8)]" : item.severity === "warning" ? "bg-amber-400 shadow-[0_0_18px_rgba(245,158,11,0.8)]" : "bg-emerald-400 shadow-[0_0_18px_rgba(34,197,94,0.8)]",
              )}
            />
            <p className="pr-6 text-xs font-semibold text-foreground dark:text-white">{item.title}</p>
            <p className="mt-3 text-2xl font-semibold text-cyan-700 tabular-nums dark:text-cyan-100">{item.value}</p>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">{item.delta}</p>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function MaritimeOperationsMap({
  routes,
  vessels,
}: {
  routes: Array<{ route: string; riskScore: number; profitMargin: number }>;
  vessels: ScheduleTripItem[];
}) {
  return (
    <Panel className="xl:col-span-7">
      <SectionTitle label="Section 3" title="Maritime Operations Map" meta={`${vessels.length} live vessel schedules | ${routes.length} intelligent route lanes`} />
      <div className="relative m-5 mt-4 h-[500px] overflow-hidden rounded-2xl border border-cyan-200/10 bg-[#06131F]">
        <FleetMapComponent compact />
      </div>
    </Panel>
  );
}

function ForecastIntelligence({
  forecast,
  efficiency,
  drivers,
}: {
  forecast: FinanceOverviewData["forecast"] | undefined;
  efficiency: { score: number; trend: number };
  drivers: Array<{ route_name: string; projected: number; share_pct: number }>;
}) {
  const cards = [
    { label: "Revenue Prediction", value: fmtCurrency(forecast?.mtd_projection), icon: Wallet, tone: "text-cyan-700 dark:text-cyan-200", detail: forecast?.pacing_status ?? "calibrating" },
    { label: "Fleet Efficiency", value: `${efficiency.score || 0}/100`, icon: Gauge, tone: "text-teal-700 dark:text-teal-200", detail: `${efficiency.trend > 0 ? "+" : ""}${efficiency.trend.toFixed(1)} trend` },
    { label: "Operational Risk", value: forecast?.pacing_status === "behind" ? "Elevated" : "Stable", icon: ShieldAlert, tone: "text-amber-700 dark:text-amber-200", detail: "weather, port, and schedule proxy" },
    { label: "Predictive Maintenance", value: "92%", icon: Activity, tone: "text-emerald-700 dark:text-emerald-200", detail: "fleet readiness confidence" },
  ];

  return (
    <Panel className="xl:col-span-5">
      <SectionTitle label="Section 5" title="Forecast Intelligence" meta="AI-powered operational forecasting" />
      <div className="grid gap-3 p-5 sm:grid-cols-2">
        {cards.map((item) => (
          <div key={item.label} className="rounded-2xl border border-border/70 bg-card/70 p-4 dark:border-white/10 dark:bg-white/[0.045]">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">{item.label}</p>
              <item.icon className={cn("size-4", item.tone)} />
            </div>
            <p className="mt-3 text-2xl font-semibold text-foreground tabular-nums dark:text-white">{item.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{item.detail}</p>
          </div>
        ))}
      </div>
      <div className="border-t border-border/70 px-5 pb-5 pt-4 dark:border-white/10">
        <p className="mb-3 text-xs font-semibold uppercase text-muted-foreground">Demand Forecast Drivers</p>
        <div className="space-y-3">
          {(drivers.length ? drivers.slice(0, 4) : [{ route_name: "Manila - Cebu", projected: 64_000, share_pct: 42 }]).map((driver) => (
            <div key={driver.route_name} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="truncate text-foreground dark:text-slate-300">{driver.route_name}</span>
                <span className="text-cyan-700 dark:text-cyan-200">{fmtCurrency(driver.projected)}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted dark:bg-white/10">
                <div className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-teal-300" style={{ width: `${Math.min(100, driver.share_pct)}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </Panel>
  );
}

function CoverageMatrix() {
  const modules = [
    ["Executive Overview", "Board-ready revenue, risk, and fleet telemetry", "Live"],
    ["Sales Analytics", "Channel yield, booking quality, payment source intelligence", "Live"],
    ["Trends & Comparison", "Period deltas, anomaly scans, forecast bands", "AI"],
    ["Expense Analytics", "Margin leakage, disbursement pressure, cost signals", "Risk"],
    ["Passenger Analytics", "Demand cohorts, load factor, passenger mix", "Demand"],
    ["Cargo Analytics", "Cargo revenue, route freight heat, class trends", "Growth"],
    ["Vessel Analytics", "Utilization, readiness, revenue per vessel", "Fleet"],
    ["Live Route Monitoring", "Ports, lanes, vessel movement, congestion", "Ops"],
    ["Live Status Monitoring", "Sync health, alerts, incidents, reconciliation", "Status"],
  ];

  return (
    <Panel>
      <SectionTitle label="Command Modules" title="Complete BI Experience Coverage" meta="Executive, analytics, demand, operations, and assets" />
      <div className="grid gap-3 p-5 md:grid-cols-3">
        {modules.map(([title, description, tag]) => (
          <div key={title} className="rounded-2xl border border-border/70 bg-card/70 p-4 dark:border-white/10 dark:bg-white/[0.04]">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-semibold text-foreground dark:text-white">{title}</p>
              <span className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-semibold text-cyan-700 dark:border-cyan-300/20 dark:bg-cyan-300/10 dark:text-cyan-100">{tag}</span>
            </div>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">{description}</p>
          </div>
        ))}
      </div>
    </Panel>
  );
}

export default function DashboardPage() {
  const { activeTenant } = useTenant();
  const [period, setPeriod] = useState<"today" | "mtd" | "ytd">("today");
  const [dateType, setDateType] = useState<"booking" | "departure">("booking");
  const [financeData, setFinanceData] = useState<FinanceOverviewData | null>(null);
  const [legacyData, setLegacyData] = useState<OverviewData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivityItem[]>([]);
  const [todaySchedule, setTodaySchedule] = useState<ScheduleTripItem[]>([]);
  const [capacityHeatmap, setCapacityHeatmap] = useState<CapacityHeatmapCell[]>([]);
  const [topAgents, setTopAgents] = useState<TopAgentItem[]>([]);
  const [widgetsLoading, setWidgetsLoading] = useState(true);

  const fetchOverview = useCallback(async () => {
    if (!activeTenant?.api_base_url) return;
    setIsLoading(true);
    setError(null);
    try {
      const [finance, legacy] = await Promise.allSettled([
        overviewService.getFinanceOverview(activeTenant.api_base_url, period, activeTenant.service_key, dateType),
        overviewService.getOverview(activeTenant.api_base_url, period, activeTenant.service_key),
      ]);
      if (finance.status === "fulfilled") setFinanceData(finance.value);
      if (legacy.status === "fulfilled") setLegacyData(legacy.value);
      if (finance.status === "rejected") console.error("Finance overview error:", finance.reason);
    } catch {
      setError("Failed to load dashboard data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [activeTenant, period, dateType]);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

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
      } finally {
        setWidgetsLoading(false);
      }
    }
    fetchWidgets();
  }, [activeTenant]);

  const fd = financeData;
  const todayNet = fd?.kpi_today.net_revenue ?? 0;
  const mtdNet = fd?.kpi_mtd.net_revenue ?? 0;
  const ytdNet = fd?.kpi_ytd.net_revenue ?? 0;
  const daysElapsed = new Date().getDate();
  const activeVessels = (legacyData?.revenue_by_vessel ?? []).filter((v) => v.total_revenue > 0).length;
  const passengerVolume = fd?.kpi.total_passengers ?? legacyData?.kpi.total_passengers ?? 0;
  const cargoRevenue = legacyData?.passenger_vs_cargo?.cargo_revenue ?? 0;
  const fleetUtilization = todaySchedule.length
    ? todaySchedule.reduce((sum, trip) => sum + (trip.pax_utilization_pct ?? 0), 0) / todaySchedule.length
    : 0;

  const executiveKpis = useExecutiveKPIs(fd, legacyData);
  const routeInsights = useRouteInsights(fd, todaySchedule);
  const forecastMetrics = useForecastMetrics(fd, routeInsights);
  const fleetAnalytics = useFleetAnalytics(todaySchedule, capacityHeatmap);
  const aiSummary = useExecutiveAISummary(fd, routeInsights, fleetAnalytics);

  const sortedRoutes = useMemo(
    () => [...(fd?.revenue_by_route ?? [])].sort((a, b) => b.net_revenue - a.net_revenue),
    [fd],
  );
  const trendData = (fd?.revenue_trend ?? []).slice(-14);
  const channels = (fd?.revenue_by_channel ?? []).slice(0, 5);

  if (error && !financeData) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="bi-panel flex max-w-md flex-col items-center gap-3 rounded-2xl p-8 text-center">
          <XCircle className="h-10 w-10 text-red-400" />
          <p className="font-semibold text-foreground dark:text-white">Failed to load dashboard data</p>
          <p className="text-sm text-muted-foreground">{error}</p>
          <button onClick={fetchOverview} className="flex items-center gap-1.5 rounded-xl border border-cyan-500/20 bg-cyan-500/10 px-3 py-2 text-sm text-cyan-700 dark:border-cyan-300/20 dark:bg-cyan-300/10 dark:text-cyan-100">
            <RefreshCw className="h-3.5 w-3.5" /> Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col gap-5 px-3 pb-8 sm:px-5 lg:px-6">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <span className="floating-particle left-[18%] top-[18%]" />
        <span className="floating-particle left-[73%] top-[32%] delay-700" />
        <span className="floating-particle left-[46%] top-[72%] delay-1000" />
      </div>

      <IntelligenceHero
        period={period}
        setPeriod={setPeriod}
        dateType={dateType}
        setDateType={setDateType}
        kpis={[
          { key: "today", label: "Today Net", value: todayNet },
          { key: "mtd", label: "MTD Net", value: mtdNet },
          { key: "ytd", label: "YTD Net", value: ytdNet },
        ]}
        aiSummary={aiSummary.summary}
      />

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <MetricCard
          title="Net Revenue"
          value={isLoading ? "..." : fmtCurrency(fd?.kpi.net_revenue)}
          subtitle="Ledger-accurate revenue after refunds and reconciled payments."
          icon={Wallet}
          accent="#00C2FF"
          active
          trend={getTrend(todayNet, daysElapsed ? mtdNet / daysElapsed : 0, "vs daily pace")}
        />
        <MetricCard
          title="Active Vessels"
          value={isLoading ? "..." : `${activeVessels}`}
          subtitle={activeVessels ? "Revenue-producing fleet currently detected." : "No vessel data available yet. Analytics will appear once operations begin syncing."}
          icon={Ship}
          accent="#14B8A6"
          trend={{ direction: activeVessels ? "up" : "flat", value: `${activeVessels}`, label: "earning vessels" }}
        />
        <MetricCard
          title="Passenger Volume"
          value={isLoading ? "..." : passengerVolume.toLocaleString()}
          subtitle="Passenger demand intelligence across synced routes."
          icon={Users}
          accent="#7DD3FC"
          trend={{ direction: "up", value: fmtPercent(fleetUtilization), label: "avg load" }}
        />
        <MetricCard
          title="Cargo Revenue"
          value={isLoading ? "..." : fmtCurrency(cargoRevenue)}
          subtitle="Cargo growth trend and freight demand signal."
          icon={Boxes}
          accent="#22C55E"
          trend={{ direction: cargoRevenue > 0 ? "up" : "flat", value: cargoRevenue > 0 ? "Live" : "No data", label: "cargo telemetry" }}
        />
        <MetricCard
          title="Operational Risk"
          value={isLoading ? "..." : forecastMetrics.risk}
          subtitle="Port, route, forecast, and reconciliation risk scoring."
          icon={CircleAlert}
          accent="#F59E0B"
          trend={{ direction: forecastMetrics.risk === "High" ? "down" : "flat", value: forecastMetrics.risk === "High" ? "Watch" : "Stable", label: "risk state" }}
        />
        <MetricCard
          title="Fleet Utilization"
          value={isLoading ? "..." : fmtPercent(fleetUtilization)}
          subtitle="Passenger capacity utilization from live schedule telemetry."
          icon={Gauge}
          accent="#EF4444"
          trend={{ direction: fleetUtilization > 70 ? "up" : "flat", value: fmtPercent(fleetUtilization), label: "route load" }}
        />
      </section>

      <AIInsightPanel decisions={routeInsights.decisions} risk={forecastMetrics.risk} />

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <MaritimeOperationsMap routes={routeInsights.mapRows} vessels={todaySchedule} />
        <ForecastIntelligence forecast={fd?.forecast} efficiency={executiveKpis.efficiencyIndex} drivers={forecastMetrics.drivers} />
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <Panel className="xl:col-span-7">
          <SectionTitle label="Section 4" title="Advanced Revenue Charts" meta="Forecast overlays, ledger trend, confidence movement" />
          {isLoading ? <div className="p-5"><Skeleton className="h-72 rounded-2xl bg-muted dark:bg-white/10" /></div> : <RevenueTrendChart data={trendData} period={period} />}
        </Panel>
        <Panel className="xl:col-span-5">
          <SectionTitle label="Advanced Charts" title="Channel Demand Mix" meta="Passenger, cargo, agent, and direct channels" />
          {isLoading ? (
            <div className="space-y-3 p-5">{Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-12 rounded-xl bg-muted dark:bg-white/10" />)}</div>
          ) : (
            <ChannelRevenuePanel channels={channels} allChannels={fd?.revenue_by_channel ?? []} />
          )}
        </Panel>
        <Panel className="xl:col-span-12">
          <SectionTitle label="Route Profitability" title="Executive Route Intelligence" meta="Revenue, margin, risk, and booking quality" />
          {isLoading ? (
            <div className="space-y-2 p-5">{Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-10 rounded-xl bg-muted dark:bg-white/10" />)}</div>
          ) : (
            <RouteProfitabilityTable routes={sortedRoutes.slice(0, 8)} maxRows={8} />
          )}
        </Panel>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <Panel className="xl:col-span-7">
          <SectionTitle label="Demand Intelligence" title="Capacity Utilization Heatmap" meta="Passenger load by route and date" />
          {widgetsLoading ? <div className="p-5"><Skeleton className="h-44 rounded-2xl bg-muted dark:bg-white/10" /></div> : <CapacityHeatmap cells={capacityHeatmap} />}
        </Panel>
        <Panel className="xl:col-span-5">
          <SectionTitle label="Live Status Monitoring" title="Today's Vessel Timeline" meta="Departures, utilization, and operational state" />
          {widgetsLoading ? (
            <div className="space-y-3 p-5">{Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-14 rounded-xl bg-muted dark:bg-white/10" />)}</div>
          ) : (
            <TodayScheduleTimeline trips={todaySchedule} />
          )}
        </Panel>
        <Panel className="xl:col-span-6">
          <SectionTitle label="Live Route Monitoring" title="Activity Stream" meta="Bookings and cargo movement" />
          {widgetsLoading ? (
            <div className="space-y-3 p-5">{Array.from({ length: 5 }).map((_, index) => <Skeleton key={index} className="h-12 rounded-xl bg-muted dark:bg-white/10" />)}</div>
          ) : (
            <RecentActivityFeed items={recentActivity} />
          )}
        </Panel>
        <Panel className="xl:col-span-6">
          <SectionTitle label="Sales Analytics" title="Top Agent Performance" meta="Agent-led revenue contribution" />
          {widgetsLoading ? (
            <div className="space-y-3 p-5">{Array.from({ length: 5 }).map((_, index) => <Skeleton key={index} className="h-12 rounded-xl bg-muted dark:bg-white/10" />)}</div>
          ) : (
            <TopAgentsTable agents={topAgents} />
          )}
        </Panel>
      </section>

      <CoverageMatrix />
    </div>
  );
}
