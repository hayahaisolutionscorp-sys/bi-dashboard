"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Bot,
  Boxes,
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  Clock,
  Gauge,
  Radio,
  RefreshCw,
  Ship,
  Users,
  Wrench,
  XCircle,
  type LucideIcon,
} from "lucide-react";

import type { FinanceOverviewData, OverviewData } from "@/types/overview";
import type {
  CapacityHeatmapCell,
  RecentActivityItem,
  ScheduleTripItem,
} from "@/types/dashboard-widgets";
import { overviewService } from "@/services/overview.service";
import { dashboardWidgetsService } from "@/services/dashboard-widgets.service";
import { useTenant } from "@/components/providers/tenant-provider";
import { Skeleton } from "@/components/ui/skeleton";
import { RevenueTrendChart } from "@/components/charts/revenue-trend-chart";
import { cn } from "@/lib/utils";
import {
  useExecutiveKPIs,
  useForecastMetrics,
  useRouteInsights,
} from "@/hooks/use-executive-intelligence";

const fmtCurrency = (value?: number | null) => {
  const n = value ?? 0;
  if (Math.abs(n) >= 1_000_000) return `P${(n / 1_000_000).toFixed(2)}M`;
  if (Math.abs(n) >= 1_000) return `P${(n / 1_000).toFixed(0)}K`;
  return `P${n.toLocaleString()}`;
};

const fmtNumber = (value?: number | null) => (value ?? 0).toLocaleString();
const fmtPercent = (value?: number | null) => `${Math.max(0, value ?? 0).toFixed(1)}%`;
const fmtSignedPercent = (value?: number | null) => {
  const n = value ?? 0;
  return `${n > 0 ? "+" : ""}${n.toFixed(1)}%`;
};

type TrendDirection = "up" | "down" | "flat";

function trendDirection(value?: number | null): TrendDirection {
  const n = value ?? 0;
  if (n > 1) return "up";
  if (n < -1) return "down";
  return "flat";
}

function pctDelta(current: number, reference: number) {
  if (!reference) return 0;
  return ((current - reference) / reference) * 100;
}

function clampPct(value: number) {
  return Math.max(0, Math.min(100, value));
}

function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={cn("bi-panel bi-noise overflow-hidden rounded-2xl border-border/70", className)}
    >
      {children}
    </motion.section>
  );
}

function SectionHeader({
  eyebrow,
  title,
  meta,
  action,
}: {
  eyebrow: string;
  title: string;
  meta?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-wrap items-start justify-between gap-3 border-b border-border/60 px-4 py-3 dark:border-white/10">
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-700 dark:text-cyan-200/75">
          {eyebrow}
        </p>
        <h2 className="truncate text-sm font-semibold text-foreground dark:text-white">{title}</h2>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {meta && <span className="text-right text-[11px] text-muted-foreground">{meta}</span>}
        {action}
      </div>
    </div>
  );
}

function TrendBadge({
  direction,
  value,
  label,
}: {
  direction: TrendDirection;
  value: string;
  label: string;
}) {
  const Icon = direction === "up" ? ArrowUpRight : direction === "down" ? ArrowDownRight : Activity;

  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold leading-none",
        direction === "up" && "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
        direction === "down" && "bg-rose-500/10 text-rose-700 dark:text-rose-300",
        direction === "flat" && "bg-muted text-muted-foreground",
      )}
    >
      <Icon className="size-3 shrink-0" />
      <span className="tabular-nums">{value}</span>
      <span className="hidden font-medium sm:inline">{label}</span>
    </span>
  );
}

function MiniSparkline({ values, tone = "#0891b2" }: { values: number[]; tone?: string }) {
  const points = useMemo(() => {
    if (!values.length) return "";
    const max = Math.max(...values, 1);
    const min = Math.min(...values, 0);
    const span = Math.max(1, max - min);
    return values
      .map((value, index) => {
        const x = (index / Math.max(1, values.length - 1)) * 100;
        const y = 34 - ((value - min) / span) * 28;
        return `${x},${y}`;
      })
      .join(" ");
  }, [values]);

  return (
    <svg viewBox="0 0 100 38" className="h-10 w-full overflow-visible" aria-hidden="true">
      <polyline
        fill="none"
        points={points}
        stroke={tone}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.5"
      />
    </svg>
  );
}

function CriticalKpiCard({
  label,
  value,
  icon: Icon,
  trend,
  active,
  tone = "cyan",
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  trend: { direction: TrendDirection; value: string; label: string };
  active?: boolean;
  tone?: "cyan" | "emerald" | "violet" | "amber" | "rose" | "slate";
}) {
  const toneClasses = {
    cyan: "text-cyan-700 bg-cyan-500/10 border-cyan-500/25 dark:text-cyan-200",
    emerald: "text-emerald-700 bg-emerald-500/10 border-emerald-500/25 dark:text-emerald-200",
    violet: "text-violet-700 bg-violet-500/10 border-violet-500/25 dark:text-violet-200",
    amber: "text-amber-700 bg-amber-500/10 border-amber-500/25 dark:text-amber-200",
    rose: "text-rose-700 bg-rose-500/10 border-rose-500/25 dark:text-rose-200",
    slate: "text-slate-700 bg-slate-500/10 border-slate-500/25 dark:text-slate-200",
  };

  return (
    <div
      className={cn(
        "flex min-h-[126px] min-w-0 flex-col justify-between rounded-2xl border bg-card/80 p-3.5 shadow-[0_24px_70px_-58px_rgba(0,194,255,0.55)] dark:border-white/10 dark:bg-white/[0.055]",
        active ? "border-cyan-400/50 bg-cyan-400/10" : "border-border/70",
      )}
    >
      <div className="flex min-w-0 items-start justify-between gap-3">
        <p className="min-w-0 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
        <span className={cn("grid size-8 shrink-0 place-items-center rounded-xl border", toneClasses[tone])}>
          <Icon className="size-4" />
        </span>
      </div>
      <div className="min-w-0">
        <p className="truncate text-[clamp(1.55rem,2vw,2rem)] font-semibold leading-none text-foreground tabular-nums dark:text-white">
          {value}
        </p>
        <div className="mt-3">
          <TrendBadge {...trend} />
        </div>
      </div>
    </div>
  );
}

