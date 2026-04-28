"use client";

import { Package, PackageX } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { SimpleKpiCard } from "@/components/charts/simple-kpi-card";
import { BiFilterBar } from "@/components/bi-filter-bar";
import { BiPieChart } from "@/components/charts/bi-pie-chart";
import { ShadcnBarChartHorizontal } from "@/components/charts/shadcn-bar-chart.horizontal";
import { NoDataPlaceholder } from "@/components/charts/no-data-placeholder";
import { useCargoDemand } from "@/services/bi/bi.hooks";

export default function CargoAnalyticsPage() {
  const { data, isLoading } = useCargoDemand();
  const s = data?.summary;

  const vehicleData = (data?.breakdown ?? []).map((b) => ({ name: b.vehicle_type, value: b.count }));
  const barData     = (data?.breakdown ?? []).map((b) => ({ label: b.vehicle_type, count: b.count }));



  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-base font-semibold">Cargo Demand</h1>
        <BiFilterBar />
      </div>

      <section className="grid grid-cols-2 gap-3">
        <SimpleKpiCard label="Total Cargo"  value={isLoading ? "…" : (s?.total_cargo ?? 0).toLocaleString()}    icon={Package}  colorClass="text-teal-600" />
        <SimpleKpiCard label="Refunded"     value={isLoading ? "…" : (s?.refunded_cargo ?? 0).toLocaleString()} icon={PackageX} colorClass="text-rose-500" />
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          {isLoading ? (
            <div className="p-4"><Skeleton className="h-60 w-full rounded" /></div>
          ) : vehicleData.length === 0 ? (
            <NoDataPlaceholder height="260px" message="No cargo data for selected period" />
          ) : (
            <BiPieChart data={vehicleData} title="By Vehicle Type" description="Cargo count per vehicle category" showCard={false} />
          )}
        </div>
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          {isLoading ? (
            <div className="p-4 space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-8 w-full rounded" />)}</div>
          ) : barData.length === 0 ? (
            <NoDataPlaceholder height="260px" message="No cargo breakdown data" />
          ) : (
            <ShadcnBarChartHorizontal data={barData} config={{ count: { label: "Cargo Count", color: "var(--chart-4)" } }} title="Cargo by Vehicle Type" description="Count per vehicle category" dataKey="count" labelKey="label" />
          )}
        </div>
      </section>
    </div>
  );
}
