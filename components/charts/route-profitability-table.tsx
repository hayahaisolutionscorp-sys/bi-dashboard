"use client";

import { RouteMetric } from "@/types/overview";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface Props {
  routes: RouteMetric[];
  maxRows?: number;
}

function ProfitBadge({ cls }: { cls: RouteMetric["profit_class"] }) {
  if (cls === "high")
    return (
      <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400">
        <TrendingUp className="h-3 w-3" />
        High
      </span>
    );
  if (cls === "loss")
    return (
      <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400">
        <TrendingDown className="h-3 w-3" />
        Loss
      </span>
    );
  return (
    <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400">
      <Minus className="h-3 w-3" />
      Low
    </span>
  );
}

function MarginBar({ margin }: { margin: number }) {
  const pct = Math.max(0, Math.min(100, margin * 100));
  const color =
    margin < 0
      ? "bg-rose-500"
      : margin < 0.1
      ? "bg-amber-400"
      : "bg-green-500";
  return (
    <div className="flex items-center gap-2 min-w-[80px]">
      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-500", color)}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs tabular-nums text-muted-foreground w-9 text-right">
        {(margin * 100).toFixed(1)}%
      </span>
    </div>
  );
}

export function RouteProfitabilityTable({ routes, maxRows = 8 }: Props) {
  const fmt = (n: number) => `₱${n.toLocaleString()}`;
  const visible = routes.slice(0, maxRows);

  if (!visible.length) {
    return (
      <div className="flex items-center justify-center h-24 text-sm text-muted-foreground">
        No route data available
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border">
            <th className="py-2 px-3 text-left font-medium text-muted-foreground">Route</th>
            <th className="py-2 px-3 text-right font-medium text-muted-foreground">Gross</th>
            <th className="py-2 px-3 text-right font-medium text-muted-foreground">Refunds</th>
            <th className="py-2 px-3 text-right font-medium text-muted-foreground">Net</th>
            <th className="py-2 px-3 text-left font-medium text-muted-foreground w-36">Margin</th>
            <th className="py-2 px-3 text-center font-medium text-muted-foreground">Status</th>
          </tr>
        </thead>
        <tbody>
          {visible.map((r) => (
            <tr
              key={r.route_name}
              className={cn(
                "border-b border-border/50 hover:bg-muted/40 transition-colors",
                r.profit_class === "loss" && "bg-rose-50/40 dark:bg-rose-950/10",
              )}
            >
              <td className="py-2 px-3 font-medium max-w-[180px] truncate">{r.route_name}</td>
              <td className="py-2 px-3 text-right tabular-nums">{fmt(r.gross_revenue)}</td>
              <td className="py-2 px-3 text-right tabular-nums text-rose-500">
                {r.refund_amount > 0 ? `-${fmt(r.refund_amount)}` : "—"}
              </td>
              <td
                className={cn(
                  "py-2 px-3 text-right tabular-nums font-semibold",
                  r.net_revenue < 0 ? "text-rose-500" : "text-foreground",
                )}
              >
                {fmt(r.net_revenue)}
              </td>
              <td className="py-2 px-3">
                <MarginBar margin={r.profit_margin} />
              </td>
              <td className="py-2 px-3 text-center">
                <ProfitBadge cls={r.profit_class} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
