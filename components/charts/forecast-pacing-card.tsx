"use client";

import { ForecastData } from "@/types/overview";
import { TrendingUp, TrendingDown, Minus, Zap } from "lucide-react";
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
    <div className="rounded-md border border-border bg-card p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Revenue Forecast</h3>
        </div>
        <span
          className={cn(
            "flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium",
            pacingBg,
            pacingColor,
          )}
        >
          <PacingIcon className="h-3 w-3" />
          {forecast.pacing_status === "on-track" ? "On Track" :
           forecast.pacing_status === "ahead" ? "Ahead of Pace" : "Behind Pace"}
        </span>
      </div>

      {/* Two columns: today projection vs MTD projection */}
      <div className="grid grid-cols-2 gap-3">
        {/* Today */}
        <div className="space-y-1">
          <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Today Projection</p>
          <p className="text-xl font-bold tabular-nums">{fmt(forecast.today_projection)}</p>
          <div className="space-y-0.5">
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>Actual so far</span>
              <span>{fmt(kpiNetToday)}</span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
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
        <div className="space-y-1">
          <p className="text-[11px] text-muted-foreground uppercase tracking-wide">MTD Projection</p>
          <p className="text-xl font-bold tabular-nums">{fmt(forecast.mtd_projection)}</p>
          <div className="space-y-0.5">
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>Elapsed</span>
              <span>{elapsedPct.toFixed(0)}% of month</span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
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
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
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
    </div>
  );
}
