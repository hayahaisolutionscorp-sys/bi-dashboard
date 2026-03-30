"use client";

import * as React from "react";
import { Plus, X, Ship } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface VesselCreatorProps {
  routes: any[]; // Using any for now to avoid strict typing issues with complex route objects, can refine later
  onAddVessel: (vessel: any) => void;
}

export function VesselCreator({ routes, onAddVessel }: VesselCreatorProps) {
  const [open, setOpen] = React.useState(false);
  const [selectedRouteId, setSelectedRouteId] = React.useState<string>("");
  const [vesselName, setVesselName] = React.useState("");
  const [passengers, setPassengers] = React.useState("");
  const [cargo, setCargo] = React.useState("");
  const [duration, setDuration] = React.useState("60"); // Default 60 mins

  const handleAdd = () => {
    if (!selectedRouteId || !vesselName) return;

    const route = routes.find((r) => r.id.toString() === selectedRouteId);
    if (!route) return;

    const newVessel = {
      id: Math.random().toString(36).substr(2, 9),
      name: vesselName,
      routeId: route.id,
      routeName: route.name,
      origin: route.ports[0].name,
      destination: route.ports[1].name,
      passengers: passengers || "0 / 0",
      cargo: cargo || "0 tons",
      duration: parseInt(duration) * 60 * 1000, // Convert to ms
      startTime: Date.now(), // Start immediately
      eta: `${duration} min`, // Initial display
    };

    onAddVessel(newVessel);
    setOpen(false);
    
    // Reset form
    setVesselName("");
    setPassengers("");
    setCargo("");
    setSelectedRouteId("");
    setDuration("60");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-transparent hover:bg-transparent text-white border-none shadow-none p-0 h-auto">
          <Plus className="h-4 w-4" />
          Add Vessel
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Vessel</DialogTitle>
          <DialogDescription>
            Deploy a new vessel to a specific route.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="route">Route</Label>
            <Select onValueChange={setSelectedRouteId} value={selectedRouteId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a route" />
              </SelectTrigger>
              <SelectContent>
                {routes.map((route) => (
                  <SelectItem key={route.id} value={route.id.toString()}>
                    {route.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="name">Vessel Name</Label>
            <Input
              id="name"
              value={vesselName}
              onChange={(e) => setVesselName(e.target.value)}
              placeholder="e.g. MV SuperFerry 999"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="passengers">Passengers</Label>
              <Input
                id="passengers"
                value={passengers}
                onChange={(e) => setPassengers(e.target.value)}
                placeholder="e.g. 150 / 200"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="cargo">Cargo</Label>
              <Input
                id="cargo"
                value={cargo}
                onChange={(e) => setCargo(e.target.value)}
                placeholder="e.g. 15 tons"
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="duration">Trip Duration (minutes)</Label>
            <Input
              id="duration"
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="60"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleAdd} disabled={!selectedRouteId || !vesselName}>
            Add & Deploy
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
