"use client";

import * as React from 'react';
import { useState, useRef, useMemo } from 'react';
import MapGL, { Marker, MapRef, Source, Layer } from 'react-map-gl/maplibre';
import "maplibre-gl/dist/maplibre-gl.css";
import { Search, Layers, Plus, Minus, List, Sun, Wind, Waves, Map as MapIcon, TrendingUp, User, Package, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import * as turf from '@turf/turf';


import { Ship } from "lucide-react";
import { VesselCreator } from "@/components/maps/vessel-creator";
import { RouteMapService, RouteMapTrip } from "@/services/route-map.service";

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

  // Fetch API Data
  React.useEffect(() => {
    const fetchRoutes = async () => {
      try {
        const response = await RouteMapService.getRouteMapData();
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
  }, []);

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
       // Sequentially assign the local mock coordinate data based on the index position
       const mockIndex = index % SERVICE_ROUTES_RAW.length;
       const matchingMock = SERVICE_ROUTES_RAW[mockIndex];
       
       const coords = matchingMock.coordinates;
       const startPoint = coords[0];
       const endPoint = coords[coords.length - 1];
       
       const parts = routeName.split('-').map(s => s.trim());
       const startName = parts[0] ? `${parts[0]} Port` : "Origin Port";
       const endName = parts[1] ? `${parts[1]} Port` : "Destination Port";

       // Aggregate revenue for the route based on the first trip's YTD data
       const ytdRevenue = trips[0]?.route_ytd_revenue || 0;

       return {
           id: index + 1,
           name: routeName,
           vessels: trips.length,
           coords: coords,
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

    // Transform trips into initial vessel positions based on real times, but skip already arrived ones
    const initialVessels = apiTrips
      .filter(trip => trip.status !== 'arrived')
      .map(trip => {
        const route = definedRoutes.find(r => r.name === trip.route_name)!;
        const startTimeMs = new Date(trip.scheduled_departure).getTime();
        const endTimeMs = trip.scheduled_arrival 
             ? new Date(trip.scheduled_arrival).getTime() 
             : startTimeMs + (trip.eta_minutes * 60000);
        const durationMs = endTimeMs - startTimeMs;

        return {
            id: trip.trip_id,
            routeId: route.id,
            name: trip.vessel_name,
            origin: route.ports[0].name,
            destination: route.ports[1].name,
            passengers: `${trip.boarded_count} / ${trip.total_seats}`,
            cargo: "-", // Missing from MVP API
            duration: durationMs > 0 ? durationMs : (trip.eta_minutes * 60000), 
            startTime: startTimeMs,
            eta: `${trip.eta_minutes} min`,
            position: null,
            isArrived: false
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

  // Generate curved routes
  const routeGeoJSON = useMemo(() => {
    try {
        const routesToShow = showAllRoutes 
            ? DEFINED_ROUTES 
            : DEFINED_ROUTES.filter(r => r.id === selectedRouteId);

        const features = routesToShow.map(route => {
            const line = turf.lineString(route.coords);
            const curved = turf.bezierSpline(line, { resolution: 10000, sharpness: 0.75 });
            return curved;
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
  React.useEffect(() => {
    const animate = () => {
        const now = Date.now();
        
        setVessels(prevVessels => {
            return prevVessels
                .map(v => {
                    // Initialize start time if needed
                    if (!v.startTime || v.startTime === 0) {
                         return { ...v, startTime: now };
                    }

                    if (v.isArrived) return v;

                    const targetRoute = DEFINED_ROUTES.find(r => r.id === v.routeId);
                    if (!targetRoute) return v;

                    const elapsed = now - v.startTime;
                    let progress = elapsed / (v.duration > 0 ? v.duration : 1);
                    if (Number.isNaN(progress)) progress = 0;
                    progress = Math.max(0, Math.min(progress, 1));
                    
                    if (progress >= 1) {
                        return { ...v, isArrived: true, eta: "Arrived" };
                    }

                    // Calculate ETA
                    const validDuration = v.duration || 3600000;
                    const remainingMs = validDuration - elapsed;
                    const remainingMins = Math.max(0, Math.ceil(remainingMs / 60000));
                    
                    // Calculate Position safely
                    const line = turf.lineString(targetRoute.coords);
                    const routeLength = turf.length(line);
                    let currentDistance = routeLength * progress;
                    if (Number.isNaN(currentDistance)) currentDistance = 0;
                    
                    const point = turf.along(line, currentDistance);
                    const coords = point.geometry.coordinates as [number, number];
                    
                    return {
                        ...v,
                        position: coords,
                        eta: `${remainingMins} min`,
                        origin: targetRoute.ports[0].name,
                        destination: targetRoute.ports[1].name
                    };
                })
                .filter(v => !v.isArrived); // Remove vessels once they have arrived
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
            mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
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
                    <div className="flex flex-col items-center">
                        <div 
                            className="transition-transform hover:scale-110 relative"
                            style={{
                                width: 24, // Smaller marker
                                height: 24, 
                            }}
                        >
                             {/* Custom Pin Icon */}
                             {!showAllRoutes && <div className="absolute inset-0 bg-blue-600/20 rounded-full animate-ping" />}
                             <div className="relative z-10 bg-blue-600 rounded-full p-1.5 text-white shadow-lg shadow-blue-600/40 border border-white">
                                 <MapIcon className="size-3" />
                             </div>
                        </div>
                        {/* Only show label if singular route selected to avoid clutter */}
                        {!showAllRoutes && <span className="mt-1 px-2 py-0.5 bg-white/90 backdrop-blur text-[10px] font-bold rounded-md shadow-sm border">{port.name}</span>}
                    </div>
                </Marker>
            ))}

            {/* Active Vessels Markers */}
            {vessels.map((vessel) => (
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
                            {/* Icon */}
                            <div className={cn(
                                "bg-blue-600 text-white p-2 rounded-full shadow-lg border-2 border-white transform transition-transform relative z-20",
                                hoveredVesselId === vessel.id ? "scale-125" : ""
                            )}>
                                <Ship className="size-5 bg-blue-600 fill-current" />
                            </div>
                            
                            {/* Pulse Effect */}
                            <div className="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-20 -z-10"></div>

                            {/* Detailed Popover on Hover */}
                            {hoveredVesselId === vessel.id && (
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-72 bg-white rounded-xl shadow-2xl border border-border/50 overflow-hidden z-30 animate-in fade-in slide-in-from-bottom-2 duration-200">
                                    
                                    {/* Header */}
                                    <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-4">
                                        <div className="flex items-start justify-between mb-1">
                                            <h4 className="font-bold text-base text-white leading-tight">{vessel.name}</h4>
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20 text-white border border-white/20 backdrop-blur-sm uppercase tracking-wider">On Time</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-blue-100 text-xs">
                                            <span className="truncate max-w-[100px]">{vessel.origin}</span>
                                            <span className="text-white/50">→</span>
                                            <span className="truncate max-w-[100px]">{vessel.destination}</span>
                                        </div>
                                    </div>
                                    
                                    {/* Content */}
                                    <div className="p-4 space-y-4">
                                        {/* Stats Grid */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors">
                                                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                                    <User className="size-4" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-0.5">Passengers</p>
                                                    <p className="text-sm font-bold text-slate-900">{vessel.passengers}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors">
                                                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                                                    <Package className="size-4" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-0.5">Cargo</p>
                                                    <p className="text-sm font-bold text-slate-900">{vessel.cargo}</p>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* ETA Banner */}
                                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                                            <div className="flex items-center gap-2">
                                                <Clock className="size-3.5 text-slate-400" />
                                                <span className="text-xs font-semibold text-slate-600">Est. Arrival</span>
                                            </div>
                                            <span className="text-sm font-black text-blue-600">{vessel.eta}</span>
                                        </div>
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
                 <button className="p-2.5 rounded-xl hover:bg-secondary text-muted-foreground transition-colors" title="Layers">
                    <Layers className="size-5" />
                 </button>
                 <div className="w-px h-6 bg-border my-auto mx-1"></div>
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
                                "p-2 rounded-full h-fit",
                                isSelected ? "bg-white/20 text-white" : "bg-blue-600/10 text-blue-600"
                            )}>
                                <MapIcon className="size-4" />
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
      <div className="absolute bottom-6 left-6 z-10 bg-white/90 backdrop-blur-md rounded-2xl p-4 flex flex-col gap-3 shadow-lg border border-white/50">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Map Legend</p>
          <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                  <span className="w-6 h-1 bg-primary rounded-full"></span>
                  <span className="text-xs font-semibold">Active Route</span>
              </div>
          </div>
      </div>
    </div>
  );
}
