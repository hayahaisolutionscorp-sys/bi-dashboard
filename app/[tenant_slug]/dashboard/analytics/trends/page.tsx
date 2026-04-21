"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";

import { useTenant } from "@/components/providers/tenant-provider";
import { salesService } from "@/services/sales.service";
import { ComparisonTrendData } from "@/types/sales";
import { TrendsComparisonChart, TrendsMetric, TrendsChartType } from "@/components/charts/trends-comparison-chart";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  TrendingUp, Route, Ship, MapPin, BarChart2, BarChart3, LineChart,
  ChevronDown, Check, X, Search, GitCompare, Calendar,
  ArrowUpRight, ArrowDownRight, Minus, Layers3, Trophy, AlertCircle, ServerOff,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useChartColors } from "@/hooks/use-chart-colors";

// ── Types ─────────────────────────────────────────────────────────────────────

type CompareBy = "route" | "vessel" | "trip";
type Granularity = "day" | "week" | "month";

const MAX_ENTITIES: Record<CompareBy, number> = { vessel: 8, route: 10, trip: 15 };

const PALETTE = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildDefaultDateRange(): DateRange {
  const now = new Date();
  // Default to the current calendar month so there is data on first load.
  return {
    from: new Date(now.getFullYear(), now.getMonth(), 1),
    to:   now,
  };
}

function parseDateRange(fromStr: string | null, toStr: string | null): DateRange | undefined {
  if (!fromStr || !toStr) return undefined;
  const from = new Date(fromStr);
  const to   = new Date(toStr);
  if (isNaN(from.getTime()) || isNaN(to.getTime())) return undefined;
  return { from, to };
}

function formatDateRange(range: DateRange | undefined): string {
  if (!range?.from || !range?.to) return "Select range";
  return `${format(range.from, "MMM d, yyyy")} – ${format(range.to, "MMM d, yyyy")}`;
}

function formatMetricKpi(value: number, metric: TrendsMetric): string {
  if (metric === "totalSales" || metric === "grossRevenue") {
    if (value >= 1_000_000) return `₱${(value / 1_000_000).toFixed(2)}M`;
    if (value >= 1_000)     return `₱${(value / 1_000).toFixed(1)}K`;
    return `₱${value.toFixed(0)}`;
  }
  if (metric === "loadFactor") return `${value.toFixed(1)}%`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000)     return `${(value / 1_000).toFixed(1)}K`;
  return String(Math.round(value));
}

function getMetricPointValue(point: ComparisonTrendData["series"][number]["data"][number], metric: TrendsMetric): number {
  if (metric === "loadFactor") return point.loadFactor ?? 0;
  return (point as any)[metric] ?? 0;
}

function aggregateMetricAcrossSeries(
  series: ComparisonTrendData["series"],
  metric: TrendsMetric,
): number {
  const values = series.flatMap((entry) => entry.data.map((point) => getMetricPointValue(point, metric)));
  const total = values.reduce((sum, value) => sum + value, 0);
  return metric === "loadFactor" ? (values.length > 0 ? total / values.length : 0) : total;
}

const METRIC_OPTIONS: { value: TrendsMetric; label: string; sublabel: string }[] = [
  { value: "totalSales",      label: "Total Sales",      sublabel: "₱ gross bookings" },
  { value: "grossRevenue",    label: "Gross Revenue",    sublabel: "₱ net revenue" },
  { value: "totalBookings",   label: "Bookings",         sublabel: "confirmed count" },
  { value: "totalPassengers", label: "Passengers",       sublabel: "headcount" },
  { value: "loadFactor",      label: "Load Factor",      sublabel: "% capacity used" },
];

const CHART_TYPE_OPTIONS: { value: TrendsChartType; icon: React.ReactNode; label: string }[] = [
  { value: "line", icon: <LineChart className="h-3.5 w-3.5" />, label: "Line" },
  { value: "area", icon: <BarChart2  className="h-3.5 w-3.5" />, label: "Area" },
  { value: "bar",  icon: <BarChart3  className="h-3.5 w-3.5" />, label: "Bar"  },
];

const GRANULARITY_OPTIONS: { value: Granularity; label: string }[] = [
  { value: "day",   label: "Daily"   },
  { value: "week",  label: "Weekly"  },
  { value: "month", label: "Monthly" },
];

const COMPARE_BY_OPTIONS: { value: CompareBy; icon: React.ReactNode; label: string }[] = [
  { value: "route",  icon: <Route  className="h-3.5 w-3.5" />, label: "Route"  },
  { value: "vessel", icon: <Ship   className="h-3.5 w-3.5" />, label: "Vessel" },
  { value: "trip",   icon: <MapPin className="h-3.5 w-3.5" />, label: "Trip"   },
];

// ── Reusable pill toggle group ────────────────────────────────────────────────

interface PillGroupProps<T extends string> {
  options: { value: T; label: string; icon?: React.ReactNode }[];
  value: T;
  onChange: (v: T) => void;
}

