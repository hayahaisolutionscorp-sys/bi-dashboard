import { createContext, useContext } from "react";
import type { DateRange } from "react-day-picker";
import type { BiAnalyticsFilter } from "@/services/bi/bi.types";

export interface BiFilterContextValue {
  filter: BiAnalyticsFilter;
  dateRange: DateRange;
  setDateRange: (range: DateRange) => void;
  resetFilter: () => void;
  routeName: string;
  setRouteName: (v: string) => void;
  dateType: 'booking' | 'departure';
  setDateType: (v: 'booking' | 'departure') => void;
}

export const BiFilterContext = createContext<BiFilterContextValue | undefined>(undefined);

export function useBiFilter(): BiFilterContextValue {
  const ctx = useContext(BiFilterContext);
  if (!ctx) throw new Error("useBiFilter must be used inside <BiFilterProvider>");
  return ctx;
}
