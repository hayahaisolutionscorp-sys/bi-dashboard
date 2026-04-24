"use client";

import { useState, useMemo } from "react";
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Dot,
} from "recharts";
import { FinanceTrendItem } from "@/types/overview";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus, BarChart2, LineChart } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  data: FinanceTrendItem[];
  period: "today" | "mtd" | "ytd";
  className?: string;
}

interface ChartRow extends FinanceTrendItem {
  display_gross: number;
  display_net: number;
  display_refund: number;
  display_comp: number | null;
  forecast_net: number | null;
  anomaly: "drop" | "refund" | null;
  is_forecast: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtShort = (n: number) => {
  if (Math.abs(n) >= 1_000_000) return `₱${(n / 1_000_000).toFixed(2)}M`;
  if (Math.abs(n) >= 1_000)     return `₱${(n / 1_000).toFixed(0)}K`;
  return `₱${n.toLocaleString()}`;
};

const fmtFull = (n: number) => `₱${n.toLocaleString()}`;

const TOTAL_BUCKETS: Record<string, () => number> = {
  today: () => 24,
  mtd:   () => new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate(),
  ytd:   () => 12,
};

const COMP_LABEL: Record<string, string> = {
  today: "Yesterday",
  mtd:   "Last Month",
  ytd:   "Last Year",
};

// ─── Anomaly Detection ────────────────────────────────────────────────────────

function detectAnomalies(
  data: FinanceTrendItem[],
): { drops: Set<string>; refundSpikes: Set<string> } {
  const drops       = new Set<string>();
  const refundSpikes = new Set<string>();
  if (data.length < 3) return { drops, refundSpikes };

  const nets    = data.map((d) => d.net_revenue);
  const refunds = data.map((d) => d.refund_amount);

  const mean = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
  const std  = (arr: number[], m: number) =>
    Math.sqrt(arr.reduce((a, b) => a + (b - m) ** 2, 0) / arr.length);

  const netMean    = mean(nets);
  const netStd     = std(nets, netMean);
  const refundMean = mean(refunds);
  const refundStd  = std(refunds, refundMean);

  data.forEach((d) => {
    if (netStd > 0 && d.net_revenue < netMean - 1.5 * netStd)
      drops.add(d.label);
    if (refundStd > 0 && d.refund_amount > refundMean + 1.5 * refundStd && d.refund_amount > 0)
      refundSpikes.add(d.label);
  });

  return { drops, refundSpikes };
}

// ─── Custom Dot (anomaly indicators) ──────────────────────────────────────────

function AnomalyDot(props: any) {
  const { cx, cy, payload } = props;
  if (!payload?.anomaly || payload.is_forecast) return null;
  const color = payload.anomaly === "drop" ? "#f43f5e" : "#f59e0b";
  return (
    <circle
      cx={cx}
      cy={cy}
      r={4}
      fill={color}
      stroke="white"
      strokeWidth={1.5}
    />
  );
}

// ─── Custom Tooltip ──────────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label, period }: any) {
  if (!active || !payload?.length) return null;

  const d: ChartRow = payload[0]?.payload;
  if (!d) return null;

  const gross  = d.display_gross  ?? 0;
  const net    = d.display_net    ?? 0;
  const refund = d.display_refund ?? 0;
  const comp   = d.display_comp;

  const compDelta =
    comp != null && comp > 0 ? ((net - comp) / comp) * 100 : null;

