"use client";

import { FleetMapComponent } from "@/components/maps/fleet-map-component";
import "maplibre-gl/dist/maplibre-gl.css";




export default function FleetMapPage() {
  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <div className="flex-1 w-full relative overflow-hidden">
        <FleetMapComponent />
      </div>
    </div>
  );
}
