"use client";

import React, { useState, useCallback, useMemo } from "react";
import { format, subDays } from "date-fns";
import type { DateRange } from "react-day-picker";
import { BiFilterContext, type BiFilterContextValue } from "./bi-filter.context";
export { useBiFilter } from "./bi-filter.context";

// ─── Default range: last 30 days ─────────────────────────────────────────────

function defaultDateRange(): DateRange {
  const today = new Date();
  return { from: subDays(today, 30), to: today };
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function BiFilterProvider({ children }: { children: React.ReactNode }) {
  const [dateRange, setDateRangeState] = useState<DateRange>(defaultDateRange);
  const [routeName, setRouteName] = useState("");
  const [dateType, setDateType] = useState<'booking' | 'departure'>('booking');

  const setDateRange = useCallback((range: DateRange) => {
    setDateRangeState(range);
  }, []);

  const resetFilter = useCallback(() => {
    setDateRangeState(defaultDateRange());
    setRouteName("");
    setDateType('booking');
  }, []);

  const filter: BiFilterContextValue["filter"] = useMemo(() => ({
    from: dateRange.from ? format(dateRange.from, "yyyy-MM-dd") : undefined,
    to: dateRange.to ? format(dateRange.to, "yyyy-MM-dd") : undefined,
    route_name: routeName || undefined,
    date_type: dateType,
  }), [dateRange, routeName, dateType]);

  return (
    <BiFilterContext.Provider value={{ filter, dateRange, setDateRange, resetFilter, routeName, setRouteName, dateType, setDateType }}>
      {children}
    </BiFilterContext.Provider>
  );
}


