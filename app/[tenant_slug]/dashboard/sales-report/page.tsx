"use client";
import { ChangeEvent, useRef, useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { format } from "date-fns";
import { SimpleKpiCard } from "@/components/charts/simple-kpi-card";
import { CalendarDays, FilterX, FileInput, FileOutput, Download, Route, Banknote, TrendingUp, Ticket } from "lucide-react";

import { DateRangePicker } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";
import { Skeleton } from "@/components/ui/skeleton";

import { ShadcnLineChartMultiple } from "@/components/charts/shadcn-line-chart-multiple";
import { ShadcnBarChartHorizontal } from "@/components/charts/shadcn-bar-chart.horizontal";
import { NoDataPlaceholder } from "@/components/charts/no-data-placeholder";
import { ComparisonTrendChart } from "@/components/charts/comparison-trend-chart";

// Services & Types
import { salesService } from "@/services/sales.service";
import { SalesReportRoute, SalesKpiResponse } from "@/types/sales";

const createDefaultDateRange = (): DateRange => {
  const now = new Date();
  const from = new Date(now.getFullYear(), 0, 1);
  return { from, to: now };
};

export default function SalesReportPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Date Range (URL Synced) ────────────────────────────────────────────────
  const dateRange = useMemo(() => {
    const fromStr = searchParams.get("startDate");
    const toStr = searchParams.get("endDate");
    if (fromStr && toStr) {
      const from = new Date(fromStr);
      const to = new Date(toStr);
      if (!isNaN(from.getTime()) && !isNaN(to.getTime())) return { from, to };
    }
    return createDefaultDateRange();
  }, [searchParams]);

  const setDateRange = useCallback((newRange: DateRange | undefined) => {
    const params = new URLSearchParams(searchParams.toString());
    if (newRange?.from && newRange?.to) {
      params.set("startDate", newRange.from.toISOString());
      params.set("endDate", newRange.to.toISOString());
    } else {
      params.delete("startDate");
      params.delete("endDate");
    }
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }, [router, pathname, searchParams]);

  const [isExporting, setIsExporting] = useState(false);
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);

  // ── Routes (URL Synced) ──────────────────────────────────────────────────
  const [routeNames, setRouteNames] = useState<string[]>([]);
  const selectedRouteName = searchParams.get("route") || "";
  const [isRoutesLoading, setIsRoutesLoading] = useState(true);

  const setSelectedRouteName = useCallback((name: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (name) params.set("route", name);
    else params.delete("route");
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [router, pathname, searchParams]);

  // UI State
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data States
  const [kpiData, setKpiData] = useState<SalesKpiResponse["data"] | null>(null);
  const [isKpisLoading, setIsKpisLoading] = useState(false);

  const [revenueTrend, setRevenueTrend] = useState<any[]>([]);
  const [isTrendLoading, setIsTrendLoading] = useState(false);

  const [salesByRoute, setSalesByRoute] = useState<any[]>([]);
  const [salesByVessel, setSalesByVessel] = useState<any[]>([]);
  const [isChartsLoading, setIsChartsLoading] = useState(false);

  const ITEMS_PER_PAGE = 5;
  const [routePage, setRoutePage] = useState(0);
  const [vesselPage, setVesselPage] = useState(0);

  // 1. Fetch routes list once on mount
  useEffect(() => {
    async function fetchRoutes() {
      setIsRoutesLoading(true);
      try {
        const names = await salesService.getRoutes();
        setRouteNames(names);
        if (names.length > 0 && !selectedRouteName) {
          setSelectedRouteName(names[0]);
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load routes.");
      } finally {
        setIsRoutesLoading(false);
      }
    }
    fetchRoutes();
  }, []);

  // 2. Clear state when route changes
  useEffect(() => {
    if (!selectedRouteName) return;
    setIsInitialLoad(false);
  }, [selectedRouteName]);

  // 3. Fetch KPI data
  useEffect(() => {
    async function fetchKpis() {
      setIsKpisLoading(true);
      try {
        const from = dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : undefined;
        const to = dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : undefined;
        const response = await salesService.getKpis(from, to);
        setKpiData(response.data);
      } catch (err) {
        console.error("Local KPI fetch error:", err);
      } finally {
        setIsKpisLoading(false);
      }
    }
    fetchKpis();
  }, [dateRange]);

  // 4. Fetch Revenue Trends
  useEffect(() => {
    async function fetchTrends() {
      setIsTrendLoading(true);
      try {
        const from = dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : undefined;
        const to = dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : undefined;
        const response = await salesService.getRevenueVsBookingTrends(from, to);
        
        const data = response?.data?.revenueTrends || [];
        const filled: any[] = [];
        const start = dateRange?.from ? new Date(dateRange.from) : null;
        const end = dateRange?.to ? new Date(dateRange.to) : null;

        if (start && end) {
          const current = new Date(start);
          current.setHours(0, 0, 0, 0);
          const endDate = new Date(end);
          endDate.setHours(0, 0, 0, 0);

          const dataMap = new Map(data.map(item => [item.date, item]));
          
          while (current <= endDate) {
            const dateStr = format(current, "yyyy-MM-dd");
            const existing = dataMap.get(dateStr);
            
            if (existing) {
              const api2 = Math.max(0, existing.sources.api_v2 || 0);
              const moba = Math.max(0, existing.sources.mobile_app || 0);
              const onl  = Math.max(0, existing.sources.online || 0);
              const otc  = Math.max(0, existing.sources.otc || 0);
              const trag = Math.max(0, existing.sources.travel_agency || 0);
              const walk = Math.max(0, existing.sources.walk_in || 0);
              const webs = Math.max(0, existing.sources.website || 0);
              const total = Math.max(0, existing.sources.total ?? (api2 + moba + onl + otc + trag + walk + webs));

              filled.push({
                transaction_date: existing.date,
                gross_revenue: Math.max(0, existing.grossRevenue || 0),
                total,
                api_v2: api2,
                mobile_app: moba,
                online: onl,
                otc: otc,
                travel_agency: trag,
                walk_in: walk,
                website: webs,
              });
            } else {
              filled.push({
                transaction_date: dateStr,
                gross_revenue: 0, total: 0, api_v2: 0, mobile_app: 0, online: 0, otc: 0, travel_agency: 0, walk_in: 0, website: 0
              });
            }
            current.setDate(current.getDate() + 1);
          }
          setRevenueTrend(filled);
        }
      } catch (err) {
        console.error("Trend fetch error:", err);
      } finally {
        setIsTrendLoading(false);
      }
    }
    fetchTrends();
  }, [dateRange]);

  // 5. Fetch breakdown charts
  useEffect(() => {
    async function fetchCharts() {
      setIsChartsLoading(true);
      try {
        const from = dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : undefined;
        const to = dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : undefined;
        const response = await salesService.getSalesReportCharts(from, to);

        const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];
        
        setSalesByRoute(response.data.salesByRoute.map((item, index) => ({
          ...item,
          value: Math.max(0, item.value || 0),
          fill: COLORS[index % COLORS.length]
        })));

        setSalesByVessel(response.data.salesByVessel.map((item, index) => ({
          ...item,
          value: Math.max(0, item.value || 0),
          fill: COLORS[index % COLORS.length]
        })));

        setRoutePage(0);
        setVesselPage(0);
      } catch (err) {
        console.error("Charts fetch error:", err);
      } finally {
        setIsChartsLoading(false);
      }
    }
    fetchCharts();
  }, [dateRange]);

  const handleClearFilter = () => setDateRange(undefined);
  const handleImportClick = () => fileInputRef.current?.click();

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

  const handleExport = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const from = dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : undefined;
      const to   = dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : undefined;
      await salesService.downloadSalesReportExcel(from, to, selectedRouteName || undefined);
    } catch (err) {
      console.error("Export error:", err);
      window.alert("Export failed. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const formatCurrency = (val?: number | null) => `₱${(val ?? 0).toLocaleString()}`;
  const isChartEmpty = (arr: any[]) => !arr || arr.length === 0;

  if (error) {
    return (
      <div className="flex h-[400px] items-center justify-center text-rose-500">
        <p className="font-medium text-lg">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-slate-100">
      <div className="mx-auto w-full max-w-[1120px] space-y-4 px-3 py-3 sm:px-4 sm:py-4 lg:px-6 lg:py-5">
        
        {/* Toolbar */}
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2 text-sm w-full sm:w-auto">
              <Route className="h-4 w-4 shrink-0 text-slate-500 dark:text-slate-400" />
              <select
                value={selectedRouteName}
                onChange={(e) => setSelectedRouteName(e.target.value)}
                className="h-9 w-full sm:w-[240px] truncate rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                disabled={isRoutesLoading || routeNames.length === 0}
              >
                {isRoutesLoading && <option value="">Loading routes...</option>}
                {!isRoutesLoading && routeNames.length === 0 && <option value="">No Routes Available</option>}
                {routeNames.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 text-sm w-full sm:w-auto sm:border-l sm:border-slate-200 sm:pl-3 dark:sm:border-slate-700">
              <CalendarDays className="h-4 w-4 shrink-0 text-slate-500 dark:text-slate-400" />
              <span className="hidden sm:inline-block shrink-0 text-slate-600 dark:text-slate-300">Date Range:</span>
              <div className="w-full sm:w-auto">
                <DateRangePicker date={dateRange} onDateChange={setDateRange} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-row sm:items-center sm:gap-2">
            <button onClick={handleClearFilter} className="inline-flex h-9 justify-center items-center gap-1.5 rounded-md border border-sky-300 bg-sky-500 px-3 text-sm font-medium text-white hover:bg-sky-600"><FilterX className="h-4 w-4" /> Reset</button>
            <button onClick={handleImportClick} className="inline-flex h-9 justify-center items-center gap-1.5 rounded-md border border-slate-300 bg-slate-100 px-3 text-sm font-medium text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200"><FileInput className="h-4 w-4" /> Import</button>
            <button onClick={handleExport} disabled={isExporting} className="inline-flex h-9 justify-center items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50">
              {isExporting ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" /> : <FileOutput className="h-4 w-4 text-sky-500" />} Export
            </button>
            <button onClick={handleDownloadTemplate} disabled={isDownloadingTemplate} className="inline-flex h-9 justify-center items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50">
              {isDownloadingTemplate ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" /> : <Download className="h-4 w-4 text-slate-400" />} Template
            </button>
          </div>
          <input ref={fileInputRef} type="file" accept=".xlsx, .xls, .json" className="hidden" onChange={() => {}} />
        </div>

        {/* KPIs */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {isKpisLoading ? (
            <Skeleton className="h-24 w-full rounded-xl" />
          ) : (
            <>
              <SimpleKpiCard label="Total Sales" value={formatCurrency(kpiData?.totalSales.value)} icon={Banknote} colorClass="text-blue-500" subtext="Before deductions" />
              <SimpleKpiCard label="Gross Revenue" value={formatCurrency(kpiData?.grossRevenue.value)} icon={TrendingUp} colorClass="text-green-500" subtext="After deductions" />
              <SimpleKpiCard label="Total Bookings" value={(kpiData?.totalBookings.value ?? 0).toLocaleString()} icon={Ticket} colorClass="text-orange-500" subtext="Total ticket count" />
            </>
          )}
        </section>

        {/* Trend Chart */}
        <div className="relative rounded-xl border border-slate-300 bg-gray-100 p-2 shadow-sm dark:border-slate-700 dark:bg-slate-950">
          {isTrendLoading ? <Skeleton className="h-[300px] w-full rounded-xl" /> : isChartEmpty(revenueTrend) ? <NoDataPlaceholder height="300px" /> : (
            <ShadcnLineChartMultiple
              title="Revenue per Bookings Source"
              description="Daily performance by booking source channel"
              data={revenueTrend}
              labelKey="transaction_date"
              height="300px"
              dateRange={dateRange}
              config={{
                api_v2: { label: "API v2", color: "#10b981" },
                mobile_app: { label: "Mobile App", color: "#f43f5e" },
                online: { label: "Online", color: "#6366f1" },
                otc: { label: "OTC", color: "#f97316" },
                travel_agency: { label: "Travel Agency", color: "#8b5cf6" },
                walk_in: { label: "Walk-in", color: "#0ea5e9" },
                website: { label: "Website", color: "#ec4899" },
              }}
              series={[
                { dataKey: "api_v2", color: "#10b981", name: "API v2" },
                { dataKey: "mobile_app", color: "#f43f5e", name: "Mobile App" },
                { dataKey: "online", color: "#6366f1", name: "Online" },
                { dataKey: "otc", color: "#f97316", name: "OTC" },
                { dataKey: "travel_agency", color: "#8b5cf6", name: "Travel Agency" },
                { dataKey: "walk_in", color: "#0ea5e9", name: "Walk-in" },
                { dataKey: "website", color: "#ec4899", name: "Website" },
              ]}
            />
          )}
        </div>

        <ComparisonTrendChart dateRange={dateRange} selectedRouteName={selectedRouteName} />

        {/* Breakdown Charts */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="rounded-xl border border-slate-300 bg-gray-100 p-2 dark:border-slate-700 dark:bg-slate-950 min-h-[350px]">
            {isChartsLoading ? <Skeleton className="h-[300px] w-full" /> : isChartEmpty(salesByRoute) ? <NoDataPlaceholder height="270px" /> : (
              <ShadcnBarChartHorizontal
                title="Sales by Route"
                description="Revenue breakdown by geographical route"
                data={salesByRoute.slice(routePage * ITEMS_PER_PAGE, (routePage + 1) * ITEMS_PER_PAGE)}
                dataKey="value"
                labelKey="label"
                config={{ value: { label: "Revenue" } }}
                pagination={{
                  currentPage: routePage,
                  totalPages: Math.ceil(salesByRoute.length / ITEMS_PER_PAGE),
                  onNext: () => setRoutePage(p => p + 1),
                  onPrev: () => setRoutePage(p => p - 1),
                }}
              />
            )}
          </div>

          <div className="rounded-xl border border-slate-300 bg-gray-100 p-2 dark:border-slate-700 dark:bg-slate-950 min-h-[350px]">
            {isChartsLoading ? <Skeleton className="h-[300px] w-full" /> : isChartEmpty(salesByVessel) ? <NoDataPlaceholder height="270px" /> : (
              <ShadcnBarChartHorizontal
                title="Sales per Vessel"
                description="Revenue contribution by individual vessels"
                data={salesByVessel.slice(vesselPage * ITEMS_PER_PAGE, (vesselPage + 1) * ITEMS_PER_PAGE)}
                dataKey="value"
                labelKey="label"
                config={{ value: { label: "Revenue" } }}
                pagination={{
                  currentPage: vesselPage,
                  totalPages: Math.ceil(salesByVessel.length / ITEMS_PER_PAGE),
                  onNext: () => setVesselPage(p => p + 1),
                  onPrev: () => setVesselPage(p => p - 1),
                }}
              />
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