function SignalRow({
  label,
  value,
  delta,
  values,
  tone,
  icon: Icon,
}: {
  label: string;
  value: string;
  delta: number;
  values: number[];
  tone: string;
  icon: LucideIcon;
}) {
  return (
    <div className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)_88px] items-center gap-3 rounded-xl border border-border/70 bg-card/70 px-3 py-2.5 dark:border-white/10 dark:bg-white/[0.045]">
      <span className="grid size-8 shrink-0 place-items-center rounded-xl border border-border/70 bg-muted/40 dark:border-white/10">
        <Icon className="size-4" style={{ color: tone }} />
      </span>
      <div className="min-w-0">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <p className="truncate text-xs font-medium text-muted-foreground">{label}</p>
          <TrendBadge direction={trendDirection(delta)} value={fmtSignedPercent(delta)} label="trend" />
        </div>
        <p className="mt-1 truncate text-lg font-semibold leading-none tabular-nums text-foreground dark:text-white">
          {value}
        </p>
      </div>
      <div className="h-8 min-w-0">
        <MiniSparkline values={values} tone={tone} />
      </div>
    </div>
  );
}

function ForecastCard({
  label,
  value,
  meta,
  progress,
  tone = "cyan",
}: {
  label: string;
  value: string;
  meta: string;
  progress: number;
  tone?: "cyan" | "emerald" | "amber" | "rose";
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-border/70 bg-card/70 p-3.5 dark:border-white/10 dark:bg-white/[0.045]">
      <p className="truncate text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 truncate text-2xl font-semibold leading-none tabular-nums text-foreground dark:text-white">{value}</p>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full rounded-full",
            tone === "cyan" && "bg-cyan-500",
            tone === "emerald" && "bg-emerald-500",
            tone === "amber" && "bg-amber-500",
            tone === "rose" && "bg-rose-500",
          )}
          style={{ width: `${clampPct(progress)}%` }}
        />
      </div>
      <p className="mt-2 truncate text-[11px] text-muted-foreground">{meta}</p>
    </div>
  );
}

function CompactMetric({
  label,
  value,
  meta,
}: {
  label: string;
  value: string;
  meta: string;
}) {
  return (
    <div className="min-w-0 rounded-xl border border-border/70 bg-card/70 p-3 dark:border-white/10 dark:bg-white/[0.045]">
      <p className="truncate text-[11px] font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 truncate text-xl font-semibold leading-none tabular-nums text-foreground dark:text-white">{value}</p>
      <p className="mt-2 truncate text-[11px] text-muted-foreground">{meta}</p>
    </div>
  );
}

