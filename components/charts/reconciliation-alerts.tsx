"use client";

import { ReconciliationData } from "@/types/overview";
import { AlertTriangle, CheckCircle, XCircle, Webhook } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  data: ReconciliationData;
}

interface AlertItem {
  label: string;
  value: string;
  detail: string;
  severity: "ok" | "warn" | "error";
  icon: React.ElementType;
}

function formatCurrency(n: number) {
  if (n >= 1_000_000) return `₱${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000)     return `₱${(n / 1_000).toFixed(1)}K`;
  return `₱${n.toLocaleString()}`;
}

export function ReconciliationAlerts({ data }: Props) {
  const alerts: AlertItem[] = [
    {
      label:    "Payment Mismatches",
      value:    data.payment_mismatch_count.toLocaleString(),
      detail:   "booking_payments ↔ payment_transactions",
      severity: data.payment_mismatch_count === 0 ? "ok" : data.payment_mismatch_count < 5 ? "warn" : "error",
      icon:     data.payment_mismatch_count === 0 ? CheckCircle : AlertTriangle,
    },
    {
      label:    "Refund Gap",
      value:    formatCurrency(data.refund_mismatch_amount),
      detail:   "credit items vs payment_refunds table",
      severity: data.refund_mismatch_amount === 0 ? "ok" : data.refund_mismatch_amount < 10_000 ? "warn" : "error",
      icon:     data.refund_mismatch_amount === 0 ? CheckCircle : AlertTriangle,
    },
    {
      label:    "Webhook Failures",
      value:    data.webhook_failures.toLocaleString(),
      detail:   "failed gateway events (last 30 days)",
      severity: data.webhook_failures === 0 ? "ok" : data.webhook_failures < 10 ? "warn" : "error",
      icon:     data.webhook_failures === 0 ? CheckCircle : Webhook,
    },
    {
      label:    "Unmatched Items",
      value:    data.unmatched_items_count.toLocaleString(),
      detail:   "payment items with no booking link",
      severity: data.unmatched_items_count === 0 ? "ok" : "error",
      icon:     data.unmatched_items_count === 0 ? CheckCircle : XCircle,
    },
  ];

  const severityStyles = {
    ok: {
      card:  "border-green-200 dark:border-green-900/40 bg-green-50/60 dark:bg-green-950/20",
      icon:  "text-green-600 dark:text-green-400",
      value: "text-green-700 dark:text-green-300",
    },
    warn: {
      card:  "border-amber-200 dark:border-amber-900/40 bg-amber-50/60 dark:bg-amber-950/20",
      icon:  "text-amber-600 dark:text-amber-400",
      value: "text-amber-700 dark:text-amber-300",
    },
    error: {
      card:  "border-rose-200 dark:border-rose-900/40 bg-rose-50/60 dark:bg-rose-950/20",
      icon:  "text-rose-600 dark:text-rose-400",
      value: "text-rose-700 dark:text-rose-300",
    },
  };

  return (
    <div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-4">
      {alerts.map((a) => {
        const styles = severityStyles[a.severity];
        const AlertIcon = a.icon;
        return (
          <div
            key={a.label}
            className={cn("rounded-md border p-3 space-y-1.5", styles.card)}
          >
            <div className="flex items-center gap-1.5">
              <AlertIcon className={cn("h-3.5 w-3.5 shrink-0", styles.icon)} />
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                {a.label}
              </span>
            </div>
            <p className={cn("text-lg font-bold tabular-nums leading-none", styles.value)}>
              {a.value}
            </p>
            <p className="text-[10px] text-muted-foreground leading-tight">{a.detail}</p>
          </div>
        );
      })}
    </div>
  );
}
