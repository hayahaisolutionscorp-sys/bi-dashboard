"use client";

import { cn } from "@/lib/utils";

export function severityClass(severity: "normal" | "warning" | "critical") {
  if (severity === "critical") return "border-rose-300 bg-rose-50/70 dark:bg-rose-950/20";
  if (severity === "warning") return "border-amber-300 bg-amber-50/70 dark:bg-amber-950/20";
  return "border-border bg-card";
}

export function trendColor(trend: "up" | "down" | "flat") {
  if (trend === "up") return "text-emerald-600";
  if (trend === "down") return "text-rose-600";
  return "text-muted-foreground";
}

export function TinySparkline({ values }: { values?: number[] }) {
  if (!values?.length) return null;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const span = Math.max(1, max - min);

  const points = values.map((v, i) => {
    const x = (i / Math.max(1, values.length - 1)) * 100;
    const y = 20 - ((v - min) / span) * 20;
    return `${x},${y}`;
  });

  return (
    <svg viewBox="0 0 100 20" className="h-6 w-full">
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className={cn("text-primary")}
        points={points.join(" ")}
      />
    </svg>
  );
}
