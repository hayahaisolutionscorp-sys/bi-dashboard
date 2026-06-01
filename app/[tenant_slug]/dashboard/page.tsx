"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  Bot,
  Boxes,
  CircleAlert,
  CalendarDays,
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

function SectionTitle({ label, title, meta, dense = false }: { label: string; title: string; meta?: string; dense?: boolean }) {
  return (
    <div className={cn("flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between", dense ? "px-4 pt-4" : "px-5 pt-5")}>
      <div>
        <p className="text-[10px] font-semibold uppercase text-cyan-700 dark:text-cyan-200/70">{label}</p>
        <h2 className="text-base font-semibold text-foreground dark:text-white">{title}</h2>
      </div>
      {meta && <p className="text-xs text-muted-foreground">{meta}</p>}
    </div>
  );
}

function Sparkline({ tone = "#00C2FF", compact = false }: { tone?: string; compact?: boolean }) {
  return (
    <svg viewBox="0 0 148 52" className={cn("overflow-visible", compact ? "h-12 w-36" : "h-14 w-36")} aria-hidden="true">
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
        "group relative min-h-[164px] overflow-hidden rounded-2xl border border-border/70 bg-card/80 p-4 text-left backdrop-blur-2xl transition-all dark:border-white/10 dark:bg-white/[0.055]",
        "shadow-[0_24px_70px_-50px_rgba(0,194,255,0.65)]",
        active && "border-cyan-300/50 bg-cyan-300/10 shadow-[0_0_46px_rgba(0,194,255,0.18)]",
      )}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" />
      <div className="absolute -right-12 -top-12 h-28 w-28 rounded-full blur-3xl" style={{ backgroundColor: `${accent}24` }} />
      <div className="pointer-events-none absolute bottom-2 right-3 z-0 opacity-45 [mask-image:linear-gradient(to_left,black,transparent)]">
        <Sparkline tone={accent} compact />
      </div>
      <div className="relative z-10 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold leading-snug text-slate-700 dark:text-slate-200">{title}</p>
          <p className="mt-2 text-2xl font-semibold leading-none text-slate-950 tabular-nums dark:text-white">{value}</p>
        </div>
        <span className="grid size-10 shrink-0 place-items-center rounded-2xl border border-border/70 bg-muted/50 dark:border-white/10 dark:bg-black/20" style={{ color: accent }}>
          <Icon className="size-4" />
        </span>
      </div>
      <div className="relative z-10 mt-4 space-y-2">
        <div className="min-w-0">
          {trend && (
            <p
              className={cn(
                "flex items-start gap-1.5 text-sm font-semibold leading-5",
                trend.direction === "down" ? "text-red-700 dark:text-red-300" : trend.direction === "up" ? "text-emerald-700 dark:text-emerald-300" : "text-slate-700 dark:text-slate-300",
              )}
            >
              <TrendIcon className="mt-0.5 size-4 shrink-0" />
              <span>
                <span className="tabular-nums">{trend.value}</span>{" "}
                <span className="font-medium text-slate-600 dark:text-slate-400">{trend.label}</span>
              </span>
            </p>
          )}
          <p className="max-w-[22rem] text-sm leading-5 text-slate-600 dark:text-slate-400">{subtitle}</p>
        </div>
      </div>
    </motion.div>
  );
}

