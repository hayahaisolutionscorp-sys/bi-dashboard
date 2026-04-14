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
  showDetails = false
}: KpiCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const trendClass = trend
    ? trend.direction === "up"
      ? "text-green-400 dark:text-green-400 text-green-600 dark:text-green-400"
      : trend.direction === "down"
        ? "text-red-400 dark:text-red-400 text-red-500 dark:text-red-400"
        : "text-muted-foreground"
    : "text-muted-foreground";

  // Reference / overview variant — flat bg-muted card, spec-compliant
  if (variant === "reference") {
    const trendColor = trend
      ? trend.direction === "up" ? "text-green-500" : trend.direction === "down" ? "text-red-500" : "text-muted-foreground"
      : "text-muted-foreground";

    return (
      <div
        className={cn(
          "rounded-md bg-muted p-3 sm:p-4 cursor-pointer transition-all duration-[120ms] select-none relative overflow-visible",
          isActive && "ring-1 ring-primary",
          isExpanded && "rounded-b-none z-20"
        )}
        onClick={onClick}
      >
        <p className="text-[11px] sm:text-[13px] text-muted-foreground mb-1 truncate">{title}</p>
        <p className="text-lg sm:text-xl lg:text-2xl font-medium tabular-nums text-foreground leading-tight truncate">{value}</p>
        {trend && (
          <p className={cn("text-[11px] sm:text-xs mt-1", trendColor)}>
            {trend.direction === "up" ? "↑" : trend.direction === "down" ? "↓" : "—"}
            {" "}
            {trend.direction === "up" ? "+" : trend.direction === "down" ? "-" : ""}
            {typeof trend.value === "number" ? `${trend.value}%` : trend.value} {trend.label}
          </p>
        )}

        {showDetails && (
          <button
            className="mt-2 text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-0.5 transition-colors"
            onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
          >
            {isExpanded ? "Hide" : "Details"}
            <ChevronDown className={cn("size-3 transition-transform duration-[120ms]", isExpanded && "rotate-180")} />
          </button>
        )}

        {/* Breakdown — floating panel */}
        {isExpanded && breakdown && breakdown.length > 0 && (
          <div
            className="absolute top-full left-0 right-0 bg-card border border-t-0 border-border rounded-b-md px-4 py-3 z-50"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-2">
              {breakdown.map((item, index) => {
                const ItemIcon = item.icon;
                return (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                      {ItemIcon && <ItemIcon className="size-3.5" />}
                      {item.label}
                    </span>
                    <span className={cn("text-xs font-medium tabular-nums text-foreground", item.valueColor)}>
                      {item.value}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (variant === "vertical") {
    return (
      <Card className={cn("rounded-md p-5 border border-border bg-card relative overflow-hidden flex flex-col justify-between", minHeight || "min-h-[200px]")}>
        <div>
          {trend && (
            <span className={cn(
              "inline-block mb-3 px-2 py-0.5 rounded text-[11px] font-medium",
              trend.direction === "up" && "bg-green-950/50 text-green-400",
              trend.direction === "down" && "bg-red-950/50 text-red-400",
              trend.direction === "neutral" && "bg-muted text-muted-foreground"
            )}>
              {trend.direction === "up" ? "+" : trend.direction === "down" ? "-" : ""}
              {typeof trend.value === "number" ? `${trend.value}%` : trend.value} {trend.label}
            </span>
          )}
          <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">{title}</p>
          <p className="text-2xl font-medium tabular-nums mt-1 text-foreground">{value}</p>
        </div>
        {progress && (
          <div className="mt-4">
            <p className="text-xs text-muted-foreground mb-1.5">{progress.label}</p>
            <div className="w-full bg-muted h-1 rounded-full overflow-hidden">
              <div
                className={cn("h-full", progress.color || "bg-primary")}
                style={{ width: `${progress.value}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">{progress.value}%</p>
          </div>
        )}
      </Card>
    );
  }

  // Horizontal variant (default)
  return (
    <Card className="flex flex-row items-center justify-between px-4 py-3 border border-border bg-card rounded-md">
      <div className="space-y-0.5 min-w-0">
        <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-widest">{title}</p>
        <p className="text-2xl font-medium tabular-nums text-foreground">{value}</p>
        {trend && (
          <p className={cn("text-xs", trendClass)}>
            {trend.direction === "up" ? "↑ +" : trend.direction === "down" ? "↓ -" : "— "}
            {typeof trend.value === "number" ? `${trend.value}%` : trend.value} {trend.label}
          </p>
        )}
      </div>
      <div className={cn("size-9 rounded-md flex items-center justify-center shrink-0", iconBgClass)}>
        <Icon className={cn("size-4", iconColorClass)} />
      </div>
    </Card>
  );
}
