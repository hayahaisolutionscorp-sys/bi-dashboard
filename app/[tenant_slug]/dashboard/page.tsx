"use client";

import { useState, useEffect } from "react";
import { 
  Wallet, 
  Calendar, 
  TrendingUp, 
  User, 
  Package, 
  XCircle, 
  Route, 
  PhilippinePeso
} from "lucide-react";

// Components
import { KpiCard } from "@/components/charts/kpi-card";
import { Skeleton } from "@/components/ui/skeleton";

// Services & Types
import { overviewService } from "@/services/overview.service";
import { OverviewData } from "@/types/overview";
import { ShadcnOverviewBarChartHorizontal } from "@/components/charts/shadcn-overview-bar-chart-horizontal";
import { ShadcnOverviewBarChartVertical } from "@/components/charts/shadcn-overview-bar-chart-vertical";
import { ShadcnOverviewRegularLineChart } from "@/components/charts/shadcn-overview-regular-line-chart";
import { ShadnOverviewStackedPieChart } from "@/components/charts/shadn-overview-stacked-pie-chart";
import { ChartConfig } from "@/components/ui/chart";
import { useTenant } from "@/components/providers/tenant-provider";

export default function DashboardPage() {
  const { activeTenant, isLoading: isTenantLoading } = useTenant();
  const [period, setPeriod] = useState<"today" | "mtd" | "ytd">("today");
  const [data, setData] = useState<OverviewData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [routePage, setRoutePage] = useState(0);
  const [vesselPage, setVesselPage] = useState(0);

  // Persistent totals to keep cards stable when switching
  const [kpiTotals, setKpiTotals] = useState({
    today: 0,
    mtd: 0,
    ytd: 0
  });

  useEffect(() => {
    async function fetchData() {
      if (!activeTenant?.api_base_url) return;
      setIsLoading(true);
      setError(null);
      setRoutePage(0); // Reset page on period change
      setVesselPage(0); // Reset vessel page on period change
      try {
        const overview = await overviewService.getOverview(
          activeTenant.api_base_url, 
          period, 
          activeTenant.service_key
        );
        setData(overview);

        // Update persistent totals based on incoming data
        setKpiTotals(prev => ({
          today: period === "today" ? overview.kpi.total_revenue : (overview.today_total_revenue ?? prev.today),
          mtd: overview.mtd_total_revenue ?? (period === "mtd" ? overview.kpi.total_revenue : prev.mtd),
          ytd: overview.ytd_total_revenue ?? (period === "ytd" ? overview.kpi.total_revenue : prev.ytd)
        }));
      } catch (err) {
        setError("Failed to load dashboard data. Please try again later.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [period, activeTenant]);

  if (error) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-rose-500">
        <p className="font-medium text-lg">{error}</p>
      </div>
    );
  }

  const kpis = [
    { 
      id: "today", 
      title: "Sales Today", 
      icon: Wallet, 
      color: "text-primary", 
      bg: "bg-sky-50 dark:bg-sky-900/20" 
    },
    { 
      id: "mtd", 
      title: "MTD Revenue", 
      icon: Calendar, 
      color: "text-teal-600", 
      bg: "bg-teal-50 dark:bg-teal-900/20" 
    },
    { 
      id: "ytd", 
      title: "YTD Revenue", 
      icon: TrendingUp, 
      color: "text-blue-600", 
      bg: "bg-blue-50 dark:bg-blue-900/20" 
    }
  ];

  const formatCurrency = (val?: number | null) => `₱${(val ?? 0).toLocaleString()}`;

  return (
    <div className="bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-slate-100">
      <div className="mx-auto flex h-auto min-h-[calc(100vh-4rem)] lg:h-[calc(100vh-4rem)] w-full max-w-[1120px] min-h-0 flex-col gap-2 overflow-y-auto px-3 py-3 sm:px-4 sm:py-4 lg:overflow-hidden lg:px-6 lg:py-5">
        
        {/* KPI Section */}
        <section className="grid shrink-0 grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {kpis.map((kpi) => {
            const isSelected = period === kpi.id;
            const displayValue = formatCurrency(kpiTotals[kpi.id as keyof typeof kpiTotals]);
            
            return (
              <KpiCard
                key={kpi.id}
                title={kpi.title}
                value={isLoading && isSelected ? "..." : displayValue}
                icon={kpi.icon}
                iconColorClass={kpi.color}
                iconBgColor={kpi.bg}
                variant="reference"
                isActive={isSelected}
                showDetails={isSelected}
                onClick={() => setPeriod(kpi.id as any)}
                breakdown={isSelected && data?.kpi ? [
                  { label: "Passengers", value: (data.kpi.total_passengers ?? 0).toLocaleString(), icon: User },
                  { label: "Cargo", value: `${(data.kpi.total_cargo_units ?? 0).toLocaleString()} units`, icon: Package },
                  { label: "Canceled", value: (data.kpi.canceled_count ?? 0).toLocaleString(), icon: XCircle, valueColor: "text-rose-500" },
                  { label: "Total Trips", value: (data.kpi.total_trips ?? 0).toLocaleString(), icon: Route },
                  { label: "Expenses", value: formatCurrency(data.kpi.total_expenses), icon: PhilippinePeso },
                ] : []}
              />
            );
          })}
        </section>

        {/* Charts Section */}
        <section className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:auto-rows-fr lg:grid-cols-2 [&>*]:min-h-0 [&>*]:flex [&>*]:flex-col">
          {isLoading || !data ? (
            <>
              <Skeleton className="h-[280px] w-full rounded-xl" />
              <Skeleton className="h-[280px] w-full rounded-xl" />
              <Skeleton className="h-[280px] w-full rounded-xl" />
              <Skeleton className="h-[280px] w-full rounded-xl" />
            </>
          ) : (
            <>
              {/* Revenue Trend */}
              <div className="h-full flex flex-col rounded-xl border border-slate-300 bg-gray-100 shadow-sm dark:border-slate-700 dark:bg-slate-950 overflow-hidden">
                <ShadcnOverviewRegularLineChart
                  title="Booking Revenue Trend"
                  description="Revenue performance over time"
                  data={data.revenue_trend}
                  config={{
                    total_revenue: {
                      label: "Revenue",
                      color: "var(--chart-1)",
                    },
                  }}
                  dataKey="total_revenue"
                  labelKey="label"
                  color="var(--chart-1)"
                />
              </div>

              {/* Revenue by Route */}
              {(() => {
                const filteredRoutes = [...data.revenue_by_route].sort((a, b) => b.total_revenue - a.total_revenue);
                const ROUTES_PER_PAGE = 3;
                const totalRoutePages = Math.ceil(filteredRoutes.length / ROUTES_PER_PAGE);
                
                const validRoutePage = Math.min(routePage, Math.max(0, totalRoutePages - 1));
                const paginatedRoutes = filteredRoutes
                  .slice(validRoutePage * ROUTES_PER_PAGE, (validRoutePage + 1) * ROUTES_PER_PAGE)
                  .map((d, i) => ({ ...d, fill: `var(--chart-${(i % 5) + 1})` }));

                const routeConfig = {
                  total_revenue: {
                    label: "Revenue",
                  },
                } satisfies ChartConfig;
                
                return (
                  <div className="h-full flex flex-col rounded-xl border border-slate-300 bg-gray-100 shadow-sm dark:border-slate-700 dark:bg-slate-950 overflow-hidden ">
                    <ShadcnOverviewBarChartHorizontal
                      title="Revenue by Route"
                      description="Performance across different routes"
                      data={paginatedRoutes}
                      config={routeConfig}
                      dataKey="total_revenue"
                      labelKey="route_name"
                      colorKey="total_revenue"
                      hideYAxis={true}
                      pagination={{
                        currentPage: validRoutePage,
                        totalPages: totalRoutePages,
                        onNext: () => setRoutePage(validRoutePage + 1),
                        onPrev: () => setRoutePage(validRoutePage - 1),
                      }}
                    />
                  </div>
                );
              })()}

              {/* Revenue per Vessel */}
              {(() => {
                const filteredVessels = [...data.revenue_by_vessel].sort((a, b) => b.total_revenue - a.total_revenue);
                const VESSELS_PER_PAGE = 10;
                const totalVesselPages = Math.ceil(filteredVessels.length / VESSELS_PER_PAGE);

                const validVesselPage = Math.min(vesselPage, Math.max(0, totalVesselPages - 1));
                const paginatedVessels = filteredVessels
                  .slice(validVesselPage * VESSELS_PER_PAGE, (validVesselPage + 1) * VESSELS_PER_PAGE)
                  .map((d, i) => ({ ...d, fill: `var(--chart-${(i % 5) + 1})` }));

                const vesselConfig = {
                  total_revenue: {
                    label: "Revenue",
                  },
                } satisfies ChartConfig;

                return (
                  <div className="h-full flex flex-col rounded-xl border border-slate-300 bg-gray-100 shadow-sm dark:border-slate-700 dark:bg-slate-950 overflow-hidden">
                    <ShadcnOverviewBarChartVertical
                      title="Revenue per Vessel"
                      description="Performance breakdown by ship"
                      data={paginatedVessels}
                      config={vesselConfig}
                      dataKey="total_revenue"
                      labelKey="vessel_name"
                      colorKey="total_revenue"
                      pagination={{
                        currentPage: validVesselPage,
                        totalPages: totalVesselPages,
                        onNext: () => setVesselPage(validVesselPage + 1),
                        onPrev: () => setVesselPage(validVesselPage - 1),
                      }}
                    />
                  </div>
                );
              })()}

              {/* Revenue Split */}
              {(() => {
                const outerData = [
                  { 
                    name: "Passengers", 
                    value: data.passenger_vs_cargo.passenger_revenue, 
                    fill: "var(--chart-1)",
                    isInner: false,
                    category: 'pax',
                    sourceBreakdown: Object.entries(data.passenger_vs_cargo.by_source || {}).map(([source, sData]) => ({
                      source,
                      revenue: Object.values(sData.pax || {}).reduce((acc: number, curr) => acc + (curr.revenue || 0), 0)
                    })).filter(s => s.revenue > 0)
                  },
                  { 
                    name: "Cargo", 
                    value: data.passenger_vs_cargo.cargo_revenue, 
                    fill: "var(--chart-2)",
                    isInner: false,
                    category: 'cargo',
                    sourceBreakdown: [
                      ...Object.entries(data.passenger_vs_cargo.cargo_class_breakdown?.rolling || {}),
                      ...Object.entries(data.passenger_vs_cargo.cargo_class_breakdown?.loose || {})
                    ].map(([className, revenue]) => ({
                      source: className,
                      revenue: revenue as number
                    }))
                    .filter(s => s.revenue > 0)
                    .sort((a, b) => b.revenue - a.revenue)
                  }
                ];

                const paxColors: Record<string, string> = {
                  adult: "var(--chart-1)", student: "var(--chart-2)", child: "var(--chart-3)",
                  senior: "var(--chart-4)", pwd: "var(--chart-5)", regular: "var(--chart-1)",
                  driver: "var(--chart-2)", helper: "var(--chart-3)"
                };
                const cargoColors: Record<string, string> = { loose: "var(--chart-4)", rolling: "var(--chart-5)" };

                const innerData = [
                  ...Object.entries(data.passenger_vs_cargo.pax_breakdown || {})
                    .filter(([_, v]) => (v as number) > 0)
                    .map(([k, v]) => ({
                      name: k.charAt(0).toUpperCase() + k.slice(1).replace(/_/g, ' '),
                      value: v as number,
                      fill: paxColors[k.toLowerCase()] || "var(--chart-1)",
                      isInner: true,
                      category: 'pax',
                      sourceBreakdown: Object.entries(data.passenger_vs_cargo.by_source || {}).map(([source, sData]) => ({
                        source,
                        revenue: sData.pax?.[k]?.revenue || sData.pax?.[k.toUpperCase()]?.revenue || 0
                      })).filter(s => s.revenue > 0)
                    })),
                  ...Object.entries(data.passenger_vs_cargo.cargo_breakdown || {})
                    .filter(([_, v]) => (v as number) > 0)
                    .map(([k, v]) => ({
                      name: k.charAt(0).toUpperCase() + k.slice(1).replace(/_/g, ' '),
                      value: v as number,
                      fill: cargoColors[k.toLowerCase()] || "var(--chart-4)",
                      isInner: true,
                      category: 'cargo',
                      sourceBreakdown: Object.entries(data.passenger_vs_cargo.cargo_class_breakdown?.[k.toLowerCase() as 'rolling' | 'loose'] || {})
                        .map(([className, revenue]) => ({
                          source: className,
                          revenue: revenue as number
                        }))
                        .filter(s => s.revenue > 0)
                        .sort((a, b) => b.revenue - a.revenue)
                    }))
                ];

                const pieConfig = {
                  value: { label: "Revenue" },
                  Passengers: { label: "Passengers", color: "var(--chart-1)" },
                  Cargo: { label: "Cargo", color: "var(--chart-2)" },
                } satisfies ChartConfig;

                return (
                  <div className="h-full flex flex-col rounded-xl border border-slate-300 bg-gray-100 shadow-sm dark:border-slate-700 dark:bg-slate-950 overflow-visible">
                    <ShadnOverviewStackedPieChart
                      title="Revenue Source Breakdown"
                      description="Split between passengers and cargo types"
                      innerData={innerData}
                      outerData={outerData}
                      config={pieConfig}
                      innerDataKey="value"
                      outerDataKey="value"
                      nameKey="name"
                    />
                  </div>
                );
              })()}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
