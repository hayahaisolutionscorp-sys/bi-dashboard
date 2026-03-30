import { useState } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface RouteSeasonality {
  route: string;
  data: { month: string; value: number }[];
}

export interface HeatmapGridProps {
  title: string;
  data: Record<string, RouteSeasonality[]>;
  years: string[];
}

export function HeatmapGrid({ title, data, years }: HeatmapGridProps) {
  const [selectedYear, setSelectedYear] = useState(years[years.length - 1]);
  const currentData = data[selectedYear] || [];

  // Value scale configuration
  const maxValue = 1000000;

  // Helper to determine color intensity based on value
  const getColorClass = (value: number) => {
    if (value >= 1000000) return "bg-primary"; // Max
    if (value >= 500000) return "bg-primary/80";
    if (value >= 250000) return "bg-primary/60";
    if (value >= 100000) return "bg-primary/40";
    if (value >= 50000) return "bg-primary/20";
    return "bg-primary/10"; // Min
  };

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  return (
    <Card className="lg:col-span-2 p-6 shadow-sm overflow-hidden flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-bold text-lg">{title}</h3>
        
        {/* Year Toggle */}
        <div className="flex items-center gap-1 bg-secondary rounded-lg p-1">
          {years.map((year) => (
            <button
              key={year}
              onClick={() => setSelectedYear(year)}
              className={cn(
                "px-3 py-1 text-xs font-medium rounded-md transition-colors",
                selectedYear === year
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {year}
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-end items-center gap-3 mb-4">
         <span className="text-[10px] text-muted-foreground">5k</span>
          <div className="flex gap-1">
            <span className="size-3 rounded-sm bg-primary/10"></span>
            <span className="size-3 rounded-sm bg-primary/20"></span>
            <span className="size-3 rounded-sm bg-primary/40"></span>
            <span className="size-3 rounded-sm bg-primary/60"></span>
            <span className="size-3 rounded-sm bg-primary/80"></span>
            <span className="size-3 rounded-sm bg-primary"></span>
          </div>
          <span className="text-[10px] text-muted-foreground">1M+</span>
      </div>

      <div className="overflow-x-auto pb-2">
        <div className="min-w-[700px]"> 
          {/* Header Row */}
          <div className="grid grid-cols-[140px_repeat(12,1fr)] gap-2 mb-2 items-center">
            <div className="text-xs font-semibold text-muted-foreground">Route</div>
            {months.map(m => (
              <div key={m} className="text-[10px] font-semibold text-muted-foreground text-center">{m}</div>
            ))}
          </div>

          {/* Data Rows */}
          <div className="flex flex-col gap-2">
            {currentData.map((routeItem) => (
              <div key={routeItem.route} className="grid grid-cols-[140px_repeat(12,1fr)] gap-2 items-center hover:bg-muted/50 rounded-md p-1 transition-colors">
                <div className="text-xs font-medium truncate" title={routeItem.route}>
                  {routeItem.route}
                </div>
                {routeItem.data.map((monthData) => (
                  <div key={monthData.month} className="relative group flex justify-center">
                    {/* Tooltip */}
                    <div className="absolute bottom-full mb-1 hidden group-hover:block bg-popover text-popover-foreground text-[10px] px-2 py-1 rounded shadow-md whitespace-nowrap z-10">
                      {routeItem.route} - {monthData.month}: ${monthData.value.toLocaleString()}
                    </div>
                    
                    <div 
                      className={cn(
                        "w-full aspect-[2/1] min-h-[20px] rounded-sm transition-all duration-300 hover:scale-110",
                        getColorClass(monthData.value)
                      )}
                    ></div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}