function WaterfallCard({
  gross,
  refunds,
  expenses,
  netProfit,
}: {
  gross: number;
  refunds: number;
  expenses: number;
  netProfit: number;
}) {
  const max = Math.max(gross, refunds, expenses, Math.abs(netProfit), 1);
  const rows = [
    { label: "Gross Revenue", value: gross, tone: "bg-cyan-500" },
    { label: "Refunds", value: -refunds, tone: "bg-rose-500" },
    { label: "Expenses", value: -expenses, tone: "bg-amber-500" },
    { label: "Net Profit", value: netProfit, tone: netProfit >= 0 ? "bg-emerald-500" : "bg-rose-500" },
  ];

  return (
    <Panel className="h-full">
      <SectionHeader eyebrow="CFO" title="Revenue Waterfall" meta="gross to net profit" />
      <div className="space-y-2.5 p-3.5">
        {rows.map((row, index) => (
          <div key={row.label} className={cn("space-y-1.5", index === rows.length - 1 && "border-t border-border/70 pt-2.5 dark:border-white/10")}>
            <div className="flex items-center justify-between gap-3 text-xs">
              <span className="font-medium text-muted-foreground">{row.label}</span>
              <span className={cn("font-semibold tabular-nums", row.value < 0 && "text-rose-500")}>
                {row.value < 0 ? "-" : ""}
                {fmtCurrency(Math.abs(row.value))}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div className={cn("h-full rounded-full", row.tone)} style={{ width: `${clampPct((Math.abs(row.value) / max) * 100)}%` }} />
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function BusinessHealthScore({
  score,
  checks,
  className,
}: {
  score: number;
  checks: Array<{ label: string; state: "good" | "watch" | "bad" }>;
  className?: string;
}) {
  return (
    <Panel className={className}>
      <SectionHeader eyebrow="Health" title={`${score}/100`} meta="executive score" />
      <div className="grid items-center gap-3 p-3.5 sm:grid-cols-[112px_minmax(0,1fr)]">
        <div className="relative mx-auto grid size-28 place-items-center rounded-full border border-border/70 bg-card/70 dark:border-white/10 dark:bg-white/[0.045]">
          <div
            className="absolute inset-2 rounded-full"
            style={{ background: `conic-gradient(rgb(16 185 129) ${clampPct(score)}%, rgba(148,163,184,.18) 0)` }}
          />
          <div className="relative grid size-20 place-items-center rounded-full bg-background dark:bg-[#071122]">
            <span className="text-2xl font-semibold tabular-nums">{score}</span>
          </div>
        </div>
        <div className="grid gap-1.5">
          {checks.map((check) => (
            <div key={check.label} className="flex items-center justify-between rounded-xl border border-border/70 bg-card/70 px-3 py-1.5 text-xs dark:border-white/10 dark:bg-white/[0.045]">
              <span className="font-medium text-muted-foreground">{check.label}</span>
              {check.state === "good" ? (
                <CheckCircle2 className="size-4 text-emerald-500" />
              ) : check.state === "watch" ? (
                <CircleAlert className="size-4 text-amber-500" />
              ) : (
                <XCircle className="size-4 text-rose-500" />
              )}
            </div>
          ))}
        </div>
      </div>
    </Panel>
  );
}

function TargetTracker({
  target,
  achieved,
}: {
  target: number;
  achieved: number;
}) {
  const pct = target ? (achieved / target) * 100 : 0;

  return (
    <Panel className="h-full">
      <SectionHeader eyebrow="Target" title="Revenue Target Tracker" meta={`${fmtPercent(pct)} achieved`} />
      <div className="space-y-3 p-3.5">
        <div className="grid grid-cols-2 gap-2">
          <CompactMetric label="Target" value={fmtCurrency(target)} meta="EOM goal" />
          <CompactMetric label="Achieved" value={fmtCurrency(achieved)} meta="realized MTD" />
        </div>
        <div>
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="font-medium text-muted-foreground">Progress</span>
            <span className="font-semibold tabular-nums">{fmtPercent(pct)}</span>
          </div>
          <div className="h-4 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-500" style={{ width: `${clampPct(pct)}%` }} />
          </div>
        </div>
      </div>
    </Panel>
  );
}

function ExecutiveTable({
  title,
  columns,
  rows,
}: {
  title: string;
  columns: string[];
  rows: string[][];
}) {
  return (
    <Panel className="h-full">
      <SectionHeader eyebrow="Performance" title={title} />
      <div className="overflow-x-auto p-3.5 pt-3">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border/70 text-muted-foreground dark:border-white/10">
              {columns.map((column, index) => (
                <th key={column} className={cn("pb-2 font-medium", index === 0 ? "text-left" : "text-right")}>{column}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.join("-")} className="border-b border-border/40 last:border-0 dark:border-white/10">
                {row.map((cell, index) => (
                  <td key={`${cell}-${index}`} className={cn("py-2.5 tabular-nums", index === 0 ? "max-w-[12rem] truncate text-left font-medium text-foreground dark:text-white" : "text-right text-muted-foreground")}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

function ChannelDonut({ channels }: { channels: Array<{ label: string; pct: number; value: number }> }) {
  const colors = ["#06b6d4", "#8b5cf6", "#22c55e", "#f59e0b", "#ef4444"];
  let cursor = 0;
  const gradient = channels.length
    ? channels.map((channel, index) => {
        const start = cursor;
        cursor += channel.pct;
        return `${colors[index % colors.length]} ${start}% ${cursor}%`;
      }).join(", ")
    : "rgba(148,163,184,.25) 0% 100%";

  return (
    <Panel className="h-full">
      <SectionHeader eyebrow="Channels" title="Revenue by Channel" />
      <div className="grid items-center gap-3 p-3.5 sm:grid-cols-[112px_minmax(0,1fr)]">
        <div className="relative grid size-28 place-items-center rounded-full" style={{ background: `conic-gradient(${gradient})` }}>
          <div className="grid size-16 place-items-center rounded-full bg-background text-center dark:bg-[#071122]">
            <span className="text-xs font-semibold text-muted-foreground">Mix</span>
          </div>
        </div>
        <div className="space-y-2">
          {(channels.length ? channels : [{ label: "Awaiting channels", pct: 100, value: 0 }]).map((channel, index) => (
            <div key={channel.label} className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-card/70 px-3 py-2 text-xs dark:border-white/10 dark:bg-white/[0.045]">
              <span className="flex min-w-0 items-center gap-2">
                <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: colors[index % colors.length] }} />
                <span className="min-w-0 truncate font-medium">{channel.label === "Awaiting channels" ? "Channels pending" : channel.label}</span>
              </span>
              <span className="shrink-0 tabular-nums text-muted-foreground">{channel.pct.toFixed(0)}%</span>
            </div>
          ))}
        </div>
      </div>
    </Panel>
  );
}

function FleetSnapshot({
  activeVessels,
  trips,
  completed,
  ongoing,
  delayed,
}: {
  activeVessels: number;
  trips: number;
  completed: number;
  ongoing: number;
  delayed: number;
}) {
  const items = [
    { label: "Active Vessels", value: activeVessels, icon: Ship },
    { label: "In Service", value: Math.max(0, activeVessels - (delayed > 0 ? 1 : 0)), icon: CheckCircle2 },
    { label: "Maintenance", value: delayed > 0 ? 1 : 0, icon: Wrench },
    { label: "Trips Today", value: trips, icon: CalendarDays },
    { label: "Completed", value: completed, icon: CheckCircle2 },
    { label: "Ongoing", value: ongoing, icon: Clock },
    { label: "Delayed", value: delayed, icon: CircleAlert },
  ];

  return (
    <Panel className="h-full">
      <SectionHeader eyebrow="Fleet" title="Fleet Snapshot" />
      <div className="grid grid-cols-2 gap-2 p-3.5 sm:grid-cols-3 xl:grid-cols-7">
        {items.map((item) => (
          <div key={item.label} className="rounded-xl border border-border/70 bg-card/70 p-2.5 dark:border-white/10 dark:bg-white/[0.045]">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] font-medium text-muted-foreground">{item.label}</p>
              <item.icon className="size-4 text-cyan-500" />
            </div>
            <p className="mt-2 text-xl font-semibold tabular-nums">{fmtNumber(item.value)}</p>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function RiskRadar({ risks }: { risks: Array<{ label: string; metric: string; severity: "critical" | "warning" | "normal" }> }) {
  const baselineRows = [
    { label: "Route risk engine", metric: "No critical alerts", severity: "normal" as const },
    { label: "Capacity monitor", metric: "No route above threshold", severity: "normal" as const },
    { label: "Fleet maintenance", metric: "No maintenance signal", severity: "normal" as const },
    { label: "Schedule monitor", metric: "No delay signal", severity: "normal" as const },
    { label: "Revenue monitor", metric: "No margin alert", severity: "normal" as const },
  ];
  const rows = [...risks, ...baselineRows].slice(0, 5);

  return (
    <Panel className="h-full">
      <SectionHeader eyebrow="Risk" title="Critical Alerts" />
      <div className="grid gap-2 p-3.5">
        {rows.map((risk) => (
          <div key={risk.label} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-border/70 bg-card/70 px-3 py-2.5 text-xs dark:border-white/10 dark:bg-white/[0.045]">
            <span className={cn("size-2.5 rounded-full", risk.severity === "critical" ? "bg-rose-500" : risk.severity === "warning" ? "bg-amber-500" : "bg-emerald-500")} />
            <span className="min-w-0 truncate font-medium text-foreground dark:text-white">{risk.label}</span>
            <span className="shrink-0 rounded-full bg-muted px-2 py-1 text-[11px] text-muted-foreground">{risk.metric}</span>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function RevenueHeatmap({
  routes,
  cells,
}: {
  routes: string[];
  cells: CapacityHeatmapCell[];
}) {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const routeNames = routes.length ? routes.slice(0, 5) : ["Route sync pending", "Revenue baseline pending", "Demand signal pending"];

  return (
    <Panel>
      <SectionHeader eyebrow="Demand" title="Route x Day Heatmap" />
      <div className="p-4">
        <div className="grid grid-cols-[minmax(110px,1fr)_repeat(7,24px)] gap-2 text-[11px] text-muted-foreground">
          <span />
          {days.map((day) => <span key={day} className="text-center">{day}</span>)}
          {routeNames.map((route, routeIndex) => (
            <div key={route} className="contents">
              <span className="truncate pr-2 font-medium text-foreground dark:text-white">{route}</span>
              {days.map((day, dayIndex) => {
                const match = cells.find((cell) => cell.route_name === route && new Date(cell.period_label).getDay() === (dayIndex + 1) % 7);
                const value = match?.utilization_pct ?? ((routeIndex + dayIndex) % 5) * 18;
                return (
                  <span
                    key={`${route}-${day}`}
                    className={cn(
                      "size-6 rounded-md border border-white/10",
                      value >= 80 ? "bg-rose-500/80" : value >= 60 ? "bg-amber-500/80" : value > 0 ? "bg-emerald-500/75" : "bg-muted",
                    )}
                    title={`${route} ${day}: ${fmtPercent(value)}`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </Panel>
  );
}

function AIExecutiveInsights({ insights }: { insights: string[] }) {
  return (
    <Panel className="h-full">
      <SectionHeader eyebrow="AI" title="Executive Insights" />
      <div className="grid gap-2 p-3.5">
        {insights.map((insight) => (
          <div key={insight} className="flex gap-2 rounded-xl border border-border/70 bg-card/70 px-3 py-2 text-xs leading-4 dark:border-white/10 dark:bg-white/[0.045]">
            <Bot className="mt-0.5 size-4 shrink-0 text-cyan-500" />
            <span className="text-muted-foreground">{insight}</span>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function CashPosition({
  cashCollected,
  refunds,
  expenses,
  netCash,
}: {
  cashCollected: number;
  refunds: number;
  expenses: number;
  netCash: number;
}) {
  return (
    <Panel className="h-full">
      <SectionHeader eyebrow="Cash" title="Cash Position" />
      <div className="grid gap-2 p-3.5 sm:grid-cols-2">
        {[
          ["Cash Collected", cashCollected],
          ["Refund Exposure", refunds],
          ["Expenses", expenses],
          ["Net Cash Today", netCash],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-border/70 bg-card/70 p-3 dark:border-white/10 dark:bg-white/[0.045]">
            <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
            <p className="mt-1 text-xl font-semibold tabular-nums">{fmtCurrency(Number(value))}</p>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function BriefBar({
  dateType,
  setDateType,
  period,
  setPeriod,
  summaryItems,
  topRoute,
  topVessel,
}: {
  dateType: "booking" | "departure";
  setDateType: (dateType: "booking" | "departure") => void;
  period: "today" | "mtd" | "ytd";
  setPeriod: (period: "today" | "mtd" | "ytd") => void;
  summaryItems: Array<{ label: string; value: string; trend?: { direction: TrendDirection; value: string; label: string } }>;
  topRoute: string;
  topVessel: string;
}) {
  const commandItems = [
    ...summaryItems,
    { label: "Top Route", value: topRoute },
    { label: "Top Vessel", value: topVessel },
  ];

  return (
    <Panel className="px-4 py-3">
      <div className="grid gap-3">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-2xl border border-cyan-500/25 bg-cyan-500/10 text-cyan-700 dark:text-cyan-200">
              <Bot className="size-5" />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate text-lg font-semibold leading-tight text-foreground dark:text-white">
                  Executive Command Center
                </h1>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-200">
                  <Radio className="size-3.5 animate-pulse" />
                  Live
                </span>
              </div>
              <p className="mt-1 truncate text-xs text-muted-foreground">Revenue, profitability, targets, and operating risk</p>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <div className="flex rounded-xl border border-border/70 bg-muted/35 p-1 dark:border-white/10">
              {(["today", "mtd", "ytd"] as const).map((item) => (
                <button
                  key={item}
                  onClick={() => setPeriod(item)}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em]",
                    period === item ? "bg-background text-cyan-700 shadow-sm dark:bg-white/10 dark:text-cyan-200" : "text-muted-foreground",
                  )}
                >
                  {item}
                </button>
              ))}
            </div>
            <div className="flex rounded-xl border border-border/70 bg-muted/35 p-1 dark:border-white/10">
              {(["booking", "departure"] as const).map((item) => (
                <button
                  key={item}
                  onClick={() => setDateType(item)}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-xs font-medium capitalize",
                    dateType === item ? "bg-background text-cyan-700 shadow-sm dark:bg-white/10 dark:text-cyan-200" : "text-muted-foreground",
                  )}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-8">
          {commandItems.map((item) => (
            <div key={item.label} className="min-w-0 rounded-xl border border-border/70 bg-card/70 px-3 py-2 dark:border-white/10 dark:bg-white/[0.045]">
              <p className="truncate text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{item.label}</p>
              <p className="mt-1 truncate text-xl font-semibold leading-none tabular-nums text-foreground dark:text-white">{item.value}</p>
              {"trend" in item && item.trend && (
                <div className="mt-2">
                  <TrendBadge {...item.trend} />
                </div>
              )}
            </div>
          ))}
        </div>
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
        return;
      }

      try {
        const [activity, schedule, heatmap] = await Promise.allSettled([
          dashboardWidgetsService.getRecentActivity(activeTenant.api_base_url, 20, activeTenant.service_key),
          dashboardWidgetsService.getTodaySchedule(activeTenant.api_base_url, activeTenant.service_key),
          dashboardWidgetsService.getCapacityHeatmap(activeTenant.api_base_url, undefined, undefined, activeTenant.service_key),
        ]);
        if (activity.status === "fulfilled") setRecentActivity(activity.value);
        if (schedule.status === "fulfilled") setTodaySchedule(schedule.value);
        if (heatmap.status === "fulfilled") setCapacityHeatmap(heatmap.value);
      } catch (widgetError) {
        console.error("Dashboard widget error:", widgetError);
      }
    }
    fetchWidgets();
  }, [activeTenant, isTenantLoading]);

  const fd = financeData;
  const todayNet = fd?.kpi_today.net_revenue ?? 0;
  const mtdNet = fd?.kpi_mtd.net_revenue ?? 0;
  const ytdNet = fd?.kpi_ytd.net_revenue ?? 0;
  const daysElapsed = new Date().getDate();
  const dailyPace = daysElapsed ? mtdNet / daysElapsed : 0;
  const activeVessels = (legacyData?.revenue_by_vessel ?? []).filter((v) => v.total_revenue > 0).length;
  const activeRoutes = fd?.revenue_by_route.filter((route) => route.net_revenue > 0).length ?? 0;
  const activeTrips = todaySchedule.length || fd?.kpi.total_trips || legacyData?.kpi.total_trips || 0;
  const passengerVolume = fd?.kpi.total_passengers ?? legacyData?.kpi.total_passengers ?? 0;
  const cargoRevenue = legacyData?.passenger_vs_cargo?.cargo_revenue ?? 0;
  const cargoVolume = legacyData?.kpi.total_cargo_units ?? recentActivity.reduce((sum, item) => sum + (item.cargo_count ?? 0), 0);
  const cancellationCount = todaySchedule.filter((trip) => /cancel/i.test(trip.status)).length;
  const delayedCount = todaySchedule.filter((trip) => /delay|late/i.test(trip.status)).length;
  const onTimePerformance = todaySchedule.length ? ((todaySchedule.length - delayedCount - cancellationCount) / todaySchedule.length) * 100 : 100;
  const capacityUtilization = todaySchedule.length
    ? todaySchedule.reduce((sum, trip) => sum + (trip.pax_utilization_pct ?? 0), 0) / todaySchedule.length
    : 0;
  const cancellationRate = activeTrips ? (cancellationCount / activeTrips) * 100 : 0;
  const netRevenue = fd?.kpi.net_revenue ?? 0;
  const grossRevenue = fd?.kpi.gross_revenue ?? legacyData?.kpi.total_revenue ?? 0;
  const refundAmount = fd?.kpi.refund_amount ?? 0;
  const expenses = legacyData?.kpi.total_expenses ?? 0;
  const netProfit = netRevenue - expenses;
  const profitMargin = (fd?.kpi.profit_margin ?? 0) * 100;
  const mtdProjection = fd?.forecast.mtd_projection ?? 0;
  const targetAchievement = mtdProjection ? (mtdNet / mtdProjection) * 100 : 0;
  const revenueGrowth = fd?.comparisons.last_month.delta_pct ?? 0;
  const bookingGrowth = fd?.comparisons.last_week.delta_pct ?? 0;
  const completedTrips = todaySchedule.filter((trip) => /complete|arrived|done/i.test(trip.status)).length;
  const ongoingTrips = todaySchedule.filter((trip) => /ongoing|departed|sailing|active/i.test(trip.status)).length;
  const cashCollected = grossRevenue;
  const netCashToday = cashCollected - refundAmount - expenses;

  const executiveKpis = useExecutiveKPIs(fd, legacyData);
  const routeInsights = useRouteInsights(fd, todaySchedule);
  const forecastMetrics = useForecastMetrics(fd, routeInsights);

  const sortedRoutes = useMemo(
    () => [...(fd?.revenue_by_route ?? [])].sort((a, b) => b.net_revenue - a.net_revenue),
    [fd],
  );
  const topVessels = useMemo(
    () => [...(legacyData?.revenue_by_vessel ?? [])].sort((a, b) => b.total_revenue - a.total_revenue).slice(0, 4),
    [legacyData],
  );
  const topChannels = useMemo(
    () => [...(fd?.revenue_by_channel ?? [])].sort((a, b) => b.net_revenue - a.net_revenue).slice(0, 4),
    [fd],
  );
  const trendData = (fd?.revenue_trend ?? []).slice(-14);
  const passengerSparkline = capacityHeatmap.slice(-14).map((item) => item.booked);
  const cargoSparkline = recentActivity.slice(-14).map((item) => item.cargo_count);
  const bookingSparkline = trendData.map((item) => item.gross_revenue);
  const topRoute = sortedRoutes[0];
  const topVessel = topVessels[0];
  const topChannel = topChannels[0];

  const healthChecks = [
    { label: "Revenue Growth", state: revenueGrowth >= 0 ? "good" : "bad" },
    { label: "Bookings Growth", state: bookingGrowth >= 0 ? "good" : "watch" },
    { label: "Profitability", state: profitMargin >= 20 ? "good" : profitMargin >= 8 ? "watch" : "bad" },
    { label: "Operations", state: onTimePerformance >= 90 ? "good" : onTimePerformance >= 75 ? "watch" : "bad" },
    { label: "Risk", state: forecastMetrics.risk === "High" ? "bad" : forecastMetrics.risk === "Medium" ? "watch" : "good" },
  ] as Array<{ label: string; state: "good" | "watch" | "bad" }>;
  const businessHealthScore = Math.round(
    Math.max(0, Math.min(100,
      (revenueGrowth >= 0 ? 20 : 5) +
      (bookingGrowth >= 0 ? 18 : 8) +
      clampPct(profitMargin) * 0.25 +
      clampPct(onTimePerformance) * 0.22 +
      (forecastMetrics.risk === "Low" ? 15 : forecastMetrics.risk === "Medium" ? 8 : 2)
    ))
  );
  const topRouteRows = (sortedRoutes.length ? sortedRoutes : [
    { route_name: "Route data syncing", net_revenue: 0, profit_margin: 0, gross_revenue: 0, refund_amount: 0, expenses: 0, profit_class: "low", booking_count: 0 },
  ]).slice(0, 5).map((route) => [
    route.route_name,
    fmtCurrency(route.net_revenue),
    fmtSignedPercent(route.profit_margin * 100),
  ]);
  const vesselLoadByName = new Map<string, number[]>();
  for (const trip of todaySchedule) {
    const values = vesselLoadByName.get(trip.vessel_name) ?? [];
    values.push(trip.pax_utilization_pct ?? 0);
    vesselLoadByName.set(trip.vessel_name, values);
  }
  const topVesselRows = (topVessels.length ? topVessels : [
    { vessel_name: "Vessel data syncing", vessel_type: "Fleet", total_revenue: 0 },
  ]).slice(0, 5).map((vessel) => {
    const loads = vesselLoadByName.get(vessel.vessel_name) ?? [];
    const load = loads.length ? loads.reduce((sum, value) => sum + value, 0) / loads.length : 0;
    return [vessel.vessel_name, fmtCurrency(vessel.total_revenue), fmtPercent(load)];
  });
  const channelMixRows = (fd?.revenue_by_channel ?? []).map((channel) => ({
    label: channel.channel,
    value: channel.net_revenue,
    pct: channel.revenue_share_pct,
  }));
  const riskRows = [
    ...sortedRoutes.filter((route) => route.booking_count > 0).slice(0, 3).map((route) => ({
      label: route.route_name,
      metric: route.profit_margin < 0.1 ? `${fmtSignedPercent(route.profit_margin * 100)} margin` : `${fmtNumber(route.booking_count)} bookings`,
      severity: route.profit_margin < 0 ? "critical" as const : route.profit_margin < 0.1 ? "warning" as const : "normal" as const,
    })),
    ...todaySchedule.filter((trip) => trip.pax_utilization_pct >= 85 || /delay|late|maintenance/i.test(trip.status)).slice(0, 3).map((trip) => ({
      label: trip.pax_utilization_pct >= 85 ? trip.route_name : trip.vessel_name,
      metric: trip.pax_utilization_pct >= 85 ? `${fmtPercent(trip.pax_utilization_pct)} capacity` : trip.status,
      severity: trip.pax_utilization_pct >= 95 ? "critical" as const : "warning" as const,
    })),
  ].slice(0, 5);
  const aiInsights = [
    `Revenue is projected at ${fmtCurrency(forecastMetrics.confidenceBand.expected)} with ${fmtPercent(targetAchievement)} target achievement.`,
    `${topRoute?.route_name ?? "Top route"} contributes ${topRoute && netRevenue ? fmtPercent((topRoute.net_revenue / netRevenue) * 100) : "0.0%"} of total revenue.`,
    `${topChannel?.channel ?? "Primary channel"} bookings represent ${topChannel ? fmtPercent(topChannel.revenue_share_pct) : "0.0%"} of channel revenue.`,
    `Cargo revenue is ${fmtCurrency(cargoRevenue)} with ${fmtNumber(cargoVolume)} cargo units tracked.`,
    `${riskRows.filter((risk) => risk.severity !== "normal").length} route or vessel signals require executive attention.`,
  ];

  if (error && !financeData) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="bi-panel flex max-w-md flex-col items-center gap-3 rounded-2xl p-8 text-center">
          <XCircle className="h-10 w-10 text-red-400" />
          <p className="font-semibold text-foreground dark:text-white">Failed to load dashboard data</p>
          <p className="text-sm text-muted-foreground">{error}</p>
          <button
            onClick={fetchOverview}
            className="flex items-center gap-1.5 rounded-xl border border-cyan-500/20 bg-cyan-500/10 px-3 py-2 text-sm text-cyan-700 dark:border-cyan-300/20 dark:bg-cyan-300/10 dark:text-cyan-100"
          >
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

      <BriefBar
        dateType={dateType}
        setDateType={setDateType}
        period={period}
        setPeriod={setPeriod}
        topRoute={topRoute?.route_name ?? "N/A"}
        topVessel={topVessel?.vessel_name ?? "N/A"}
        summaryItems={[
          {
            label: "Revenue Today",
            value: isLoading ? "..." : fmtCurrency(todayNet),
            trend: { direction: trendDirection(pctDelta(todayNet, dailyPace)), value: fmtSignedPercent(pctDelta(todayNet, dailyPace)), label: "vs pace" },
          },
          {
            label: "MTD Revenue",
            value: isLoading ? "..." : fmtCurrency(mtdNet),
            trend: { direction: trendDirection(revenueGrowth), value: fmtSignedPercent(revenueGrowth), label: "vs LM" },
          },
          {
            label: "YTD Revenue",
            value: isLoading ? "..." : fmtCurrency(ytdNet),
            trend: { direction: trendDirection(revenueGrowth), value: fmtSignedPercent(revenueGrowth), label: "growth" },
          },
          {
            label: "Forecast EOM",
            value: fmtCurrency(forecastMetrics.confidenceBand.expected),
            trend: { direction: trendDirection(targetAchievement - 80), value: fmtPercent(targetAchievement), label: "target" },
          },
          {
            label: "Net Profit",
            value: fmtCurrency(netProfit),
            trend: { direction: trendDirection(netProfit), value: fmtPercent(profitMargin), label: "margin" },
          },
          {
            label: "Health Score",
            value: `${businessHealthScore}/100`,
            trend: { direction: businessHealthScore >= 75 ? "up" : businessHealthScore >= 55 ? "flat" : "down", value: forecastMetrics.risk, label: "risk" },
          },
        ]}
      />

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <CriticalKpiCard
          label="Passenger Volume"
          value={isLoading ? "..." : fmtNumber(passengerVolume)}
          icon={Users}
          active
          tone="cyan"
          trend={{ direction: trendDirection(pctDelta(passengerVolume, fd?.comparisons.last_month.booking_count ?? 0)), value: fmtSignedPercent(pctDelta(passengerVolume, fd?.comparisons.last_month.booking_count ?? 0)), label: "vs LM" }}
        />
        <CriticalKpiCard
          label="Cargo Volume"
          value={isLoading ? "..." : fmtNumber(cargoVolume)}
          icon={Boxes}
          tone="emerald"
          trend={{ direction: cargoVolume > 0 ? "up" : "flat", value: cargoVolume > 0 ? fmtCurrency(cargoRevenue) : "0 units", label: "cargo" }}
        />
        <CriticalKpiCard
          label="Trips Today"
          value={isLoading ? "..." : fmtNumber(activeTrips)}
          icon={CalendarDays}
          tone="violet"
          trend={{ direction: activeTrips ? "up" : "flat", value: fmtNumber(completedTrips), label: "completed" }}
        />
        <CriticalKpiCard
          label="Capacity Utilization"
          value={isLoading ? "..." : fmtPercent(capacityUtilization)}
          icon={Gauge}
          tone="cyan"
          trend={{ direction: trendDirection(capacityUtilization - 70), value: fmtNumber(activeRoutes), label: "routes" }}
        />
        <CriticalKpiCard
          label="On-Time Performance"
          value={isLoading ? "..." : fmtPercent(onTimePerformance)}
          icon={Clock}
          tone={onTimePerformance < 85 ? "amber" : "emerald"}
          trend={{ direction: trendDirection(onTimePerformance - 90), value: fmtNumber(delayedCount), label: "delayed" }}
        />
        <CriticalKpiCard
          label="Cancellation Rate"
          value={isLoading ? "..." : fmtPercent(cancellationRate)}
          icon={XCircle}
          tone={cancellationRate > 5 ? "rose" : "slate"}
          trend={{ direction: cancellationRate > 5 ? "down" : "flat", value: fmtNumber(cancellationCount), label: "canceled" }}
        />
      </section>

      <section className="grid grid-cols-1 gap-3 xl:grid-cols-12">
        <Panel className="overflow-visible xl:col-span-8">
          <SectionHeader eyebrow="Revenue" title="Revenue Trend" meta={`${period.toUpperCase()} ledger movement`} />
          {isLoading ? (
            <div className="p-4">
              <Skeleton className="h-[220px] rounded-2xl bg-muted dark:bg-white/10" />
            </div>
          ) : trendData.length === 0 ? (
            <div className="grid gap-3 p-3.5 sm:grid-cols-3">
              <CompactMetric label="Net Revenue" value={fmtCurrency(netRevenue)} meta="awaiting trend buckets" />
              <CompactMetric label="Gross Revenue" value={fmtCurrency(grossRevenue)} meta="ledger source" />
              <CompactMetric label="Bookings" value={fmtNumber(fd?.kpi.booking_count)} meta="sync pending" />
            </div>
          ) : (
            <RevenueTrendChart data={trendData} period={period} />
          )}
        </Panel>
        <BusinessHealthScore className="xl:col-span-4" score={businessHealthScore} checks={healthChecks} />
      </section>

      <section className="grid grid-cols-1 items-stretch gap-3 xl:grid-cols-12">
        <div className="h-full xl:col-span-4">
          <WaterfallCard gross={grossRevenue} refunds={refundAmount} expenses={expenses} netProfit={netProfit} />
        </div>
        <div className="h-full xl:col-span-4">
          <TargetTracker target={mtdProjection || Math.max(mtdNet, grossRevenue)} achieved={mtdNet} />
        </div>
        <div className="h-full xl:col-span-4">
          <CashPosition cashCollected={cashCollected} refunds={refundAmount} expenses={expenses} netCash={netCashToday} />
        </div>
      </section>

      <section className="grid grid-cols-1 items-stretch gap-3 xl:grid-cols-2">
        <ExecutiveTable title="Top Routes" columns={["Route", "Revenue", "Growth"]} rows={topRouteRows} />
        <ExecutiveTable title="Top Vessels" columns={["Vessel", "Revenue", "Load Factor"]} rows={topVesselRows} />
      </section>

      <section className="grid grid-cols-1 items-stretch gap-3 xl:grid-cols-12">
        <div className="h-full xl:col-span-4">
          <ChannelDonut channels={channelMixRows} />
        </div>
        <div className="h-full xl:col-span-8">
          <FleetSnapshot
            activeVessels={activeVessels}
            trips={activeTrips}
            completed={completedTrips}
            ongoing={ongoingTrips || Math.max(0, activeTrips - completedTrips - delayedCount - cancellationCount)}
            delayed={delayedCount}
          />
        </div>
      </section>

      <section className="grid grid-cols-1 items-stretch gap-3 xl:grid-cols-12">
        <div className="h-full xl:col-span-4">
          <RiskRadar risks={riskRows} />
        </div>
        <Panel className="h-full xl:col-span-4">
          <SectionHeader eyebrow="Trends" title="Demand Signals" meta="passenger, cargo, bookings" />
          <div className="grid h-[calc(100%-53px)] gap-2 p-3.5">
            <SignalRow label="Passenger Trend" value={fmtNumber(passengerVolume)} delta={pctDelta(passengerVolume, fd?.comparisons.last_month.booking_count ?? 0)} values={passengerSparkline} tone="#0ea5e9" icon={Users} />
            <SignalRow label="Cargo Trend" value={fmtNumber(cargoVolume)} delta={cargoRevenue > 0 ? 8.4 : 0} values={cargoSparkline} tone="#22c55e" icon={Boxes} />
            <SignalRow label="Booking Trend" value={fmtNumber(fd?.kpi.booking_count)} delta={fd?.comparisons.last_week.delta_pct ?? 0} values={bookingSparkline} tone="#8b5cf6" icon={CalendarDays} />
          </div>
        </Panel>
        <div className="h-full xl:col-span-4">
          <AIExecutiveInsights insights={aiInsights} />
        </div>
      </section>

      <section className="grid grid-cols-1 items-stretch gap-3 xl:grid-cols-12">
        <div className="h-full xl:col-span-5">
          <RevenueHeatmap routes={sortedRoutes.map((route) => route.route_name)} cells={capacityHeatmap} />
        </div>
        <Panel className="h-full xl:col-span-7">
          <SectionHeader eyebrow="Forecast" title="Forecast & Target Achievement" meta={`Forecast risk ${forecastMetrics.risk}`} />
          <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-4">
            <ForecastCard label="Revenue Forecast" value={fmtCurrency(forecastMetrics.confidenceBand.expected)} meta={`${fmtCurrency(forecastMetrics.confidenceBand.low)} low | ${fmtCurrency(forecastMetrics.confidenceBand.high)} high`} progress={targetAchievement} tone="cyan" />
            <ForecastCard label="MTD Projection" value={fmtCurrency(mtdProjection)} meta={fd?.forecast.pacing_status ?? "calibrating"} progress={targetAchievement} tone={targetAchievement >= 100 ? "emerald" : "amber"} />
            <ForecastCard label="Target Achievement" value={fmtPercent(targetAchievement)} meta={`${fmtCurrency(mtdNet)} realized`} progress={targetAchievement} tone={targetAchievement >= 100 ? "emerald" : targetAchievement >= 75 ? "amber" : "rose"} />
            <ForecastCard label="Growth Trend" value={fmtSignedPercent(revenueGrowth)} meta={`${executiveKpis.efficiencyIndex.score}/100 efficiency index`} progress={Math.max(0, Math.min(100, 50 + revenueGrowth))} tone={revenueGrowth >= 0 ? "emerald" : "rose"} />
          </div>
        </Panel>
      </section>
    </div>
  );
}
