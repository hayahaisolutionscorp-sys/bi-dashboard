import { Card } from "@/components/ui/card";
import { Filter, Download, MoreVertical, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Trip {
  id: string;
  origin: string;
  destination: string;
  window: string;
  risk: string;
  riskColor: string;
  status: string;
  statusColor: string;
}

export interface TripTableProps {
  title: string;
  items: Trip[];
}

export function TripTable({ title, items }: TripTableProps) {
  return (
    <Card className="rounded-xl shadow-sm overflow-hidden border">
      <div className="px-6 py-4 border-b flex items-center justify-between bg-card">
        <h4 className="font-bold text-base">{title}</h4>
        <div className="flex gap-2">
          <button className="px-3 py-1.5 text-xs font-bold border rounded-lg hover:bg-secondary transition-colors flex items-center gap-2">
            <Filter className="size-3" /> Filter
          </button>
          <button className="px-3 py-1.5 text-xs font-bold border rounded-lg hover:bg-secondary transition-colors flex items-center gap-2">
            <Download className="size-3" /> Export
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-[#f8fafc] dark:bg-secondary/20 border-b">
            <tr>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Vessel ID</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Origin Port</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Next Destination</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Arrival Window</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Risk Level</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Status</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {items.map((item, i) => (
              <tr key={i} className="hover:bg-primary/5 transition-colors cursor-pointer">
                <td className="px-6 py-4 font-bold text-sm">{item.id}</td>
                <td className="px-6 py-4 text-sm font-medium">{item.origin}</td>
                <td className="px-6 py-4 text-sm font-medium">{item.destination}</td>
                <td className="px-6 py-4 text-sm font-medium">{item.window}</td>
                <td className="px-6 py-4">
                  <span className={cn("px-2 py-1 rounded-full text-[10px] font-black uppercase", item.riskColor)}>
                    {item.risk}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-sm">
                    <span className={cn("size-2 rounded-full", item.statusColor)}></span> {item.status}
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <MoreVertical className="ml-auto text-muted-foreground size-5 hover:text-primary" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-6 py-3 bg-[#f8fafc] dark:bg-card border-t flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">Showing {items.length} of 142 trips</span>
        <div className="flex gap-1">
          <button className="size-8 rounded-lg flex items-center justify-center border bg-card hover:bg-secondary transition-colors">
            <ChevronLeft className="size-4" />
          </button>
          <button className="size-8 rounded-lg flex items-center justify-center border border-primary bg-primary text-primary-foreground font-bold text-xs">1</button>
          <button className="size-8 rounded-lg flex items-center justify-center border bg-card hover:bg-secondary transition-colors font-bold text-xs">2</button>
          <button className="size-8 rounded-lg flex items-center justify-center border bg-card hover:bg-secondary transition-colors">
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>
    </Card>
  );
}
