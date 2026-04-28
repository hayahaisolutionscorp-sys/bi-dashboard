"use client";

import { AlertTriangle } from "lucide-react";

export interface ExecutiveAlert {
  message: string;
  severity: "warning" | "critical";
}

export function ExecutiveAlertBanner({ alerts }: { alerts: ExecutiveAlert[] }) {
  if (!alerts.length) return null;
  const primary = alerts[0];
  const extra = alerts.length - 1;

  return (
    <div className={`inline-flex w-fit max-w-full rounded-md border px-3 py-2 items-center gap-2 ${primary.severity === "critical" ? "border-rose-300 bg-rose-50/70 dark:bg-rose-950/20" : "border-amber-300 bg-amber-50/70 dark:bg-amber-950/20"}`}>
      <AlertTriangle className={`h-4 w-4 shrink-0 ${primary.severity === "critical" ? "text-rose-600" : "text-amber-600"}`} />
      <p className="text-xs font-medium">
        {primary.message}
        {extra > 0 ? ` (+${extra} more alert${extra > 1 ? "s" : ""})` : ""}
      </p>
    </div>
  );
}
