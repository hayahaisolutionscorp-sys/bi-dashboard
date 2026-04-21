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
import { useTenant } from "@/components/providers/tenant-provider";

// Services & Types
import { salesService } from "@/services/sales.service";
import { SalesReportRoute, SalesKpiResponse } from "@/types/sales";

const createDefaultDateRange = (): DateRange => {
  const now = new Date();
  const from = new Date(now.getFullYear(), 0, 1);
  return { from, to: now };
};

export default function SalesReportPage() {
  const { activeTenant, isLoading: isTenantLoading } = useTenant();
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
      if (!activeTenant?.api_base_url) return;
      setIsRoutesLoading(true);
      try {
        const names = await salesService.getRoutes(activeTenant.api_base_url, activeTenant.service_key);
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
  }, [activeTenant]);

  // 2. Clear state when route changes
  useEffect(() => {
    if (!selectedRouteName) return;
    setIsInitialLoad(false);
  }, [selectedRouteName]);

  // 3. Fetch KPI data
  useEffect(() => {
    async function fetchKpis() {
      if (!activeTenant?.api_base_url) return;
      setIsKpisLoading(true);
      try {
        const from = dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : undefined;
        const to = dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : undefined;
        const response = await salesService.getKpis(
          activeTenant.api_base_url, 
          from, 
          to, 
          activeTenant.service_key
        );
        setKpiData(response.data);
      } catch (err) {
        console.error("Local KPI fetch error:", err);
      } finally {
        setIsKpisLoading(false);
      }
    }
    fetchKpis();
  }, [dateRange, activeTenant]);

  // 4. Fetch Revenue Trends
  useEffect(() => {
    async function fetchTrends() {
      if (!activeTenant?.api_base_url) return;
      setIsTrendLoading(true);
      try {
        const from = dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : undefined;
        const to = dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : undefined;
        const response = await salesService.getRevenueVsBookingTrends(
          activeTenant.api_base_url, 
          from, 
          to, 
          activeTenant.service_key
        );
        
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
  }, [dateRange, activeTenant]);

  // 5. Fetch breakdown charts
  useEffect(() => {
    async function fetchCharts() {
      if (!activeTenant?.api_base_url) return;
      setIsChartsLoading(true);
      try {
        const from = dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : undefined;
        const to = dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : undefined;
        const response = await salesService.getSalesReportCharts(
          activeTenant.api_base_url, 
          from, 
          to, 
          activeTenant.service_key
        );

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
  }, [dateRange, activeTenant]);

  const handleClearFilter = () => setDateRange(undefined);
  const handleImportClick = () => fileInputRef.current?.click();

  const handleDownloadTemplate = async () => {
    if (isDownloadingTemplate || !activeTenant?.api_base_url) return;
    setIsDownloadingTemplate(true);
    try {
      await salesService.downloadSalesReportTemplateExcel(activeTenant.api_base_url, activeTenant.service_key);
    } catch {
      window.alert("Failed to download template. Please try again.");
    } finally {
      setIsDownloadingTemplate(false);
    }
  };

  const handleExport = async () => {
    if (isExporting || !activeTenant?.api_base_url) return;
    setIsExporting(true);
    try {
      const from = dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : undefined;
      const to   = dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : undefined;
      await salesService.downloadSalesReportExcel(
        activeTenant.api_base_url, 
        from, 
        to, 
        selectedRouteName || undefined, 
        activeTenant.service_key
      );
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
      <div className="flex h-[400px] items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="h-12 w-12 rounded-full bg-rose-100 dark:bg-rose-950/40 flex items-center justify-center">
            <Route className="h-6 w-6 text-rose-500" />
          </div>
          <p className="font-semibold text-slate-800 dark:text-slate-200">Failed to load data</p>
          <p className="text-sm text-slate-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background text-foreground">
      <div className="flex flex-col gap-2 p-2 sm:p-3 lg:p-4 2xl:p-5 2xl:gap-3">
        
        {/* Toolbar */}
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2 text-sm w-full sm:w-auto">
              <Route className="h-4 w-4 shrink-0 text-slate-500 dark:text-slate-400" />
              <select
                value={selectedRouteName}
                onChange={(e) => setSelectedRouteName(e.target.value)}
                className="h-8 w-full sm:w-[220px] truncate rounded-lg border border-border bg-card px-2.5 text-xs text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                disabled={isRoutesLoading || routeNames.length === 0}
              >
                {isRoutesLoading && <option value="">Loading routes...</option>}
                {!isRoutesLoading && routeNames.length === 0 && <option value="">No Routes Available</option>}
                {routeNames.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 text-sm w-full sm:w-auto sm:border-l sm:border-l sm:border-border sm:pl-3">
              <CalendarDays className="h-4 w-4 shrink-0 text-slate-500 dark:text-slate-400" />
              <span className="hidden sm:inline-block shrink-0 text-slate-600 dark:text-slate-300">Date Range:</span>
              <div className="w-full sm:w-auto">
                <DateRangePicker date={dateRange} onDateChange={setDateRange} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-row sm:items-center sm:gap-2">
            <button onClick={handleClearFilter} className="inline-flex h-8 justify-center items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-xs font-medium text-foreground hover:bg-secondary"><FilterX className="h-3.5 w-3.5" /> Reset</button>
            <button onClick={handleImportClick} className="inline-flex h-8 justify-center items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-xs font-medium text-foreground hover:bg-secondary"><FileInput className="h-3.5 w-3.5" /> Import</button>
            <button onClick={handleExport} disabled={isExporting} className="inline-flex h-8 justify-center items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-xs font-medium text-foreground hover:bg-secondary disabled:opacity-50">
              {isExporting ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary border-t-transparent" /> : <FileOutput className="h-3.5 w-3.5 text-primary" />} Export
            </button>
            <button onClick={handleDownloadTemplate} disabled={isDownloadingTemplate} className="inline-flex h-8 justify-center items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-xs font-medium text-foreground hover:bg-secondary">
              {isDownloadingTemplate ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" /> : <Download className="h-3.5 w-3.5 text-muted-foreground" />} Template
            </button>
          </div>
          <input ref={fileInputRef} type="file" accept=".xlsx, .xls, .json" className="hidden" onChange={() => {}} />
        </div>

        {/* KPIs */}
        <section className="grid grid-cols-1 gap-2 sm:grid-cols-3 2xl:gap-3">
          {isKpisLoading ? (
            <>
              <Skeleton className="h-20 w-full rounded-xl" />
              <Skeleton className="h-20 w-full rounded-xl" />
              <Skeleton className="h-20 w-full rounded-xl" />
            </>
          ) : (
            <>
              <SimpleKpiCard label="Total Sales" value={formatCurrency(kpiData?.totalSales.value)} icon={Banknote} colorClass="text-blue-500" subtext="Before deductions" />
              <SimpleKpiCard label="Gross Revenue" value={formatCurrency(kpiData?.grossRevenue.value)} icon={TrendingUp} colorClass="text-green-500" subtext="After deductions" />
              <SimpleKpiCard label="Total Bookings" value={(kpiData?.totalBookings.value ?? 0).toLocaleString()} icon={Ticket} colorClass="text-orange-500" subtext="Total ticket count" />
            </>
          )}
        </section>

        {/* Trend Chart */}
        <div className="relative rounded-xl border border-border bg-card">
          {isTrendLoading ? <Skeleton className="h-[220px] w-full rounded-xl md:h-[280px] 2xl:h-[340px]" /> : isChartEmpty(revenueTrend) ? <NoDataPlaceholder height="280px" /> : (
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
        <section className="grid grid-cols-1 gap-2 md:grid-cols-2 2xl:gap-3">
          <div className="rounded-xl border border-border bg-card min-h-[220px] md:min-h-[260px] 2xl:min-h-[320px]">
            {isChartsLoading ? <Skeleton className="h-[260px] w-full" /> : isChartEmpty(salesByRoute) ? <NoDataPlaceholder height="220px" /> : (
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

          <div className="rounded-xl border border-border bg-card min-h-[220px] md:min-h-[260px] 2xl:min-h-[320px]">
            {isChartsLoading ? <Skeleton className="h-[260px] w-full" /> : isChartEmpty(salesByVessel) ? <NoDataPlaceholder height="220px" /> : (
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
