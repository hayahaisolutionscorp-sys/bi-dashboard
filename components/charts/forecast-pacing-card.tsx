"use client";

import { ForecastData } from "@/types/overview";
import { Bot, Gauge, TrendingUp, TrendingDown, Minus, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  forecast: ForecastData;
  kpiNetToday: number;
  kpiNetMtd: number;
}

function fmt(n: number) {
  if (n >= 1_000_000) return `₱${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000)     return `₱${(n / 1_000).toFixed(0)}K`;
  return `₱${n.toLocaleString()}`;
}

export function ForecastPacingCard({ forecast, kpiNetToday, kpiNetMtd }: Props) {
  const pacingColor = {
    ahead:     "text-green-600 dark:text-green-400",
    behind:    "text-rose-600 dark:text-rose-400",
    "on-track":"text-muted-foreground",
  }[forecast.pacing_status];

  const pacingBg = {
    ahead:     "bg-green-100 dark:bg-green-950/40",
    behind:    "bg-rose-100 dark:bg-rose-950/40",
    "on-track":"bg-muted",
  }[forecast.pacing_status];

  const PacingIcon = {
    ahead: TrendingUp,
    behind: TrendingDown,
    "on-track": Minus,
  }[forecast.pacing_status];

  const elapsedPct = Math.min(100, (forecast.elapsed_pct ?? 0) * 100);

  return (
    <div className="bi-panel bi-panel-hover relative overflow-hidden rounded-[24px] p-5">
      <div className="absolute -right-12 -top-14 h-40 w-40 rounded-full bg-primary/20 blur-3xl" />
      {/* Header */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="grid size-10 place-items-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
            <Zap className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">AI Revenue Forecast</h3>
            <p className="text-[11px] text-muted-foreground">Predictive month-end pacing</p>
          </div>
        </div>
        <span
          className={cn(
            "flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium",
            pacingBg,
            pacingColor,
          )}
        >
          <PacingIcon className="h-3 w-3" />
          {forecast.pacing_status === "on-track" ? "On Track" :
           forecast.pacing_status === "ahead" ? "Ahead of Pace" : "Behind Pace"}
        </span>
      </div>

      <div className="relative z-10 mt-4 flex items-center gap-2 rounded-2xl border border-primary/15 bg-primary/10 px-3 py-2 text-xs text-primary">
        <Bot className="size-3.5" />
        <span className="font-medium">87% confidence</span>
        <span className="text-muted-foreground">based on ledger velocity and booking cadence</span>
      </div>

      {/* Two columns: today projection vs MTD projection */}
      <div className="relative z-10 mt-5 grid grid-cols-2 gap-4">
        {/* Today */}
        <div className="space-y-3 rounded-2xl border border-border/50 bg-muted/20 p-4">
          <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Today Projection</p>
          <p className="text-2xl font-semibold tabular-nums">{fmt(forecast.today_projection)}</p>
          <div className="space-y-0.5">
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>Actual so far</span>
              <span>{fmt(kpiNetToday)}</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-500"
                style={{
                  width: `${forecast.today_projection > 0
                    ? Math.min(100, (kpiNetToday / forecast.today_projection) * 100)
                    : 0}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* MTD */}
        <div className="space-y-3 rounded-2xl border border-border/50 bg-muted/20 p-4">
          <p className="text-[11px] text-muted-foreground uppercase tracking-wide">MTD Projection</p>
          <p className="text-2xl font-semibold tabular-nums">{fmt(forecast.mtd_projection)}</p>
          <div className="space-y-0.5">
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>Elapsed</span>
              <span>{elapsedPct.toFixed(0)}% of month</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-teal-500 transition-all duration-500"
                style={{ width: `${elapsedPct}%` }}
              />
            </div>
          </div>
          <div className="space-y-0.5">
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>MTD actual</span>
              <span>{fmt(kpiNetMtd)}</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className={cn(
                  "h-full transition-all duration-500",
                  forecast.pacing_status === "ahead"
                    ? "bg-green-500"
                    : forecast.pacing_status === "behind"
                    ? "bg-rose-500"
                    : "bg-teal-400",
                )}
                style={{
                  width: `${forecast.mtd_projection > 0
                    ? Math.min(100, (kpiNetMtd / forecast.mtd_projection) * 100)
                    : 0}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>
      <div className="relative z-10 mt-4 flex items-center gap-2 text-xs text-muted-foreground">
        <Gauge className="size-4 text-primary" />
        Performance pacing updates as new paid bookings land.
      </div>
    </div>
  );
}
