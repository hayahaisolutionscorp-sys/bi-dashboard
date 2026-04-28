"use client";

import { Ship, CalendarDays, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { SimpleKpiCard } from "@/components/charts/simple-kpi-card";
import { BiFilterBar } from "@/components/bi-filter-bar";
import { ShadcnLineChartRegular } from "@/components/charts/shadcn-line-chart-regular";
import { ShadcnBarChartHorizontal } from "@/components/charts/shadcn-bar-chart.horizontal";
import { NoDataPlaceholder } from "@/components/charts/no-data-placeholder";
import { useSchedule } from "@/services/bi/bi.hooks";

export default function OperationsPage() {
  const { data, isLoading } = useSchedule();
  const s = data?.summary;

  const dailyTrips = (data?.trends ?? []).map((t) => ({ date: t.date, trips: t.trip_count }));
  const routeBreakdown = (data?.breakdown ?? [])
    .slice().sort((a, b) => b.trip_count - a.trip_count)
    .map((r) => ({ label: r.route_name, count: r.trip_count }));

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-base font-semibold">Schedule Utilization</h1>
        <BiFilterBar />
      </div>

      <section className="grid grid-cols-3 gap-3">
        <SimpleKpiCard label="Total Trips"    value={isLoading ? "…" : (s?.total_trips ?? 0).toLocaleString()} icon={Ship}        colorClass="text-violet-500" />
        <SimpleKpiCard label="Trips / Day"    value={isLoading ? "…" : (s?.trips_per_day ?? 0).toFixed(1)}    icon={CalendarDays} colorClass="text-teal-600" />
        <SimpleKpiCard label="Avg Pax / Trip" value={isLoading ? "…" : (s?.avg_pax_per_trip ?? 0).toFixed(1)} icon={Users}       colorClass="text-blue-600" />
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          {isLoading ? (
            <div className="p-4"><Skeleton className="h-60 w-full rounded" /></div>
          ) : dailyTrips.length === 0 ? (
            <NoDataPlaceholder height="260px" message="No trip schedule data" />
          ) : (
            <ShadcnLineChartRegular data={dailyTrips} config={{ trips: { label: "Trips", color: "var(--chart-1)" } }} title="Daily Trips" description="Trip count per day in selected period" labelKey="date" dataKey="trips" isCurrency={false} />
          )}
        </div>
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          {isLoading ? (
            <div className="p-4 space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-8 w-full rounded" />)}</div>
          ) : routeBreakdown.length === 0 ? (
            <NoDataPlaceholder height="260px" message="No route breakdown data" />
          ) : (
            <ShadcnBarChartHorizontal data={routeBreakdown} config={{ count: { label: "Trips", color: "var(--chart-2)" } }} title="Trips by Route" description="Trip frequency per route" dataKey="count" labelKey="label" />
          )}
        </div>
      </section>

      {/* Detailed Route Table */}
      <section>
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="px-4 pt-4 pb-2">
            <h2 className="text-xs font-semibold">Route Schedule Details</h2>
          </div>
          {isLoading ? (
            <div className="p-4 space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full rounded" />)}</div>
          ) : (data?.breakdown ?? []).length === 0 ? (
            <NoDataPlaceholder height="160px" message="No route data" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">Route</th>
                    <th className="px-3 py-2 text-right font-medium text-muted-foreground">Trips</th>
                    <th className="px-3 py-2 text-right font-medium text-muted-foreground">Avg Pax</th>
                    <th className="px-3 py-2 text-right font-medium text-muted-foreground">Avg Cargo</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.breakdown ?? [])
                    .slice().sort((a, b) => b.trip_count - a.trip_count)
                    .map((r, i) => (
                      <tr key={i} className="border-b border-border/60 hover:bg-muted/30">
                        <td className="px-3 py-2 font-medium">{r.route_name}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{r.trip_count}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{r.avg_pax_per_trip.toFixed(1)}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{r.avg_cargo_per_trip.toFixed(1)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
