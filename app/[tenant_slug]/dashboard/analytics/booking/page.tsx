"use client";

import { Ship, CalendarDays, Users, RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { SimpleKpiCard } from "@/components/charts/simple-kpi-card";
import { BiFilterBar } from "@/components/bi-filter-bar";
import { ShadcnBarChartHorizontal } from "@/components/charts/shadcn-bar-chart.horizontal";
import { ShadcnLineChartRegular } from "@/components/charts/shadcn-line-chart-regular";
import { NoDataPlaceholder } from "@/components/charts/no-data-placeholder";
import { useSchedule, useLive } from "@/services/bi/bi.hooks";
import { cn } from "@/lib/utils";

const fmtM = (n: number) => n >= 1_000_000 ? `₱${(n / 1_000_000).toFixed(2)}M` : `₱${n.toLocaleString()}`;

export default function OperationsBookingPage() {
  const { data: sched,    isLoading: schLoading } = useSchedule();
  const { data: live,     isLoading: liveLoading, refetch } = useLive(30_000);

  const s = sched?.summary;

  const dailyTrips = (sched?.trends ?? []).map((t) => ({ date: t.date, trips: t.trip_count }));
  const routeBreakdown = (sched?.breakdown ?? [])
    .slice().sort((a, b) => b.trip_count - a.trip_count)
    .map((r) => ({ label: r.route_name, count: r.trip_count }));

  const liveBookings = (live?.bookings ?? []).slice(0, 20);
  const liveTrips    = live?.trips ?? [];

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-base font-semibold">Operations</h1>
        <BiFilterBar />
      </div>

      <section className="grid grid-cols-3 gap-3">
        <SimpleKpiCard label="Total Trips"      value={schLoading ? "…" : (s?.total_trips ?? 0).toLocaleString()}    icon={Ship}        colorClass="text-violet-500" />
        <SimpleKpiCard label="Trips / Day"      value={schLoading ? "…" : (s?.trips_per_day ?? 0).toFixed(1)}        icon={CalendarDays} colorClass="text-teal-600" />
        <SimpleKpiCard label="Avg Pax / Trip"   value={schLoading ? "…" : (s?.avg_pax_per_trip ?? 0).toFixed(1)}     icon={Users}       colorClass="text-blue-600" />
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          {schLoading ? (
            <div className="p-4"><Skeleton className="h-60 w-full rounded" /></div>
          ) : dailyTrips.length === 0 ? (
            <NoDataPlaceholder height="260px" message="No trip schedule data" />
          ) : (
            <ShadcnLineChartRegular data={dailyTrips} config={{ trips: { label: "Trips", color: "var(--chart-1)" } }} title="Daily Trips" description="Trip count per day" labelKey="date" dataKey="trips" isCurrency={false} />
          )}
        </div>
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          {schLoading ? (
            <div className="p-4 space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-8 w-full rounded" />)}</div>
          ) : routeBreakdown.length === 0 ? (
            <NoDataPlaceholder height="260px" message="No route breakdown data" />
          ) : (
            <ShadcnBarChartHorizontal data={routeBreakdown} config={{ count: { label: "Trips", color: "var(--chart-2)" } }} title="Trips by Route" description="Trip count per route" dataKey="count" labelKey="label" />
          )}
        </div>
      </section>

      {/* Live Bookings */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <div>
              <h2 className="text-xs font-semibold">Live Bookings</h2>
              <p className="text-[11px] text-muted-foreground">Auto-refreshes every 30s</p>
            </div>
            <button onClick={refetch} className="text-muted-foreground hover:text-foreground transition-colors">
              <RefreshCw className={cn("h-3.5 w-3.5", liveLoading && "animate-spin")} />
            </button>
          </div>
          {liveLoading && !live ? (
            <div className="p-4 space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full rounded" />)}</div>
          ) : liveBookings.length === 0 ? (
            <NoDataPlaceholder height="160px" message="No recent bookings" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead><tr className="border-b border-border bg-muted/40"><th className="px-3 py-2 text-left font-medium text-muted-foreground">Ref</th><th className="px-3 py-2 text-left font-medium text-muted-foreground">Route</th><th className="px-3 py-2 text-right font-medium text-muted-foreground">Amount</th><th className="px-3 py-2 text-left font-medium text-muted-foreground">Status</th></tr></thead>
                <tbody>
                  {liveBookings.map((b) => (
                    <tr key={b.booking_reference} className="border-b border-border/60 hover:bg-muted/30">
                      <td className="px-3 py-2 font-mono">{b.booking_reference}</td>
                      <td className="px-3 py-2 text-muted-foreground truncate max-w-[120px]">{b.route_name}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{fmtM(b.total_amount)}</td>
                      <td className="px-3 py-2"><span className="rounded-full px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-[10px] font-medium">{b.booking_status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Upcoming Trips */}
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="px-4 pt-4 pb-2">
            <h2 className="text-xs font-semibold">Upcoming Trips</h2>
            <p className="text-[11px] text-muted-foreground">Scheduled departures</p>
          </div>
          {liveLoading && !live ? (
            <div className="p-4 space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded" />)}</div>
          ) : liveTrips.length === 0 ? (
            <NoDataPlaceholder height="160px" message="No upcoming trips" />
          ) : (
            <div className="divide-y divide-border/60">
              {liveTrips.map((t) => (
                <div key={t.trip_id} className="px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium">{t.route_name}</p>
                    <p className="text-[11px] text-muted-foreground">{t.vessel_name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] tabular-nums text-muted-foreground">{new Date(t.scheduled_departure).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                    <span className="rounded-full px-1.5 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-[10px]">{t.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
