import { cn } from "@/lib/utils";
import { type LucideIcon } from "lucide-react";

interface SimpleKpiCardProps {
  label: string;
  value: string;
  subtext?: string;
  icon?: LucideIcon;
  colorClass?: string;
  valueClass?: string;
  indicatorText?: string;
  indicatorDirection?: "up" | "down" | "neutral";
  indicatorSubtext?: string;
}

export function SimpleKpiCard({ 
  label, 
  value, 
  subtext,
  icon: Icon,
  colorClass = "text-slate-900 dark:text-slate-100",
  valueClass,
  indicatorText,
  indicatorDirection = "neutral",
  indicatorSubtext,
}: SimpleKpiCardProps) {
  return (
    <div className="flex flex-col rounded-xl border border-border bg-card p-3 sm:p-4 shadow-sm hover:shadow-md transition-all h-full">
      <div className="mb-2">
        <p className="text-[11px] sm:text-[12px] font-medium text-muted-foreground uppercase tracking-wide leading-tight truncate">
          {label}
        </p>
      </div>

      <div className="flex-1 flex flex-col justify-center">
        <div className="flex items-center gap-2">
          {Icon && (
            <Icon className={cn("h-5 w-5 sm:h-6 sm:w-6 shrink-0", colorClass)} strokeWidth={1.5} />
          )}
          <h3 className={cn(
            "text-lg sm:text-xl lg:text-2xl 2xl:text-3xl font-semibold leading-none truncate",
            colorClass,
            valueClass
          )}>
            {value}
          </h3>
        </div>
      </div>

      {(subtext || indicatorSubtext) && (
        <div className="mt-2">
          <p className="text-[11px] text-muted-foreground leading-tight line-clamp-2">
            {subtext || indicatorSubtext}
          </p>
        </div>
      )}
    </div>
  );
}
