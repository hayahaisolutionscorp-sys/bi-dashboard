"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface BarListItem {
  name: string;
  value: string | number;
  percentage: number;
  color: string;
  textColor?: string; // NEW: For text inside bar
}

export interface BarListProps {
  title: string;
  description?: string;
  items: BarListItem[];
  
  // NEW: Customization
  barHeight?: "sm" | "md" | "lg"; // Default: "md" (h-2, h-4, h-6)
  showPagination?: boolean; // Default: true if items > 5
  itemsPerPage?: number; // Default: 5
  valueFormatter?: (value: string | number) => string;
}

export function BarList({ 
  title, 
  description, 
  items,
  barHeight = "md",
  showPagination = true,
  itemsPerPage = 5,
  valueFormatter
}: BarListProps) {
  const [currentPage, setCurrentPage] = useState(0);
  
  const totalPages = Math.ceil(items.length / itemsPerPage);
  const startIndex = currentPage * itemsPerPage;
  const displayedItems = items.slice(startIndex, startIndex + itemsPerPage);
  
  const barHeightClass = {
    sm: "h-2",
    md: "h-4",
    lg: "h-6"
  }[barHeight];

  const handleNext = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentPage > 0) {
      setCurrentPage(prev => prev - 1);
    }
  };

  return (
    <Card className="col-span-1 p-6 shadow-sm flex flex-col">
      <div className="flex-none mb-6">
        <h4 className="text-lg font-bold mb-1">{title}</h4>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>

      <div className="flex-1 space-y-4">
        {displayedItems.map((item, i) => (
          <div key={startIndex + i} className="space-y-1">
            <div className="flex justify-between text-xs font-bold">
              <span className="truncate">{item.name}</span>
              <span>
                {valueFormatter ? valueFormatter(item.value) : (
                  typeof item.value === 'number' 
                    ? `$${item.value.toLocaleString()}` 
                    : item.value
                )}
              </span>
            </div>
            <div className={cn("w-full bg-secondary rounded-full overflow-hidden", barHeightClass)}>
              <div
                className={cn("h-full rounded-full flex items-center", item.color, barHeight === "lg" ? "px-2" : "")} 
                style={{ width: `${item.percentage}%` }}
              >
                {barHeight === "lg" && item.textColor && (
                  <span className={cn("text-[10px] font-bold", item.textColor)}>
                    {item.percentage}% Capacity
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
        
        {/* Fill empty space if items < itemsPerPage to keep height consistent (optional, skipping for now to let it collapse or expand naturally) */}
      </div>

      {/* Pagination Controls */}
      {showPagination && totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 pt-4 border-t">
          <span className="text-xs text-muted-foreground">
            Page {currentPage + 1} of {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrev}
              disabled={currentPage === 0}
              className="p-1 rounded-md hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Previous Page"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              onClick={handleNext}
              disabled={currentPage === totalPages - 1}
              className="p-1 rounded-md hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Next Page"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      )}
    </Card>
  );
}
