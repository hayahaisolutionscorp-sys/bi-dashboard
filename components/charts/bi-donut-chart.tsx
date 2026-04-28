"use client";

/**
 * BiDonutChart
 * ─────────────────────────────────────────────────────────────
 * A production-ready donut chart with:
 *  • Always-visible leader-line labels (name + value or %)
 *  • Center label showing total
 *  • Rich legend with color swatch, name, value, and % per row
 *  • "Others" grouping for slices below a threshold
 *  • Graceful empty-state
 *  • Responsive, no hover required for core understanding
 */

import * as React from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

// ─── Constants ────────────────────────────────────────────────────────────────

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "#a78bfa",
  "#34d399",
  "#fb923c",
  "#f472b6",
  "#60a5fa",
];

const RADIAN = Math.PI / 180;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BiDonutSlice {
  name: string;
  value: number;
  color?: string;
}

export interface BiDonutChartProps {
  data: BiDonutSlice[];
  title?: string;
  description?: string;
  /** Format applied to numeric values in labels and legend. Default: locale number */
  formatValue?: (v: number) => string;
  /** Slices with share < this threshold (0–1) are grouped into "Others". Default: 0.03 */
  othersThreshold?: number;
  /** Height of the chart area in px. Default: 260 */
  chartHeight?: number;
  /** Show the total in the donut center. Default: true */
  showCenter?: boolean;
  /** Label for the center total. Default: "Total" */
  centerLabel?: string;
  /** Show the legend below the chart. Default: true */
  showLegend?: boolean;
  /** Show the card wrapper. Default: true */
  showCard?: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function defaultFormat(v: number): string {
  return v.toLocaleString();
}

/** Groups slices below `threshold` share into a single "Others" slice. */
function collapseSmallSlices(
  data: BiDonutSlice[],
  threshold: number,
): BiDonutSlice[] {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return data;

  const main: BiDonutSlice[] = [];
  let othersValue = 0;

  for (const slice of data) {
    if (slice.value / total < threshold) {
      othersValue += slice.value;
    } else {
      main.push(slice);
    }
  }

  if (othersValue > 0) {
    main.push({ name: "Others", value: othersValue, color: "#9ca3af" });
  }
  return main;
}

// ─── Leader-line label ────────────────────────────────────────────────────────

interface LabelProps {
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  name: string;
  value: number;
  percent: number;
  fill: string;
  formatValue: (v: number) => string;
}

function LeaderLabel({
  cx,
  cy,
  midAngle,
  outerRadius,
  name,
  value,
  percent,
  fill,
  formatValue,
}: LabelProps) {
  // Skip tiny slices to avoid label clutter
  if (percent < 0.03) return null;

  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);
  const isRight = cos >= 0;

  // Elbow points
  const sx = cx + (outerRadius + 6) * cos;
  const sy = cy + (outerRadius + 6) * sin;
  const mx = cx + (outerRadius + 22) * cos;
  const my = cy + (outerRadius + 22) * sin;
  const ex = mx + (isRight ? 24 : -24);
  const ey = my;

  const anchor = isRight ? "start" : "end";
  const tx = ex + (isRight ? 4 : -4);

