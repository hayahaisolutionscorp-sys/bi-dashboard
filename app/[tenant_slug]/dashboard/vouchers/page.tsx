"use client";

import { BadgePercent, DollarSign, Ticket, Users } from "lucide-react";
import { usePassengerDemand, useSalesOverview } from "@/services/bi/bi.hooks";
import { KpiCard } from "@/components/charts/kpi-card";
import { LineGraph } from "@/components/charts/line-graph";
import { BarList } from "@/components/charts/bar-list";
import { PieChart } from "@/components/charts/pie-chart";
import { NoDataPlaceholder } from "@/components/charts/no-data-placeholder";
import { Header } from "@/components/ui/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function formatCurrency(value: number) {
  return `₱${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function clampPercent(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value));
}

export default function VouchersPage() {
  const { data: passengerDemand, isLoading: passengerLoading, error: passengerError } = usePassengerDemand();
  const { data: salesOverview, isLoading: salesLoading, error: salesError } = useSalesOverview();

  const passengerSummary = passengerDemand?.summary;
  const discountSegments = passengerDemand?.trends ?? [];
  const salesTrend = salesOverview?.trends ?? [];
  const isLoading = passengerLoading || salesLoading;
  const error = passengerError || salesError;

  const discountPassengerTotal = discountSegments.reduce((sum, item) => sum + item.count, 0);
  const discountRevenueTotal = discountSegments.reduce((sum, item) => sum + item.net_revenue, 0);

  const topDiscounts = discountSegments
    .slice()
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)
    .map((item) => ({
      name: item.segment || "Unspecified discount",
      value: item.count,
      percentage: clampPercent(item.share_pct),
      color: "bg-primary",
      textColor: "text-white",
    }));

  const discountDistribution = discountSegments
    .slice()
    .sort((a, b) => b.count - a.count)
    .slice(0, 6)
    .map((item, index) => ({
      name: item.segment || "Unspecified",
      value: item.count,
      itemStyle: {
        color: ["#0ea5e9", "#14b8a6", "#6366f1", "#f59e0b", "#ef4444", "#94a3b8"][index],
      },
    }));

  const revenueXAxis = salesTrend.map((point) => point.date);
  const revenueSeries = [
    {
      name: "Passenger Revenue",
      data: salesTrend.map((point) => point.pax_revenue),
      color: "#0ea5e9",
    },
    {
      name: "Cargo Revenue",
      data: salesTrend.map((point) => point.cargo_revenue),
      color: "#14b8a6",
    },
  ];

  return (
    <div className="w-full max-w-[1400px] mx-auto">
      <div className="px-8 pt-10 pb-2">
        <Header
          title="Discounts & Vouchers"
          subtitle="Live discount utilization and revenue context from passenger and sales analytics."
        />
      </div>

      <div className="space-y-8 px-8 pb-8 pt-6">
        {error && (
          <Card className="border-red-500/25 bg-red-500/10">
            <CardContent className="px-4 py-3 text-sm font-medium text-red-600 dark:text-red-300">
              {error}
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            title="Discount Types"
            value={passengerLoading ? "..." : (passengerSummary?.unique_discount_types ?? 0).toLocaleString()}
            icon={Ticket}
            trend={{ value: "Live", label: "passenger data", direction: "neutral" }}
          />
          <KpiCard
            title="Discounted Passengers"
            value={passengerLoading ? "..." : discountPassengerTotal.toLocaleString()}
            icon={Users}
            trend={{ value: "Selected", label: "period", direction: "neutral" }}
          />
          <KpiCard
            title="Discount Net Revenue"
            value={passengerLoading ? "..." : formatCurrency(discountRevenueTotal)}
            icon={DollarSign}
            trend={{ value: "Live", label: "net", direction: "neutral" }}
          />
          <KpiCard
            title="Total Passengers"
            value={passengerLoading ? "..." : (passengerSummary?.total_passengers ?? 0).toLocaleString()}
            icon={BadgePercent}
            trend={{ value: "Demand", label: "analytics", direction: "neutral" }}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-8">
            {salesTrend.length === 0 ? (
              <Card>
                <NoDataPlaceholder height="260px" message={salesLoading ? "Loading revenue trend" : "No revenue trend data"} />
              </Card>
            ) : (
              <LineGraph
                title="Revenue Context"
                description="Passenger and cargo revenue trend for the selected period"
                xAxisData={revenueXAxis}
                series={revenueSeries}
                tooltipFormatter={formatCurrency}
                yAxisFormatter={(value) => formatCurrency(value)}
                customLegend
                legendItems={[
                  { name: "Passenger Revenue", color: "#0ea5e9" },
                  { name: "Cargo Revenue", color: "#14b8a6" },
                ]}
                height="240px"
              />
            )}
          </div>

          <Card className="lg:col-span-4">
            <CardHeader>
              <CardTitle className="text-lg font-bold">Discount Coverage</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 text-sm">
              <div className="rounded-lg bg-muted/50 px-3 py-2">
                <p className="text-muted-foreground">Refunded passengers</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums">
                  {passengerLoading ? "..." : (passengerSummary?.refunded_passengers ?? 0).toLocaleString()}
                </p>
              </div>
              <div className="rounded-lg bg-muted/50 px-3 py-2">
                <p className="text-muted-foreground">Tracked accommodation types</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums">
                  {passengerLoading ? "..." : (passengerSummary?.unique_accommodations ?? 0).toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {topDiscounts.length === 0 ? (
            <Card>
              <NoDataPlaceholder height="300px" message={isLoading ? "Loading discount usage" : "No discount usage data"} />
            </Card>
          ) : (
            <BarList
              title="Top Discount Types by Usage"
              description="Passenger count per discount segment"
              items={topDiscounts}
              barHeight="lg"
              valueFormatter={(value) => `${Number(value).toLocaleString()} pax`}
            />
          )}

          <Card className="bg-card p-6 shadow-sm flex flex-col gap-6">
            <div>
              <h3 className="text-lg font-bold">Discount Type Distribution</h3>
              <p className="text-xs text-muted-foreground">Live passenger segment utilization</p>
            </div>
            {discountDistribution.length === 0 ? (
              <NoDataPlaceholder height="176px" message={isLoading ? "Loading discount distribution" : "No discount distribution data"} />
            ) : (
              <PieChart
                data={discountDistribution}
                variant="donut"
                radius={["60%", "75%"]}
                centerLabel={{ value: discountPassengerTotal.toLocaleString(), subtitle: "Pax" }}
                customLegend
                showLegend={false}
                showCard={false}
                height="176px"
              />
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
