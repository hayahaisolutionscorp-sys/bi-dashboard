import { LucideIcon, TrendingDown, TrendingUp, Minus, ChevronDown } from "lucide-react";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface KpiCardBreakdownItem {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  valueColor?: string; // For highlighting (e.g., "text-rose-500")
}

export interface KpiCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number | string;
    label: string;
    direction: "up" | "down" | "neutral";
  };
  iconColorClass?: string;
  iconBgClass?: string;
  
  // Progress bar support
  progress?: {
    label: string;
    value: number; // 0-100
    color?: string; // Default: "bg-teal-500"
  };
  
  // Layout variants
  variant?: "horizontal" | "vertical" | "reference"; // Default: "horizontal"
  minHeight?: string;
  
  // NEW: Breakdown metrics support (reference design)
  breakdown?: KpiCardBreakdownItem[];
  iconBgColor?: string; // e.g., "bg-sky-50 dark:bg-sky-900/20"
  onClick?: () => void;
  isActive?: boolean;
  showDetails?: boolean; // Control visibility of View Details dropdown
}

export function KpiCard({
  title,
  value,
  icon: Icon,
  trend,
  iconColorClass = "text-primary",
  iconBgClass = "bg-primary/10",
  progress,
  variant = "horizontal",
  minHeight,
  breakdown,
  iconBgColor,
  onClick,
  isActive,
  showDetails = false // Default to false
}: KpiCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const indicatorColorClass = trend
    ? trend.direction === "up"
      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
      : trend.direction === "down"
        ? "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300"
        : "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200"
    : "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200";

  // Reference variant (3-column KPI cards with breakdown)
  if (variant === "reference") {
    const bgColor = iconBgColor || "bg-sky-200 dark:bg-sky-900/40";
    const valueStr = String(value);
    const isVeryLongValue = valueStr.length > 18;
    const isLongValue = !isVeryLongValue && valueStr.length > 10;
    const valueSizeClass = isVeryLongValue
      ? "text-lg sm:text-xl md:text-2xl"
      : isLongValue
        ? "text-2xl sm:text-3xl"
        : "text-2xl sm:text-3xl md:text-4xl";
    
    return (
      <Card 
        className={cn(
          "gap-0 p-0 shadow-sm border rounded-xl transition-all duration-200 relative overflow-visible",
          onClick && "cursor-pointer hover:border-primary/50",
          isActive ? "border-primary ring-1 ring-primary shadow-md" : "border-border",
          "hover:shadow-md",
          isExpanded && "rounded-b-none z-20 border-b-0 shadow-none ring-0"
        )}
        onClick={onClick}
      >
        <div className={cn("flex items-center justify-between rounded-t-xl px-4 py-3", bgColor)}>
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-600 dark:text-slate-200/90">
              {title}
            </p>
            <h3
              className={cn(
                "mt-1 leading-none font-normal text-slate-900 dark:text-slate-50",
                valueSizeClass
              )}
            >
              {value}
            </h3>
          </div>

          <div className="flex h-10 w-10 shrink-0 items-center justify-center self-center rounded-md border-2 border-black/80 text-black dark:border-slate-100 dark:text-slate-100">
            <Icon className={cn("size-6", iconColorClass)} />
          </div>
        </div>

        <div className="flex items-center justify-between rounded-b-xl border-t bg-white px-4 py-2 text-[10px] text-slate-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300">
          <div className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5", indicatorColorClass)}>
            {trend && (
              <>
                {trend.direction === "up" && <TrendingUp className="size-3" />}
                {trend.direction === "down" && <TrendingDown className="size-3" />}
                {trend.direction === "neutral" && <Minus className="size-3" />}
                <span>
                  {trend.direction === "up" ? "+" : trend.direction === "down" ? "-" : ""}
                  {typeof trend.value === "number" ? `${trend.value}%` : trend.value} {trend.label}
                </span>
              </>
            )}
          </div>

          {showDetails && (
            <button 
              className={cn(
                "inline-flex items-center text-[10px] text-slate-600 hover:text-slate-900 transition-colors dark:text-slate-300 dark:hover:text-slate-100",
                isExpanded && "text-slate-900 dark:text-slate-100"
              )}
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
            >
              {isExpanded ? "Hide Details" : "View Details"} 
              <ChevronDown className={cn("ml-1 size-3 transition-transform duration-200", isExpanded && "rotate-180")} />
            </button>
          )}
        </div>

        {/* Breakdown Section (Expandable & Floating) */}
        {isExpanded && breakdown && breakdown.length > 0 && (
          <div 
            className={cn(
              "absolute top-full -left-px -right-px bg-card border border-t-0 p-4 rounded-b-xl shadow-lg z-50",
              isActive ? "border-primary ring-1 ring-t-0 ring-primary" : "border-border"
            )}
            onClick={(e) => e.stopPropagation()} 
          >
            <div className="space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
              {breakdown.map((item, index) => {
                const ItemIcon = item.icon;
                return (
                  <div key={index} className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground flex items-center gap-2">
                      {ItemIcon && <ItemIcon className="size-4" />}
                      {item.label}
                    </span>
                    <span className={cn("font-semibold", item.valueColor || "")}>
                      {item.value}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Card>
    );
  }
  
  if (variant === "vertical") {
    return (
      <Card className={cn("rounded-xl p-8 shadow-sm relative overflow-hidden flex flex-col justify-between", minHeight || "min-h-[280px]")}>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className={cn("p-3 rounded-lg", iconBgClass)}>
              <Icon className={cn("size-8", iconColorClass)} />
            </div>
            {trend && (
              <span className={cn(
                "px-2 py-1 rounded text-xs font-bold",
                trend.direction === "up" && "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
                trend.direction === "down" && "bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400",
                trend.direction === "neutral" && "bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400"
              )}>
                {trend.direction === "up" ? "+" : trend.direction === "down" ? "-" : ""}
                {typeof trend.value === "number" ? `${trend.value}%` : trend.value} {trend.label}
              </span>
            )}
          </div>
          <p className="text-muted-foreground text-sm font-semibold uppercase tracking-wider">{title}</p>
          <p className="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight mt-2">{value}</p>
        </div>
        {progress && (
          <div className="flex items-center gap-4 mt-6">
            <div className="flex-1">
              <p className="text-xs text-muted-foreground mb-1">{progress.label}</p>
              <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden">
                <div 
                  className={cn("h-full rounded-full", progress.color || "bg-teal-500")} 
                  style={{ width: `${progress.value}%` }} 
                />
              </div>
            </div>
            <span className="text-sm font-bold">{progress.value}%</span>
          </div>
        )}
      </Card>
    );
  }
  
  // Horizontal variant (default)
  return (
    <Card className="flex flex-row items-center justify-between p-6 shadow-sm">
      <div className="space-y-1">
        <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          {title}
        </p>
        <h3 className="text-2xl sm:text-3xl font-extrabold">{value}</h3>
        {trend && (
          <div
            className={cn(
              "flex items-center gap-1.5 text-sm font-bold",
              trend.direction === "up" && "text-emerald-500",
              trend.direction === "down" && "text-rose-500",
              trend.direction === "neutral" && "text-muted-foreground"
            )}
          >
            {trend.direction === "up" && <TrendingUp className="size-4" />}
            {trend.direction === "down" && <TrendingDown className="size-4" />}
            {trend.direction === "neutral" && <Minus className="size-4" />}
            <span>
              {trend.direction === "up" ? "+" : trend.direction === "down" ? "-" : ""}
              {typeof trend.value === "number" ? `${trend.value}%` : trend.value} {trend.label}
            </span>
          </div>
        )}
      </div>
      <div
        className={cn(
          "size-14 rounded-full flex items-center justify-center",
          iconBgClass,
          iconColorClass
        )}
      >
        <Icon className="size-8" />
      </div>
    </Card>
  );
}