  return (
    <g>
      {/* Elbow line */}
      <path
        d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`}
        stroke={fill}
        strokeWidth={1.5}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.8}
      />
      <circle cx={ex} cy={ey} r={2.5} fill={fill} />

      {/* Name */}
      <text
        x={tx}
        y={ey - 7}
        textAnchor={anchor}
        fill="currentColor"
        className="fill-foreground"
        fontSize={10}
        fontWeight={500}
      >
        {name.length > 14 ? name.slice(0, 12) + "…" : name}
      </text>

      {/* Value + percentage */}
      <text
        x={tx}
        y={ey + 5}
        textAnchor={anchor}
        fill="currentColor"
        className="fill-muted-foreground"
        fontSize={9}
      >
        {formatValue(value)} ({(percent * 100).toFixed(1)}%)
      </text>
    </g>
  );
}

// ─── Center label ─────────────────────────────────────────────────────────────

function CenterLabel({
  cx,
  cy,
  total,
  label,
  formatValue,
}: {
  cx: number;
  cy: number;
  total: number;
  label: string;
  formatValue: (v: number) => string;
}) {
  return (
    <g>
      <text
        x={cx}
        y={cy - 6}
        textAnchor="middle"
        dominantBaseline="middle"
        className="fill-foreground"
        fontSize={18}
        fontWeight={700}
      >
        {formatValue(total)}
      </text>
      <text
        x={cx}
        y={cy + 12}
        textAnchor="middle"
        dominantBaseline="middle"
        className="fill-muted-foreground"
        fontSize={10}
      >
        {label}
      </text>
    </g>
  );
}

// ─── Tooltip ──────────────────────────────────────────────────────────────────

function DonutTooltip({
  active,
  payload,
  total,
  formatValue,
}: {
  active?: boolean;
  payload?: { payload: BiDonutSlice & { color: string }; value: number }[];
  total: number;
  formatValue: (v: number) => string;
}) {
  if (!active || !payload?.length) return null;
  const { name, color } = payload[0].payload;
  const value = payload[0].value;
  const pct = total > 0 ? ((value / total) * 100).toFixed(1) : "0.0";

  return (
    <div className="z-50 min-w-[150px] rounded-lg border border-border bg-background px-3 py-2 text-xs shadow-xl">
      <div className="flex items-center gap-2 mb-1">
        <span className="h-2.5 w-2.5 rounded-sm shrink-0" style={{ backgroundColor: color }} />
        <span className="font-semibold text-foreground">{name}</span>
      </div>
      <div className="flex justify-between gap-4 text-muted-foreground">
        <span>{formatValue(value)}</span>
        <span className="font-medium text-foreground">{pct}%</span>
      </div>
    </div>
  );
}

// ─── Legend ───────────────────────────────────────────────────────────────────

function DonutLegend({
  slices,
  total,
  formatValue,
}: {
  slices: (BiDonutSlice & { color: string })[];
  total: number;
  formatValue: (v: number) => string;
}) {
  return (
    <div className="mt-3 grid grid-cols-1 gap-1 px-1 sm:grid-cols-2">
      {slices.map((s) => {
        const pct = total > 0 ? ((s.value / total) * 100).toFixed(1) : "0.0";
        return (
          <div key={s.name} className="flex items-center gap-2 min-w-0 py-0.5">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-sm"
              style={{ backgroundColor: s.color }}
            />
            <span className="truncate text-[11px] text-muted-foreground flex-1 min-w-0">
              {s.name}
            </span>
            <span className="shrink-0 text-[11px] font-medium tabular-nums text-foreground">
              {formatValue(s.value)}
            </span>
            <span className="shrink-0 text-[10px] text-muted-foreground tabular-nums w-[38px] text-right">
              {pct}%
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function BiDonutChart({
  data,
  title,
  description,
  formatValue = defaultFormat,
  othersThreshold = 0.03,
  chartHeight = 260,
  showCenter = true,
  centerLabel = "Total",
  showLegend = true,
  showCard = true,
}: BiDonutChartProps) {
  // Collapse small slices
  const processed = React.useMemo(
    () => collapseSmallSlices(data.filter((d) => d.value > 0), othersThreshold),
    [data, othersThreshold],
  );

  // Assign colors
  const colored = React.useMemo(
    () =>
      processed.map((s, i) => ({
        ...s,
        color: s.color ?? CHART_COLORS[i % CHART_COLORS.length],
      })),
    [processed],
  );

  const total = colored.reduce((s, d) => s + d.value, 0);

  const isEmpty = colored.length === 0 || total === 0;

  const inner = (
    <div className="flex flex-col">
      {(title || description) && (
        <div className="px-4 pt-4 pb-2 space-y-0.5">
          {title && <p className="text-sm font-semibold">{title}</p>}
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
      )}

      {isEmpty ? (
        <div
          className="flex items-center justify-center text-sm text-muted-foreground"
          style={{ height: chartHeight }}
        >
          No data available
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={chartHeight}>
            <PieChart>
              <Tooltip
                content={
                  <DonutTooltip total={total} formatValue={formatValue} />
                }
              />
              <Pie
                data={colored}
                dataKey="value"
                nameKey="name"
                innerRadius="45%"
                outerRadius="68%"
                paddingAngle={2}
                labelLine={false}
                label={(props) => (
                  <LeaderLabel {...props} formatValue={formatValue} />
                )}
              >
                {colored.map((s, i) => (
                  <Cell key={`cell-${i}`} fill={s.color} stroke="transparent" />
                ))}
              </Pie>

              {/* Center total — drawn as a custom label on a zero-radius Pie */}
              {showCenter && (
                <Pie
                  data={[{ value: 1 }]}
                  dataKey="value"
                  innerRadius={0}
                  outerRadius={0}
                  label={({ cx, cy }) => (
                    <CenterLabel
                      cx={cx}
                      cy={cy}
                      total={total}
                      label={centerLabel}
                      formatValue={formatValue}
                    />
                  )}
                  labelLine={false}
                  isAnimationActive={false}
                >
                  <Cell fill="transparent" stroke="transparent" />
                </Pie>
              )}
            </PieChart>
          </ResponsiveContainer>

          {showLegend && (
            <div className="px-4 pb-4">
              <DonutLegend slices={colored} total={total} formatValue={formatValue} />
            </div>
          )}
        </>
      )}
    </div>
  );

  if (!showCard) return inner;

  return (
    <Card className="border border-border bg-card overflow-hidden shadow-none">
      {inner}
    </Card>
  );
}
