"use client";
import { ChangeEvent, useRef, useState, useEffect } from "react";
import { downloadTemplate } from "@/lib/export-utils";
import { SimpleKpiCard } from "@/components/charts/simple-kpi-card";
import { CalendarDays, FilterX, FileInput, FileOutput, Download, Route, Banknote, TrendingUp, Ticket } from "lucide-react";

import { DateRangePicker } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";
import { Skeleton } from "@/components/ui/skeleton";

import { ShadcnLineChartMultiple } from "@/components/charts/shadcn-line-chart-multiple";
import { ShadcnBarChartHorizontal } from "@/components/charts/shadcn-bar-chart.horizontal";
import { ShadcnPieChartLabelList } from "@/components/charts/shadcn-pie-chart-label-list";
import { NoDataPlaceholder } from "@/components/charts/no-data-placeholder";
import { ComparisonTrendChart } from "@/components/charts/comparison-trend-chart";

// Services & Types
import { salesService } from "@/services/sales.service";
import { SalesReportRoute } from "@/types/sales";

const createDefaultDateRange = (): DateRange => {
  const now = new Date();
  const from = new Date(now.getFullYear(), 0, 1);
  return { from, to: now };
};

export default function SalesReportPage() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => createDefaultDateRange());
  const [isExporting, setIsExporting] = useState(false);
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);

  // Routes list (fetched once on mount)
  const [routeNames, setRouteNames] = useState<string[]>([]);
  const [selectedRouteName, setSelectedRouteName] = useState<string>("");
  const [isRoutesLoading, setIsRoutesLoading] = useState(true);

  // Route detail (KPIs + charts)
  const [selectedRoute, setSelectedRoute] = useState<SalesReportRoute | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true); // true until first data arrives
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Fetch routes list once on mount
  useEffect(() => {
    async function fetchRoutes() {
      setIsRoutesLoading(true);
      try {
        const names = await salesService.getRoutes();
        setRouteNames(names);
        if (names.length > 0) setSelectedRouteName(names[0]);
      } catch (err) {
        console.error(err);
        setError("Failed to load routes.");
      } finally {
        setIsRoutesLoading(false);
      }
    }
    fetchRoutes();
  }, []);

  // 2. Fetch route detail whenever route or date range changes
  useEffect(() => {
    if (!selectedRouteName) return;
    async function fetchData() {
      setIsLoading(true);
      setError(null);
      try {
        const from = dateRange?.from?.toISOString().split("T")[0];
        const to = dateRange?.to?.toISOString().split("T")[0];
        const data = await salesService.getSalesReport(from, to, selectedRouteName);
        setSelectedRoute(data);
      } catch (err) {
        console.error(err);
        setError("Failed to load sales report. Please try again later.");
      } finally {
        setIsLoading(false);
        setIsInitialLoad(false);
      }
    }
    fetchData();
  }, [selectedRouteName, dateRange]);

  const handleClearFilter = () => setDateRange(createDefaultDateRange());

  const handleImportClick = () => fileInputRef.current?.click();

  const handleImportChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
  };

  const handleDownloadTemplate = async () => {
    if (isDownloadingTemplate) return;
    setIsDownloadingTemplate(true);
    try {
      await salesService.downloadSalesReportTemplateExcel();
    } catch {
      window.alert("Failed to download template. Please try again.");
    } finally {
      setIsDownloadingTemplate(false);
    }
  };

  const formatCurrency = (val?: number | null) => `₱${(val ?? 0).toLocaleString()}`;

  const handleExport = async () => {
    if (!selectedRoute || isExporting) return;
    setIsExporting(true);
    try {
      const from = dateRange?.from?.toISOString().split("T")[0];
      const to   = dateRange?.to?.toISOString().split("T")[0];
      await salesService.downloadSalesReportExcel(from, to, selectedRoute.route_name);
    } catch {
      window.alert("Export failed. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  if (error) {
    return (
      <div className="flex h-[400px] items-center justify-center text-rose-500">
        <p className="font-medium text-lg">{error}</p>
      </div>
    );
  }

  // Helpers
  const noData = !selectedRoute;
  const kpiValue = (val: number | null | undefined) =>
    isLoading ? "—" : (val ?? 0) === 0 ? "—" : formatCurrency(val);
  const kpiCount = (val: number | null | undefined) =>
    isLoading ? "—" : (val ?? 0) === 0 ? "—" : (val ?? 0).toLocaleString();

  const isChartEmpty = (arr: any[]) => !arr || arr.length === 0;

  return (
    <div className="bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-slate-100">
      <div className="mx-auto w-full max-w-[1120px] space-y-4 px-3 py-3 sm:px-4 sm:py-4 lg:px-6 lg:py-5">
        
        {/* Toolbar */}
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          
          {/* Filters (Route & Date) */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {/* Route selector */}
            <div className="flex items-center gap-2 text-sm w-full sm:w-auto">
              <Route className="h-4 w-4 shrink-0 text-slate-500 dark:text-slate-400" />
              <select
                value={selectedRouteName}
                onChange={(e) => setSelectedRouteName(e.target.value)}
                className="h-9 w-full sm:w-[240px] truncate rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                disabled={isRoutesLoading || routeNames.length === 0}
              >
                {isRoutesLoading && <option value="">Loading routes...</option>}
                {!isRoutesLoading && routeNames.length === 0 && (
                  <option value="">No Routes Available</option>
                )}
                {routeNames.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>

            {/* Date range */}
            <div className="flex items-center gap-2 text-sm w-full sm:w-auto sm:border-l sm:border-slate-200 sm:pl-3 dark:sm:border-slate-700">
              <CalendarDays className="h-4 w-4 shrink-0 text-slate-500 dark:text-slate-400" />
              <span className="hidden sm:inline-block shrink-0 text-slate-600 dark:text-slate-300">Date Range:</span>
              <div className="w-full sm:w-auto">
                <DateRangePicker date={dateRange} onDateChange={setDateRange} />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-row sm:flex-wrap sm:items-center sm:gap-2">
            <button
              type="button"
              onClick={handleClearFilter}
              className="inline-flex h-9 w-full sm:w-auto justify-center items-center gap-1.5 rounded-md border border-sky-300 bg-sky-500 px-3 text-sm font-medium text-white transition-colors hover:bg-sky-600"
            >
              <FilterX className="h-4 w-4 shrink-0" />
              <span className="truncate">Reset</span>
            </button>
            <button
              type="button"
              onClick={handleImportClick}
              className="inline-flex h-9 w-full sm:w-auto justify-center items-center gap-1.5 rounded-md border border-slate-300 bg-slate-100 px-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              <FileInput className="h-4 w-4 shrink-0" />
              <span className="truncate">Import</span>
            </button>
            <button
              type="button"
              onClick={handleExport}
              disabled={!selectedRoute || isExporting}
              className="inline-flex h-9 w-full sm:w-auto justify-center items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 disabled:opacity-50"
            >
              {isExporting ? (
                <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
              ) : (
                <FileOutput className="h-4 w-4 shrink-0 text-sky-500" />
              )}
              <span className="truncate">{isExporting ? "Exporting…" : "Export"}</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadTemplate}
              disabled={isDownloadingTemplate}
              className="inline-flex h-9 w-full sm:w-auto justify-center items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 disabled:opacity-50"
              title="Download Excel Template"
            >
              {isDownloadingTemplate ? (
                <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" />
              ) : (
                <Download className="h-4 w-4 shrink-0 text-slate-400" />
              )}
              <span className="truncate">{isDownloadingTemplate ? "Downloading…" : "Template"}</span>
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx, .xls, .json"
            className="hidden"
            onChange={handleImportChange}
          />
        </div>

        {/* KPIs */}
        <div className="relative">
          {/* Loading overlay for subsequent fetches */}
          {isLoading && !isInitialLoad && (
            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-[2px]">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
            </div>
          )}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {isInitialLoad ? (
              <>
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full rounded-xl" />
                ))}
              </>
            ) : (
              <>
                <SimpleKpiCard
                  label="Gross Revenue"
                  value={kpiValue(selectedRoute?.kpis.total_gross_revenue)}
                  icon={Banknote}
                  colorClass="text-blue-500"
                  subtext="Before deductions"
                />
                <SimpleKpiCard
                  label="Net Revenue"
                  value={kpiValue(selectedRoute?.kpis.total_net_revenue)}
                  icon={TrendingUp}
                  colorClass="text-green-500"
                  subtext="After deductions"
                />
                <SimpleKpiCard
                  label="Total Bookings"
                  value={kpiCount(selectedRoute?.kpis.total_bookings)}
                  icon={Ticket}
                  colorClass="text-orange-500"
                  subtext="Total ticket count"
                />
              </>
            )}
          </section>
        </div>

        {/* Trend Chart */}
        <div className="relative rounded-xl border border-slate-300 bg-gray-100 p-2 shadow-sm dark:border-slate-700 dark:bg-slate-950">
          {isLoading && !isInitialLoad && (
            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-[2px]">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
            </div>
          )}
          {isInitialLoad ? (
            <Skeleton className="h-[300px] w-full rounded-xl" />
          ) : isChartEmpty(selectedRoute?.charts.trend ?? []) ? (
            <NoDataPlaceholder height="300px" />
          ) : (
            <ShadcnLineChartMultiple
              title="Revenue & Bookings Trend"
              description="Daily performance of gross revenue and total bookings"
              data={selectedRoute!.charts.trend}
              labelKey="transaction_date"
              height="300px"
              dateRange={dateRange}
              config={{
                gross_revenue: { label: "Gross Revenue", color: "#2563eb" },
                bookings:      { label: "Bookings",      color: "#f59e0b" },
              }}
              series={[
                { dataKey: "gross_revenue", color: "#2563eb", name: "Gross Revenue" },
                { dataKey: "bookings",      color: "#f59e0b", name: "Bookings" },
              ]}
            />
          )}
        </div>

        {/* Comparison Trend Chart */}
        <ComparisonTrendChart dateRange={dateRange} />

        {/* Breakdown Charts */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Sales by Booking Source */}
          <div className="relative rounded-xl border border-slate-300 bg-gray-100 p-2 shadow-sm dark:border-slate-700 dark:bg-slate-950 min-h-[350px]">
            {isLoading && !isInitialLoad && (
              <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-[2px]">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
              </div>
            )}
            {isInitialLoad ? (
              <Skeleton className="h-[300px] w-full rounded-xl" />
            ) : isChartEmpty(selectedRoute?.charts.booking_source ?? []) ? (
              <div className="pt-4 px-4">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Sales by Booking Source</p>
                <NoDataPlaceholder height="270px" />
              </div>
            ) : (
              <ShadcnBarChartHorizontal
                title="Sales by Booking Source"
                description="Revenue breakdown by channel/source"
                data={selectedRoute!.charts.booking_source}
                dataKey="gross_revenue"
                labelKey="source"
                hideYAxis={false}
                config={{
                  gross_revenue: { label: "Gross Revenue", color: "#0ea5e9" },
                }}
              />
            )}
          </div>

          {/* Revenue Mix Pie Chart */}
          <div className="relative rounded-xl border border-slate-300 bg-gray-100 p-2 shadow-sm dark:border-slate-700 dark:bg-slate-950 min-h-[350px]">
            {isLoading && !isInitialLoad && (
              <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-[2px]">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
              </div>
            )}
            {isInitialLoad ? (
              <Skeleton className="h-[300px] w-full rounded-xl" />
            ) : isChartEmpty(selectedRoute?.charts.revenue_mix.type_split ?? []) ? (
              <div className="pt-4 px-4">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Revenue Mix</p>
                <NoDataPlaceholder height="270px" />
              </div>
            ) : (
              <ShadcnPieChartLabelList
                title="Revenue Mix"
                description="Passenger vs Cargo — hover a slice for breakdown"
                typeSplit={selectedRoute!.charts.revenue_mix.type_split}
                subCategories={selectedRoute!.charts.revenue_mix.sub_categories}
                height="300px"
              />
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