function CommandStatusStrip({
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
    <section className="relative overflow-hidden rounded-2xl border border-border/70 bg-card/80 p-3 shadow-[0_24px_80px_-58px_rgba(0,209,255,0.55)] backdrop-blur-2xl dark:border-white/10 dark:bg-[#071122]/86 sm:p-4">
      <div className="absolute inset-0 command-grid opacity-45" />
      <div className="absolute -right-16 -top-24 h-56 w-56 rounded-full bg-cyan-400/12 blur-3xl" />
      <div className="relative grid gap-3 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="grid gap-3 lg:grid-cols-[minmax(240px,0.9fr)_minmax(0,1.2fr)]">
          <div className="rounded-xl border border-border/60 bg-background/35 px-4 py-3 dark:border-white/10 dark:bg-black/20">
            <div className="flex items-center gap-2">
              <span className="grid size-8 place-items-center rounded-xl border border-cyan-500/25 bg-cyan-500/10 text-cyan-700 dark:border-cyan-300/25 dark:text-cyan-100">
                <Sparkles className="size-4" />
              </span>
              <div className="min-w-0">
                <h1 className="text-base font-semibold leading-tight text-foreground dark:text-white sm:text-lg">Maritime Intelligence Command</h1>
                <p className="mt-0.5 text-[11px] leading-4 text-muted-foreground">Executive overview | real-time finance, demand, and fleet telemetry</p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 font-medium text-emerald-700 dark:text-emerald-200">
                <Radio className="size-3.5 animate-pulse" />
                Live sync active
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/40 px-2.5 py-1 text-muted-foreground dark:border-white/10 dark:bg-white/[0.045]">
                <CalendarDays className="size-3.5" />
                {dateType === "booking" ? "Booking date" : "Departure date"}
              </span>
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            {kpis.map((item) => (
              <button
                key={item.key}
                onClick={() => setPeriod(item.key)}
                className={cn(
                  "rounded-xl border px-3 py-3 text-left transition-all",
                  period === item.key
                    ? "border-cyan-500/45 bg-cyan-500/10 text-foreground shadow-[0_0_26px_rgba(0,209,255,0.16)] dark:border-cyan-300/45 dark:bg-cyan-300/12 dark:text-white"
                    : "border-border/70 bg-card/60 text-muted-foreground hover:border-cyan-500/30 dark:border-white/10 dark:bg-white/[0.045]",
                )}
              >
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{item.label}</p>
                <p className="mt-1 text-xl font-semibold tabular-nums">{fmtCurrency(item.value)}</p>
              </button>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-border/70 bg-background/40 p-3 backdrop-blur-xl dark:border-white/10 dark:bg-black/20">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-cyan-700 dark:text-cyan-100">
              <Bot className="size-4" />
              Compact AI Brief
            </div>
            <div className="flex rounded-lg border border-border/70 bg-muted/40 p-0.5 text-[11px] dark:border-white/10 dark:bg-black/25">
              <button
                onClick={() => setDateType("booking")}
                className={cn("rounded-md px-2.5 py-1.5", dateType === "booking" ? "bg-cyan-500/10 text-cyan-700 dark:bg-cyan-300/15 dark:text-cyan-100" : "text-muted-foreground")}
              >
                Booking
              </button>
              <button
                onClick={() => setDateType("departure")}
                className={cn("rounded-md px-2.5 py-1.5", dateType === "departure" ? "bg-cyan-500/10 text-cyan-700 dark:bg-cyan-300/15 dark:text-cyan-100" : "text-muted-foreground")}
              >
                Departure
              </button>
            </div>
          </div>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            {aiSummary || "Awaiting live bookings, route, and fleet telemetry for executive briefing."}
          </p>
        </div>
      </div>
    </section>
  );
}

function AIInsightPanel({
  decisions,
  risk,
  className,
  compact = false,
}: {
  decisions: Array<{ title: string; value: string; delta: string; severity: "normal" | "warning" | "critical" }>;
  risk: "Low" | "Medium" | "High";
  className?: string;
  compact?: boolean;
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
    <Panel className={className}>
      <SectionTitle dense={compact} label="AI Insights" title="AI Maritime Insights" meta={`Risk ${riskScore}/100 | ${risk.toLowerCase()}`} />
      <div className={cn("grid gap-3", compact ? "p-4" : "p-5 md:grid-cols-2 xl:grid-cols-5")}>
        {rows.map((item, index) => (
          <div key={`${item.title}-${index}`} className={cn(
            "group relative overflow-hidden rounded-2xl border border-border/70 bg-card/70 transition-all hover:-translate-y-0.5 hover:border-cyan-500/30 dark:border-white/10 dark:bg-white/[0.045]",
            compact ? "p-3.5" : "p-4",
          )}>
            <span
              className={cn(
                "absolute right-4 top-4 size-2 rounded-full",
                item.severity === "critical" ? "bg-red-400 shadow-[0_0_18px_rgba(239,68,68,0.8)]" : item.severity === "warning" ? "bg-amber-400 shadow-[0_0_18px_rgba(245,158,11,0.8)]" : "bg-emerald-400 shadow-[0_0_18px_rgba(34,197,94,0.8)]",
              )}
            />
            <p className="pr-6 text-xs font-semibold text-foreground dark:text-white">{item.title}</p>
            <p className={cn("font-semibold text-cyan-700 tabular-nums dark:text-cyan-100", compact ? "mt-2 text-xl" : "mt-3 text-2xl")}>{item.value}</p>
            <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-muted-foreground">{item.delta}</p>
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
    <Panel className="flex min-h-[620px] flex-col xl:col-span-7">
      <SectionTitle dense label="Operations" title="Live Maritime Operations Map" meta={`${vessels.length} schedules | ${routes.length} route lanes`} />
      <div className="relative m-4 mt-3 min-h-[460px] flex-1 overflow-hidden rounded-2xl border border-cyan-200/10 bg-[#06131F]">
        <FleetMapComponent compact />
      </div>
    </Panel>
  );
}

function ForecastIntelligence({
  forecast,
  efficiency,
  drivers,
  className,
}: {
  forecast: FinanceOverviewData["forecast"] | undefined;
  efficiency: { score: number; trend: number };
  drivers: Array<{ route_name: string; projected: number; share_pct: number }>;
  className?: string;
}) {
  const cards = [
    { label: "Revenue Prediction", value: fmtCurrency(forecast?.mtd_projection), icon: Wallet, tone: "text-cyan-700 dark:text-cyan-200", detail: forecast?.pacing_status ?? "calibrating" },
    { label: "Fleet Efficiency", value: `${efficiency.score || 0}/100`, icon: Gauge, tone: "text-teal-700 dark:text-teal-200", detail: `${efficiency.trend > 0 ? "+" : ""}${efficiency.trend.toFixed(1)} trend` },
    { label: "Operational Risk", value: forecast?.pacing_status === "behind" ? "Elevated" : "Stable", icon: ShieldAlert, tone: "text-amber-700 dark:text-amber-200", detail: "weather, port, and schedule proxy" },
    { label: "Predictive Maintenance", value: "92%", icon: Activity, tone: "text-emerald-700 dark:text-emerald-200", detail: "fleet readiness confidence" },
  ];

  return (
    <Panel className={cn("xl:col-span-4", className)}>
      <SectionTitle dense label="Forecast" title="Forecast Intelligence" meta="AI operational pacing" />
      <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
        {cards.map((item) => (
          <div key={item.label} className="rounded-2xl border border-border/70 bg-card/70 p-3.5 dark:border-white/10 dark:bg-white/[0.045]">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">{item.label}</p>
              <item.icon className={cn("size-4", item.tone)} />
            </div>
            <p className="mt-2 text-xl font-semibold text-foreground tabular-nums dark:text-white">{item.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{item.detail}</p>
          </div>
        ))}
      </div>
      <div className="border-t border-border/70 px-4 pb-4 pt-3 dark:border-white/10">
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
  const { activeTenant, isLoading: isTenantLoading } = useTenant();
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
    if (isTenantLoading) return;

    if (!activeTenant?.api_base_url) {
      setFinanceData(null);
      setLegacyData(null);
      setError("No active tenant API is available.");
      setIsLoading(false);
      return;
    }

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
  }, [activeTenant, isTenantLoading, period, dateType]);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  useEffect(() => {
    async function fetchWidgets() {
      if (isTenantLoading) return;

      if (!activeTenant?.api_base_url) {
        setRecentActivity([]);
        setTodaySchedule([]);
        setCapacityHeatmap([]);
        setTopAgents([]);
        setWidgetsLoading(false);
        return;
      }

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
  }, [activeTenant, isTenantLoading]);

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
    <div className="relative flex flex-col gap-3 px-3 pb-6 sm:px-5 lg:px-6">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <span className="floating-particle left-[18%] top-[18%]" />
        <span className="floating-particle left-[73%] top-[32%] delay-700" />
        <span className="floating-particle left-[46%] top-[72%] delay-1000" />
      </div>

      <CommandStatusStrip
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

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-[repeat(auto-fit,minmax(260px,1fr))]">
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

      <section className="grid grid-cols-1 gap-3 xl:grid-cols-12">
        <MaritimeOperationsMap routes={routeInsights.mapRows} vessels={todaySchedule} />
        <AIInsightPanel compact className="xl:col-span-5" decisions={routeInsights.decisions} risk={forecastMetrics.risk} />
      </section>

      <section className="grid grid-cols-1 gap-3 xl:grid-cols-12">
        <Panel className="xl:col-span-5">
          <SectionTitle dense label="Analytics" title="Revenue Trend" meta="Ledger trend and pacing movement" />
          {isLoading ? <div className="p-4"><Skeleton className="h-64 rounded-2xl bg-muted dark:bg-white/10" /></div> : <RevenueTrendChart data={trendData} period={period} />}
        </Panel>
        <Panel className="xl:col-span-3">
          <SectionTitle dense label="Channels" title="Demand Mix" meta="Source yield" />
          {isLoading ? (
            <div className="space-y-3 p-4">{Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-12 rounded-xl bg-muted dark:bg-white/10" />)}</div>
          ) : (
            <ChannelRevenuePanel channels={channels} allChannels={fd?.revenue_by_channel ?? []} />
          )}
        </Panel>
        <ForecastIntelligence forecast={fd?.forecast} efficiency={executiveKpis.efficiencyIndex} drivers={forecastMetrics.drivers} />
        <Panel className="xl:col-span-12">
          <SectionTitle dense label="Routes" title="Executive Route Intelligence" meta="Revenue, margin, risk, and booking quality" />
          {isLoading ? (
            <div className="space-y-2 p-4">{Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-10 rounded-xl bg-muted dark:bg-white/10" />)}</div>
          ) : (
            <RouteProfitabilityTable routes={sortedRoutes.slice(0, 8)} maxRows={8} />
          )}
        </Panel>
      </section>

      <section className="grid grid-cols-1 gap-3 xl:grid-cols-12">
        <Panel className="xl:col-span-7">
          <SectionTitle dense label="Demand" title="Capacity Utilization Heatmap" meta="Passenger load by route and date" />
          {widgetsLoading ? <div className="p-4"><Skeleton className="h-44 rounded-2xl bg-muted dark:bg-white/10" /></div> : <CapacityHeatmap cells={capacityHeatmap} />}
        </Panel>
        <Panel className="xl:col-span-5">
          <SectionTitle dense label="Status" title="Today's Vessel Timeline" meta="Departures, utilization, and state" />
          {widgetsLoading ? (
            <div className="space-y-3 p-4">{Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-14 rounded-xl bg-muted dark:bg-white/10" />)}</div>
          ) : (
            <TodayScheduleTimeline trips={todaySchedule} />
          )}
        </Panel>
        <Panel className="xl:col-span-6">
          <SectionTitle dense label="Activity" title="Live Activity Feed" meta="Bookings and cargo movement" />
          {widgetsLoading ? (
            <div className="space-y-3 p-4">{Array.from({ length: 5 }).map((_, index) => <Skeleton key={index} className="h-12 rounded-xl bg-muted dark:bg-white/10" />)}</div>
          ) : (
            <RecentActivityFeed items={recentActivity} />
          )}
        </Panel>
        <Panel className="xl:col-span-6">
          <SectionTitle dense label="Sales" title="Top Agent Performance" meta="Agent-led revenue contribution" />
          {widgetsLoading ? (
            <div className="space-y-3 p-4">{Array.from({ length: 5 }).map((_, index) => <Skeleton key={index} className="h-12 rounded-xl bg-muted dark:bg-white/10" />)}</div>
          ) : (
            <TopAgentsTable agents={topAgents} />
          )}
        </Panel>
      </section>

      <CoverageMatrix />
    </div>
  );
}
