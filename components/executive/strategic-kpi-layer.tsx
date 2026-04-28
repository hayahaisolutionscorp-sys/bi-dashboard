"use client";

import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import type { StrategicKpiItem } from "@/hooks/use-executive-intelligence";
import { TinySparkline, trendColor } from "./executive-shared";

export function StrategicKPILayer({
  items,
  efficiency,
}: {
  items: StrategicKpiItem[];
  efficiency: { score: number; trend: number; sparkline: number[] };
}) {
  return (
    <section className="grid grid-cols-1 gap-2 lg:grid-cols-3 xl:grid-cols-6">
      {items.map((kpi) => (
        <div key={kpi.label} className="rounded-md border border-border bg-card p-3 space-y-1">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{kpi.label}</p>
          <p className="text-base font-semibold tabular-nums">{kpi.value}</p>
          <div className={`flex items-center gap-1 text-[11px] ${trendColor(kpi.trend)}`}>
            {kpi.trend === "up" ? <TrendingUp className="h-3.5 w-3.5" /> : kpi.trend === "down" ? <TrendingDown className="h-3.5 w-3.5" /> : <Minus className="h-3.5 w-3.5" />}
            <span>{kpi.delta}</span>
          </div>
        </div>
      ))}

      <div className="rounded-md border border-border bg-card p-3 space-y-1">
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Operational Efficiency Index</p>
        <p className="text-base font-semibold tabular-nums">{efficiency.score}/100</p>
        <div className={`flex items-center gap-1 text-[11px] ${trendColor(efficiency.trend > 1 ? "up" : efficiency.trend < -1 ? "down" : "flat")}`}>
          {efficiency.trend > 1 ? <TrendingUp className="h-3.5 w-3.5" /> : efficiency.trend < -1 ? <TrendingDown className="h-3.5 w-3.5" /> : <Minus className="h-3.5 w-3.5" />}
          <span>{efficiency.trend >= 0 ? "+" : ""}{efficiency.trend.toFixed(1)}%</span>
        </div>
        <TinySparkline values={efficiency.sparkline} />
      </div>
    </section>
  );
}
