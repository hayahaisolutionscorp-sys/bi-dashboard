"use client";

import { RecentActivityItem } from "@/types/dashboard-widgets";
import { Anchor, Package, Users, Clock } from "lucide-react";

const SOURCE_LABELS: Record<string, string> = {
  OTC: "Counter",
  Website: "Web",
  Mobile: "App",
};

function typeIcon(type: RecentActivityItem["type"]) {
  if (type === "cargo") return <Package className="h-3.5 w-3.5" />;
  if (type === "mixed") return <Anchor className="h-3.5 w-3.5" />;
  return <Users className="h-3.5 w-3.5" />;
}

function typeColor(type: RecentActivityItem["type"]) {
  if (type === "cargo") return "text-amber-600 bg-amber-100 dark:bg-amber-950/50 dark:text-amber-400";
  if (type === "mixed") return "text-violet-600 bg-violet-100 dark:bg-violet-950/50 dark:text-violet-400";
  return "text-blue-600 bg-blue-100 dark:bg-blue-950/50 dark:text-blue-400";
}

function statusBadge(status: string) {
  const s = status.toLowerCase();
  if (s === "confirmed") return "bg-green-100 dark:bg-green-950/50 text-green-700 dark:text-green-400";
  if (s === "cancelled") return "bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400";
  return "bg-muted text-muted-foreground";
}

function timeAgo(isoStr: string) {
  const diff = Date.now() - new Date(isoStr).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return `${Math.floor(hr / 24)}d ago`;
}

export function RecentActivityFeed({ items }: { items: RecentActivityItem[] }) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-40 text-muted-foreground text-sm gap-2">
        <Clock className="h-6 w-6 opacity-40" />
        <span>No recent activity today</span>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-border">
      {items.map((item) => (
        <li key={item.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors">
          <span className={`flex-shrink-0 rounded-full p-1.5 ${typeColor(item.type)}`}>
            {typeIcon(item.type)}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-sm font-medium truncate">{item.route_name}</span>
              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${statusBadge(item.status)}`}>
                {item.status}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
              <span>{item.vessel_name}</span>
              <span>·</span>
              <span>{SOURCE_LABELS[item.source] ?? item.source}</span>
              {item.pax_count > 0 && (
                <>
                  <span>·</span>
                  <span>{item.pax_count} pax</span>
                </>
              )}
            </div>
          </div>
          <div className="flex-shrink-0 text-right">
            <p className="text-sm font-semibold tabular-nums">
              ₱{item.amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
            <p className="text-[10px] text-muted-foreground">{timeAgo(item.created_at)}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