  return (
    <div className="rounded-md border border-border bg-popover shadow-md px-3 py-2 text-xs min-w-[180px]">
      <p className="font-semibold text-foreground mb-2">{label}</p>

      {d.is_forecast ? (
        <p className="text-muted-foreground italic">Projected: {fmtFull(net)}</p>
      ) : (
        <div className="space-y-1.5">
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Gross</span>
            <span className="font-medium tabular-nums">{fmtFull(gross)}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Net</span>
            <span className="font-semibold tabular-nums text-teal-600 dark:text-teal-400">
              {fmtFull(net)}
            </span>
          </div>
          {refund > 0 && (
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Refunds</span>
              <span className="font-medium tabular-nums text-rose-500">
                −{fmtFull(refund)}
              </span>
            </div>
          )}
          {comp != null && (
            <>
              <div className="my-1 border-t border-border" />
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">{COMP_LABEL[period]}</span>
                <span className="tabular-nums text-muted-foreground">{fmtFull(comp)}</span>
              </div>
              {compDelta != null && (
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">vs prev</span>
                  <span
                    className={cn(
                      "font-medium tabular-nums",
                      compDelta > 0
                        ? "text-green-600 dark:text-green-400"
                        : compDelta < 0
                        ? "text-rose-500"
                        : "text-muted-foreground",
                    )}
                  >
                    {compDelta > 0 ? "+" : ""}
                    {compDelta.toFixed(1)}%
                  </span>
                </div>
              )}
            </>
          )}
          {d.anomaly === "drop" && (
            <p className="mt-1 text-[10px] text-rose-500 font-medium">⚠ Revenue drop detected</p>
          )}
          {d.anomaly === "refund" && (
            <p className="mt-1 text-[10px] text-amber-500 font-medium">⚠ Refund spike detected</p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function RevenueTrendChart({ data, period, className }: Props) {
  const [cumulative, setCumulative] = useState(false);

  const { drops, refundSpikes } = useMemo(() => detectAnomalies(data), [data]);

  const totalBuckets = TOTAL_BUCKETS[period]?.() ?? 24;
  const rateNet      = data.length > 0 ? data.reduce((a, b) => a + b.net_revenue, 0) / data.length : 0;
  const rateGross    = data.length > 0 ? data.reduce((a, b) => a + b.gross_revenue, 0) / data.length : 0;
  const hasComparison = data.some((d) => d.comparison_net != null);

  const chartData: ChartRow[] = useMemo(() => {
    let runGross = 0, runNet = 0, runRefund = 0, runComp = 0;

    // ── Actuals ──
    const rows: ChartRow[] = data.map((d) => {
      runGross  += d.gross_revenue;
      runNet    += d.net_revenue;
      runRefund += d.refund_amount;
      if (d.comparison_net != null) runComp += d.comparison_net;

      return {
        ...d,
        display_gross:  cumulative ? runGross  : d.gross_revenue,
        display_net:    cumulative ? runNet    : d.net_revenue,
        display_refund: cumulative ? runRefund : d.refund_amount,
        display_comp:   d.comparison_net != null
          ? cumulative ? runComp : d.comparison_net
          : null,
        forecast_net:   null,
        anomaly: drops.has(d.label)
          ? "drop"
          : refundSpikes.has(d.label)
          ? "refund"
          : null,
        is_forecast: false,
      };
    });

    // ── Forecast (next 3 buckets max) ──
    if (data.length > 0 && data.length < totalBuckets) {
      const projCount = Math.min(3, totalBuckets - data.length);
      for (let i = 0; i < projCount; i++) {
        const idx    = data.length + i;
        const label  = period === "today"
          ? `${String(idx).padStart(2, "0")}:00`
          : period === "ytd"
          ? `Month ${idx + 1}`
          : `Day ${idx + 1}`;

        rows.push({
          label,
          bucket_index:  idx,
          gross_revenue: 0,
          net_revenue:   0,
          refund_amount: 0,
          comparison_net: null,
          display_gross:  cumulative ? runGross  + rateGross * (i + 1) : rateGross,
          display_net:    cumulative ? runNet    + rateNet   * (i + 1) : rateNet,
          display_refund: 0,
          display_comp:   null,
          forecast_net:   cumulative ? runNet + rateNet * (i + 1) : rateNet,
          anomaly: null,
          is_forecast: true,
        });
      }
    }

    return rows;
  }, [data, cumulative, drops, refundSpikes, totalBuckets, period, rateNet, rateGross]);

  // Tick label thinning for readability
  const tickInterval = useMemo(() => {
    const count = chartData.length;
    if (count <= 12) return 0;
    if (count <= 24) return 1;
    if (count <= 36) return 2;
    return Math.floor(count / 12);
  }, [chartData.length]);

  // Running totals summary bar
  const totalNet     = data.reduce((a, b) => a + b.net_revenue, 0);
  const totalGross   = data.reduce((a, b) => a + b.gross_revenue, 0);
  const totalRefund  = data.reduce((a, b) => a + b.refund_amount, 0);
  const totalComp    = data.reduce((a, b) => a + (b.comparison_net ?? 0), 0);
  const overallDelta = hasComparison && totalComp > 0
    ? ((totalNet - totalComp) / totalComp) * 100
    : null;

  // Reference line for average net
  const avgNet = data.length > 0 ? totalNet / data.length : 0;

  return (
    <div className={cn("flex flex-col gap-0", className)}>

      {/* ── Summary Strip ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border gap-2 flex-wrap">
        <div className="flex items-center gap-4">
          {/* Net total */}
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Net Revenue</p>
            <p className="text-sm font-bold tabular-nums text-teal-600 dark:text-teal-400">
              {fmtShort(totalNet)}
            </p>
          </div>
          {/* Gross total */}
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Gross</p>
            <p className="text-sm font-semibold tabular-nums text-muted-foreground">
              {fmtShort(totalGross)}
            </p>
          </div>
          {/* Refund total */}
          {totalRefund > 0 && (
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Refunds</p>
              <p className="text-sm font-medium tabular-nums text-rose-500">
                −{fmtShort(totalRefund)}
              </p>
            </div>
          )}
          {/* vs comparison */}
          {overallDelta != null && (
            <div className="flex items-center gap-1">
              {overallDelta > 1 ? (
                <TrendingUp className="h-3.5 w-3.5 text-green-500" />
              ) : overallDelta < -1 ? (
                <TrendingDown className="h-3.5 w-3.5 text-rose-500" />
              ) : (
                <Minus className="h-3.5 w-3.5 text-muted-foreground" />
              )}
              <span
                className={cn(
                  "text-xs font-medium",
                  overallDelta > 1
                    ? "text-green-600 dark:text-green-400"
                    : overallDelta < -1
                    ? "text-rose-500"
                    : "text-muted-foreground",
                )}
              >
                {overallDelta > 0 ? "+" : ""}
                {overallDelta.toFixed(1)}% vs {COMP_LABEL[period]}
              </span>
            </div>
          )}
        </div>

        {/* Cumulative toggle */}
        <button
          onClick={() => setCumulative((c) => !c)}
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-medium border transition-colors",
            cumulative
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-background border-border text-muted-foreground hover:bg-muted",
          )}
        >
          {cumulative ? (
            <LineChart className="h-3 w-3" />
          ) : (
            <BarChart2 className="h-3 w-3" />
          )}
          {cumulative ? "Cumulative" : "Interval"}
        </button>
      </div>

      {/* ── Legend ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-4 px-3 py-1.5 text-[10px] text-muted-foreground flex-wrap">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-5 rounded-sm bg-rose-200 dark:bg-rose-900/50" />
          Gross (refund zone)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-5 rounded-sm bg-teal-400/60 dark:bg-teal-600/40" />
          Net Revenue
        </span>
        {hasComparison && (
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-5 border-t-2 border-dashed border-slate-400" />
            {COMP_LABEL[period]}
          </span>
        )}
        {data.length < totalBuckets && (
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-5 border-t-2 border-dashed border-primary/60" />
            Projected
          </span>
        )}
        {(drops.size > 0 || refundSpikes.size > 0) && (
          <>
            {drops.size > 0 && (
              <span className="flex items-center gap-1">
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-rose-500" />
                Drop
              </span>
            )}
            {refundSpikes.size > 0 && (
              <span className="flex items-center gap-1">
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-amber-400" />
                Refund spike
              </span>
            )}
          </>
        )}
      </div>

      {/* ── Chart ──────────────────────────────────────────────────────────── */}
      <div style={{ height: 240 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
            <defs>
              {/* Gross fill — light rose, shows the refund zone above net */}
              <linearGradient id="rtGross" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="rgb(251 113 133)" stopOpacity={0.25} />
                <stop offset="95%" stopColor="rgb(251 113 133)" stopOpacity={0.05} />
              </linearGradient>
              {/* Net fill — teal, covers the bottom portion of the gross area */}
              <linearGradient id="rtNet" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="rgb(45 212 191)" stopOpacity={0.45} />
                <stop offset="95%" stopColor="rgb(45 212 191)" stopOpacity={0.08} />
              </linearGradient>
              {/* Forecast net fill */}
              <linearGradient id="rtForecast" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="var(--primary)" stopOpacity={0.15} />
                <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.02} />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              stroke="currentColor"
              className="text-border"
              opacity={0.4}
            />

            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: "currentColor" }}
              className="text-muted-foreground"
              interval={tickInterval}
              tickLine={false}
              axisLine={false}
              height={22}
            />
            <YAxis
              tickFormatter={fmtShort}
              tick={{ fontSize: 10, fill: "currentColor" }}
              className="text-muted-foreground"
              tickLine={false}
              axisLine={false}
              width={52}
            />

            <Tooltip
              content={<CustomTooltip period={period} />}
              cursor={{ stroke: "currentColor", strokeWidth: 1, opacity: 0.2 }}
            />

            {/* Average reference line */}
            {avgNet > 0 && (
              <ReferenceLine
                y={avgNet}
                stroke="currentColor"
                strokeDasharray="2 4"
                className="text-muted-foreground/40"
                label={{
                  value: `avg ${fmtShort(avgNet)}`,
                  position: "insideTopRight",
                  fontSize: 9,
                  fill: "currentColor",
                  className: "text-muted-foreground/60",
                }}
              />
            )}

            {/* ── Gross area (rose — refund zone visible as gap above net) ── */}
            <Area
              type="monotone"
              dataKey="display_gross"
              name="Gross Revenue"
              fill="url(#rtGross)"
              stroke="rgb(251 113 133)"
              strokeWidth={1}
              dot={false}
              activeDot={false}
              connectNulls
              isAnimationActive={false}
            />

            {/* ── Net area (teal — overlays gross, showing clean revenue) ── */}
            <Area
              type="monotone"
              dataKey="display_net"
              name="Net Revenue"
              fill="url(#rtNet)"
              stroke="rgb(20 184 166)"
              strokeWidth={2}
              dot={<AnomalyDot />}
              activeDot={{ r: 4, fill: "rgb(20 184 166)", stroke: "white", strokeWidth: 1.5 }}
              connectNulls
              isAnimationActive={false}
            />

            {/* ── Comparison line (previous period) ── */}
            {hasComparison && (
              <Line
                type="monotone"
                dataKey="display_comp"
                name={COMP_LABEL[period]}
                stroke="currentColor"
                strokeWidth={1.5}
                strokeDasharray="4 3"
                className="text-slate-400 dark:text-slate-500"
                dot={false}
                activeDot={false}
                connectNulls
                isAnimationActive={false}
              />
            )}

            {/* ── Forecast line (projected continuation) ── */}
            {data.length < totalBuckets && (
              <Line
                type="monotone"
                dataKey="forecast_net"
                name="Projected"
                stroke="var(--primary)"
                strokeWidth={1.5}
                strokeDasharray="5 4"
                opacity={0.7}
                dot={false}
                activeDot={{ r: 3 }}
                connectNulls
                isAnimationActive={false}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
