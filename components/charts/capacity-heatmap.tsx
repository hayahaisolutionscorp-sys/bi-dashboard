"use client";

import { CapacityHeatmapCell } from "@/types/dashboard-widgets";
import { BarChart3 } from "lucide-react";

function cellColor(pct: number): string {
  if (pct >= 90) return "bg-rose-600 text-white";
  if (pct >= 75) return "bg-rose-400 text-white";
  if (pct >= 55) return "bg-amber-400 text-white";
  if (pct >= 35) return "bg-emerald-400 text-white";
  if (pct > 0) return "bg-emerald-200 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-200";
  return "bg-muted text-muted-foreground";
}

export function CapacityHeatmap({ cells }: { cells: CapacityHeatmapCell[] }) {
  if (cells.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-40 text-muted-foreground text-sm gap-2">
        <BarChart3 className="h-6 w-6 opacity-40" />
        <span>No capacity data available</span>
      </div>
    );
  }

  // Build route × date matrix
  const routes = Array.from(new Set(cells.map((c) => c.route_name))).sort();
  const dates = Array.from(new Set(cells.map((c) => c.period_label))).sort();
  const matrix = new Map<string, CapacityHeatmapCell>();
  for (const cell of cells) matrix.set(`${cell.route_name}|${cell.period_label}`, cell);

  // Show only last 14 dates max to keep layout compact
  const visibleDates = dates.slice(-14);

  return (
    <div className="overflow-x-auto px-4 pb-4">
      <table className="w-full text-[10px] border-collapse">
        <thead>
          <tr>
            <th className="text-left pr-2 pb-1 font-medium text-muted-foreground w-32 sticky left-0 bg-card z-10">
              Route
            </th>
            {visibleDates.map((d) => (
              <th key={d} className="pb-1 font-medium text-muted-foreground text-center min-w-[36px]">
                {d.slice(5)} {/* MM-DD */}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {routes.map((route) => (
            <tr key={route}>
              <td
                className="pr-2 py-0.5 font-medium truncate max-w-[8rem] sticky left-0 bg-card z-10"
                title={route}
              >
                {route}
              </td>
              {visibleDates.map((date) => {
                const cell = matrix.get(`${route}|${date}`);
                const pct = cell?.utilization_pct ?? 0;
                return (
                  <td key={date} className="py-0.5 px-0.5">
                    <div
                      title={cell ? `${route} · ${date}: ${pct}% (${cell.booked}/${cell.capacity})` : "No data"}
                      className={`rounded text-center tabular-nums py-1 ${cellColor(pct)}`}
                      style={{ minWidth: 32 }}
                    >
                      {cell ? `${pct.toFixed(0)}%` : "—"}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      {/* Legend */}
      <div className="flex items-center gap-3 mt-3 flex-wrap">
        {[
          { label: "0%", cls: "bg-muted" },
          { label: "35%+", cls: "bg-emerald-200 dark:bg-emerald-900/40" },
          { label: "55%+", cls: "bg-amber-400" },
          { label: "75%+", cls: "bg-rose-400" },
          { label: "90%+", cls: "bg-rose-600" },
        ].map(({ label, cls }) => (
          <span key={label} className="flex items-center gap-1">
            <span className={`inline-block w-3 h-3 rounded ${cls}`} />
            <span className="text-[10px] text-muted-foreground">{label}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
