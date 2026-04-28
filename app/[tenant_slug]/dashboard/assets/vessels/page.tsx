"use client";

import { Ship, Wallet, BarChart2, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { SimpleKpiCard } from "@/components/charts/simple-kpi-card";
import { BiFilterBar } from "@/components/bi-filter-bar";
import { ShadcnBarChartHorizontal } from "@/components/charts/shadcn-bar-chart.horizontal";
import { NoDataPlaceholder } from "@/components/charts/no-data-placeholder";
import { useVessels } from "@/services/bi/bi.hooks";

const fmtM = (n: number) => n >= 1_000_000 ? `₱${(n / 1_000_000).toFixed(2)}M` : `₱${n.toLocaleString()}`;

export default function VesselsAssetsPage() {
  const { data, isLoading } = useVessels();
  const s = data?.summary;

  const vesselRevBar = (data?.breakdown ?? [])
    .slice().sort((a, b) => b.net_revenue - a.net_revenue)
    .map((v) => ({ label: v.vessel_name, revenue: v.net_revenue }));

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-base font-semibold">Vessel Assets</h1>
        <BiFilterBar />
      </div>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SimpleKpiCard label="Total Vessels"    value={isLoading ? "…" : (s?.total_vessels ?? 0).toString()}          icon={Ship}     colorClass="text-violet-500" />
        <SimpleKpiCard label="Total Revenue"    value={isLoading ? "…" : fmtM(s?.total_revenue ?? 0)}                 icon={Wallet}   colorClass="text-primary" />
        <SimpleKpiCard label="Total Trips"      value={isLoading ? "…" : (s?.total_trips ?? 0).toLocaleString()}      icon={BarChart2} colorClass="text-teal-600" />
        <SimpleKpiCard label="Total Passengers" value={isLoading ? "…" : (s?.total_passengers ?? 0).toLocaleString()} icon={Users}    colorClass="text-blue-600" />
      </section>

      <section>
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          {isLoading ? (
            <div className="p-4 space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-8 w-full rounded" />)}</div>
          ) : vesselRevBar.length === 0 ? (
            <NoDataPlaceholder height="200px" message="No vessel revenue data" />
          ) : (
            <ShadcnBarChartHorizontal data={vesselRevBar} config={{ revenue: { label: "Net Revenue", color: "var(--chart-1)" } }} title="Revenue by Vessel" description="Net revenue per vessel" dataKey="revenue" labelKey="label" />
          )}
        </div>
      </section>

      <section>
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="px-4 pt-4 pb-2">
            <h2 className="text-xs font-semibold">Vessel Performance Table</h2>
          </div>
          {isLoading ? (
            <div className="p-4 space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full rounded" />)}</div>
          ) : (data?.breakdown ?? []).length === 0 ? (
            <NoDataPlaceholder height="160px" message="No vessel data" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">Vessel</th>
                    <th className="px-3 py-2 text-right font-medium text-muted-foreground">Trips</th>
                    <th className="px-3 py-2 text-right font-medium text-muted-foreground">Passengers</th>
                    <th className="px-3 py-2 text-right font-medium text-muted-foreground">Net Revenue</th>
                    <th className="px-3 py-2 text-right font-medium text-muted-foreground">Net Income</th>
                    <th className="px-3 py-2 text-right font-medium text-muted-foreground">Avg Rev/Trip</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.breakdown ?? [])
                    .slice().sort((a, b) => b.net_revenue - a.net_revenue)
                    .map((v) => (
                      <tr key={v.ship_id} className="border-b border-border/60 hover:bg-muted/30">
                        <td className="px-3 py-2 font-medium">{v.vessel_name}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{v.trip_count}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{v.pax_count.toLocaleString()}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{fmtM(v.net_revenue)}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{fmtM(v.net_income)}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{fmtM(v.avg_revenue_per_trip)}</td>
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
