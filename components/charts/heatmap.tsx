"use client";

import React, { useMemo, useState } from "react";
import { format, eachDayOfInterval } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { SuccessfulTripsCount } from "@/types/vessels";

interface HeatmapProps {
  title: string;
  description?: string;
  data: SuccessfulTripsCount[];
  dateRange: { from: Date; to: Date };
}

export function Heatmap({ title, description, data, dateRange }: HeatmapProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"successful" | "cancelled">("successful");
  const itemsPerPage = 5;

  const days = useMemo(() => {
    try {
      return eachDayOfInterval({ start: dateRange.from, end: dateRange.to });
    } catch (e) {
      return [];
    }
  }, [dateRange]);

  const filteredVessels = useMemo(() => {
    const sorted = [...data].sort((a, b) => a.vessel_name.localeCompare(b.vessel_name));
    if (!searchTerm) return sorted;
    return sorted.filter(v => v.vessel_name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [data, searchTerm]);

  const totalPages = Math.ceil(filteredVessels.length / itemsPerPage);

  const displayedVessels = useMemo(() => {
    const start = currentPage * itemsPerPage;
    return filteredVessels.slice(start, start + itemsPerPage);
  }, [filteredVessels, currentPage]);

  const handlePrevPage = () => setCurrentPage((p) => Math.max(0, p - 1));
  const handleNextPage = () => setCurrentPage((p) => Math.min(totalPages - 1, p + 1));

  const getDayCount = (vesselObj: SuccessfulTripsCount, day: Date) => {
    const dayStr = format(day, "yyyy-MM-dd");
    const targetArray = viewMode === "successful" ? vesselObj.successful_trips : (vesselObj.cancelled_trips || []);
    const match = targetArray.find((t) => t.date === dayStr);
    return match ? match.count : 0;
  };

  const getCellClasses = (count: number) => {
    if (viewMode === "successful") {
      if (count === 0) return "bg-emerald-600/[0.05] text-emerald-300 dark:bg-emerald-950/20";
      if (count === 1) return "bg-emerald-600/20 text-emerald-700";
      if (count === 2) return "bg-emerald-600/40 text-white";
      if (count === 3) return "bg-emerald-600/60 text-white";
      if (count === 4) return "bg-emerald-600/80 text-white";
      return "bg-emerald-600 text-white";
    } else {
      if (count === 0) return "bg-rose-600/[0.05] text-rose-300 dark:bg-rose-950/20";
      if (count === 1) return "bg-rose-600/20 text-rose-700";
      if (count === 2) return "bg-rose-600/40 text-white";
      if (count === 3) return "bg-rose-600/60 text-white";
      if (count === 4) return "bg-rose-600/80 text-white";
      return "bg-rose-600 text-white";
    }
  };

  return (
    <div className="flex flex-col w-full h-full min-h-0 overflow-hidden">
      {/* Header Section */}
      <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">{title}</h1>
          {description && (
            <p className="hidden md:block text-slate-500 dark:text-slate-400 text-sm mt-1">
              {viewMode === "successful" 
                ? description 
                : description.replace(/completed/i, "cancelled")}
            </p>
          )}
        </div>
        
        <div className="flex flex-row items-center gap-3">
          {/* View Toggle */}
          <div className="flex h-9 bg-slate-100/80 dark:bg-slate-900/50 p-1 rounded-sm border border-slate-200 dark:border-slate-800 w-full sm:w-[320px] gap-1 shrink-0">
            <button
              onClick={() => {
                setViewMode("successful");
                setCurrentPage(0);
              }}
              className={cn(
                "flex-1 h-full flex items-center justify-center text-[10.5px] font-bold uppercase tracking-wider rounded-sm transition-all",
                viewMode === "successful" 
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20" 
                  : "text-slate-600 hover:text-slate-800 dark:text-slate-400"
              )}
            >
              Completed Trips
            </button>
            <button
              onClick={() => {
                setViewMode("cancelled");
                setCurrentPage(0);
              }}
              className={cn(
                "flex-1 h-full flex items-center justify-center text-[10.5px] font-bold uppercase tracking-wider rounded-sm transition-all",
                viewMode === "cancelled" 
                  ? "bg-rose-600 text-white shadow-md shadow-rose-600/20" 
                  : "text-slate-600 hover:text-slate-800 dark:text-slate-400"
              )}
            >
              Cancelled Trips
            </button>
          </div>

          {/* Search Input */}
          <div className="relative max-w-xs w-full">
            <input
              type="text"
              placeholder="Find vessel..."
              value={searchTerm}
              onInput={(e) => setSearchTerm(e.currentTarget.value)}
              className="w-full h-9 pl-9 pr-4 rounded-sm bg-slate-50 border border-slate-200 text-[13px] outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all dark:bg-slate-900 dark:border-slate-800"
            />
            <Search className="absolute left-2.5 top-2 w-4.5 h-4.5 text-slate-400" />
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto no-scrollbar">
        <TooltipProvider delayDuration={0}>
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-900/50">
                <th className="sticky left-0 z-20 bg-slate-50 dark:bg-slate-900 py-5 px-6 text-left text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500 border-b border-slate-100 dark:border-slate-800 min-w-max">
                  Vessel Name
                </th>
                {days.map((day, idx) => (
                  <th key={idx} className="py-5 px-1 text-center text-[10px] font-bold text-slate-500 border-b border-slate-100 dark:border-slate-800 min-w-[50px]">
                    <span className="uppercase">{format(day, "EEE")}</span>
                    <br />
                    <span className="text-sm font-light text-slate-400">{format(day, "dd")}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {displayedVessels.map((vesselObj, vIdx) => (
                <tr 
                  key={vIdx} 
                  className={cn(
                    "transition-colors", 
                    viewMode === "successful" 
                      ? "hover:bg-emerald-50/30 dark:hover:bg-emerald-950/20" 
                      : "hover:bg-rose-50/30 dark:hover:bg-rose-950/20"
                  )}
                >
                  <td className="sticky left-0 z-10 bg-white dark:bg-slate-950 py-4 px-6 text-sm font-medium text-slate-700 dark:text-slate-200 border-r border-slate-100 dark:border-slate-800 min-w-max whitespace-nowrap">
                    {vesselObj.vessel_name}
                  </td>
                  {days.map((day, dIdx) => {
                    const count = getDayCount(vesselObj, day);
                    const classes = getCellClasses(count);
                    return (
                      <td key={dIdx} className="p-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className={cn(
                              "h-10 rounded-sm flex items-center justify-center text-[10px] font-bold transition-all hover:scale-105",
                              classes
                            )}>
                              {count}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent className="bg-slate-900 text-white text-xs">
                            {vesselObj.vessel_name}: {count} {viewMode === "successful" ? "completed" : "cancelled"} trips on {format(day, "MMM d")}
                          </TooltipContent>
                        </Tooltip>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </TooltipProvider>
      </div>

      {/* Footer: Legend & Pagination */}
      <footer className="p-6 bg-slate-50/30 dark:bg-slate-900/30 border-t border-slate-100 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-6">
        {/* Legend */}
        <div className="flex items-center gap-4">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Intensity</span>
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-slate-400 mr-1">Low</span>
            <div className="flex gap-0.5">
              <div className={cn("w-5 h-5 rounded-sm transition-colors", viewMode === "successful" ? "bg-emerald-600/30" : "bg-rose-600/30")}></div>
              <div className={cn("w-5 h-5 rounded-sm transition-colors", viewMode === "successful" ? "bg-emerald-600/50" : "bg-rose-600/50")}></div>
              <div className={cn("w-5 h-5 rounded-sm transition-colors", viewMode === "successful" ? "bg-emerald-600/70" : "bg-rose-600/70")}></div>
              <div className={cn("w-5 h-5 rounded-sm transition-colors", viewMode === "successful" ? "bg-emerald-600/85" : "bg-rose-600/85")}></div>
              <div className={cn("w-5 h-5 rounded-sm transition-colors", viewMode === "successful" ? "bg-emerald-600" : "bg-rose-600")}></div>
            </div>
            <span className="text-[10px] text-slate-400 ml-1">High</span>
          </div>
        </div>

        {/* Pagination */}
        <div className="flex items-center gap-6">
          <span className="text-sm text-slate-500 dark:text-slate-400">
            Showing {displayedVessels.length} of {filteredVessels.length} results (Total: {data.length})
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 0}
              className="flex items-center justify-center w-9 h-9 border border-slate-200 rounded-lg bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-30 transition-all shadow-sm dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-1 px-2 text-sm font-bold text-slate-700 dark:text-slate-200">
              Page {currentPage + 1} of {totalPages}
            </div>
            <button
              onClick={handleNextPage}
              disabled={currentPage >= totalPages - 1}
              className="flex items-center justify-center w-9 h-9 border border-slate-200 rounded-lg bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-30 transition-all shadow-sm dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </footer>

      <style dangerouslySetInnerHTML={{__html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}

