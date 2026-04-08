"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { ShadcnLineChartMultiple } from "@/components/charts/shadcn-line-chart-multiple";
import { NoDataPlaceholder } from "@/components/charts/no-data-placeholder";
import { DateRange } from "react-day-picker";
import { salesService } from "@/services/sales.service";
import { ComparisonTrendData } from "@/types/sales";
import { Route, Ship, MapPin, ChevronDown, Check } from "lucide-react";
import { useTenant } from "@/components/providers/tenant-provider";

interface ComparisonTrendChartProps {
  dateRange?: DateRange;
  selectedRouteName?: string;
}

const SERIES_COLORS = [
  "#2563eb", // blue-600
  "#f59e0b", // amber-500
  "#10b981", // emerald-500
  "#ef4444", // red-500
  "#8b5cf6", // violet-500
  "#06b6d4", // cyan-500
  "#f97316", // orange-500
  "#14b8a6", // teal-500
  "#ec4899", // pink-500
  "#6366f1", // indigo-500
];

export function ComparisonTrendChart({ dateRange, selectedRouteName }: ComparisonTrendChartProps) {
  const { activeTenant } = useTenant();
  const [compareBy, setCompareBy] = useState<"route" | "vessel" | "trip">("route");
  const [metric, setMetric] = useState<"totalSales" | "totalBookings" | "totalPassengers">("totalSales");
  
  const [entityIds, setEntityIds] = useState<string[]>([]);
  const [availableEntities, setAvailableEntities] = useState<string[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  const [trendData, setTrendData] = useState<ComparisonTrendData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isDropdownOpen]);

  const fetchTrend = async (overrideEntityIds?: string[]) => {
    if (!dateRange?.from || !dateRange?.to) {
      setTrendData(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    
    const from = dateRange.from.toISOString().split("T")[0];
    const to = dateRange.to.toISOString().split("T")[0];
    
    // Combine manual selections with the globally selected route (if comparing by route)
    let currentIds = overrideEntityIds !== undefined ? overrideEntityIds : entityIds;
    
    const isPinnedRouteActive = compareBy === "route" && selectedRouteName;
    if (isPinnedRouteActive && !currentIds.includes(selectedRouteName as string)) {
      currentIds = [...currentIds, selectedRouteName as string];
    }

    try {
      if (!activeTenant?.api_base_url) return;
      const data = await salesService.getComparisonTrend(activeTenant.api_base_url, {
        from,
        to,
        compareBy,
        entityIds: currentIds.length > 0 ? currentIds : undefined
      }, activeTenant.service_key);

      setTrendData(data);
    } catch (err) {
      console.error(err);
      setError("Failed to load comparison trend.");
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Separate logic to fetch available options for the dropdown
  const fetchAvailableEntities = async () => {
    try {
      let fetchedIds: string[] = [];
      if (!activeTenant?.api_base_url) return;
      if (compareBy === "route") {
        fetchedIds = await salesService.getRoutes(activeTenant.api_base_url, activeTenant.service_key);
      } else {
        // For vessels/trips, we might fallback to generic series if no specialized discovery exists
        const data = await salesService.getComparisonTrend(activeTenant.api_base_url, {
          from: dateRange?.from?.toISOString().split("T")[0]!,
          to: dateRange?.to?.toISOString().split("T")[0]!,
          compareBy
        }, activeTenant.service_key);
        fetchedIds = data.series.map(s => s.id);
      }

      // Filter out the globally selected route so it doesn't show in the dropdown
      if (compareBy === "route" && selectedRouteName) {
        fetchedIds = fetchedIds.filter(id => id !== selectedRouteName);
      }
      setAvailableEntities(fetchedIds);
    } catch (err) {
      console.error("Discovery fetch error:", err);
    }
  };

  useEffect(() => {
    // Reset local selection when dimension changes
    setEntityIds([]);
    setAvailableEntities([]);
    setTrendData(null);
    
    fetchTrend([]);
    fetchAvailableEntities();
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [compareBy, dateRange, selectedRouteName]);

  const handleToggleEntity = (name: string) => {
    const isSelected = entityIds.includes(name);
    const newIds = isSelected ? entityIds.filter(r => r !== name) : [...entityIds, name];
    setEntityIds(newIds);
    fetchTrend(newIds);
  };

  // Transform backend series data to flat Recharts format
  const chartData = useMemo(() => {
    if (!trendData || !trendData.series || trendData.series.length === 0) return [];
    
    const dateMap = new Map<string, any>();
    
    trendData.series.forEach((seriesItem) => {
      seriesItem.data.forEach((point) => {
        if (!dateMap.has(point.date)) {
          dateMap.set(point.date, { date: point.date });
        }
        const row = dateMap.get(point.date);
        row[seriesItem.id] = point[metric];
      });
    });
    
    return Array.from(dateMap.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [trendData, metric]);

  const seriesConfig = useMemo(() => {
    if (!trendData || !trendData.series) return [];
    return trendData.series.map((seriesItem, idx) => ({
      dataKey: seriesItem.id,
      name: seriesItem.id,
      color: SERIES_COLORS[idx % SERIES_COLORS.length]
    }));
  }, [trendData]);

  const configObj = useMemo(() => {
    const obj: Record<string, any> = {};
    seriesConfig.forEach((s) => {
      obj[s.dataKey] = { label: s.name, color: s.color };
    });
    return obj;
  }, [seriesConfig]);

  const isChartEmpty = chartData.length === 0;

  return (
    <div className="relative rounded-xl border border-slate-300 bg-gray-100 p-3 shadow-sm dark:border-slate-700 dark:bg-slate-950 mt-4">
      <h3 className="text-base font-semibold mb-3 px-1 text-slate-800 dark:text-slate-100">Comparison Trend</h3>
      <div className="mb-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center w-full">
          {/* Compare By */}
          <div className="flex flex-col gap-1.5 w-full sm:w-[280px]">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">Compare By</span>
            <div className="flex rounded-md shadow-sm w-full">
              <button
                type="button"
                onClick={() => setCompareBy("route")}
                className={`flex-1 justify-center relative inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-l-md border ${
                  compareBy === "route" 
                    ? "bg-sky-50 text-sky-700 border-sky-200 z-10 dark:bg-sky-900/30 dark:text-sky-400 dark:border-sky-800" 
                    : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-800"
                }`}
              >
                <Route className="w-3.5 h-3.5 mr-1.5" />
                Route
              </button>
              <button
                type="button"
                onClick={() => setCompareBy("vessel")}
                className={`flex-1 justify-center relative inline-flex items-center px-3 py-1.5 text-sm font-medium border-t border-b ${
                  compareBy === "vessel" 
                    ? "bg-sky-50 text-sky-700 border-sky-200 z-10 dark:bg-sky-900/30 dark:text-sky-400 dark:border-sky-800" 
                    : "bg-white text-slate-700 border-slate-300 border-x-0 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-800"
                }`}
              >
                <Ship className="w-3.5 h-3.5 mr-1.5" />
                Vessel
              </button>
              <button
                type="button"
                onClick={() => setCompareBy("trip")}
                className={`flex-1 justify-center relative inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-r-md border ${
                  compareBy === "trip" 
                    ? "bg-sky-50 text-sky-700 border-sky-200 z-10 dark:bg-sky-900/30 dark:text-sky-400 dark:border-sky-800" 
                    : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-800"
                }`}
              >
                <MapPin className="w-3.5 h-3.5 mr-1.5" />
                Trip
              </button>
            </div>
          </div>

          <div className="hidden sm:block w-px h-8 bg-slate-200 dark:bg-slate-700 mx-1"></div>

          {/* Metric Selector */}
          <div className="flex flex-col gap-1.5 flex-1 sm:flex-none sm:w-[150px]">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">Metric</span>
            <select
              value={metric}
              onChange={(e) => setMetric(e.target.value as any)}
              className="h-8 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            >
              <option value="totalSales">Sales</option>
              <option value="totalBookings">Bookings</option>
              <option value="totalPassengers">Passengers</option>
            </select>
          </div>
          
          <div className="hidden sm:block w-px h-8 bg-slate-200 dark:bg-slate-700 mx-1"></div>

          {/* Entities Dropdown */}
          <div className="flex flex-col gap-1.5 w-full sm:w-[280px] relative">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">Compare With</span>
            <div 
              className="relative" 
              ref={dropdownRef}
            >
              <div 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center justify-between w-full h-8 px-3 rounded-md border border-slate-300 bg-white text-sm text-slate-900 cursor-pointer shadow-sm focus:border-sky-500 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              >
                <span className="truncate pr-2">
                  {entityIds.length === 0 
                    ? `Compare with ${compareBy}s...` 
                    : `${entityIds.length} added for comparison`}
                </span>
                <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </div>
              
              {isDropdownOpen && (
                <div className="absolute top-[calc(100%+4px)] left-0 w-full min-w-[240px] max-h-60 overflow-y-auto z-50 rounded-md border border-slate-200 bg-white shadow-lg py-1 dark:border-slate-700 dark:bg-slate-900">
                  {availableEntities.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-slate-500">Loading {compareBy}s...</div>
                  ) : (
                    availableEntities.map(name => {
                      const isSelected = entityIds.includes(name);
                      return (
                        <div 
                          key={name}
                          onClick={() => handleToggleEntity(name)}
                          className="flex items-center px-3 py-1.5 text-sm cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-200"
                        >
                          <div className={`flex items-center justify-center w-4 h-4 mr-2 border rounded ${isSelected ? 'bg-sky-500 border-sky-500' : 'border-slate-300 dark:border-slate-600'}`}>
                            {isSelected && <Check className="w-3 h-3 text-white" />}
                          </div>
                          <span className="truncate">{name}</span>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Chart Display */}
      <div className="relative pt-2">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-[2px]">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
          </div>
        )}
        
        {error ? (
          <div className="flex h-[300px] items-center justify-center text-rose-500 font-medium">
            {error}
          </div>
        ) : entityIds.length === 0 && !isLoading ? (
          <div className="flex h-[300px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 dark:border-slate-700 dark:bg-slate-900/50">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Select one or more {compareBy}{compareBy === "trip" ? "s" : "s"} above to compare trends
            </span>
          </div>
        ) : isChartEmpty && !isLoading ? (
          <NoDataPlaceholder height="300px" message="No trend data for the selected entities in this period" />
        ) : (
          <ShadcnLineChartMultiple
            data={chartData}
            labelKey="date"
            height="300px"
            dateRange={dateRange}
            config={configObj}
            series={seriesConfig}
            valueFormatter={(value: number | string) => metric === "totalSales" ? `₱${Number(value).toLocaleString()}` : Number(value).toLocaleString()}
          />
        )}
      </div>
    </div>
  );
}
