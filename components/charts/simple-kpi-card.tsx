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
    <div className="flex flex-col rounded-xl border border-[#f0f0f0] bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.1)] transition-all dark:bg-slate-900 dark:border-slate-800 h-full min-h-[140px]">
      <div className="mb-4">
        <p className="text-[13px] font-medium text-[#8c8c8c] dark:text-slate-400 uppercase tracking-wide">
          {label}
        </p>
      </div>

      <div className="flex-1 flex flex-col justify-center">
        <div className="flex items-center gap-3">
          {Icon && (
            <Icon className={cn("h-7 w-7", colorClass)} strokeWidth={1.5} />
          )}
          <div className="flex flex-col gap-1">
            <h3 className={cn(
              "text-[25px] font-normal leading-none",
              colorClass,
              valueClass
            )}>
              {value}
            </h3>
          </div>
        </div>
      </div>

      {(subtext || indicatorSubtext) && (
        <div className="mt-4">
          <p className="text-[12px] text-[#8c8c8c] dark:text-slate-500">
            {subtext || indicatorSubtext}
          </p>
        </div>
      )}
    </div>
  );
}
