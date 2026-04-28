"use client";

import { Users, UserX } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { SimpleKpiCard } from "@/components/charts/simple-kpi-card";
import { BiFilterBar } from "@/components/bi-filter-bar";
import { BiPieChart } from "@/components/charts/bi-pie-chart";
import { ShadcnBarChartHorizontal } from "@/components/charts/shadcn-bar-chart.horizontal";
import { NoDataPlaceholder } from "@/components/charts/no-data-placeholder";
import { usePassengerDemand } from "@/services/bi/bi.hooks";

export default function PassengersAnalyticsPage() {
  const { data, isLoading } = usePassengerDemand();
  const s = data?.summary;

  const accommodationData = (data?.breakdown ?? []).map((b) => ({ name: b.segment, value: b.count }));
  const discountData      = (data?.trends   ?? []).map((t) => ({ label: t.segment, count: t.count }));



  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-base font-semibold">Passenger Demand</h1>
        <BiFilterBar />
      </div>

      <section className="grid grid-cols-2 gap-3">
        <SimpleKpiCard label="Total Passengers" value={isLoading ? "…" : (s?.total_passengers ?? 0).toLocaleString()} icon={Users}  colorClass="text-blue-600" />
        <SimpleKpiCard label="Refunded"          value={isLoading ? "…" : (s?.refunded_passengers ?? 0).toLocaleString()} icon={UserX} colorClass="text-rose-500" />
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          {isLoading ? (
            <div className="p-4"><Skeleton className="h-60 w-full rounded" /></div>
          ) : accommodationData.length === 0 ? (
            <NoDataPlaceholder height="260px" message="No accommodation data" />
          ) : (
            <BiPieChart data={accommodationData} title="By Accommodation" description="Passenger count per accommodation type" showCard={false} />
          )}
        </div>

        <div className="rounded-lg border border-border bg-card overflow-hidden">
          {isLoading ? (
            <div className="p-4 space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-8 w-full rounded" />)}</div>
          ) : discountData.length === 0 ? (
            <NoDataPlaceholder height="260px" message="No discount type data" />
          ) : (
            <ShadcnBarChartHorizontal data={discountData} config={{ count: { label: "Passengers", color: "var(--chart-3)" } }} title="By Discount Type" description="Passenger count per discount category" dataKey="count" labelKey="label" />
          )}
        </div>
      </section>
    </div>
  );
}
