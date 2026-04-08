"use client";

import { useState, useEffect, useRef, ChangeEvent, useMemo } from "react";
import { format } from "date-fns";
import { SimpleKpiCard } from "@/components/charts/simple-kpi-card";
import { CalendarDays, FilterX, FileOutput, FileInput, Download, Wallet, LayoutGrid, Route, ReceiptText } from "lucide-react";
import { downloadTemplate } from "@/lib/export-utils";

import { ShadcnLineChartRegular } from "@/components/charts/shadcn-line-chart-regular";
import { ShadcnPieChartInteractive } from "@/components/charts/shadcn-pie-chart-interactive";
import { ShadcnPieChartLegend } from "@/components/charts/shadcn-pie-chart-legend";
import { ShadcnBarChartHorizontal } from "@/components/charts/shadcn-bar-chart.horizontal";
import { NoDataPlaceholder } from "@/components/charts/no-data-placeholder";

import { DateRangePicker } from "@/components/ui/date-range-picker";
import { DateRange } from   "react-day-picker";
import { Skeleton } from "@/components/ui/skeleton";

import { expensesService } from "@/services/expenses.service";
import { ExpensesReportData } from "@/types/expenses";
import { ExpensesImportPreviewModal } from "@/components/expenses-import-preview-modal";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useTenant } from "@/components/providers/tenant-provider";

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmt = (val: number) => {
  if (val >= 1_000_000) return `₱${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `₱${(val / 1_000).toFixed(0)}K`;
  return `₱${val.toLocaleString()}`;
};

// ─── Page ────────────────────────────────────────────────────────────────────
export default function ExpensesReportPage() {
  const { activeTenant, isLoading: isTenantLoading } = useTenant();
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    const now = new Date();
    return { from: new Date(now.getFullYear(), 0, 1), to: now };
  });

  const [data, setData] = useState<ExpensesReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<any>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!dateRange?.from || !dateRange?.to) return;
    async function fetchData() {
      if (!activeTenant?.api_base_url) return;
      setIsLoading(true);
      setError(null);
      try {
        const from = dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : undefined;
        const to = dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : undefined;
        if (!from || !to) return;
        const result = await expensesService.getExpensesReport(
          activeTenant.api_base_url, 
          from, 
          to, 
          activeTenant.service_key
        );
        setData(result);
        if (isInitialLoad) {
          setTimeout(() => setIsInitialLoad(false), 500);
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load expenses report. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [dateRange, refreshKey, activeTenant]);

  const handleClearFilter = () => {
    const now = new Date();
    setDateRange({ from: new Date(now.getFullYear(), 0, 1), to: now });
  };

  const handleImportClick = () => fileInputRef.current?.click();

  const handleImportChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setIsImporting(true);
    
    try {
      if (!activeTenant?.api_base_url) return;
      const preview = await expensesService.previewExpensesImport(
        activeTenant.api_base_url, 
        file, 
        activeTenant.service_key
      );
      setImportPreview(preview);
      setIsPreviewOpen(true);
    } catch (err: any) {
      toast.error("Import Preview Failed", {
        description: err?.message || "Could not parse the Excel file. Please ensure it follows the correct template.",
      });
      setSelectedFile(null);
    } finally {
      setIsImporting(false);
      // Reset input so name change isn't needed for same file re-upload
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleImportSuccess = () => {
    setRefreshKey(prev => prev + 1);
    setSelectedFile(null);
    setImportPreview(null);
  };

  const handleDownloadTemplate = async () => {
    if (isDownloadingTemplate || !activeTenant?.api_base_url) return;
    setIsDownloadingTemplate(true);
    try {
      await expensesService.downloadExpensesReportTemplateExcel(activeTenant.api_base_url, activeTenant.service_key);
    } catch {
      window.alert("Failed to download template. Please try again.");
    } finally {
      setIsDownloadingTemplate(false);
    }
  };

  const handleExport = async () => {
    if (!data || isExporting || !activeTenant?.api_base_url) return;
    setIsExporting(true);
    try {
      const from = dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : undefined;
      const to   = dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : undefined;
      await expensesService.downloadExpensesReportExcel(
        activeTenant.api_base_url, 
        from, 
        to, 
        activeTenant.service_key
      );
    } catch {
      window.alert("Export failed. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  // Trend: zip xAxisData + seriesData into recharts-friendly objects, filling missing dates
  const trendData = useMemo(() => {
    if (!data?.charts.trend || !dateRange?.from || !dateRange?.to) return [];

    const filled: { date: string; expense: number }[] = [];
    const current = new Date(dateRange.from);
    current.setHours(0, 0, 0, 0); // start of day

    const end = new Date(dateRange.to);
    end.setHours(0, 0, 0, 0);

    const { xAxisData, seriesData } = data.charts.trend;
    const dataMap = new Map(xAxisData.map((d, i) => [d, seriesData[i]]));

    while (current <= end) {
      const dateStr = format(current, "yyyy-MM-dd");
      const val = dataMap.get(dateStr) ?? 0;
      filled.push({
        date: dateStr,
        expense: Math.max(0, val), // Disregard negative values
      });
      current.setDate(current.getDate() + 1);
    }

    return filled;
  }, [data, dateRange]);

  // Payees: zip names + values with categorical coloring
  const payeeData = useMemo(() => {
    if (!data?.charts.payees) return [];
    
    const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];
    const getFill = (name: string) => {
      let hash = 0;
      for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
      return COLORS[Math.abs(hash) % COLORS.length];
    };

    return data.charts.payees.payeeNames.map((name, i) => ({
      name,
      amount: Math.max(0, data.charts.payees.payeeValues[i] ?? 0),
      fill: getFill(name)
    }));
  }, [data]);

  // Category Pie Data for ShadcnPieChartLegend
  const categoryPieData = useMemo(() => {
    if (!data?.charts.category) return { mappedData: [], config: {} };
    const mappedData = data.charts.category;
    const config: any = {};
    const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];
    
    mappedData.forEach((d, i) => {
      config[d.name] = { label: d.name, color: COLORS[i % COLORS.length] };
    });
    
    return { mappedData, config };
  }, [data]);

  // KPI display helpers
  const kpiStr = (val: number | undefined) =>
    isLoading ? "—" : (val ?? 0) === 0 ? "—" : fmt(val!);
  const kpiCount = (val: number | undefined) =>
    isLoading ? "—" : (val ?? 0) === 0 ? "—" : (val ?? 0).toLocaleString();
  const kpiText = (val: string | undefined) =>
    isLoading ? "—" : val || "—";

  // Empty checks
  const isTrendEmpty = trendData.length === 0 || trendData.every(d => d.expense === 0);
  const isCategoryEmpty = !data?.charts.category.length;
  const isPayeesEmpty = payeeData.length === 0;

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
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-end">
          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
            <CalendarDays className="h-4 w-4" />
            <span>Date Range:</span>
            <DateRangePicker date={dateRange} onDateChange={setDateRange} />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleClearFilter}
              className="inline-flex h-9 items-center gap-1.5 rounded-md border border-sky-300 bg-sky-500 px-3 text-sm font-medium text-white transition-colors hover:bg-sky-600"
            >
              <FilterX className="h-4 w-4" /> Reset
            </button>
            <button
              type="button"
              onClick={handleImportClick}
              disabled={isImporting}
              className="inline-flex h-9 items-center gap-1.5 rounded-md border border-slate-300 bg-slate-100 px-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 disabled:opacity-50"
            >
              {isImporting ? (
                <Loader2 className="h-4 w-4 animate-spin text-sky-500" />
              ) : (
                <FileInput className="h-4 w-4 text-sky-500" />
              )}
              {isImporting ? "Reading File..." : "Import"}
            </button>
            <button
              type="button"
              onClick={handleExport}
              disabled={!data || isExporting}
              className="inline-flex h-9 items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 disabled:opacity-50"
            >
              <FileOutput className={`h-4 w-4 text-sky-500 ${isExporting ? "animate-pulse" : ""}`} />
              {isExporting ? "Exporting..." : "Export"}
            </button>
            <button
              type="button"
              onClick={handleDownloadTemplate}
              disabled={isDownloadingTemplate}
              className="inline-flex h-9 items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 disabled:opacity-50"
              title="Download Excel Template"
            >
              {isDownloadingTemplate ? (
                <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" />
              ) : (
                <Download className="h-4 w-4 shrink-0 text-slate-400" />
              )}
              {isDownloadingTemplate ? "Downloading..." : "Template"}
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

        {/* KPI Row */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {isInitialLoad ? (
            <>
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-24 w-full rounded-xl" />
              ))}
            </>
          ) : (
            <>
              <SimpleKpiCard
                label="Total Expenses"
                value={kpiStr(data?.kpis.total_expenses)}
                icon={Wallet}
                colorClass="text-blue-500"
                subtext="Total spending for selected period"
              />
              <SimpleKpiCard
                label="Top Cost Category"
                value={kpiText(data?.kpis.top_cost_category)}
                icon={LayoutGrid}
                colorClass="text-green-500"
                subtext="Highest expense category"
              />
              <SimpleKpiCard
                label="Avg Cost Per Trip"
                value={kpiStr(data?.kpis.avg_cost_per_trip)}
                icon={Route}
                colorClass="text-orange-500"
                subtext="Average cost per recorded trip"
              />
              <SimpleKpiCard
                label="Transactions"
                value={kpiCount(data?.kpis.transactions)}
                icon={ReceiptText}
                colorClass="text-purple-500"
                subtext="Total number of expense entries"
              />
            </>
          )}
        </section>

        {/* Daily Expenses Trend (full width) */}
        <div className="rounded-xl border border-slate-300 bg-gray-100 p-2 shadow-sm dark:border-slate-700 dark:bg-slate-950">
          {isLoading ? (
            <Skeleton className="h-[280px] w-full rounded-xl" />
          ) : isTrendEmpty ? (
            <div className="px-4 pt-4">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Daily Expenses Trend</p>
              <NoDataPlaceholder height="240px" />
            </div>
          ) : (
            <ShadcnLineChartRegular
              title="Daily Expenses Trend"
              description="Daily aggregate of all recorded expenses"
              data={trendData}
              config={{ expense: { label: "Total Expense", color: "#ef4444" } }}
              labelKey="date"
              dataKey="expense"
              height="280px"
              dateRange={dateRange}
            />
          )}
        </div>

        {/* Breakdown Charts */}
        <section className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {/* Expenses by Category */}
          <div className="rounded-xl border border-slate-300 bg-gray-100 p-2 shadow-sm dark:border-slate-700 dark:bg-slate-950 min-h-[350px]">
            {isLoading ? (
              <Skeleton className="h-[320px] w-full rounded-xl" />
            ) : isCategoryEmpty ? (
              <div className="px-4 pt-4">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Expenses by Category</p>
                <NoDataPlaceholder height="280px" />
              </div>
            ) : (
              <ShadcnPieChartLegend
                title="Expenses by Category"
                description="Distribution across expense categories"
                data={categoryPieData.mappedData}
                config={categoryPieData.config}
                dataKey="value"
                nameKey="name"
                height="320px"
              />
            )}
          </div>

          {/* Top 5 Payees / Vendors */}
          <div className="rounded-xl border border-slate-300 bg-gray-100 p-2 shadow-sm dark:border-slate-700 dark:bg-slate-950 min-h-[350px]">
            {isLoading ? (
              <Skeleton className="h-[320px] w-full rounded-xl" />
            ) : isPayeesEmpty ? (
              <div className="px-4 pt-4">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Top 5 Payees / Vendors</p>
                <NoDataPlaceholder height="280px" />
              </div>
            ) : (
              <ShadcnBarChartHorizontal
                title="Expenses by Vendors"
                description="Top 5 payees with highest total expenditure"
                data={payeeData}
                dataKey="amount"
                labelKey="name"
                hideYAxis={false}
                config={{
                  amount: { label: "Paid Amount" },
                }}
              />
            )}
          </div>
        </section>
      </div>

      <ExpensesImportPreviewModal
        isOpen={isPreviewOpen}
        onOpenChange={setIsPreviewOpen}
        file={selectedFile}
        preview={importPreview}
        onSuccess={handleImportSuccess}
      />
    </div>
  );
}
