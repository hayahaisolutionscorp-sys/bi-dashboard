"use client";

import { FilterX } from "lucide-react";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Button } from "@/components/ui/button";
import { useBiFilter } from "@/components/providers/bi-filter-provider";

interface BiFilterBarProps {
  /** Extra slots (e.g. route selector, export button) */
  children?: React.ReactNode;
  className?: string;
}

export function BiFilterBar({ children, className }: BiFilterBarProps) {
  const { dateRange, setDateRange, resetFilter, dateType, setDateType } = useBiFilter();

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className ?? ""}`}>
      {/* Date type toggle */}
      <div className="flex items-center rounded-md border border-border bg-muted/40 text-xs">
        <button
          onClick={() => setDateType("booking")}
          className={`px-2.5 py-1.5 rounded-l-md transition-colors ${
            dateType === "booking"
              ? "bg-primary text-primary-foreground font-medium"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Booking Date
        </button>
        <button
          onClick={() => setDateType("departure")}
          className={`px-2.5 py-1.5 rounded-r-md transition-colors ${
            dateType === "departure"
              ? "bg-primary text-primary-foreground font-medium"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Departure Date
        </button>
      </div>

      <DateRangePicker
        date={dateRange}
        onDateChange={(range) => { if (range) setDateRange(range); }}
      />
      <Button variant="ghost" size="sm" onClick={resetFilter} className="gap-1.5 text-muted-foreground">
        <FilterX className="h-3.5 w-3.5" />
        Reset
      </Button>
      {children}
    </div>
  );
}
