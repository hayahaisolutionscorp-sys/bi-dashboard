"use client";

import { Activity, AlertTriangle, CalendarDays, Package, Ship, Users } from "lucide-react";
import { useLive, useSchedule, useVessels } from "@/services/bi/bi.hooks";
import { KpiCard } from "@/components/charts/kpi-card";
import { BarGraph } from "@/components/charts/bar-graph";
import { PieChart } from "@/components/charts/pie-chart";
import { TripTable, type Trip } from "@/components/tables/trip-table";
import { NoDataPlaceholder } from "@/components/charts/no-data-placeholder";
import { Header } from "@/components/ui/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function splitRoute(routeName: string) {
  const [origin, ...rest] = routeName.split(/\s+(?:-|→|to)\s+/i);
  return {
    origin: origin || routeName || "Unknown origin",
    destination: rest.join(" - ") || "Unknown destination",
  };
}

function formatDeparture(value?: string) {
  if (!value) return "No schedule";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function mapStatusColor(status: string) {
  const normalized = status.toLowerCase();
  if (normalized.includes("cancel")) return "bg-red-500";
  if (normalized.includes("delay")) return "bg-orange-500";
  if (normalized.includes("depart") || normalized.includes("complete")) return "bg-green-500";
  if (normalized.includes("board") || normalized.includes("schedule")) return "bg-blue-500";
  return "bg-slate-500";
}

function mapTripRisk(scheduledDeparture: string, status: string) {
  const normalized = status.toLowerCase();
  if (normalized.includes("cancel") || normalized.includes("delay")) {
    return {
      risk: "High",
      riskColor: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    };
  }

  const departure = new Date(scheduledDeparture);
  if (!Number.isNaN(departure.getTime())) {
    const hoursUntilDeparture = (departure.getTime() - Date.now()) / 36e5;
    if (hoursUntilDeparture < 0 && !normalized.includes("depart") && !normalized.includes("complete")) {
      return {
        risk: "Watch",
        riskColor: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
      };
    }
  }

  return {
    risk: "Normal",
    riskColor: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  };
}

export default function TripOperationsPage() {
  const { data: schedule, isLoading: scheduleLoading, error: scheduleError } = useSchedule();
  const { data: live, isLoading: liveLoading, error: liveError } = useLive();
  const { data: vessels, isLoading: vesselsLoading, error: vesselsError } = useVessels();

  const summary = schedule?.summary;
  const activeTrips = live?.trips ?? [];
  const vesselRows = vessels?.breakdown ?? [];
  const isLoading = scheduleLoading || liveLoading || vesselsLoading;
  const error = scheduleError || liveError || vesselsError;

  const dailyTrips = (schedule?.trends ?? []).map((point) => ({
    name: point.date,
    value: point.trip_count,
  }));

  const routeTripShare = (schedule?.breakdown ?? [])
    .slice()
    .sort((a, b) => b.trip_count - a.trip_count)
    .slice(0, 6)
    .map((route, index) => ({
      value: route.trip_count,
      name: route.route_name,
      itemStyle: {
        color: ["#0ea5e9", "#14b8a6", "#6366f1", "#f59e0b", "#ef4444", "#94a3b8"][index],
      },
    }));

  const vesselActivity = vesselRows
    .slice()
    .sort((a, b) => b.trip_count - a.trip_count)
    .slice(0, 8)
    .map((vessel) => ({
      name: vessel.vessel_name,
      value: vessel.trip_count,
    }));

  const tripTableItems: Trip[] = activeTrips.slice(0, 12).map((trip) => {
    const route = splitRoute(trip.route_name);
    const risk = mapTripRisk(trip.scheduled_departure, trip.status);
    return {
      id: trip.vessel_name || trip.trip_id,
      origin: route.origin,
      destination: route.destination,
      window: formatDeparture(trip.scheduled_departure),
      risk: risk.risk,
      riskColor: risk.riskColor,
      status: trip.status || "Scheduled",
      statusColor: mapStatusColor(trip.status || ""),
    };
  });

  return (
    <div className="flex min-h-full w-full max-w-[1700px] flex-1 flex-col mx-auto">
      <div className="px-8 pt-10 pb-2">
        <Header
          title="Trip Operations"
          subtitle="Live monitoring of trip scheduling, route volume, and vessel activity."
        />
      </div>

      <div className="space-y-8 px-8 pb-8 pt-6">
        {error && (
          <Card className="border-red-500/25 bg-red-500/10">
            <CardContent className="px-4 py-3 text-sm font-medium text-red-600 dark:text-red-300">
              {error}
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            title="Total Trips"
            value={scheduleLoading ? "..." : (summary?.total_trips ?? 0).toLocaleString()}
            icon={Ship}
            trend={{ value: "Live", label: "schedule", direction: "neutral" }}
          />
          <KpiCard
            title="Trips / Day"
            value={scheduleLoading ? "..." : (summary?.trips_per_day ?? 0).toFixed(1)}
            icon={CalendarDays}
            trend={{ value: "Selected", label: "period", direction: "neutral" }}
          />
          <KpiCard
            title="Avg Pax / Trip"
            value={scheduleLoading ? "..." : (summary?.avg_pax_per_trip ?? 0).toFixed(1)}
            icon={Users}
            trend={{ value: "Live", label: "demand", direction: "neutral" }}
          />
          <KpiCard
            title="Active Live Trips"
            value={liveLoading ? "..." : activeTrips.length.toLocaleString()}
            icon={Activity}
            trend={{ value: "Auto", label: "refresh", direction: "neutral" }}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {dailyTrips.length === 0 ? (
            <Card className="lg:col-span-2">
              <NoDataPlaceholder height="260px" message={isLoading ? "Loading trip schedule data" : "No trip schedule data"} />
            </Card>
          ) : (
            <BarGraph title="Daily Trips" data={dailyTrips} />
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-bold">Live Operations Health</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 text-sm">
              <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Package className="size-4" />
                  Avg cargo / trip
                </span>
                <span className="font-semibold tabular-nums">{scheduleLoading ? "..." : (summary?.avg_cargo_per_trip ?? 0).toFixed(1)}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Ship className="size-4" />
                  Reporting vessels
                </span>
                <span className="font-semibold tabular-nums">{vesselsLoading ? "..." : (vessels?.summary.total_vessels ?? vesselRows.length).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <AlertTriangle className="size-4" />
                  Watchlist trips
                </span>
                <span className="font-semibold tabular-nums">
                  {tripTableItems.filter((trip) => trip.risk !== "Normal").length}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {vesselActivity.length === 0 ? (
            <Card>
              <NoDataPlaceholder height="300px" message={isLoading ? "Loading vessel activity" : "No vessel activity data"} />
            </Card>
          ) : (
            <BarGraph title="Trips by Vessel" data={vesselActivity} />
          )}

          {routeTripShare.length === 0 ? (
            <Card>
              <NoDataPlaceholder height="300px" message={isLoading ? "Loading route distribution" : "No route distribution data"} />
            </Card>
          ) : (
            <PieChart
              title="Route Trip Distribution"
              description="Trip count by route in the selected period"
              data={routeTripShare}
              variant="donut"
              radius={["48%", "72%"]}
            />
          )}
        </div>

        {tripTableItems.length === 0 ? (
          <Card>
            <NoDataPlaceholder height="220px" message={liveLoading ? "Loading live trip monitor" : "No live trips available"} />
          </Card>
        ) : (
          <TripTable title="Live Trip Monitor" items={tripTableItems} />
        )}
      </div>
    </div>
  );
}
