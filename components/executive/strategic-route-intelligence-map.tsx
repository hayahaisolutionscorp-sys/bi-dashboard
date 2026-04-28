"use client";

import { useMemo, useState } from "react";

type Layer = "profit" | "demand" | "risk";

function colorBy(layer: Layer, value: number): string {
  if (layer === "profit") {
    if (value >= 30) return "bg-emerald-500";
    if (value >= 15) return "bg-emerald-300";
    if (value >= 0) return "bg-amber-400";
    return "bg-rose-500";
  }
  if (layer === "demand") {
    if (value > 30) return "bg-sky-500";
    if (value > 10) return "bg-sky-300";
    if (value > -10) return "bg-muted";
    if (value > -30) return "bg-indigo-300";
    return "bg-indigo-500";
  }
  if (value >= 75) return "bg-rose-600";
  if (value >= 50) return "bg-rose-400";
  if (value >= 25) return "bg-amber-400";
  return "bg-emerald-400";
}

export function StrategicRouteIntelligenceMap({
  rows,
}: {
  rows: Array<{ route: string; profitMargin: number; demandGap: number; riskScore: number }>;
}) {
  const [layer, setLayer] = useState<Layer>("profit");

  const sorted = useMemo(() => {
    const copy = [...rows];
    if (layer === "profit") return copy.sort((a, b) => b.profitMargin - a.profitMargin);
    if (layer === "demand") return copy.sort((a, b) => b.demandGap - a.demandGap);
    return copy.sort((a, b) => b.riskScore - a.riskScore);
  }, [rows, layer]);

  return (
    <section className="rounded-md border border-border bg-card p-3 space-y-2">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h3 className="text-xs font-semibold">Strategic Route Intelligence Map</h3>
          <p className="text-[11px] text-muted-foreground">Layered route signals: profit, demand-capacity gap, and risk</p>
        </div>
        <div className="flex items-center gap-1 rounded border border-border p-1">
          <button onClick={() => setLayer("profit")} className={`text-[11px] px-2 py-1 rounded ${layer === "profit" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>Profit</button>
          <button onClick={() => setLayer("demand")} className={`text-[11px] px-2 py-1 rounded ${layer === "demand" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>Demand Gap</button>
          <button onClick={() => setLayer("risk")} className={`text-[11px] px-2 py-1 rounded ${layer === "risk" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>Risk</button>
        </div>
      </div>

      <div className="space-y-1">
        {sorted.slice(0, 10).map((r) => {
          const value = layer === "profit" ? r.profitMargin : layer === "demand" ? r.demandGap : r.riskScore;
          const width = Math.min(100, Math.max(2, Math.abs(value)));
          return (
            <div key={r.route} className="grid grid-cols-[1fr_auto] gap-2 items-center">
              <div>
                <div className="flex items-center justify-between text-xs mb-0.5">
                  <span className="truncate max-w-[70%]">{r.route}</span>
                  <span className="tabular-nums text-muted-foreground">{value.toFixed(1)}{layer === "profit" || layer === "demand" ? "%" : ""}</span>
                </div>
                <div className="h-2 rounded bg-muted overflow-hidden">
                  <div className={`h-full ${colorBy(layer, value)}`} style={{ width: `${width}%` }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