function PillGroup<T extends string>({ options, value, onChange }: PillGroupProps<T>) {
  return (
    <div className="flex items-center gap-0.5 rounded-md border bg-muted/30 p-0.5">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-all duration-100",
            value === opt.value
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-background/60",
          )}
        >
          {opt.icon}
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// ── Entity selector ───────────────────────────────────────────────────────────

interface EntitySelectorProps {
  selected: string[];
  available: string[];
  isSearching: boolean;
  searchTerm: string;
  maxEntities: number;
  entityError: string | null;
  onSearchChange: (v: string) => void;
  onToggle: (entity: string) => void;
  onClear: () => void;
  compareBy: CompareBy;
  compact?: boolean;
  /** When true, hides badges/empty-state/error — caller renders those itself */
  hideMeta?: boolean;
}

function EntitySelector({
  selected, available, isSearching, searchTerm, maxEntities, entityError,
  onSearchChange, onToggle, onClear, compareBy, compact = false, hideMeta = false,
}: EntitySelectorProps) {
  const [open, setOpen] = useState(false);
  const dimensionLabel = compareBy === "route" ? "routes" : compareBy === "vessel" ? "vessels" : "trips";

  return (
    <div className={cn("flex flex-col", compact ? "gap-1.5" : "gap-2")}>
      {/* Selected badges */}
      {!hideMeta && selected.length > 0 && (
        <div className={cn("flex flex-wrap gap-1.5", compact && "max-h-16 overflow-y-auto pr-1") }>
          {selected.map((e, i) => (
            <Badge
              key={e}
              variant="secondary"
              className={cn("gap-1 text-xs", compact ? "max-w-[132px] py-0.5" : "max-w-[160px]")}
              style={{ borderLeftColor: PALETTE[i % PALETTE.length], borderLeftWidth: 3 }}
            >
              <span className="truncate">{e}</span>
              <button onClick={() => onToggle(e)} className="ml-0.5 hover:text-destructive flex-shrink-0">
                <X className="h-2.5 w-2.5" />
              </button>
            </Badge>
          ))}
          <button
            onClick={onClear}
            className="text-[10px] text-muted-foreground hover:text-destructive underline self-center"
          >
            {compact ? "Clear" : "Clear all"}
          </button>
        </div>
      )}

      {!hideMeta && selected.length === 0 && !entityError && (
        <p className="text-xs text-muted-foreground italic">
          {compact
            ? `Top ${dimensionLabel} auto-selected when empty`
            : `Auto-selecting top ${dimensionLabel} by volume`}
        </p>
      )}

      {!hideMeta && entityError && (
        <p className="text-xs text-destructive flex items-center gap-1">
          <AlertCircle className="h-3 w-3 flex-shrink-0" />
          {entityError}
        </p>
      )}

      {/* Portal-based dropdown — renders outside overflow-hidden parents */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            disabled={selected.length >= maxEntities}
            className={cn(
              "flex w-full items-center gap-2 px-3 rounded-md border border-input bg-background text-xs hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed",
              compact ? "h-9" : "h-8",
            )}
          >
            <Search className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
            <span className="text-muted-foreground flex-1 text-left">
              {selected.length >= maxEntities
                ? `Max ${maxEntities} ${dimensionLabel} selected`
                : `Search ${dimensionLabel}…`}
            </span>
            <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform", open && "rotate-180")} />
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          sideOffset={4}
          className="p-0 min-w-[240px] w-[var(--radix-popover-trigger-width)]"
        >
          <div className="p-2 border-b">
            <div className="flex items-center gap-2 h-8 px-2 rounded-sm border bg-background">
              <Search className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
              <input
                autoFocus
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={`Search ${dimensionLabel}…`}
                className="flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground"
              />
              {searchTerm && (
                <button onClick={() => onSearchChange("")} className="flex-shrink-0 hover:text-destructive">
                  <X className="h-3 w-3 text-muted-foreground" />
                </button>
              )}
            </div>
          </div>
          <div className="max-h-52 overflow-y-auto py-1">
            {isSearching && (
              <div className="px-3 py-2 space-y-1.5">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-3 w-full" />)}
              </div>
            )}
            {!isSearching && available.length === 0 && (
              <div className="px-3 py-4 text-xs text-muted-foreground text-center">No results found.</div>
            )}
            {!isSearching && available.map((entity) => {
              const isSelected = selected.includes(entity);
              const isDisabled = !isSelected && selected.length >= maxEntities;
              return (
                <button
                  key={entity}
                  onClick={() => { if (!isDisabled) { onToggle(entity); setOpen(false); } }}
                  disabled={isDisabled}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed text-left transition-colors"
                >
                  <span className={cn(
                    "flex-shrink-0 h-3.5 w-3.5 rounded-sm border flex items-center justify-center",
                    isSelected ? "bg-primary border-primary" : "border-input",
                  )}>
                    {isSelected && <Check className="h-2.5 w-2.5 text-primary-foreground" />}
                  </span>
                  <span className="truncate">{entity}</span>
                </button>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

// ── Control section label ─────────────────────────────────────────────────────

function ControlLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground leading-none select-none">
      {children}
    </span>
  );
}

// ── Horizontal Control Bar ────────────────────────────────────────────────────

interface ControlBarProps {
  dateRangeA: DateRange;
  dateRangeB: DateRange | undefined;
  comparePeriod: boolean;
  compareBy: CompareBy;
  granularity: Granularity;
  metric: TrendsMetric;
  entities: string[];
  availableEntities: string[];
  isSearching: boolean;
  entitySearch: string;
  isLoadingB: boolean;
  entityError: string | null;
  resolvedPalette: string[];
  onDateRangeAChange: (r: DateRange | undefined) => void;
  onDateRangeBChange: (r: DateRange | undefined) => void;
  onToggleComparePeriod: () => void;
  onCompareByChange: (v: CompareBy) => void;
  onGranularityChange: (v: Granularity) => void;
  onMetricChange: (v: TrendsMetric) => void;
  onEntitySearchChange: (v: string) => void;
  onEntityToggle: (entity: string) => void;
  onEntityClear: () => void;
  onReset: () => void;
}

function ControlBar({
  dateRangeA, dateRangeB, comparePeriod, compareBy, granularity, metric,
  entities, availableEntities, isSearching, entitySearch, isLoadingB, entityError, resolvedPalette,
  onDateRangeAChange, onDateRangeBChange, onToggleComparePeriod,
  onCompareByChange, onGranularityChange, onMetricChange,
  onEntitySearchChange, onEntityToggle, onEntityClear, onReset,
}: ControlBarProps) {
  const dimensionLabel = compareBy === "route" ? "routes" : compareBy === "vessel" ? "vessels" : "trips";

  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">

      {/* ── Row 1: Date range ──────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 px-5 py-4">
        <ControlLabel>Date Range</ControlLabel>
        <DateRangePicker
          date={dateRangeA}
          onDateChange={onDateRangeAChange}
        />
        <Button
          type="button"
          variant={comparePeriod ? "default" : "outline"}
          size="sm"
          className="h-9 gap-1.5 text-xs font-medium transition-all"
          onClick={onToggleComparePeriod}
        >
          <GitCompare className="h-3.5 w-3.5" />
          {comparePeriod ? "vs Period B" : "Compare Period"}
        </Button>
        {comparePeriod && (
          <div className="flex items-center gap-2">
            <ControlLabel>Period B</ControlLabel>
            <DateRangePicker
              date={dateRangeB}
              onDateChange={onDateRangeBChange}
            />
            {isLoadingB && (
              <span className="text-[10px] text-primary animate-pulse whitespace-nowrap">Loading…</span>
            )}
          </div>
        )}
      </div>

      {/* ── Divider ─────────────────────────────────────────────────────────── */}
      <div className="h-px bg-border mx-0" />

      {/* ── Row 2: Filters + Entities + Actions ─────────────────────────────── */}
      <div className="flex flex-wrap items-end gap-5 px-5 py-4">
        {/* Granularity */}
        <div className="flex flex-col gap-2 flex-shrink-0">
          <ControlLabel>Granularity</ControlLabel>
          <PillGroup options={GRANULARITY_OPTIONS} value={granularity} onChange={onGranularityChange} />
        </div>

        {/* Group By */}
        <div className="flex flex-col gap-2 flex-shrink-0">
          <ControlLabel>Group By</ControlLabel>
          <Select value={compareBy} onValueChange={(v) => onCompareByChange(v as CompareBy)}>
            <SelectTrigger className="h-9 text-xs w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {COMPARE_BY_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value} className="text-xs">
                  <span className="flex items-center gap-1.5">
                    {opt.icon}
                    {opt.label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Metric */}
        <div className="flex flex-col gap-2 flex-shrink-0">
          <ControlLabel>Metric</ControlLabel>
          <Select value={metric} onValueChange={(v) => onMetricChange(v as TrendsMetric)}>
            <SelectTrigger className="h-9 text-xs w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {METRIC_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value} className="text-xs">
                  <span className="font-medium">{opt.label}</span>
                  <span className="ml-1.5 text-muted-foreground text-[10px]">{opt.sublabel}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Entities — flex-1 so it fills remaining space */}
        <div className="flex flex-col gap-2 flex-1 min-w-[200px]">
          <div className="flex items-center justify-between">
            <ControlLabel>Entities</ControlLabel>
            <span className="text-[10px] text-muted-foreground tabular-nums">
              {entities.length}/{MAX_ENTITIES[compareBy]} max
            </span>
          </div>

          {/* Selected badges — shown above the search trigger */}
          {entities.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {entities.map((e, i) => (
                <Badge
                  key={e}
                  variant="secondary"
                  className="gap-1 text-xs max-w-[180px] py-0.5"
                  style={{ borderLeftColor: resolvedPalette[i % resolvedPalette.length] || PALETTE[i % PALETTE.length], borderLeftWidth: 3 }}
                >
                  <span className="truncate">{e}</span>
                  <button onClick={() => onEntityToggle(e)} className="ml-0.5 hover:text-destructive flex-shrink-0">
                    <X className="h-2.5 w-2.5" />
                  </button>
                </Badge>
              ))}
              <button
                onClick={onEntityClear}
                className="text-[10px] text-muted-foreground hover:text-destructive underline self-center"
              >
                Clear all
              </button>
            </div>
          )}

          {entityError && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <AlertCircle className="h-3 w-3 flex-shrink-0" />
              {entityError}
            </p>
          )}

          <EntitySelector
            selected={entities}
            available={availableEntities}
            isSearching={isSearching}
            searchTerm={entitySearch}
            maxEntities={MAX_ENTITIES[compareBy]}
            entityError={null}
            onSearchChange={onEntitySearchChange}
            onToggle={onEntityToggle}
            onClear={onEntityClear}
            compareBy={compareBy}
            compact
            hideMeta
          />
        </div>

        {/* Actions — pushed to the right */}
        <div className="flex flex-col gap-2 flex-shrink-0">
          <ControlLabel>Actions</ControlLabel>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 px-5 text-xs font-medium"
              onClick={onReset}
            >
              Clear
            </Button>
            <Button
              type="button"
              size="sm"
              className="h-9 px-6 text-xs font-semibold"
              onClick={onEntityClear}
            >
              Apply
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface OverviewStatCardProps {
  label: string;
  value: string;
  detail: string;
  icon: React.ReactNode;
  tone?: "default" | "success" | "accent";
}

function OverviewStatCard({ label, value, detail, icon, tone = "default" }: OverviewStatCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border px-3 py-3 sm:px-4 sm:py-4 shadow-sm",
        tone === "default" && "border-border/60 bg-card",
        tone === "success" && "border-emerald-500/25 bg-emerald-500/8 dark:bg-emerald-500/10",
        tone === "accent" && "border-primary/25 bg-primary/8 dark:bg-primary/10",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
          <p className="mt-1.5 sm:mt-2 text-base sm:text-lg font-semibold leading-tight text-foreground truncate">{value}</p>
        </div>
        <div className={cn(
          "flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl shadow-sm flex-shrink-0",
          tone === "default" && "bg-muted text-muted-foreground",
          tone === "success" && "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
          tone === "accent" && "bg-primary/15 text-primary",
        )}>
          {icon}
        </div>
      </div>
      <p className="mt-2 sm:mt-3 text-[11px] sm:text-xs text-muted-foreground leading-relaxed">{detail}</p>
    </div>
  );
}

// ── KPI card ──────────────────────────────────────────────────────────────────

interface KpiCardProps {
  id: string;
  value: number;
  valueB?: number | null;
  metric: TrendsMetric;
  color: string;
  periodBLabel?: string;
  isComparing: boolean;
}

function KpiCard({ id, value, valueB, metric, color, periodBLabel, isComparing }: KpiCardProps) {
  const delta =
    isComparing && valueB != null && valueB !== 0
      ? ((value - valueB) / Math.abs(valueB)) * 100
      : null;

  const isUp = delta !== null && delta > 0;
  const isDown = delta !== null && delta < 0;
  const isFlat = delta !== null && delta === 0;

  return (
    <div
      className="rounded-xl border bg-card px-3 py-3 sm:px-4 sm:py-3.5 flex flex-col gap-2 overflow-hidden relative"
      style={{ borderTopColor: color, borderTopWidth: 3 }}
    >
      {/* Subtle color wash behind the card using the entity's chart color */}
      <div
        className="absolute inset-0 opacity-[0.04] dark:opacity-[0.07] pointer-events-none"
        style={{ background: `linear-gradient(135deg, ${color} 0%, transparent 60%)` }}
      />
      <p className="relative text-xs text-muted-foreground font-medium truncate leading-tight" title={id}>
        {id}
      </p>
      <div className="relative flex items-end justify-between gap-2">
        <div>
          <p className="text-2xl font-bold tabular-nums tracking-tight leading-none text-foreground">
            {formatMetricKpi(value, metric)}
          </p>
          <p className="text-[10px] text-muted-foreground mt-1">
            {metric === "loadFactor" ? "avg" : "total"}
          </p>
        </div>
        {delta !== null && (
          <div className={cn(
            "flex items-center gap-0.5 text-[11px] font-semibold px-2 py-1 rounded-lg flex-shrink-0",
            isUp && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
            isDown && "bg-red-500/10 text-red-600 dark:text-red-400",
            isFlat && "bg-muted text-muted-foreground",
          )}>
            {isUp && <ArrowUpRight className="h-3 w-3" />}
            {isDown && <ArrowDownRight className="h-3 w-3" />}
            {isFlat && <Minus className="h-3 w-3" />}
            {Math.abs(delta).toFixed(1)}%
          </div>
        )}
      </div>
      {isComparing && valueB != null && (
        <p className="relative text-[10px] text-muted-foreground border-t pt-1.5">
          {periodBLabel}:{" "}
          <span className="font-medium text-foreground/70">{formatMetricKpi(valueB, metric)}</span>
        </p>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function TrendsPage() {
  const { activeTenant, isLoading: isTenantLoading } = useTenant();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Resolved chart colors — react to theme changes & brand config
  const { chart: resolvedPalette } = useChartColors();

  // Responsive chart height
  const [chartHeight, setChartHeight] = useState(420);
  useEffect(() => {
    const update = () => setChartHeight(window.innerWidth < 640 ? 260 : 420);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // ── URL-synced helpers ──────────────────────────────────────────────────────

  const setParam = useCallback((key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value !== null) params.set(key, value); else params.delete(key);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [router, pathname, searchParams]);

  const setMultiParam = useCallback((updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([k, v]) => {
      if (v !== null) params.set(k, v); else params.delete(k);
    });
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [router, pathname, searchParams]);

  // ── Read URL state ──────────────────────────────────────────────────────────

  const dateRangeA = useMemo((): DateRange => {
    return parseDateRange(searchParams.get("from"), searchParams.get("to")) ?? buildDefaultDateRange();
  }, [searchParams]);

  const dateRangeB = useMemo((): DateRange | undefined => {
    return parseDateRange(searchParams.get("fromB"), searchParams.get("toB"));
  }, [searchParams]);

  const compareBy    = (searchParams.get("compareBy")    || "vessel")     as CompareBy;
  const metric       = (searchParams.get("metric")        || "totalSales") as TrendsMetric;
  const granularity  = (searchParams.get("granularity")   || "day")        as Granularity;
  const chartType    = (searchParams.get("chartType")     || "line")       as TrendsChartType;
  const comparePeriod = searchParams.get("comparePeriod") === "1";

  const entities = useMemo(() => {
    const raw = searchParams.get("entities");
    return raw ? raw.split(",").filter(Boolean) : [];
  }, [searchParams]);

  // ── Write URL state ─────────────────────────────────────────────────────────

  const setDateRangeA = useCallback((r: DateRange | undefined) => {
    if (r?.from && r?.to) {
      setMultiParam({ from: r.from.toISOString(), to: r.to.toISOString() });
    }
  }, [setMultiParam]);

  const setDateRangeB = useCallback((r: DateRange | undefined) => {
    if (r?.from && r?.to) {
      setMultiParam({ fromB: r.from.toISOString(), toB: r.to.toISOString() });
    } else {
      setMultiParam({ fromB: null, toB: null });
    }
  }, [setMultiParam]);

  const setCompareBy = useCallback((v: CompareBy) => {
    setMultiParam({ compareBy: v, entities: null });
  }, [setMultiParam]);

  const toggleEntity = useCallback((entity: string) => {
    const next = entities.includes(entity)
      ? entities.filter((e) => e !== entity)
      : [...entities, entity].slice(0, MAX_ENTITIES[compareBy]);
    setParam("entities", next.length > 0 ? next.join(",") : null);
  }, [entities, compareBy, setParam]);

  const clearEntities = useCallback(() => setParam("entities", null), [setParam]);

  const handleReset = useCallback(() => {
    const def = buildDefaultDateRange();
    setMultiParam({
      from: def.from!.toISOString(),
      to: def.to!.toISOString(),
      fromB: null,
      toB: null,
      comparePeriod: null,
      compareBy: "vessel",
      metric: "totalSales",
      granularity: "day",
      entities: null,
    });
  }, [setMultiParam]);

  const toggleComparePeriod = useCallback(() => {
    if (comparePeriod) {
      setMultiParam({ comparePeriod: null, fromB: null, toB: null });
    } else {
      const days = dateRangeA.to && dateRangeA.from
        ? Math.round((dateRangeA.to.getTime() - dateRangeA.from.getTime()) / 86400000) : 30;
      const toB = new Date(dateRangeA.from!);
      toB.setDate(toB.getDate() - 1);
      const fromB = new Date(toB);
      fromB.setDate(fromB.getDate() - days);
      setMultiParam({ comparePeriod: "1", fromB: fromB.toISOString(), toB: toB.toISOString() });
    }
  }, [comparePeriod, dateRangeA, setMultiParam]);

  // ── Entity search ───────────────────────────────────────────────────────────

  const [availableEntities, setAvailableEntities] = useState<string[]>([]);
  const [entitySearch, setEntitySearch] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [entityError, setEntityError] = useState<string | null>(null);

  useEffect(() => {
    if (!activeTenant?.api_base_url) return;
    setIsSearching(true);
    setEntityError(null);
    const timer = setTimeout(async () => {
      try {
        const from = dateRangeA.from?.toISOString().split("T")[0];
        const to   = dateRangeA.to?.toISOString().split("T")[0];
        const result = await salesService.getComparisonTrendEntities(
          activeTenant.api_base_url,
          { compareBy, from, to, q: entitySearch || undefined },
          activeTenant.service_key,
        );
        setAvailableEntities(result);
      } catch (err) {
        console.error("Entity fetch error:", err);
        setEntityError("Could not load entities.");
        setAvailableEntities([]);
      } finally {
        setIsSearching(false);
      }
    }, 280);
    return () => clearTimeout(timer);
  }, [activeTenant, compareBy, dateRangeA, entitySearch]);

  // ── Trend data fetch ────────────────────────────────────────────────────────

  const [dataA, setDataA] = useState<ComparisonTrendData | null>(null);
  const [dataB, setDataB] = useState<ComparisonTrendData | null>(null);
  const [isLoadingA, setIsLoadingA] = useState(false);
  const [isLoadingB, setIsLoadingB] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!activeTenant?.api_base_url || !dateRangeA.from || !dateRangeA.to) return;
    setIsLoadingA(true);
    setError(null);
    salesService.getComparisonTrend(
      activeTenant.api_base_url,
      {
        from: dateRangeA.from.toISOString().split("T")[0],
        to:   dateRangeA.to.toISOString().split("T")[0],
        compareBy,
        entityIds: entities.length > 0 ? entities : undefined,
        granularity,
      },
      activeTenant.service_key,
    ).then(setDataA)
      .catch(() => setError("Failed to load trend data. Please try again."))
      .finally(() => setIsLoadingA(false));
  }, [activeTenant, dateRangeA, compareBy, entities, granularity]);

  useEffect(() => {
    if (!comparePeriod || !activeTenant?.api_base_url || !dateRangeB?.from || !dateRangeB?.to) {
      setDataB(null);
      return;
    }
    setIsLoadingB(true);
    salesService.getComparisonTrend(
      activeTenant.api_base_url,
      {
        from: dateRangeB.from.toISOString().split("T")[0],
        to:   dateRangeB.to.toISOString().split("T")[0],
        compareBy,
        entityIds: entities.length > 0 ? entities : undefined,
        granularity,
      },
      activeTenant.service_key,
    ).then(setDataB)
      .catch(console.error)
      .finally(() => setIsLoadingB(false));
  }, [activeTenant, dateRangeB, compareBy, entities, granularity, comparePeriod]);

  // ── KPI summary ─────────────────────────────────────────────────────────────

  const kpiSummary = useMemo(() => {
    if (!dataA) return [];
    return dataA.series.map((s, i) => {
      const values = s.data.map((pt) =>
        metric === "loadFactor" ? (pt.loadFactor ?? 0) : (pt as any)[metric] ?? 0,
      );
      const total = values.reduce((sum, v) => sum + v, 0);
      const valueA = metric === "loadFactor" ? (values.length > 0 ? total / values.length : 0) : total;

      // Match Period B series by entity id
      const seriesB = dataB?.series.find((sb) => sb.id === s.id);
      let valueB: number | null = null;
      if (seriesB) {
        const bVals = seriesB.data.map((pt) =>
          metric === "loadFactor" ? (pt.loadFactor ?? 0) : (pt as any)[metric] ?? 0);
        const bTotal = bVals.reduce((sum, v) => sum + v, 0);
        valueB = metric === "loadFactor" ? (bVals.length > 0 ? bTotal / bVals.length : 0) : bTotal;
      }

      return {
        id: s.id,
        value: valueA,
        valueB,
        // Use resolved palette so color responds to theme & brand changes
        color: resolvedPalette[i % resolvedPalette.length] || PALETTE[i % PALETTE.length],
      };
    });
  }, [dataA, dataB, metric, resolvedPalette]);

  const overviewStats = useMemo(() => {
    if (!dataA) return null;

    const dimensionName = compareBy === "route" ? "route" : compareBy === "vessel" ? "vessel" : "trip";
    const totalA = aggregateMetricAcrossSeries(dataA.series, metric);
    const totalB = dataB ? aggregateMetricAcrossSeries(dataB.series, metric) : null;
    const delta =
      comparePeriod && totalB != null && totalB !== 0
        ? ((totalA - totalB) / Math.abs(totalB)) * 100
        : null;
    const leadEntity = kpiSummary.reduce<{ id: string; value: number } | null>((best, current) => {
      if (!best || current.value > best.value) {
        return { id: current.id, value: current.value };
      }
      return best;
    }, null);

    return {
      dimensionLabel: `${dimensionName}${dataA.series.length === 1 ? "" : "s"}`,
      seriesCount: dataA.series.length,
      totalA,
      totalB,
      delta,
      leadEntity,
    };
  }, [compareBy, comparePeriod, dataA, dataB, kpiSummary, metric]);

  // ── Loading (tenant) ─────────────────────────────────────────────────────────

  // ── No tenant configured ────────────────────────────────────────────────────

  if (!isTenantLoading && !activeTenant) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-12 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
          <ServerOff className="h-6 w-6 text-muted-foreground" />
        </div>
        <div>
          <h2 className="text-base font-semibold">No tenant configured</h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-xs">
            Sign in to a tenant to load Trends &amp; Comparison data.
          </p>
        </div>
      </div>
    );
  }

  if (isTenantLoading) {
    return (
      <div className="flex flex-col gap-6 p-4 md:p-6">
        <Skeleton className="h-10 w-64" />
        <div className="rounded-xl border overflow-hidden">
          <div className="flex flex-wrap gap-px bg-border/60">
            {[260, 200, 160, 220, 280].map((w, i) => (
              <div key={i} className="bg-card px-4 py-3.5 flex-shrink-0">
                <Skeleton className="h-3 w-16 mb-2.5" />
                <Skeleton className="h-9" style={{ width: w }} />
              </div>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-xl border bg-card p-4 space-y-3">
              <Skeleton className="h-3 w-3/4" />
              <Skeleton className="h-8 w-1/2" />
              <Skeleton className="h-2.5 w-2/3" />
            </div>
          ))}
        </div>
        <Skeleton className="h-[420px] w-full rounded-xl" />
      </div>
    );
  }

  const periodALabel = formatDateRange(dateRangeA);
  const periodBLabel = dateRangeB ? formatDateRange(dateRangeB) : "Period B";
  const activeMetricLabel = METRIC_OPTIONS.find((m) => m.value === metric)?.label ?? "Trend";

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">

      {/* ── Hero header ──────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-[28px] border border-border/70 bg-gradient-to-br from-primary/12 via-background to-[hsl(var(--chart-2))]/10 shadow-sm">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.45),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(14,165,233,0.10),transparent_30%)] dark:bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.06),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(14,165,233,0.12),transparent_30%)]" />
        <div className="relative p-5 md:p-6">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-2xl bg-primary/12 ring-1 ring-primary/15 flex-shrink-0">
                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <h1 className="mt-1 text-lg sm:text-2xl font-bold tracking-tight leading-tight">Trends &amp; Comparison</h1>
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1 truncate">
                  {periodALabel}
                  {comparePeriod && dateRangeB && <> &nbsp;·&nbsp; compared with &nbsp;{periodBLabel}</>}
                </p>
              </div>
            </div>
            {/* Badges — horizontal scroll on mobile */}
            <div className="flex items-center gap-1.5 flex-nowrap overflow-x-auto pb-0.5 max-w-full scrollbar-none">
              <Badge variant="secondary" className="text-[11px] font-medium bg-background/70 backdrop-blur-sm whitespace-nowrap">
                {COMPARE_BY_OPTIONS.find((o) => o.value === compareBy)?.label}
              </Badge>
              <Badge variant="secondary" className="text-[11px] font-medium capitalize bg-background/70 backdrop-blur-sm whitespace-nowrap">
                {granularity}
              </Badge>
              <Badge variant="secondary" className="text-[11px] font-medium bg-background/70 backdrop-blur-sm whitespace-nowrap">
                {activeMetricLabel}
              </Badge>
              {comparePeriod && (
                <Badge className="text-[11px] font-medium gap-1 shadow-sm whitespace-nowrap">
                  <GitCompare className="h-3 w-3" />
                  Comparing
                </Badge>
              )}
            </div>
          </div>

          {/* ── Inline control bar ─────────────────────────────────────────── */}
          <div className="mt-4 pt-4 border-t border-border/40">
            <ControlBar
              dateRangeA={dateRangeA}
              dateRangeB={dateRangeB}
              comparePeriod={comparePeriod}
              compareBy={compareBy}
              granularity={granularity}
              metric={metric}
              entities={entities}
              availableEntities={availableEntities}
              isSearching={isSearching}
              entitySearch={entitySearch}
              isLoadingB={isLoadingB}
              entityError={entityError}
              resolvedPalette={resolvedPalette}
              onDateRangeAChange={setDateRangeA}
              onDateRangeBChange={setDateRangeB}
              onToggleComparePeriod={toggleComparePeriod}
              onCompareByChange={setCompareBy}
              onGranularityChange={(v) => setParam("granularity", v)}
              onMetricChange={(v) => setParam("metric", v)}
              onEntitySearchChange={setEntitySearch}
              onEntityToggle={toggleEntity}
              onEntityClear={clearEntities}
              onReset={handleReset}
            />
          </div>
        </div>
      </section>

      {/* ── Overview stat cards ───────────────────────────────────────────── */}
      {overviewStats && (
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <OverviewStatCard
            label="Current Period"
            value={formatMetricKpi(overviewStats.totalA, metric)}
            detail={`Aggregated ${activeMetricLabel.toLowerCase()} across ${overviewStats.seriesCount} ${overviewStats.dimensionLabel}.`}
            icon={<Calendar className="h-4 w-4" />}
            tone="accent"
          />
          <OverviewStatCard
            label={comparePeriod ? "Period Delta" : "Analysis Mode"}
            value={
              comparePeriod && overviewStats.delta != null
                ? `${overviewStats.delta > 0 ? "+" : ""}${overviewStats.delta.toFixed(1)}%`
                : "Single period"
            }
            detail={
              comparePeriod && overviewStats.totalB != null
                ? `Compared against ${periodBLabel} at ${formatMetricKpi(overviewStats.totalB, metric)}.`
                : `Switch on period comparison to benchmark ${activeMetricLabel.toLowerCase()} changes.`
            }
            icon={<GitCompare className="h-4 w-4" />}
            tone={comparePeriod ? "success" : "default"}
          />
          <OverviewStatCard
            label="Tracked Entities"
            value={String(overviewStats.seriesCount)}
            detail={`The chart is currently monitoring ${overviewStats.dimensionLabel} with ${granularity} granularity.`}
            icon={<Layers3 className="h-4 w-4" />}
          />
          <OverviewStatCard
            label="Top Performer"
            value={overviewStats.leadEntity?.id ?? "No leader"}
            detail={
              overviewStats.leadEntity
                ? `${formatMetricKpi(overviewStats.leadEntity.value, metric)} leads the current view.`
                : "Waiting for data to identify the strongest performer."
            }
            icon={<Trophy className="h-4 w-4" />}
          />
        </div>
      )}

      {(isLoadingA || kpiSummary.length > 0) && (
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary flex-shrink-0">
              <BarChart3 className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold tracking-tight text-foreground">Performance Snapshot</h2>
              <p className="text-xs text-muted-foreground">
                Compare each {compareBy} side by side and spot outliers faster.
              </p>
            </div>
          </div>
          {kpiSummary.length > 0 && (
            <Badge variant="outline" className="text-[11px] font-medium border-primary/30 text-primary bg-primary/5">
              {kpiSummary.length} {compareBy}{kpiSummary.length !== 1 ? "s" : ""} in view
            </Badge>
          )}
        </div>
      )}

      {/* ── Fetch error banner ────────────────────────────────────────────────── */}
      {error && !isLoadingA && (
        <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium">Failed to load trend data</p>
            <p className="text-xs mt-0.5 opacity-80">{error}</p>
          </div>
        </div>
      )}

      {/* ── KPI cards ─────────────────────────────────────────────────────────── */}
      {isLoadingA ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-xl border bg-card p-4 space-y-3">
              <Skeleton className="h-3 w-3/4" />
              <Skeleton className="h-8 w-1/2" />
              <Skeleton className="h-2.5 w-2/3" />
            </div>
          ))}
        </div>
      ) : kpiSummary.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
          {kpiSummary.map((kpi) => (
            <KpiCard
              key={kpi.id}
              id={kpi.id}
              value={kpi.value}
              valueB={comparePeriod ? kpi.valueB : undefined}
              metric={metric}
              color={kpi.color}
              periodBLabel={periodBLabel}
              isComparing={comparePeriod && !!dataB}
            />
          ))}
        </div>
      ) : null}

      {/* ── Chart card ───────────────────────────────────────────────────────── */}
      <Card className="rounded-xl shadow-sm">
        <CardHeader className="pb-3 border-b">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <CardTitle className="text-sm sm:text-base font-semibold">
                {activeMetricLabel} Over Time
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1 flex-wrap">
                <Calendar className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
                <span className="truncate max-w-[160px] sm:max-w-none">{periodALabel}</span>
                {comparePeriod && dateRangeB && (
                  <>
                    <span className="text-border mx-0.5">vs</span>
                    <span className="truncate max-w-[160px] sm:max-w-none">{periodBLabel}</span>
                  </>
                )}
              </p>
            </div>
            <div className="flex items-center justify-between sm:justify-end gap-2 flex-shrink-0">
              {comparePeriod && (
                <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block w-5 h-0.5 bg-foreground/40 rounded" />
                    A
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block w-5 h-0 border-t border-dashed border-foreground/40" />
                    B
                  </span>
                </div>
              )}
              {/* Chart type selector */}
              <PillGroup
                options={CHART_TYPE_OPTIONS}
                value={chartType}
                onChange={(v) => setParam("chartType", v)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-3 pb-5 sm:pt-4 sm:pb-6">
          <TrendsComparisonChart
            dataA={dataA}
            dataB={comparePeriod ? dataB : null}
            metric={metric}
            chartType={chartType}
            isLoading={isLoadingA}
            error={error}
            periodALabel={periodALabel}
            periodBLabel={periodBLabel}
            height={chartHeight}
          />
        </CardContent>
      </Card>

    </div>
  );
}

