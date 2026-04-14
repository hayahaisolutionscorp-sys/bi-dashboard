/**
 * overview-transformer.ts
 *
 * Transforms the raw OverviewData API response into a normalized,
 * UI-ready dashboard data model. All chart datasets follow the shape
 * { labels: string[], values: number[] } so they can be handed directly
 * to chart components without any further mapping in JSX.
 */

import { OverviewData } from "@/types/overview";

// ─── Output Types ──────────────────────────────────────────────────────────────

export interface DashboardKpis {
  totalRevenue: number;
  passengerRevenue: number;
  cargoRevenue: number;
  totalPassengers: number;
  totalCargoUnits: number;
  totalTrips: number;
  canceledCount: number;
  totalExpenses: number;
  todayRevenue: number;
  mtdRevenue: number;
  ytdRevenue: number;
}

export interface ChartDataset {
  labels: string[];
  values: number[];
}

export interface DashboardCharts {
  passengerVsCargo: ChartDataset;
  cargoBreakdown: ChartDataset;
  passengerBreakdown: ChartDataset;
  revenueTrend: ChartDataset;
}

export interface RoutePerformanceRow {
  routeName: string;
  totalRevenue: number;
}

export interface VesselPerformanceRow {
  vesselName: string;
  vesselType: string;
  totalRevenue: number;
}

export interface SourceDistributionRow {
  source: string;
  passengerRevenue: number;
  cargoRevenue: number;
  totalRevenue: number;
}

export interface DashboardTables {
  routePerformance: RoutePerformanceRow[];
  vesselPerformance: VesselPerformanceRow[];
  sourceDistribution: SourceDistributionRow[];
}

export interface NormalizedDashboardData {
  kpis: DashboardKpis;
  charts: DashboardCharts;
  tables: DashboardTables;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function round2(n: unknown): number {
  const num = Number(n);
  return isFinite(num) ? Math.round(num * 100) / 100 : 0;
}

function safeStr(s: unknown): string {
  return typeof s === "string" && s.trim().length > 0 ? s.trim() : "Unknown";
}

// ─── Transformer ─────────────────────────────────────────────────────────────

export function transformOverviewData(raw: OverviewData): NormalizedDashboardData {
  // ── KPIs ────────────────────────────────────────────────────────────────────
  const kpis: DashboardKpis = {
    totalRevenue:     round2(raw.kpi?.total_revenue),
    passengerRevenue: round2(raw.kpi?.passenger_revenue ?? raw.passenger_vs_cargo?.passenger_revenue),
    cargoRevenue:     round2(raw.kpi?.cargo_revenue     ?? raw.passenger_vs_cargo?.cargo_revenue),
    totalPassengers:  round2(raw.kpi?.total_passengers),
    totalCargoUnits:  round2(raw.kpi?.total_cargo_units),
    totalTrips:       round2(raw.kpi?.total_trips),
    canceledCount:    round2(raw.kpi?.canceled_count),
    totalExpenses:    round2(raw.kpi?.total_expenses),
    todayRevenue:     round2(raw.today_total_revenue),
    mtdRevenue:       round2(raw.mtd_total_revenue),
    ytdRevenue:       round2(raw.ytd_total_revenue),
  };

  // ── Passenger vs Cargo ──────────────────────────────────────────────────────
  const passengerVsCargo: ChartDataset = {
    labels: ["Passenger", "Cargo"],
    values: [kpis.passengerRevenue, kpis.cargoRevenue],
  };

  // ── Cargo Breakdown (LOOSE / ROLLING) ────────────────────────────────────────
  const rawCargoBreakdown = raw.passenger_vs_cargo?.cargo_breakdown ?? {};
  const cargoBreakdown: ChartDataset = {
    labels: Object.keys(rawCargoBreakdown).map((k) => k.toUpperCase()),
    values: Object.values(rawCargoBreakdown).map(round2),
  };

  // ── Passenger Breakdown (ADULT / STUDENT / …) ────────────────────────────────
  const rawPaxBreakdown = raw.passenger_vs_cargo?.pax_breakdown ?? {};
  const passengerBreakdown: ChartDataset = {
    labels: Object.keys(rawPaxBreakdown).map((k) => k.toUpperCase()),
    values: Object.values(rawPaxBreakdown).map(round2),
  };

  // ── Revenue Trend ────────────────────────────────────────────────────────────
  // Preserve all 24 hours even if zero so the x-axis is always complete.
  const trendMap = new Map<string, number>();
  (raw.revenue_trend ?? []).forEach((item) => {
    trendMap.set(item.label, round2(item.total_revenue));
  });

  const allHours = Array.from({ length: 24 }, (_, i) =>
    `${String(i).padStart(2, "0")}:00`
  );
  const revenueTrend: ChartDataset = {
    labels: allHours,
    values: allHours.map((h) => trendMap.get(h) ?? 0),
  };

  // ── Route Performance ────────────────────────────────────────────────────────
  const routePerformance: RoutePerformanceRow[] = (raw.revenue_by_route ?? [])
    .map((r) => ({
      routeName:    safeStr(r.route_name ?? (r as any).canonical_route_name),
      totalRevenue: round2(r.total_revenue),
    }))
    .sort((a, b) => b.totalRevenue - a.totalRevenue);

  // ── Vessel Performance ────────────────────────────────────────────────────────
  const vesselPerformance: VesselPerformanceRow[] = (raw.revenue_by_vessel ?? [])
    .map((v) => ({
      vesselName:   safeStr(v.vessel_name),
      vesselType:   safeStr(v.vessel_type),
      totalRevenue: round2(v.total_revenue),
    }))
    .sort((a, b) => b.totalRevenue - a.totalRevenue);

  // ── Source Distribution (flatten by_source deep nesting) ──────────────────
  const bySource = raw.passenger_vs_cargo?.by_source ?? {};
  const sourceDistribution: SourceDistributionRow[] = Object.entries(bySource).map(
    ([source, breakdown]) => {
      let paxRev = 0;
      let cargoRev = 0;

      // Sum all passenger sub-types
      Object.values(breakdown.pax ?? {}).forEach((v: any) => {
        paxRev += round2(typeof v === "object" ? v?.revenue : v);
      });

      // Sum all cargo sub-types
      Object.values(breakdown.cargo ?? {}).forEach((v: any) => {
        cargoRev += round2(typeof v === "object" ? v?.revenue : v);
      });

      return {
        source:           safeStr(source),
        passengerRevenue: round2(paxRev),
        cargoRevenue:     round2(cargoRev),
        totalRevenue:     round2(paxRev + cargoRev),
      };
    }
  ).sort((a, b) => b.totalRevenue - a.totalRevenue);

  return {
    kpis,
    charts: {
      passengerVsCargo,
      cargoBreakdown,
      passengerBreakdown,
      revenueTrend,
    },
    tables: {
      routePerformance,
      vesselPerformance,
      sourceDistribution,
    },
  };
}
