"use client";

import React, { useMemo, useState } from "react";
import { useTheme } from "next-themes";
import {
  LineChart, Line,
  BarChart, Bar,
  AreaChart, Area,
  XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { NoDataPlaceholder } from "@/components/charts/no-data-placeholder";
import { ComparisonTrendData } from "@/types/sales";
import { useChartColors } from "@/hooks/use-chart-colors";

// ── Types ─────────────────────────────────────────────────────────────────────

export type TrendsMetric = "totalSales" | "grossRevenue" | "totalBookings" | "totalPassengers" | "loadFactor";
export type TrendsChartType = "line" | "bar" | "area";
interface TrendsComparisonChartProps {
  dataA: ComparisonTrendData | null;
  dataB?: ComparisonTrendData | null;
  metric: TrendsMetric;
  chartType: TrendsChartType;
  isLoading: boolean;
  error?: string | null;
  /** Human-readable label for Period A (e.g. "Jan 1 – Jan 31 2026") */
  periodALabel?: string;
  /** Human-readable label for Period B — enables period-comparison mode */
  periodBLabel?: string;
  height?: number;
}

// ── Metric helpers ────────────────────────────────────────────────────────────

function metricLabel(metric: TrendsMetric): string {
  switch (metric) {
    case "totalSales":      return "Total Sales";
    case "grossRevenue":    return "Gross Revenue";
    case "totalBookings":   return "Total Bookings";
    case "totalPassengers": return "Total Passengers";
    case "loadFactor":      return "Load Factor (%)";
  }
}

function formatValue(value: number, metric: TrendsMetric): string {
  if (metric === "totalSales" || metric === "grossRevenue") {
    return `₱${value.toLocaleString("en-PH", { maximumFractionDigits: 0 })}`;
  }
  if (metric === "loadFactor") {
    return `${value.toFixed(1)}%`;
  }
  return value.toLocaleString("en-PH", { maximumFractionDigits: 0 });
}

function getPointValue(point: ComparisonTrendData["series"][0]["data"][0], metric: TrendsMetric): number {
  if (metric === "loadFactor") return point.loadFactor ?? 0;
  return (point as any)[metric] ?? 0;
}

// ── Chart data builders ───────────────────────────────────────────────────────

/**
 * Single-period mode: x-axis = real dates, one series per entity.
 */
function buildSinglePeriodData(
  dataA: ComparisonTrendData,
  metric: TrendsMetric,
  palette: string[],
): { chartData: any[]; seriesKeys: { key: string; color: string; name: string; dashed: boolean }[] } {
  const dateMap = new Map<string, any>();

  dataA.series.forEach((s) => {
    s.data.forEach((pt) => {
      if (!dateMap.has(pt.date)) dateMap.set(pt.date, { date: pt.date });
      dateMap.get(pt.date)[s.id] = getPointValue(pt, metric);
    });
  });

  const chartData = Array.from(dateMap.values()).sort((a, b) => a.date.localeCompare(b.date));
  const seriesKeys = dataA.series.map((s, i) => ({
    key: s.id,
    color: palette[i % palette.length],
    name: s.id,
    dashed: false,
  }));

  return { chartData, seriesKeys };
}

/**
 * Period-comparison mode: x-axis = "Day 1", "Day 2", … Entities appear twice
 * (A solid, B dashed) using the same colour per entity.
 */
function buildComparisonPeriodData(
  dataA: ComparisonTrendData,
  dataB: ComparisonTrendData,
  metric: TrendsMetric,
  periodALabel: string,
  periodBLabel: string,
  palette: string[],
): { chartData: any[]; seriesKeys: { key: string; color: string; name: string; dashed: boolean }[] } {
  const maxLen = Math.max(
    ...dataA.series.map((s) => s.data.length),
    ...dataB.series.map((s) => s.data.length),
  );

  const chartData: any[] = Array.from({ length: maxLen }, (_, i) => ({ date: `Day ${i + 1}` }));

  const seriesKeys: { key: string; color: string; name: string; dashed: boolean }[] = [];

  dataA.series.forEach((s, i) => {
    const keyA = `${s.id} (${periodALabel})`;
    s.data.forEach((pt, idx) => {
      chartData[idx][keyA] = getPointValue(pt, metric);
    });
    seriesKeys.push({ key: keyA, color: palette[i % palette.length], name: keyA, dashed: false });
  });

  dataB.series.forEach((s, i) => {
    const keyB = `${s.id} (${periodBLabel})`;
    s.data.forEach((pt, idx) => {
      if (chartData[idx]) chartData[idx][keyB] = getPointValue(pt, metric);
    });
    seriesKeys.push({ key: keyB, color: palette[i % palette.length], name: keyB, dashed: true });
  });

  return { chartData, seriesKeys };
}

// ── Custom Tooltip ────────────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label, metric }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-card px-3 py-2 shadow-md text-xs min-w-[160px]">
      <p className="font-semibold text-foreground mb-1">{label}</p>
      {payload.map((entry: any) => (
        <div key={entry.dataKey} className="flex items-center gap-1.5 py-0.5">
          <span className="inline-block w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: entry.color }} />
          <span className="text-muted-foreground truncate max-w-[140px]">{entry.name}</span>
          <span className="ml-auto font-medium text-foreground">{formatValue(entry.value ?? 0, metric)}</span>
        </div>
      ))}
    </div>
  );
}

