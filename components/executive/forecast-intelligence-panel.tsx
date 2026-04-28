"use client";

import type { ForecastRouteDriver } from "@/hooks/use-executive-intelligence";

const fmtCurrency = (v: number) => {
  if (v >= 1_000_000) return `P${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000) return `P${(v / 1_000).toFixed(0)}K`;
  return `P${v.toLocaleString()}`;
};

export function ForecastIntelligencePanel({
  confidenceBand,
  drivers,
  risk,
}: {
  confidenceBand: { low: number; expected: number; high: number };
  drivers: ForecastRouteDriver[];
  risk: "Low" | "Medium" | "High";
}) {
  return (
    <section className="rounded-md border border-border bg-card p-3 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-semibold">Forecast Intelligence</h3>
          <p className="text-[11px] text-muted-foreground">Confidence band, route drivers, and risk signal</p>
        </div>
        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${risk === "High" ? "bg-rose-100 text-rose-700" : risk === "Medium" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>
          {risk} Risk
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="rounded border border-border p-2">
          <p className="text-[10px] text-muted-foreground">Low</p>
          <p className="text-sm font-semibold tabular-nums">{fmtCurrency(confidenceBand.low)}</p>
        </div>
        <div className="rounded border border-border p-2">
          <p className="text-[10px] text-muted-foreground">Expected</p>
          <p className="text-sm font-semibold tabular-nums">{fmtCurrency(confidenceBand.expected)}</p>
        </div>
        <div className="rounded border border-border p-2">
          <p className="text-[10px] text-muted-foreground">High</p>
          <p className="text-sm font-semibold tabular-nums">{fmtCurrency(confidenceBand.high)}</p>
        </div>
      </div>

      <div className="space-y-1">
        <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">End-of-Month Projection Drivers</p>
        {drivers.map((d) => (
          <div key={d.route_name} className="flex items-center justify-between text-xs border-b border-border/60 py-1">
            <span className="truncate max-w-[65%]">{d.route_name}</span>
            <span className="tabular-nums text-muted-foreground">{d.share_pct.toFixed(1)}%</span>
            <span className="tabular-nums font-medium">{fmtCurrency(d.projected)}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
