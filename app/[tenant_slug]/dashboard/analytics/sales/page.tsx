"use client";

import { Wallet, ShoppingCart, BarChart2, DollarSign } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { SimpleKpiCard } from "@/components/charts/simple-kpi-card";
import { BiFilterBar } from "@/components/bi-filter-bar";
import { ShadcnBarChartHorizontal } from "@/components/charts/shadcn-bar-chart.horizontal";
import { ShadcnLineChartRegular } from "@/components/charts/shadcn-line-chart-regular";
import { BiDonutChart } from "@/components/charts/bi-donut-chart";
import { NoDataPlaceholder } from "@/components/charts/no-data-placeholder";
import { useSalesOverview, useSalesChannels, useSalesInsights } from "@/services/bi/bi.hooks";

const fmtM = (n: number) => n >= 1_000_000 ? `₱${(n / 1_000_000).toFixed(2)}M` : `₱${n.toLocaleString()}`;

export default function SalesAnalyticsPage() {
  const { data: overview,  isLoading: ovLoading }  = useSalesOverview();
  const { data: channels,  isLoading: chLoading }  = useSalesChannels();
  const { data: insights,  isLoading: inLoading }  = useSalesInsights();

  const s  = overview?.summary;
  const ins = insights?.summary;

  const topRoutes = (overview?.breakdown ?? [])
    .slice().sort((a, b) => b.net_revenue - a.net_revenue)
    .slice(0, 10)
    .map((r) => ({ route: r.route_name, revenue: r.net_revenue }));

  const dailyTrend = (overview?.trends ?? []).map((t) => ({ date: t.date, total: t.total }));

  const channelPie = (channels?.breakdown ?? []).map((c) => ({ name: c.channel, value: c.net_revenue }));


  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-base font-semibold">Sales Analytics</h1>
        <BiFilterBar />
      </div>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SimpleKpiCard label="Pax Revenue"       value={ovLoading ? "…" : fmtM(s?.pax_revenue ?? 0)}          icon={Wallet}       colorClass="text-primary" />
        <SimpleKpiCard label="Cargo Revenue"     value={ovLoading ? "…" : fmtM(s?.cargo_revenue ?? 0)}        icon={ShoppingCart} colorClass="text-teal-600" />
        <SimpleKpiCard label="Total Bookings"    value={ovLoading ? "…" : (s?.booking_count ?? 0).toLocaleString()} icon={BarChart2} colorClass="text-blue-600" />
        <SimpleKpiCard label="Avg Booking Value" value={inLoading ? "…" : fmtM(ins?.avg_booking_value ?? 0)}  icon={DollarSign}   colorClass="text-violet-500" />
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          {chLoading ? (
            <div className="p-4"><Skeleton className="h-60 w-full rounded" /></div>
          ) : channelPie.length === 0 ? (
            <NoDataPlaceholder height="260px" message="No channel data for selected period" />
          ) : (
            <BiDonutChart data={channelPie} title="Revenue by Channel" description="Net revenue share per booking channel" formatValue={fmtM} centerLabel="Net Rev." showCard={false} />
          )}
        </div>

        <div className="rounded-lg border border-border bg-card overflow-hidden">
          {ovLoading ? (
            <div className="p-4"><Skeleton className="h-60 w-full rounded" /></div>
          ) : dailyTrend.length === 0 ? (
            <NoDataPlaceholder height="260px" message="No daily revenue data" />
          ) : (
            <ShadcnLineChartRegular data={dailyTrend} config={{ total: { label: "Total Revenue", color: "var(--chart-1)" } }} title="Daily Revenue" description="Total daily revenue (pax + cargo)" labelKey="date" dataKey="total" isCurrency />
          )}
        </div>
      </section>

      <section>
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          {ovLoading ? (
            <div className="p-4 space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-8 w-full rounded" />)}</div>
          ) : topRoutes.length === 0 ? (
            <NoDataPlaceholder height="200px" message="No route data for selected period" />
          ) : (
            <ShadcnBarChartHorizontal data={topRoutes} config={{ revenue: { label: "Net Revenue", color: "var(--chart-2)" } }} title="Top Routes by Revenue" description="Ranked by net revenue" dataKey="revenue" labelKey="route" />
          )}
        </div>
      </section>
    </div>
  );
}