// ── Theme-aware chart config ──────────────────────────────────────────────────

interface ChartTheme {
  /** Resolved RGB string for axis tick labels and legend text */
  labelColor: string;
  /** Resolved RGB string for CartesianGrid lines */
  gridColor: string;
  /** CSS color for Recharts cursor highlight (rgba is fine here — not SVG attr) */
  cursorColor: string;
}

// ── Chart renderer ────────────────────────────────────────────────────────────

function renderChart(
  chartType: TrendsChartType,
  chartData: any[],
  seriesKeys: { key: string; color: string; name: string; dashed: boolean }[],
  metric: TrendsMetric,
  height: number,
  theme: ChartTheme,
  containerWidth: number,
  onResize: (w: number) => void,
) {
  const isMobile = containerWidth > 0 && containerWidth < 500;
  const margin = isMobile
    ? { top: 4, right: 6, left: 0, bottom: 2 }
    : { top: 8, right: 16, left: 8, bottom: 4 };
  const yAxisWidth = isMobile ? 44 : 64;
  const axisFontSize = isMobile ? 10 : 11;
  const yTickFormatter = (v: number) => {
    if (metric === "loadFactor") return `${v.toFixed(0)}%`;
    if (metric === "totalSales" || metric === "grossRevenue") {
      if (v >= 1_000_000) return `₱${(v / 1_000_000).toFixed(1)}M`;
      if (v >= 1_000) return `₱${(v / 1_000).toFixed(0)}K`;
      return `₱${v}`;
    }
    if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
    return String(v);
  };

  const commonProps = {
    data: chartData,
    margin,
  };

  const commonAxisProps = {
    xAxis: (
      <XAxis
        dataKey="date"
        tick={{ fontSize: axisFontSize, fill: theme.labelColor }}
        tickLine={false}
        axisLine={false}
        interval="preserveStartEnd"
      />
    ),
    yAxis: (
      <YAxis
        tickFormatter={yTickFormatter}
        tick={{ fontSize: axisFontSize, fill: theme.labelColor }}
        tickLine={false}
        axisLine={false}
        width={yAxisWidth}
      />
    ),
    grid: <CartesianGrid strokeDasharray="3 3" stroke={theme.gridColor} vertical={false} />,
    tooltip: (
      <Tooltip
        content={<CustomTooltip metric={metric} />}
        cursor={{ fill: theme.cursorColor }}
      />
    ),
    legend: (
      <Legend
        wrapperStyle={{ fontSize: 11, paddingTop: 12, color: theme.labelColor }}
        iconType="circle"
        iconSize={8}
      />
    ),
  };

  if (chartType === "bar") {
    return (
      <ResponsiveContainer width="100%" height={height} onResize={(w) => onResize(w)}>
        <BarChart {...commonProps}>
          {commonAxisProps.grid}
          {commonAxisProps.xAxis}
          {commonAxisProps.yAxis}
          {commonAxisProps.tooltip}
          {commonAxisProps.legend}
          {seriesKeys.map((s) => (
            <Bar
              key={s.key}
              dataKey={s.key}
              name={s.name}
              fill={s.color}
              radius={[3, 3, 0, 0]}
              opacity={s.dashed ? 0.45 : 0.85}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    );
  }

  if (chartType === "area") {
    return (
      <ResponsiveContainer width="100%" height={height} onResize={(w) => onResize(w)}>
        <AreaChart {...commonProps}>
          {commonAxisProps.grid}
          {commonAxisProps.xAxis}
          {commonAxisProps.yAxis}
          {commonAxisProps.tooltip}
          {commonAxisProps.legend}
          {seriesKeys.map((s) => (
            <Area
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.name}
              stroke={s.color}
              strokeWidth={s.dashed ? 1.5 : 2}
              strokeDasharray={s.dashed ? "5 4" : undefined}
              fill={s.color}
              fillOpacity={s.dashed ? 0.08 : 0.18}
              dot={false}
              activeDot={{ r: 4 }}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    );
  }

  // default: line
  return (
    <ResponsiveContainer width="100%" height={height} onResize={(w) => onResize(w)}>
      <LineChart {...commonProps}>
        {commonAxisProps.grid}
        {commonAxisProps.xAxis}
        {commonAxisProps.yAxis}
        {commonAxisProps.tooltip}
        {commonAxisProps.legend}
        {seriesKeys.map((s) => (
          <Line
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.name}
            stroke={s.color}
            strokeWidth={s.dashed ? 1.5 : 2}
            strokeDasharray={s.dashed ? "6 4" : undefined}
            dot={false}
            activeDot={{ r: 4 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function TrendsComparisonChart({
  dataA,
  dataB,
  metric,
  chartType,
  isLoading,
  error,
  periodALabel = "Period A",
  periodBLabel = "Period B",
  height = 380,
}: TrendsComparisonChartProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [containerWidth, setContainerWidth] = useState(800);

  // useChartColors resolves CSS vars to actual RGB strings via DOM.
  // SVG presentation attributes (stroke/fill) do NOT support CSS custom
  // properties — they render as black without resolved values.
  const { chart: palette, axisLabel, splitLine } = useChartColors();

  const chartTheme: ChartTheme = {
    labelColor: axisLabel,
    gridColor: splitLine,
    cursorColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
  };

  const { chartData, seriesKeys } = useMemo(() => {
    if (!dataA || dataA.series.length === 0) return { chartData: [], seriesKeys: [] };

    if (dataB && dataB.series.length > 0) {
      return buildComparisonPeriodData(dataA, dataB, metric, periodALabel, periodBLabel, palette);
    }

    return buildSinglePeriodData(dataA, metric, palette);
  }, [dataA, dataB, metric, periodALabel, periodBLabel, palette]);

  // Load factor: check if all values are null (soft dependency unavailable)
  const loadFactorUnavailable = useMemo(() => {
    if (metric !== "loadFactor" || !dataA) return false;
    return dataA.series.every((s) => s.data.every((pt) => pt.loadFactor == null));
  }, [metric, dataA]);

  if (isLoading) {
    return (
      <div className="space-y-3 p-4">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="w-full" style={{ height }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center text-destructive text-sm p-8">
        {error}
      </div>
    );
  }

  if (loadFactorUnavailable) {
    return (
      <NoDataPlaceholder
        title="Load Factor Unavailable"
        description="Passenger capacity data is not available for the selected entities and date range."
      />
    );
  }

  if (!dataA || chartData.length === 0) {
    return (
      <NoDataPlaceholder
        title="No Data"
        description="No data found for the selected filters. Try adjusting the date range or entities."
      />
    );
  }

  return (
    <div>
      <p className="text-xs text-muted-foreground mb-3 px-1">{metricLabel(metric)}</p>
      {renderChart(chartType, chartData, seriesKeys, metric, height, chartTheme, containerWidth, setContainerWidth)}
    </div>
  );
}
