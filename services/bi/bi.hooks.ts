"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useTenant } from "@/components/providers/tenant-provider";
import { useBiFilter } from "@/components/providers/bi-filter.context";
import { biService } from "./bi.service";
import type {
  BiAnalyticsFilter,
  ExecutiveOverviewResponse,
  ExecutiveKpiResponse,
  ExecutiveForecastResponse,
  RevenueResponse,
  ProfitabilityResponse,
  ExpensesResponse,
  ReconciliationResponse,
  SalesOverviewResponse,
  SalesChannelsResponse,
  SalesInsightsResponse,
  PassengerDemandResponse,
  CargoDemandResponse,
  DemandTrendsResponse,
  ScheduleResponse,
  LiveResponse,
  VesselsResponse,
} from "./bi.types";

// ─── Generic hook factory ─────────────────────────────────────────────────────

interface UseAnalyticsState<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

function useAnalytics<T>(
  fetcher: (baseUrl: string, filter: BiAnalyticsFilter, serviceKey: string) => Promise<T>,
  filterOverride?: Partial<BiAnalyticsFilter>,
): UseAnalyticsState<T> {
  const { activeTenant } = useTenant();
  const { filter: globalFilter } = useBiFilter();

  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fetchKey, setFetchKey] = useState(0);

  const mergedFilter: BiAnalyticsFilter = { ...globalFilter, ...filterOverride };

  // Stable reference to avoid stale closure
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  useEffect(() => {
    if (!activeTenant?.api_base_url) return;

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    fetcherRef
      .current(activeTenant.api_base_url, mergedFilter, activeTenant.service_key)
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load data");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTenant?.api_base_url, activeTenant?.service_key, fetchKey, JSON.stringify(mergedFilter)]);

  const refetch = useCallback(() => setFetchKey((k) => k + 1), []);

  return { data, isLoading, error, refetch };
}

// ─── Executive ────────────────────────────────────────────────────────────────

export function useExecutiveOverview(filterOverride?: Partial<BiAnalyticsFilter>) {
  return useAnalytics<ExecutiveOverviewResponse>(
    (baseUrl, filter, sk) => biService.getExecutiveOverview(baseUrl, filter, sk),
    filterOverride,
  );
}

export function useExecutiveKpis(filterOverride?: Partial<BiAnalyticsFilter>) {
  return useAnalytics<ExecutiveKpiResponse>(
    (baseUrl, filter, sk) => biService.getExecutiveKpis(baseUrl, filter, sk),
    filterOverride,
  );
}

export function useExecutiveForecast(filterOverride?: Partial<BiAnalyticsFilter>) {
  return useAnalytics<ExecutiveForecastResponse>(
    (baseUrl, filter, sk) => biService.getExecutiveForecast(baseUrl, filter, sk),
    filterOverride,
  );
}

// ─── Financials ───────────────────────────────────────────────────────────────

export function useRevenue(
  groupBy: "route" | "vessel" | "method" | "trip" = "route",
  filterOverride?: Partial<BiAnalyticsFilter>,
) {
  return useAnalytics<RevenueResponse>(
    (baseUrl, filter, sk) => biService.getRevenue(baseUrl, filter, groupBy, sk),
    filterOverride,
  );
}

export function useProfitability(
  groupBy: "route" | "vessel" | "trip" = "route",
  filterOverride?: Partial<BiAnalyticsFilter>,
) {
  return useAnalytics<ProfitabilityResponse>(
    (baseUrl, filter, sk) => biService.getProfitability(baseUrl, filter, groupBy, sk),
    filterOverride,
  );
}

export function useExpenses(filterOverride?: Partial<BiAnalyticsFilter>) {
  return useAnalytics<ExpensesResponse>(
    (baseUrl, filter, sk) => biService.getExpenses(baseUrl, filter, sk),
    filterOverride,
  );
}

export function useReconciliation(filterOverride?: Partial<BiAnalyticsFilter>) {
  return useAnalytics<ReconciliationResponse>(
    (baseUrl, filter, sk) => biService.getReconciliation(baseUrl, filter, sk),
    filterOverride,
  );
}

// ─── Sales ────────────────────────────────────────────────────────────────────

export function useSalesOverview(filterOverride?: Partial<BiAnalyticsFilter>) {
  return useAnalytics<SalesOverviewResponse>(
    (baseUrl, filter, sk) => biService.getSalesOverview(baseUrl, filter, sk),
    filterOverride,
  );
}

export function useSalesChannels(filterOverride?: Partial<BiAnalyticsFilter>) {
  return useAnalytics<SalesChannelsResponse>(
    (baseUrl, filter, sk) => biService.getSalesChannels(baseUrl, filter, sk),
    filterOverride,
  );
}

export function useSalesInsights(filterOverride?: Partial<BiAnalyticsFilter>) {
  return useAnalytics<SalesInsightsResponse>(
    (baseUrl, filter, sk) => biService.getSalesInsights(baseUrl, filter, sk),
    filterOverride,
  );
}

// ─── Demand ───────────────────────────────────────────────────────────────────

export function usePassengerDemand(filterOverride?: Partial<BiAnalyticsFilter>) {
  return useAnalytics<PassengerDemandResponse>(
    (baseUrl, filter, sk) => biService.getPassengerDemand(baseUrl, filter, sk),
    filterOverride,
  );
}

export function useCargoDemand(filterOverride?: Partial<BiAnalyticsFilter>) {
  return useAnalytics<CargoDemandResponse>(
    (baseUrl, filter, sk) => biService.getCargoDemand(baseUrl, filter, sk),
    filterOverride,
  );
}

export function useDemandTrends(filterOverride?: Partial<BiAnalyticsFilter>) {
  return useAnalytics<DemandTrendsResponse>(
    (baseUrl, filter, sk) => biService.getDemandTrends(baseUrl, filter, sk),
    filterOverride,
  );
}

// ─── Operations ───────────────────────────────────────────────────────────────

export function useSchedule(filterOverride?: Partial<BiAnalyticsFilter>) {
  return useAnalytics<ScheduleResponse>(
    (baseUrl, filter, sk) => biService.getSchedule(baseUrl, filter, sk),
    filterOverride,
  );
}

export function useLive(refreshIntervalMs = 20000) {
  const { activeTenant } = useTenant();
  const [data, setData] = useState<LiveResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLive = useCallback(async () => {
    if (!activeTenant?.api_base_url) return;
    setError(null);
    try {
      const result = await biService.getLive(activeTenant.api_base_url, activeTenant.service_key);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load live data");
    } finally {
      setIsLoading(false);
    }
  }, [activeTenant?.api_base_url, activeTenant?.service_key]);

  useEffect(() => {
    fetchLive();
    const interval = setInterval(fetchLive, refreshIntervalMs);
    return () => clearInterval(interval);
  }, [fetchLive, refreshIntervalMs]);

  return { data, isLoading, error, refetch: fetchLive };
}

// ─── Assets ───────────────────────────────────────────────────────────────────

export function useVessels(filterOverride?: Partial<BiAnalyticsFilter>) {
  return useAnalytics<VesselsResponse>(
    (baseUrl, filter, sk) => biService.getVessels(baseUrl, filter, sk),
    filterOverride,
  );
}
