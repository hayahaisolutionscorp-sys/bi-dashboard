"use client";

import * as React from 'react';
import { useState, useRef, useMemo } from 'react';
import MapGL, { Marker, MapRef, Source, Layer } from 'react-map-gl/maplibre';
import { Search, Plus, Minus, TrendingUp, User, Clock, X, Navigation, Anchor } from "lucide-react";
import { cn } from "@/lib/utils";
import * as turf from '@turf/turf';
// @ts-ignore — no type declarations for searoute-js


import { Ship } from "lucide-react";

import { RouteMapService, RouteMapTrip, RouteMapRoute } from "@/services/route-map.service";
import { useTenant } from "@/components/providers/tenant-provider";

// Mock Data


import { routes as SERVICE_ROUTES_RAW } from '@/mock-data/route-service-2';

// Transform Service Data to Component Structure
const SERVICE_ROUTES = SERVICE_ROUTES_RAW.map((route, index) => {
    const coords = route.coordinates;
    const startPoint = coords[0];
    const endPoint = coords[coords.length - 1];
    
    // Attempt to infer port names from route name 
    // e.g. "Cebu - Manila" -> Start: Cebu, End: Manila
    const parts = route.route_name.split('-').map(s => s.trim());
    const startName = parts[0] ? `${parts[0]} Port` : "Origin Port";
    const endName = parts[1] ? `${parts[1]} Port` : "Destination Port";

    return {
        id: index + 1,
        name: route.route_name,
        vessels: Math.floor(Math.random() * 4) + 1, // Mock vessel count
        coords: coords,
        ports: [
            { name: startName, lat: startPoint[1], lng: startPoint[0] },
            { name: endName, lat: endPoint[1], lng: endPoint[0] }
        ],
        // Mock revenue data for UI completeness
        revenue: { 
            current: `₱${(Math.random() * 300000 + 100000).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`, 
            last: `₱${(Math.random() * 300000 + 100000).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`, 
            trend: Number((Math.random() * 20 - 5).toFixed(1)) 
        }
    };
});

const ROUTE_LIST = SERVICE_ROUTES.map(r => ({ id: r.id, name: r.name, vessels: r.vessels }));



