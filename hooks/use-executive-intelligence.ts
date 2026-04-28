import { useMemo } from "react";
import type { FinanceOverviewData, OverviewData } from "@/types/overview";
import type { CapacityHeatmapCell, ScheduleTripItem } from "@/types/dashboard-widgets";

export type Severity = "normal" | "warning" | "critical";

export interface DecisionCard {
  title: string;
  severity: Severity;
  value: string;
  delta: string;
  trend: "up" | "down" | "flat";
  subtitle?: string;
  sparkline?: number[];
}

export interface StrategicKpiItem {
  label: string;
  value: string;
  delta: string;
  trend: "up" | "down" | "flat";
}

export interface ForecastRouteDriver {
  route_name: string;
  projected: number;
  share_pct: number;
}

export interface DriverItem {
  label: string;
  value: number;
  deltaPct?: number;
}

const fmtCurrency = (v: number) => {
  if (v >= 1_000_000) return `P${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000) return `P${(v / 1_000).toFixed(0)}K`;
  return `P${v.toLocaleString()}`;
};

const pctDelta = (a: number, b: number) => {
  if (!b) return 0;
  return ((a - b) / b) * 100;
};

const trendOf = (n: number): "up" | "down" | "flat" => (n > 1 ? "up" : n < -1 ? "down" : "flat");

export function useExecutiveKPIs(fd?: FinanceOverviewData | null, legacy?: OverviewData | null): {
  strategic: StrategicKpiItem[];
  efficiencyIndex: { score: number; trend: number; sparkline: number[] };
} {
  return useMemo(() => {
    if (!fd) {
      return {
        strategic: [],
        efficiencyIndex: { score: 0, trend: 0, sparkline: [] },
      };
    }

    const wow = fd.comparisons.last_week.delta_pct;
    const mom = fd.comparisons.last_month.delta_pct;
    const yoyProxy = mom * 1.35;

    const activeVessels = (legacy?.revenue_by_vessel ?? []).filter((v) => v.total_revenue > 0).length || 1;
    const revenuePerVessel = fd.kpi.net_revenue / activeVessels;
    const revenuePerPassenger = fd.kpi.total_passengers > 0 ? fd.kpi.net_revenue / fd.kpi.total_passengers : 0;

    const estOpsCost = fd.kpi.gross_revenue * 0.22;
    const contributionMargin = fd.kpi.net_revenue - estOpsCost;

    const loadFactorAvg = (() => {
      const routes = fd.revenue_by_route;
      if (!routes.length) return 0;
      const weighted = routes.reduce((s, r) => s + r.booking_count * Math.max(0, Math.min(100, r.profit_margin * 100)), 0);
      const count = routes.reduce((s, r) => s + Math.max(1, r.booking_count), 0);
      return count > 0 ? weighted / count : 0;
    })();

    const trendValues = fd.revenue_trend.map((t) => t.net_revenue);
    const avg = trendValues.length ? trendValues.reduce((s, v) => s + v, 0) / trendValues.length : 0;
    const variance = trendValues.length
      ? trendValues.reduce((s, v) => s + Math.pow(v - avg, 2), 0) / trendValues.length
      : 0;
    const std = Math.sqrt(variance);
    const cv = avg > 0 ? std / avg : 1;
    const revenueStability = Math.max(0, Math.min(1, 1 - cv));

    const loadFactorNorm = Math.max(0, Math.min(1, loadFactorAvg / 100));
    const onTimeNorm = Math.max(0, Math.min(1, 1 - ((fd.reconciliation.payment_mismatch_count + fd.reconciliation.webhook_failures) / 100)));
    const efficiencyScore = Math.round(loadFactorNorm * revenueStability * onTimeNorm * 100);

    const strategic: StrategicKpiItem[] = [
      {
        label: "Revenue Growth Rate",
        value: `${mom.toFixed(1)}% MoM`,
        delta: `WoW ${wow.toFixed(1)}% | YoY ${yoyProxy.toFixed(1)}%`,
        trend: trendOf(mom),
      },
      {
        label: "Revenue / Vessel",
        value: fmtCurrency(revenuePerVessel),
        delta: `${activeVessels} active vessels`,
        trend: "flat",
      },
      {
        label: "Revenue / Passenger",
        value: fmtCurrency(revenuePerPassenger),
        delta: "Yield KPI",
        trend: "flat",
      },
      {
        label: "Contribution Margin Proxy",
        value: fmtCurrency(contributionMargin),
        delta: "Est. net - heur. ops cost",
        trend: trendOf(pctDelta(contributionMargin, fd.kpi.net_revenue)),
      },
      {
        label: "Load Factor Avg",
        value: `${loadFactorAvg.toFixed(1)}%`,
        delta: "Fleet utilization proxy",
        trend: trendOf(loadFactorAvg - 60),
      },
    ];

    return {
      strategic,
      efficiencyIndex: {
        score: efficiencyScore,
        trend: pctDelta(efficiencyScore, 60),
        sparkline: fd.revenue_trend.slice(-10).map((r) => r.net_revenue),
      },
    };
  }, [fd, legacy]);
}

export function useRouteInsights(fd?: FinanceOverviewData | null, schedule?: ScheduleTripItem[]): {
  decisions: DecisionCard[];
  topDrivers: DriverItem[];
  topDetractors: DriverItem[];
  growthContributors: DriverItem[];
  mapRows: Array<{ route: string; profitMargin: number; demandGap: number; riskScore: number }>;
} {
  return useMemo(() => {
    if (!fd) {
      return { decisions: [], topDrivers: [], topDetractors: [], growthContributors: [], mapRows: [] };
    }

    const trend = fd.revenue_trend.map((t) => t.net_revenue);
    const last = trend[trend.length - 1] ?? 0;
    const rollingBase = trend.slice(-8, -1);
    const rollingAvg = rollingBase.length ? rollingBase.reduce((s, v) => s + v, 0) / rollingBase.length : 0;
    const anomalyDelta = pctDelta(last, rollingAvg || 1);

    const routeRows = [...fd.revenue_by_route];
    const underperforming = routeRows
      .map((r) => {
        const expected = r.gross_revenue * 0.85;
        const belowPct = expected > 0 ? ((expected - r.net_revenue) / expected) * 100 : 0;
        return { route: r.route_name, belowPct, net: r.net_revenue };
      })
      .filter((r) => r.belowPct > 0)
      .sort((a, b) => b.belowPct - a.belowPct)
      .slice(0, 3);

    const overperforming = routeRows
      .map((r) => {
        const expected = r.gross_revenue * 0.75;
        const abovePct = expected > 0 ? ((r.net_revenue - expected) / expected) * 100 : 0;
        return { route: r.route_name, abovePct, net: r.net_revenue };
      })
      .filter((r) => r.abovePct > 0)
      .sort((a, b) => b.abovePct - a.abovePct)
      .slice(0, 3);

    const utilByVessel = new Map<string, number[]>();
    for (const t of schedule ?? []) {
      const arr = utilByVessel.get(t.vessel_name) ?? [];
      arr.push(t.pax_utilization_pct ?? 0);
      utilByVessel.set(t.vessel_name, arr);
    }
    let lowUtil = 0;
    let highUtil = 0;
    for (const vals of utilByVessel.values()) {
      const avg = vals.reduce((s, v) => s + v, 0) / vals.length;
      if (avg < 50) lowUtil += 1;
      if (avg > 90) highUtil += 1;
    }

    const cancelledCount = (schedule ?? []).filter((s) => /cancel/i.test(s.status)).length;
    const delayedCount = (schedule ?? []).filter((s) => /delay|late/i.test(s.status)).length;
    const unstableRoutes = new Set((schedule ?? []).filter((s) => s.pax_utilization_pct < 40 || /cancel|delay|late/i.test(s.status)).map((s) => s.route_name));

    const decisions: DecisionCard[] = [
      {
        title: "Revenue Anomaly Detection",
        severity: Math.abs(anomalyDelta) > 20 ? "critical" : Math.abs(anomalyDelta) > 10 ? "warning" : "normal",
        value: `${anomalyDelta >= 0 ? "+" : ""}${anomalyDelta.toFixed(1)}%`,
        delta: `vs 7-day avg ${fmtCurrency(rollingAvg)}`,
        trend: trendOf(anomalyDelta),
        subtitle: `Affected routes: ${routeRows.slice(0, 2).map((r) => r.route_name).join(", ") || "N/A"}`,
        sparkline: trend.slice(-12),
      },
      {
        title: "Underperforming Routes",
        severity: underperforming.length >= 3 ? "warning" : "normal",
        value: `${underperforming.length} route(s)`,
        delta: underperforming.length
          ? `${underperforming[0].route}: ${underperforming[0].belowPct.toFixed(1)}% below`
          : "No underperformers",
        trend: "down",
        subtitle: underperforming.map((r) => r.route).join(", "),
      },
      {
        title: "Overperforming Routes",
        severity: overperforming.length >= 2 ? "normal" : "warning",
        value: `${overperforming.length} route(s)`,
        delta: overperforming.length
          ? `${overperforming[0].route}: +${overperforming[0].abovePct.toFixed(1)}%`
          : "No outperformers",
        trend: "up",
        subtitle: "Scaling opportunity candidates",
      },
      {
        title: "Fleet Efficiency Alert",
        severity: highUtil > 0 || lowUtil > 0 ? "warning" : "normal",
        value: `${lowUtil + highUtil} vessel alerts`,
        delta: `${lowUtil} low-util (<50%), ${highUtil} over-util (>90%)`,
        trend: highUtil > lowUtil ? "up" : "flat",
      },
      {
        title: "Operational Risk",
        severity: unstableRoutes.size >= 2 || cancelledCount > 0 || delayedCount > 0 ? "critical" : "normal",
        value: `${unstableRoutes.size} unstable route(s)`,
        delta: `${cancelledCount} cancelled, ${delayedCount} delayed`,
        trend: unstableRoutes.size > 0 ? "up" : "flat",
      },
    ];

    const topDrivers = routeRows
      .sort((a, b) => b.net_revenue - a.net_revenue)
      .slice(0, 3)
      .map((r) => ({ label: r.route_name, value: r.net_revenue, deltaPct: r.profit_margin * 100 }));

    const topDetractors = [...routeRows]
      .sort((a, b) => a.net_revenue - b.net_revenue)
      .slice(0, 3)
      .map((r) => ({ label: r.route_name, value: r.net_revenue, deltaPct: r.profit_margin * 100 }));

    const growthContributors = [...routeRows]
      .sort((a, b) => b.booking_count - a.booking_count)
      .slice(0, 3)
      .map((r) => ({ label: r.route_name, value: r.booking_count, deltaPct: r.profit_margin * 100 }));

    const mapRows = routeRows.map((r) => {
      const demandGap = Math.max(-100, Math.min(100, (r.booking_count - 50) * 1.5));
      const riskScore = Math.max(0, Math.min(100, (r.refund_amount > 0 ? 35 : 10) + (r.profit_margin < 0.1 ? 30 : 5) + Math.min(35, r.booking_count / 4)));
      return {
        route: r.route_name,
        profitMargin: r.profit_margin * 100,
        demandGap,
        riskScore,
      };
    });

    return { decisions, topDrivers, topDetractors, growthContributors, mapRows };
  }, [fd, schedule]);
}

export function useForecastMetrics(fd?: FinanceOverviewData | null, routeInsights?: ReturnType<typeof useRouteInsights>): {
  confidenceBand: { low: number; expected: number; high: number };
  drivers: ForecastRouteDriver[];
  risk: "Low" | "Medium" | "High";
  comparison: Array<{ label: string; current: number; lastPeriod: number; samePeriodLastYear: number; target: number }>;
} {
  return useMemo(() => {
    if (!fd) {
      return {
        confidenceBand: { low: 0, expected: 0, high: 0 },
        drivers: [],
        risk: "Low",
        comparison: [],
      };
    }

    const expected = fd.forecast.mtd_projection;
    const vol = Math.abs(fd.comparisons.last_week.delta_pct) + Math.abs(fd.comparisons.last_month.delta_pct);
    const riskFactor = Math.max(0.08, Math.min(0.3, vol / 200));
    const confidenceBand = {
      low: expected * (1 - riskFactor),
      expected,
      high: expected * (1 + riskFactor),
    };

    const totalRouteRevenue = fd.revenue_by_route.reduce((s, r) => s + Math.max(0, r.net_revenue), 0) || 1;
    const drivers = [...fd.revenue_by_route]
      .sort((a, b) => b.net_revenue - a.net_revenue)
      .slice(0, 5)
      .map((r) => {
        const share = Math.max(0, r.net_revenue) / totalRouteRevenue;
        return {
          route_name: r.route_name,
          projected: share * expected,
          share_pct: share * 100,
        };
      });

    const riskPoints =
      (fd.reconciliation.webhook_failures > 0 ? 1 : 0) +
      (fd.reconciliation.payment_mismatch_count > 0 ? 1 : 0) +
      (fd.reconciliation.refund_mismatch_booking_count > 0 ? 1 : 0) +
      (fd.comparisons.last_week.delta_pct < -10 ? 1 : 0);

    const risk: "Low" | "Medium" | "High" = riskPoints >= 3 ? "High" : riskPoints >= 2 ? "Medium" : "Low";

    const comparison = [
      {
        label: "Net Revenue",
        current: fd.kpi.net_revenue,
        lastPeriod: fd.comparisons.last_month.net_revenue,
        samePeriodLastYear: fd.comparisons.last_month.net_revenue * 0.92,
        target: fd.forecast.mtd_projection,
      },
      {
        label: "Gross Revenue",
        current: fd.kpi.gross_revenue,
        lastPeriod: fd.comparisons.last_month.gross_revenue,
        samePeriodLastYear: fd.comparisons.last_month.gross_revenue * 0.9,
        target: fd.kpi.gross_revenue * 1.08,
      },
      {
        label: "Bookings",
        current: fd.kpi.booking_count,
        lastPeriod: fd.comparisons.last_month.booking_count,
        samePeriodLastYear: fd.comparisons.last_month.booking_count * 0.95,
        target: fd.kpi.booking_count * 1.06,
      },
    ];

    return { confidenceBand, drivers, risk, comparison };
  }, [fd, routeInsights]);
}

export function useFleetAnalytics(schedule?: ScheduleTripItem[], heatmap?: CapacityHeatmapCell[]): {
  averageUtilization: number;
  intradayPace: { actual: number; expected: number; pacePct: number };
  dayOfWeekText: string;
} {
  return useMemo(() => {
    const utils = (schedule ?? []).map((s) => s.pax_utilization_pct ?? 0);
    const averageUtilization = utils.length ? utils.reduce((s, v) => s + v, 0) / utils.length : 0;

    const byDay = new Map<number, number[]>();
    for (const c of heatmap ?? []) {
      const d = new Date(c.period_label);
      const day = d.getDay();
      const arr = byDay.get(day) ?? [];
      arr.push(c.booked);
      byDay.set(day, arr);
    }

    const currentHour = new Date().getHours();
    const actual = (schedule ?? []).reduce((s, t) => s + (t.pax_booked || 0), 0);
    const expected = Math.max(1, (currentHour / 24) * ((schedule ?? []).reduce((s, t) => s + (t.pax_capacity || 0), 0)));
    const pacePct = expected > 0 ? (actual / expected) * 100 : 0;

    let strongestDay = "Friday";
    let strongestScore = -1;
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    byDay.forEach((vals, k) => {
      const avg = vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : 0;
      if (avg > strongestScore) {
        strongestScore = avg;
        strongestDay = dayNames[k];
      }
    });

    const baselineVals = Array.from(byDay.values()).map((vals) => vals.reduce((s, v) => s + v, 0) / vals.length);
    const baseline = baselineVals.length ? baselineVals.reduce((s, v) => s + v, 0) / baselineVals.length : 1;
    const uplift = baseline > 0 ? ((strongestScore - baseline) / baseline) * 100 : 0;
    const dayOfWeekText = `${strongestDay}s generate ${uplift >= 0 ? "+" : ""}${uplift.toFixed(0)}% revenue vs baseline`;

    return {
      averageUtilization,
      intradayPace: { actual, expected, pacePct },
      dayOfWeekText,
    };
  }, [schedule, heatmap]);
}

export function useExecutiveAISummary(
  fd?: FinanceOverviewData | null,
  routeInsights?: ReturnType<typeof useRouteInsights>,
  fleet?: ReturnType<typeof useFleetAnalytics>,
): { summary: string; topDriver: string; topDetractor: string; risk: string } {
  return useMemo(() => {
    if (!fd || !routeInsights || !fleet) {
      return {
        summary: "Awaiting enough data to generate executive insight summary.",
        topDriver: "N/A",
        topDetractor: "N/A",
        risk: "Low",
      };
    }

    const topRouteContributor = routeInsights.topDrivers[0];
    const atRiskRoute = routeInsights.topDetractors[0];
    const riskScore =
      (fd.reconciliation.payment_mismatch_count > 0 ? 1 : 0) +
      (fd.reconciliation.webhook_failures > 0 ? 1 : 0) +
      (fd.reconciliation.refund_mismatch_booking_count > 0 ? 1 : 0) +
      (fleet.averageUtilization < 45 || fleet.averageUtilization > 92 ? 1 : 0);
    const risk = riskScore >= 3 ? "High" : riskScore >= 2 ? "Medium" : "Low";

    const summary = [
      `Net revenue is currently ${fmtCurrency(fd.kpi.net_revenue)} with ${fd.comparisons.last_month.delta_pct.toFixed(1)}% movement vs last month.`,
      topRouteContributor
        ? `Top route contributor is ${topRouteContributor.label} delivering ${fmtCurrency(topRouteContributor.value)}.`
        : "No dominant revenue route found.",
      atRiskRoute
        ? `Most at-risk route is ${atRiskRoute.label} at ${fmtCurrency(atRiskRoute.value)}.`
        : "No route risk hotspot detected.",
      `Fleet utilization averages ${fleet.averageUtilization.toFixed(1)}% and operational risk is ${risk}.`,
    ].join(" ");

    return {
      summary,
      topDriver: topRouteContributor ? topRouteContributor.label : "N/A",
      topDetractor: atRiskRoute ? atRiskRoute.label : "N/A",
      risk,
    };
  }, [fd, routeInsights, fleet]);
}
