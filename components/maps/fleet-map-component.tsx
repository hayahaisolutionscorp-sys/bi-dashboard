"use client";

import * as React from 'react';
import { useState, useRef, useMemo } from 'react';
import MapGL, { Marker, MapRef, Source, Layer } from 'react-map-gl/maplibre';
import "maplibre-gl/dist/maplibre-gl.css";
import { Search, Layers, Plus, Minus, List, Sun, Wind, Waves, Map as MapIcon, TrendingUp, User, Package, Clock, X, Navigation, Anchor } from "lucide-react";
import { cn } from "@/lib/utils";
import * as turf from '@turf/turf';
// @ts-ignore — no type declarations for searoute-js


import { Ship } from "lucide-react";
import { VesselCreator } from "@/components/maps/vessel-creator";
import { RouteMapService, RouteMapTrip } from "@/services/route-map.service";
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
  const [loading, setLoading] = useState(true);
  const [seaRoutesData, setSeaRoutesData] = useState<Record<string, { coords: number[][]; distance_km: number }> | null>(null);

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
        const response = await RouteMapService.getRouteMapData(activeTenant.api_base_url, activeTenant.service_key);
        setApiTrips(response.trips);
      } catch (error) {
        console.error("Failed to fetch route map data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRoutes();
    
    // Optional polling for real-time updates
    const intervalId = setInterval(fetchRoutes, 60000); // 1 minute refresh
    return () => clearInterval(intervalId);
  }, [activeTenant]);

  // Map API Data to Component Structure
  const { DEFINED_ROUTES, ROUTE_LIST, apiVessels } = useMemo(() => {
    if (!apiTrips.length) return { DEFINED_ROUTES: [], ROUTE_LIST: [], apiVessels: [] };

    // Group trips by route to build the DEFINED_ROUTES list
    const routeGroups = new Map<string, RouteMapTrip[]>();
    apiTrips.forEach(trip => {
      if (!routeGroups.has(trip.route_name)) {
        routeGroups.set(trip.route_name, []);
      }
      routeGroups.get(trip.route_name)!.push(trip);
    });

    const definedRoutes = Array.from(routeGroups.entries()).map(([routeName, trips], index) => {
       const firstTrip = trips[0];
       const srcLat = firstTrip?.src_port_latitude;
       const srcLng = firstTrip?.src_port_longitude;
       const destLat = firstTrip?.dest_port_latitude;
       const destLng = firstTrip?.dest_port_longitude;

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
         // 3. Fallback to mock data
         const mockIndex = index % SERVICE_ROUTES_RAW.length;
         coords = SERVICE_ROUTES_RAW[mockIndex].coordinates;
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
               last: "N/A", // This could come from a past data aggregate if added to the API
               trend: 0 
           }
       };
    });

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
        };
     });

    return { DEFINED_ROUTES: definedRoutes, ROUTE_LIST: routeList, apiVessels: initialVessels };
  }, [apiTrips]);

  // Combine local injected vessels (from creator) with API vessels
  // Update state whenever apiVessels change, but preserve user-added ones
  React.useEffect(() => {
    setVessels(prev => {
      const userAdded = prev.filter(v => v.id.startsWith('v-user-'));
      return [...apiVessels, ...userAdded];
    });
  }, [apiVessels]);

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

  const handleAddVessel = (newVessel: any) => {
      setVessels(prev => [...prev, { ...newVessel, id: `v-user-${Date.now()}`, isArrived: false, position: null }]);
  };

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
    setShowAllRoutes(false); // Disable "show all" when selecting a specific route
    
    // Optional: Fly to route center or bounds
    const route = DEFINED_ROUTES.find(r => r.id === routeId);
    if (route && route.ports.length > 0) {
        // Fly to first port (usually origin Cebu) for consistency, or standard view
         mapRef.current?.flyTo({ center: [route.ports[0].lng, route.ports[0].lat], zoom: 7, duration: 1500 });
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
                                    <div className="px-3 py-2 flex items-center justify-between">
                                        <div className="flex items-center gap-1.5">
                                            <User className="size-3 text-muted-foreground" />
                                            <span className="text-[10px] text-muted-foreground font-medium">{vessel.passengers}</span>
                                        </div>
                                        <span className="text-[10px] font-semibold text-blue-600">{vessel.eta}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </Marker>
                )
            ))}

        </MapGL>

      {/* Top Header Overlay - HIDDEN/COMMENTED OUT as requested */}
      {/* 
      <div className="absolute top-6 left-6 right-6 z-10 flex items-center justify-between pointer-events-none">
        
        ... buttons ...
             
      </div> 
      */}

      {/* Simplified Search Only Overlay if needed, or keeping it clean */}
       <div className="absolute top-6 left-6 right-6 z-10 flex items-start justify-between pointer-events-none">
            {/* Left Side: Vessel Creator */}
            <div className="pointer-events-auto">
                <VesselCreator routes={DEFINED_ROUTES} onAddVessel={handleAddVessel} />
            </div>

            {/* Right Side: Map Controls */}
             <div className="pointer-events-auto bg-white/90 backdrop-blur-md p-1.5 rounded-2xl flex gap-1 shadow-sm border border-white/50">
                 <button className="p-2.5 rounded-xl hover:bg-secondary text-muted-foreground transition-colors" onClick={() => mapRef.current?.zoomIn()}>
                    <Plus className="size-5" />
                 </button>
                 <button className="p-2.5 rounded-xl hover:bg-secondary text-muted-foreground transition-colors" onClick={() => mapRef.current?.zoomOut()}>
                    <Minus className="size-5" />
                 </button>
            </div>
      </div>

      {/* Right Sidebar Overlay - Routes Selection */}
      <aside className="absolute top-24 right-6 bottom-6 w-[340px] bg-white/90 backdrop-blur-md rounded-3xl flex flex-col z-10 shadow-xl shadow-blue-900/5 border border-white/50 overflow-hidden">
         <div className="p-6 border-b border-border/50">
             <div className="flex items-center justify-between mb-4">
                 <h3 className="text-base font-extrabold">Routes</h3>
                 <button 
                    onClick={() => setShowAllRoutes(!showAllRoutes)}
                    className={cn(
                        "text-[10px] font-bold px-3 py-1.5 rounded-full transition-all border",
                        showAllRoutes 
                            ? "bg-primary text-white border-primary shadow-sm" 
                            : "bg-white text-muted-foreground border-border/50 hover:bg-secondary"
                    )}
                 >
                    {showAllRoutes ? "Showing All" : "Show All Routes"}
                 </button>
             </div>
             
             {!showAllRoutes && (
                 <div className="flex items-center gap-1.5 mb-2 px-2.5 py-1 w-fit bg-emerald-100 text-emerald-700 text-[10px] font-black rounded-full border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400">
                     <span className="size-1.5 bg-emerald-500 rounded-full animate-pulse"></span> ACTIVE
                 </div>
             )}
             <p className="text-xs text-muted-foreground font-medium">Monitoring {ROUTE_LIST.length} active routes</p>
         </div>
         <div className="flex-1 overflow-y-auto p-4 space-y-3">
             {ROUTE_LIST.map((route) => {
                 const detailedRoute = DEFINED_ROUTES.find(r => r.id === route.id);
                 const isSelected = selectedRouteId === route.id && !showAllRoutes;
                 
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
                         <div className="flex gap-3">
                            <div className={cn(
                                "p-1.5 rounded-full h-fit flex items-center justify-center",
                                isSelected ? "bg-white/20" : "bg-blue-600/10"
                            )}>
                                <Ship className={cn("size-4", isSelected ? "text-white fill-white/50" : "text-blue-600 fill-blue-600/30")} />
                            </div>
                            <div>
                                <p className={cn("text-sm font-bold", isSelected ? "text-white" : "text-foreground")}>{route.name}</p>
                                
                                {isSelected && detailedRoute?.revenue ? (
                                    <div className="mt-3 space-y-2 animate-in slide-in-from-left-2 fade-in duration-300">
                                        <div className="flex items-center gap-2">
                                            <div className="bg-white/20 p-1 rounded-md">
                                                <TrendingUp className="size-3 text-white" />
                                            </div>
                                            <span className="text-[10px] font-bold text-white/90 uppercase tracking-wider">Revenue</span>
                                        </div>
                                        <div>
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-xl font-black">{detailedRoute.revenue.current}</span>
                                                 <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-white/20 text-white")}>
                                                     {detailedRoute.revenue.trend > 0 ? "+" : ""}{detailedRoute.revenue.trend}%
                                                 </span>
                                            </div>
                                            <p className="text-[10px] text-white/70 font-medium">vs {detailedRoute.revenue.last} last month</p>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{route.vessels} Vessels Assigned</p>
                                )}
                            </div>
                         </div>
                         {isSelected && <div className="size-2 rounded-full bg-white animate-pulse mt-2" />}
                     </div>
                 </div>
             )})}
         </div>
      </aside>

      {/* Bottom Right Weather Widget Overlay */}
      <div className="absolute bottom-6 right-[380px] z-10 hidden lg:block">
          <div className="bg-white/90 backdrop-blur-md rounded-2xl px-6 py-4 flex items-center gap-8 shadow-lg border border-white/50">
               <div className="flex items-center gap-3">
                   <Sun className="text-amber-400 size-6 fill-current" />
                   <div>
                       <p className="text-xs font-bold leading-none">29°C</p>
                       <p className="text-[10px] text-muted-foreground font-medium">Manila Bay</p>
                   </div>
               </div>
               <div className="w-px h-8 bg-border"></div>
               <div className="flex items-center gap-3">
                   <Waves className="text-blue-400 size-6" />
                   <div>
                       <p className="text-xs font-bold leading-none">0.8m</p>
                       <p className="text-[10px] text-muted-foreground font-medium">Swell Height</p>
                   </div>
               </div>
               <div className="w-px h-8 bg-border"></div>
               <div className="flex items-center gap-3">
                   <Wind className="text-muted-foreground size-6" />
                   <div>
                       <p className="text-xs font-bold leading-none">14 km/h</p>
                       <p className="text-[10px] text-muted-foreground font-medium">NE Wind</p>
                   </div>
               </div>
          </div>
      </div>
      
      {/* Bottom Left Legend */}
      {(
      <div className="absolute bottom-6 left-6 z-10 bg-white/90 backdrop-blur-md rounded-2xl p-4 flex flex-col gap-3 shadow-lg border border-white/50">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Map Legend</p>
          <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                  <span className="w-6 h-1 bg-primary rounded-full"></span>
                  <span className="text-xs font-semibold">Active Route</span>
              </div>
              <div className="flex items-center gap-3">
                  <span className="px-1.5 py-0.5 rounded-full text-[8px] font-black bg-blue-600 text-white border border-blue-700">EN ROUTE</span>
                  <span className="text-xs font-semibold">Departed</span>
              </div>
              <div className="flex items-center gap-3">
                  <span className="px-1.5 py-0.5 rounded-full text-[8px] font-black bg-amber-500 text-white border border-amber-600">BOARDING</span>
                  <span className="text-xs font-semibold">Onboarded</span>
              </div>
              <div className="flex items-center gap-3">
                  <span className="px-1.5 py-0.5 rounded-full text-[8px] font-black bg-slate-500 text-white border border-slate-600">PENDING</span>
                  <span className="text-xs font-semibold">Pending</span>
              </div>
              <div className="flex items-center gap-3">
                  <span className="px-1.5 py-0.5 rounded-full text-[8px] font-black bg-slate-400 text-white border border-slate-500">AWAITING</span>
                  <span className="text-xs font-semibold">Awaiting</span>
              </div>
          </div>
      </div>
      )}
    </div>
  );
}