export function FleetMapComponent() {
  const { activeTenant } = useTenant();
  const mapRef = useRef<MapRef>(null);
  const [selectedRouteId, setSelectedRouteId] = useState<number>(1); // Default to Cebu-Manila
  const [showAllRoutes, setShowAllRoutes] = useState<boolean>(false);
  
  // Vessel Animation State
  // Initial demo vessel: Cebu - Manila (ID 5: Index 4)
  const [vessels, setVessels] = useState<any[]>([]);
  const [hoveredVesselId, setHoveredVesselId] = useState<string | null>(null);
  
  const activeRouteRef = useRef<any>(null);
  const animationRef = useRef<number>(0);

  const [apiTrips, setApiTrips] = useState<RouteMapTrip[]>([]);
  const [apiRoutes, setApiRoutes] = useState<RouteMapRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [seaRoutesData, setSeaRoutesData] = useState<Record<string, { coords: number[][]; distance_km: number }> | null>(null);
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [routeSearch, setRouteSearch] = useState<string>('');

  // Keyboard shortcut: Escape → show all routes
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowAllRoutes(true);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Load pre-computed sea route waypoints
  React.useEffect(() => {
    fetch('/sea-routes.json')
      .then(r => r.json())
      .then(data => setSeaRoutesData(data))
      .catch(() => console.warn('sea-routes.json not found, using fallback routing'));
  }, []);

  // Fetch API Data
  React.useEffect(() => {
    const fetchRoutes = async () => {
      if (!activeTenant?.api_base_url) return;
      try {
        const response = await RouteMapService.getRouteMapData(activeTenant.api_base_url, activeTenant.service_key, selectedDate);
        setApiTrips(response.trips);
        setApiRoutes(response.routes ?? []);
      } catch (error) {
        console.error("Failed to fetch route map data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRoutes();
    
    // Only poll in real-time when viewing today
    if (selectedDate === todayStr) {
      const intervalId = setInterval(fetchRoutes, 60000);
      return () => clearInterval(intervalId);
    }
  }, [activeTenant, selectedDate]);

  // Map API Data to Component Structure
  const { DEFINED_ROUTES, ROUTE_LIST, apiVessels } = useMemo(() => {
    // Group trips by route (may be empty if no trips today)
    const routeGroups = new Map<string, RouteMapTrip[]>();
    apiTrips.forEach(trip => {
      if (!routeGroups.has(trip.route_name)) {
        routeGroups.set(trip.route_name, []);
      }
      routeGroups.get(trip.route_name)!.push(trip);
    });

    // Seed with all tenant-configured routes (from API) so port pins always show
    // even when there are no trips on the selected date.
    // sea-routes.json is only used for waypoints (curved paths), not for deciding which ports to show.
    apiRoutes.forEach(r => {
      if (!routeGroups.has(r.route_name)) {
        routeGroups.set(r.route_name, []);
      }
    });

    if (!routeGroups.size) return { DEFINED_ROUTES: [], ROUTE_LIST: [], apiVessels: [] };

    const definedRoutes = Array.from(routeGroups.entries()).map(([routeName, trips], index) => {
       const firstTrip = trips[0];
       // Prefer trip-level coordinates; fall back to the static route entry from the API
       const configuredRoute = apiRoutes.find(r => r.route_name === routeName);
       const srcLat  = firstTrip?.src_port_latitude  ?? configuredRoute?.src_port_latitude;
       const srcLng  = firstTrip?.src_port_longitude ?? configuredRoute?.src_port_longitude;
       const destLat = firstTrip?.dest_port_latitude  ?? configuredRoute?.dest_port_latitude;
       const destLng = firstTrip?.dest_port_longitude ?? configuredRoute?.dest_port_longitude;

       const hasRealCoords = srcLat != null && srcLng != null && destLat != null && destLng != null;

       let coords: number[][];

       // 1. Check pre-computed sea routes (from sea-routes.json loaded via seaRoutesData)
       const seaRouteMatch = seaRoutesData?.[routeName];
       if (seaRouteMatch && seaRouteMatch.coords?.length >= 2) {
         coords = seaRouteMatch.coords;
       } else if (hasRealCoords) {
         // 2. Use real port coordinates as straight line fallback
         coords = [[srcLng!, srcLat!], [destLng!, destLat!]];
       } else {
         // 3. Skip routes with no coords at all (no sea-routes.json entry and no DB coords)
         return null;
       }

       const startPoint = coords[0];
       const endPoint = coords[coords.length - 1];

       const parts = routeName.split('-').map(s => s.trim());
       const startName = parts[0] ? `${parts[0]} Port` : "Origin Port";
       const endName = parts[1] ? `${parts[1]} Port` : "Destination Port";

       // Aggregate revenue for the route based on the first trip's YTD data
       const ytdRevenue = trips[0]?.route_ytd_revenue || 0;

       // Pre-compute smoothed route for animation
       let curvedCoords: number[][];
       try {
           if (coords.length >= 3) {
               // Multi-point waypoints (from sea-routes.json or mock) — smooth with Bezier
               const curved = turf.bezierSpline(turf.lineString(coords), { resolution: 10000, sharpness: 0.85 });
               curvedCoords = curved.geometry.coordinates;
           } else {
               // 2-point straight line — use as-is (shouldn't happen with sea-routes.json)
               curvedCoords = coords;
           }
       } catch {
           curvedCoords = coords;
       }

       return {
           id: index + 1,
           name: routeName,
           vessels: trips.length,
           coords: coords,
           curvedCoords: curvedCoords,
           ports: [
               { name: startName, lat: startPoint[1], lng: startPoint[0] },
               { name: endName, lat: endPoint[1], lng: endPoint[0] }
           ],
           revenue: { 
               current: `₱${(ytdRevenue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 
               last: "N/A",
               trend: 0 
           }
       };
    }).filter((r): r is NonNullable<typeof r> => r !== null);

    const routeList = definedRoutes.map(r => ({ id: r.id, name: r.name, vessels: r.vessels }));

    // Transform trips into initial vessel positions.
    // Status rules:
    //   awaiting / pending  — not yet boarded; vessel sits at origin port (progress = 0)
    //   onboarded           — passengers boarding; vessel still at origin port (progress = 0)
    //   departed            — en route; animate from actual/scheduled departure toward destination
    //   awaiting / pending / onboarded — excluded (vessel docked, not shown on map)
    //   arrived             — excluded entirely (filtered below)
    //   cancelled           — excluded entirely (not returned by backend, but guard here too)
    const initialVessels = apiTrips
      .filter(trip => trip.status === 'departed')
      .map(trip => {
        const route = definedRoutes.find(r => r.name === trip.route_name)!;

        const scheduledDepartureMs = new Date(trip.scheduled_departure).getTime();
        const scheduledArrivalMs = trip.scheduled_arrival
          ? new Date(trip.scheduled_arrival).getTime()
          : scheduledDepartureMs + (trip.eta_minutes * 60000);
        const durationMs = scheduledArrivalMs - scheduledDepartureMs;
        const tripDurationMs = durationMs > 0 ? durationMs : (trip.eta_minutes > 0 ? trip.eta_minutes * 60000 : 3600000);

        // Use actual_departure when available (set by TMS when operator marks trip departed).
        // Fall back to scheduled_departure if actual is missing.
        // Clamp to Date.now() so elapsed is never negative (guard for future-scheduled trips).
        // For non-departed trips: far-future startTime keeps elapsed = 0 (pinned at origin).
        const isDeparted = trip.status === 'departed';
        const departureBasis = trip.actual_departure
          ? new Date(trip.actual_departure).getTime()
          : scheduledDepartureMs;
        const startTime = isDeparted
          ? Math.min(departureBasis, Date.now())
          : (Date.now() + 1e12);

        return {
            id: trip.trip_id,
            routeId: route.id,
            name: trip.vessel_name,
            origin: route.ports[0].name,
            destination: route.ports[1].name,
            passengers: `${trip.boarded_count} / ${trip.total_seats}`,
            cargo: "-",
            duration: tripDurationMs,
            startTime,
            eta: trip.eta_minutes > 0 ? (trip.eta_minutes >= 60 ? `${Math.floor(trip.eta_minutes / 60)}h ${trip.eta_minutes % 60}m` : `${trip.eta_minutes} min`) : "N/A",
            position: null,
            isArrived: false,
            tripStatus: trip.status,
            utilization: trip.total_seats > 0 ? Math.round((trip.boarded_count / trip.total_seats) * 100) : 0,
            scheduledDeparture: trip.scheduled_departure,
        };
     });

    return { DEFINED_ROUTES: definedRoutes, ROUTE_LIST: routeList, apiVessels: initialVessels };
  }, [apiTrips, apiRoutes, seaRoutesData]);

  // Sync vessels from API data
  React.useEffect(() => {
    setVessels(apiVessels);
  }, [apiVessels]);

  // Filter routes by search query
  const filteredRouteList = useMemo(() =>
    routeSearch.trim()
      ? ROUTE_LIST.filter(r => r.name.toLowerCase().includes(routeSearch.toLowerCase()))
      : ROUTE_LIST,
  [ROUTE_LIST, routeSearch]);

  // Generate curved sea routes — offset midpoint seaward so lines bow into water
  const routeGeoJSON = useMemo(() => {
    try {
        const routesToShow = showAllRoutes
            ? DEFINED_ROUTES
            : DEFINED_ROUTES.filter(r => r.id === selectedRouteId);

        const features = routesToShow.map(route => {
            const coords = route.coords;
            if (coords.length < 2) return turf.lineString(coords);

            try {
                if (coords.length >= 3) {
                    // Multi-point waypoints — smooth with Bezier
                    return turf.bezierSpline(turf.lineString(coords), { resolution: 10000, sharpness: 0.85 });
                }
                // 2-point straight line
                return turf.lineString(coords);
            } catch {
                return turf.lineString(coords);
            }
        });

        return {
            type: "FeatureCollection" as const,
            features: features
        };
    } catch (e) {
        console.error("Error generating routes", e);
        return { type: "FeatureCollection" as const, features: [] };
    }
  }, [selectedRouteId, showAllRoutes, DEFINED_ROUTES]);



  // ANIMATION LOGIC: All Vessels
  // Status-based positioning rules:
  //   awaiting  → pinned at origin (0%), label: "Awaiting departure"
  //   pending   → pinned at origin (0%), label: "Pending departure"
  //   onboarded → pinned at origin (0%), label: "Boarding passengers"
  //   departed  → animates along route based on elapsed time since scheduled_departure
  //               clamped at 99% until TMS sets status to 'arrived'
  //   arrived   → removed from map immediately
  //   cancelled → removed from map immediately
  React.useEffect(() => {
    const animate = () => {
        const now = Date.now();
        
        setVessels(prevVessels => {
            return prevVessels
                .map(v => {
                    const targetRoute = DEFINED_ROUTES.find(r => r.id === v.routeId);
                    if (!targetRoute) return v;

                    const status = v.tripStatus as string;

                    // Non-departed statuses: pin vessel at origin port with slight offset to avoid stacking
                    if (status === 'awaiting' || status === 'pending' || status === 'onboarded') {
                        const originCoords = [targetRoute.coords[0][0], targetRoute.coords[0][1]] as [number, number];
                        const destCoords = [targetRoute.coords[targetRoute.coords.length - 1][0], targetRoute.coords[targetRoute.coords.length - 1][1]] as [number, number];
                        // Face toward destination even while docked
                        const dockedBearing = turf.bearing(turf.point(originCoords), turf.point(destCoords));
                        // Offset docked vessels slightly along their route so they don't stack
                        const vesselIdx = prevVessels.filter(
                            pv => pv.routeId === v.routeId && pv.id !== v.id &&
                            ['awaiting','pending','onboarded'].includes(pv.tripStatus as string)
                        ).indexOf(v);
                        const offsetProgress = Math.min(0.03 * (vesselIdx + 1), 0.1);
                        if (offsetProgress > 0 && targetRoute.curvedCoords?.length > 2) {
                            try {
                                const line = turf.lineString(targetRoute.curvedCoords);
                                const len = turf.length(line);
                                const pt = turf.along(line, len * offsetProgress);
                                originCoords[0] = pt.geometry.coordinates[0];
                                originCoords[1] = pt.geometry.coordinates[1];
                            } catch {}
                        }
                        const etaLabel =
                            status === 'awaiting' ? 'Awaiting departure' :
                            status === 'pending'  ? 'Pending departure' :
                                                    'Boarding passengers';
                        return {
                            ...v,
                            position: originCoords,
                            bearing: dockedBearing,
                            eta: etaLabel,
                            origin: targetRoute.ports[0].name,
                            destination: targetRoute.ports[1].name,
                        };
                    }

                    // departed: animate along route from startTime
                    if (status === 'departed') {
                        const elapsed = now - v.startTime;
                        let progress = elapsed / (v.duration > 0 ? v.duration : 1);
                        if (Number.isNaN(progress)) progress = 0;
                        // Cap at 0.99 — vessel waits near destination until TMS confirms arrival
                        progress = Math.max(0, Math.min(progress, 0.99));

                        const validDuration = v.duration || 3600000;
                        const remainingMs = validDuration - elapsed;
                        const remainingMins = Math.max(0, Math.ceil(remainingMs / 60000));
                        const etaDisplay = remainingMins === 0 ? 'Waiting for arrival confirmation' : (remainingMins >= 60 ? `${Math.floor(remainingMins / 60)}h ${remainingMins % 60}m` : `${remainingMins} min`);

                        // Use curvedCoords so vessels follow the drawn Bezier route, not a straight line
                        const line = turf.lineString(targetRoute.curvedCoords || targetRoute.coords);
                        const routeLength = turf.length(line);
                        let currentDistance = routeLength * progress;
                        if (Number.isNaN(currentDistance)) currentDistance = 0;

                        const point = turf.along(line, currentDistance);
                        const coords = point.geometry.coordinates as [number, number];

                        // Calculate bearing so ship icon faces the direction of travel
                        const lookAheadDist = Math.min(currentDistance + routeLength * 0.02, routeLength);
                        const nextPoint = turf.along(line, lookAheadDist);
                        const bearing = turf.bearing(point, nextPoint);

                        return {
                            ...v,
                            position: coords,
                            bearing,
                            eta: etaDisplay,
                            origin: targetRoute.ports[0].name,
                            destination: targetRoute.ports[1].name,
                        };
                    }

                    // arrived: dock vessel at destination port, freeze it there
                    if (status === 'arrived') {
                        const destCoords = [targetRoute.coords[targetRoute.coords.length - 1][0], targetRoute.coords[targetRoute.coords.length - 1][1]] as [number, number];
                        return {
                            ...v,
                            position: destCoords,
                            eta: 'Arrived',
                            isArrived: true,
                            origin: targetRoute.ports[0].name,
                            destination: targetRoute.ports[1].name,
                        };
                    }

                    // cancelled / unknown → keep state but will be filtered below
                    return v;
                })
                // Only remove cancelled vessels; arrived stays on map docked at destination
                .filter(v => v.tripStatus !== 'cancelled');
        });

        animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
        if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [DEFINED_ROUTES]);

  const onSelectRoute = (routeId: number) => {
    setSelectedRouteId(routeId);
    setShowAllRoutes(false);
    setRouteSearch('');

    // Fly to the midpoint between origin and destination
    const route = DEFINED_ROUTES.find(r => r.id === routeId);
    if (route && route.ports.length >= 2) {
      const midLng = (route.ports[0].lng + route.ports[1].lng) / 2;
      const midLat = (route.ports[0].lat + route.ports[1].lat) / 2;
      mapRef.current?.flyTo({ center: [midLng, midLat], zoom: 7.5, duration: 1500 });
    }
  };

  const activeMarkers = useMemo(() => {
      // Show markers for all routes if showing all, otherwise just selected
      const routes = showAllRoutes 
          ? DEFINED_ROUTES 
          : DEFINED_ROUTES.filter(r => r.id === selectedRouteId);
          
      return routes.flatMap(r => r.ports);
  }, [selectedRouteId, showAllRoutes, DEFINED_ROUTES]);

  return (
    <div className="relative w-full h-full min-h-[500px] bg-[#f0f7ff] overflow-hidden rounded-xl border">
        <MapGL
            ref={mapRef}
            initialViewState={{
                longitude: 122,
                latitude: 11,
                zoom: 6
            }}
            style={{width: "100%", height: "100%"}}
            mapStyle="https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json"
            attributionControl={false}
        >
            {/* ROUTES */}
            <Source id="routes-source" type="geojson" data={routeGeoJSON}>
                <Layer
                    id="routes-layer"
                    type="line"
                    paint={{
                        "line-color": "#3f68e4",
                        "line-width": 1.5, // Thin line as requested (was 4)
                        "line-dasharray": [2, 1], 
                        "line-opacity": 0.8
                    }}
                    layout={{
                        "line-cap": "round",
                        "line-join": "round"
                    }}
                />
            </Source>
            
            {/* Markers for Route Endpoints */}
            {activeMarkers.map((port, idx) => (
                <Marker 
                    key={`${showAllRoutes ? 'all' : selectedRouteId}-${idx}`} 
                    longitude={port.lng} 
                    latitude={port.lat} 
                    anchor="bottom"
                >
                    {/* Outer div is exactly the pin icon size so anchor="bottom" aligns the pin tip to the coordinate.
                        The label floats absolutely above — it does NOT stretch the bounding box downward. */}
                    <div
                        className="relative group transition-transform hover:scale-110"
                        style={{ width: !showAllRoutes ? 32 : 22, height: !showAllRoutes ? 40 : 28 }}
                    >
                        {!showAllRoutes && <div className="absolute inset-0 bg-blue-600/20 rounded-full animate-ping" />}
                        <img
                            src="/icons/anchor-pinpoint.png"
                            alt="Port"
                            width={!showAllRoutes ? 32 : 22}
                            height={!showAllRoutes ? 40 : 28}
                            className="relative z-10 drop-shadow-lg"
                        />
                        {/* Label floats above the pin — absolutely positioned so it doesn't shift the anchor */}
                        <span className={cn(
                            "absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-0.5 bg-white/95 backdrop-blur text-[10px] font-bold rounded-md shadow-sm border transition-opacity whitespace-nowrap pointer-events-none",
                            showAllRoutes ? "opacity-0 group-hover:opacity-100" : "opacity-100"
                        )}>{port.name}</span>
                    </div>
                </Marker>
            ))}

            {/* Active Vessels Markers — filtered to selected route unless showing all */}
            {vessels.filter(v => showAllRoutes || v.routeId === selectedRouteId).map((vessel) => (
                vessel.position && (
                    <Marker 
                        key={vessel.id}
                        longitude={vessel.position[0]} 
                        latitude={vessel.position[1]}
                        anchor="center"
                    >
                        <div
                            className="relative cursor-pointer z-50"
                            onMouseEnter={() => setHoveredVesselId(vessel.id)}
                            onMouseLeave={() => setHoveredVesselId(null)}
                        >
                            {/* Vessel icon — rotated to face direction of travel */}
                            <img
                                src="/icons/ship.png"
                                alt={vessel.name}
                                width={44}
                                height={44}
                                className={cn(
                                    "relative z-20 transition-transform",
                                    hoveredVesselId === vessel.id ? "scale-110" : ""
                                )}
                                style={{
                                    transform: `rotate(${(vessel.bearing ?? 0) - 90}deg)`,
                                    transition: 'transform 1s ease-out',
                                }}
                            />

                            {/* Status badge — only visible on hover */}
                            <div className={cn(
                              "absolute -bottom-1 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wide whitespace-nowrap z-30 border transition-opacity",
                              hoveredVesselId === vessel.id ? "opacity-100" : "opacity-0 pointer-events-none",
                              vessel.tripStatus === 'departed'  ? "bg-blue-600 text-white border-blue-700" :
                              vessel.tripStatus === 'onboarded' ? "bg-amber-500 text-white border-amber-600" :
                              vessel.tripStatus === 'pending'   ? "bg-slate-500 text-white border-slate-600" :
                              vessel.tripStatus === 'arrived'   ? "bg-green-400 text-white border-green-500" :
                                                                  "bg-slate-400 text-white border-slate-500"
                            )}>
                              {vessel.tripStatus === 'departed'  ? 'EN ROUTE' :
                               vessel.tripStatus === 'onboarded' ? 'BOARDING' :
                               vessel.tripStatus === 'pending'   ? 'PENDING' :
                               vessel.tripStatus === 'arrived'   ? 'ARRIVED' :
                                                                   'AWAITING'}
                            </div>

                            {/* Pulse Effect — color by status */}
                            <div className={cn(
                              "absolute inset-2 rounded-full animate-ping opacity-20 -z-10",
                              vessel.tripStatus === 'departed'  ? "bg-blue-500" :
                              vessel.tripStatus === 'onboarded' ? "bg-amber-400" :
                              vessel.tripStatus === 'arrived'   ? "bg-green-400" :
                                                                  "bg-slate-400"
                            )}></div>

                            {/* Hover tooltip */}
                            {hoveredVesselId === vessel.id && (
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-6 w-64 bg-white rounded-xl shadow-2xl border border-border/50 overflow-hidden z-[100] animate-in fade-in slide-in-from-bottom-2 duration-200 pointer-events-none">
                                    <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-3">
                                        <h4 className="font-bold text-sm text-white leading-tight">{vessel.name}</h4>
                                        <div className="flex items-center gap-1.5 text-blue-100 text-xs mt-0.5">
                                            <span className="truncate max-w-[90px]">{vessel.origin}</span>
                                            <span className="text-white/50">→</span>
                                            <span className="truncate max-w-[90px]">{vessel.destination}</span>
                                        </div>
                                    </div>
                                    <div className="px-3 pt-2.5 pb-1">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-[10px] text-muted-foreground font-medium">Occupancy</span>
                                            <span className="text-[10px] font-bold">{vessel.passengers} ({vessel.utilization}%)</span>
                                        </div>
                                        <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                                            <div
                                                className={cn("h-full rounded-full transition-all",
                                                    vessel.utilization >= 80 ? "bg-red-500" :
                                                    vessel.utilization >= 50 ? "bg-amber-500" : "bg-emerald-500"
                                                )}
                                                style={{ width: `${vessel.utilization}%` }}
                                            />
                                        </div>
                                    </div>
                                    <div className="px-3 py-2 flex items-center justify-between border-t border-border/40 mt-1">
                                        <div className="flex items-center gap-1.5">
                                            <Clock className="size-3 text-muted-foreground" />
                                            <span className="text-[10px] text-muted-foreground">
                                                {vessel.scheduledDeparture ? new Date(vessel.scheduledDeparture).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                                            </span>
                                        </div>
                                        <span className="text-[10px] font-semibold text-blue-600">ETA: {vessel.eta}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </Marker>
                )
            ))}

        </MapGL>

      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/50 backdrop-blur-sm rounded-xl pointer-events-none">
          <div className="flex items-center gap-3 bg-white rounded-2xl px-6 py-4 shadow-xl border border-border/50">
            <div className="animate-spin text-primary"><Ship className="size-5" /></div>
            <span className="text-sm font-semibold text-muted-foreground">Loading routes…</span>
          </div>
        </div>
      )}

      {/* Right Sidebar Overlay - Routes Selection */}
      <aside className="absolute top-6 right-6 bottom-6 w-[340px] bg-white/90 backdrop-blur-md rounded-3xl flex flex-col z-10 shadow-xl shadow-blue-900/5 border border-white/50 overflow-hidden">
        {/* Sidebar Header */}
        <div className="p-5 border-b border-border/40 space-y-3">
          {/* Title + status badge row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-xl bg-primary/10">
                <Navigation className="size-4 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold leading-none">Route Monitor</h3>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {ROUTE_LIST.length} route{ROUTE_LIST.length !== 1 ? 's' : ''} · {vessels.length} vessel{vessels.length !== 1 ? 's' : ''} active
                </p>
              </div>
            </div>
            {selectedDate === todayStr ? (
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-black rounded-full border border-emerald-200">
                <span className="size-1.5 bg-emerald-500 rounded-full animate-pulse" />
                LIVE
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-100 text-amber-700 text-[10px] font-black rounded-full border border-amber-200">
                <Clock className="size-3" /> {selectedDate}
              </div>
            )}
          </div>

          {/* Date picker + zoom controls row */}
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={selectedDate}
              onChange={e => { setSelectedDate(e.target.value); setLoading(true); }}
              className="flex-1 text-xs border border-border/60 rounded-xl px-3 py-1.5 bg-white/80 focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            {selectedDate !== todayStr && (
              <button
                onClick={() => { setSelectedDate(todayStr); setLoading(true); }}
                className="text-[10px] font-bold px-2.5 py-1.5 rounded-xl bg-primary text-white hover:bg-primary/90 transition-colors whitespace-nowrap"
              >
                Today
              </button>
            )}
            <div className="flex gap-1 shrink-0">
              <button
                className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground transition-colors border border-border/40 bg-white/60"
                onClick={() => mapRef.current?.zoomIn()}
                title="Zoom in"
              >
                <Plus className="size-3.5" />
              </button>
              <button
                className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground transition-colors border border-border/40 bg-white/60"
                onClick={() => mapRef.current?.zoomOut()}
                title="Zoom out"
              >
                <Minus className="size-3.5" />
              </button>
            </div>
          </div>

          {/* Search + Show All row */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search routes…"
                value={routeSearch}
                onChange={e => setRouteSearch(e.target.value)}
                className="w-full pl-8 pr-7 py-1.5 text-xs border border-border/60 rounded-xl bg-white/80 focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              {routeSearch && (
                <button
                  onClick={() => setRouteSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-3" />
                </button>
              )}
            </div>
            <button
              onClick={() => { setShowAllRoutes(!showAllRoutes); if (!showAllRoutes) setRouteSearch(''); }}
              className={cn(
                "text-[10px] font-bold px-2.5 py-1.5 rounded-xl transition-all border whitespace-nowrap shrink-0",
                showAllRoutes
                  ? "bg-primary text-white border-primary shadow-sm"
                  : "bg-white text-muted-foreground border-border/50 hover:bg-secondary"
              )}
            >
              {showAllRoutes ? "All" : "Show All"}
            </button>
          </div>
        </div>

        {/* Route list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="border rounded-2xl p-4 animate-pulse bg-muted/30 border-border/30">
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-full bg-muted shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-muted rounded w-3/4" />
                    <div className="h-2 bg-muted rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))
          ) : filteredRouteList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Anchor className="size-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm font-semibold text-muted-foreground">
                {routeSearch ? `No routes matching "${routeSearch}"` : `No trips scheduled for ${selectedDate}`}
              </p>
              {routeSearch && (
                <button onClick={() => setRouteSearch('')} className="mt-2 text-xs text-primary underline">
                  Clear search
                </button>
              )}
            </div>
          ) : (
            filteredRouteList.map((route) => {
              const detailedRoute = DEFINED_ROUTES.find(r => r.id === route.id);
              const isSelected = selectedRouteId === route.id && !showAllRoutes;
              const activeVessels = vessels.filter(v => v.routeId === route.id && v.tripStatus === 'departed').length;

              return (
                <div
                  key={route.id}
                  className={cn(
                    "border rounded-2xl p-4 transition-all cursor-pointer group hover:shadow-md",
                    isSelected
                      ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-600/20"
                      : "bg-white/50 border-border/50 hover:bg-white text-foreground"
                  )}
                  onClick={() => onSelectRoute(route.id)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex gap-3 min-w-0">
                      <div className={cn(
                        "p-1.5 rounded-full h-fit flex items-center justify-center shrink-0",
                        isSelected ? "bg-white/20" : "bg-blue-600/10"
                      )}>
                        <Ship className={cn("size-4", isSelected ? "text-white fill-white/50" : "text-blue-600 fill-blue-600/30")} />
                      </div>
                      <div className="min-w-0">
                        <p className={cn("text-sm font-bold truncate", isSelected ? "text-white" : "text-foreground")}>{route.name}</p>

                        {isSelected && detailedRoute ? (
                          <div className="mt-3 space-y-2 animate-in slide-in-from-left-2 fade-in duration-300">
                            <div className="flex items-center gap-1.5">
                              <TrendingUp className="size-3 text-white/70" />
                              <span className="text-[10px] font-semibold text-white/70 uppercase tracking-wider">YTD Revenue</span>
                            </div>
                            <span className="text-xl font-black block">{detailedRoute.revenue.current}</span>
                            <div className="flex flex-wrap items-center gap-1.5 mt-1">
                              <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold bg-white/20 text-white">
                                <User className="size-2.5" />{route.vessels} trip{route.vessels !== 1 ? 's' : ''}
                              </span>
                              {activeVessels > 0 && (
                                <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold bg-emerald-500/30 text-emerald-100 border border-emerald-400/30">
                                  <span className="size-1.5 bg-emerald-400 rounded-full animate-pulse" />
                                  {activeVessels} en route
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-wrap items-center gap-1.5 mt-1">
                            <span className={cn("text-[10px] font-semibold", isSelected ? "text-white/70" : "text-muted-foreground")}>
                              {route.vessels} trip{route.vessels !== 1 ? 's' : ''}
                            </span>
                            {activeVessels > 0 && (
                              <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                                <span className="size-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                {activeVessels} en route
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    {isSelected && <div className="size-2 rounded-full bg-white animate-pulse mt-2 shrink-0" />}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer legend */}
        <div className="p-4 border-t border-border/40">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2.5">Legend</p>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-1.5 py-0.5 rounded-full text-[8px] font-black bg-blue-600 text-white">EN ROUTE</span>
              <span className="text-[10px] text-muted-foreground">Departed</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-1.5 py-0.5 rounded-full text-[8px] font-black bg-amber-500 text-white">BOARDING</span>
              <span className="text-[10px] text-muted-foreground">Onboarded</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-1.5 py-0.5 rounded-full text-[8px] font-black bg-slate-500 text-white">PENDING</span>
              <span className="text-[10px] text-muted-foreground">Pending</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-1.5 py-0.5 rounded-full text-[8px] font-black bg-slate-400 text-white">AWAITING</span>
              <span className="text-[10px] text-muted-foreground">Awaiting</span>
            </div>
          </div>
          {!showAllRoutes && (
            <p className="text-[10px] text-muted-foreground/50 mt-2.5">
              Press <kbd className="px-1 py-0.5 rounded bg-muted text-[9px] font-mono">Esc</kbd> to show all routes
            </p>
          )}
        </div>
      </aside>


    </div>
  );
}
