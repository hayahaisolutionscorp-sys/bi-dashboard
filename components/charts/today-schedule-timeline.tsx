"use client";

import { useState } from "react";
import { ScheduleTripItem } from "@/types/dashboard-widgets";
import { Clock, Ship, AlertTriangle, CheckCircle2, Navigation, ChevronLeft, ChevronRight } from "lucide-react";

const PAGE_SIZE = 5;

function statusStyle(status: string): { icon: React.ReactNode; badge: string } {
  const s = status.toLowerCase();
  if (s === "arrived" || s === "completed") return {
    icon: <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />,
    badge: "bg-green-100 dark:bg-green-950/50 text-green-700 dark:text-green-400",
  };
  if (s === "departed" || s === "onboarded") return {
    icon: <Navigation className="h-3.5 w-3.5 text-blue-500" />,
    badge: "bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400",
  };
  if (s === "cancelled") return {
    icon: <AlertTriangle className="h-3.5 w-3.5 text-rose-500" />,
    badge: "bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400",
  };
  if (s === "delayed") return {
    icon: <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />,
    badge: "bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400",
  };
  return {
    icon: <Clock className="h-3.5 w-3.5 text-muted-foreground" />,
    badge: "bg-muted text-muted-foreground",
  };
}

function utilizationColor(pct: number) {
  if (pct >= 85) return "bg-rose-500";
  if (pct >= 65) return "bg-amber-400";
  return "bg-[var(--primary)]";
}

function formatTime(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("en-PH", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Manila",
  });
}

export function TodayScheduleTimeline({ trips }: { trips: ScheduleTripItem[] }) {
  const [page, setPage] = useState(1);

  if (trips.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-40 text-muted-foreground text-sm gap-2">
        <Ship className="h-6 w-6 opacity-40" />
        <span>No trips scheduled today</span>
      </div>
    );
  }

  const totalPages = Math.ceil(trips.length / PAGE_SIZE);
  const paged = trips.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div>
      <ul className="divide-y divide-border">
        {paged.map((trip) => {
          const { icon, badge } = statusStyle(trip.status);
          const pct = trip.pax_utilization_pct;
          return (
            <li key={trip.trip_id} className="px-4 py-3 space-y-2 hover:bg-muted/30 transition-colors">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  {icon}
                  <span className="text-sm font-medium truncate">{trip.route_name}</span>
                </div>
                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded flex-shrink-0 ${badge}`}>
                  {trip.status}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Ship className="h-3 w-3" />
                  {trip.vessel_name}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatTime(trip.departure_time)}
                  {trip.arrival_time && ` – ${formatTime(trip.arrival_time)}`}
                </span>
              </div>
              {trip.pax_capacity > 0 && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Capacity</span>
                    <span className="font-medium tabular-nums">
                      {trip.pax_booked}/{trip.pax_capacity}
                      <span className="text-muted-foreground ml-1">({pct.toFixed(0)}%)</span>
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${utilizationColor(pct)}`}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-2 border-t border-border">
          <span className="text-xs text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1 rounded hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-1 rounded hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
