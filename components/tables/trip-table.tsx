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
    <Card className="rounded-xl shadow-sm overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
      <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <h4 className="font-semibold text-sm text-slate-900 dark:text-white">{title}</h4>
        <div className="flex gap-2">
          <button className="px-3 py-1 text-xs font-medium border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
            <Filter className="size-3" /> Filter
          </button>
          <button className="px-3 py-1 text-xs font-medium border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
            <Download className="size-3" /> Export
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50 dark:bg-slate-800/50">
            <tr>
              <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Vessel ID</th>
              <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Origin</th>
              <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Destination</th>
              <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Arrival Window</th>
              <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Risk</th>
              <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Status</th>
              <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {items.map((item, i) => (
              <tr key={i} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors cursor-pointer">
                <td className="px-5 py-3.5 font-semibold text-xs text-slate-800 dark:text-slate-200">{item.id}</td>
                <td className="px-5 py-3.5 text-xs text-slate-600 dark:text-slate-400">{item.origin}</td>
                <td className="px-5 py-3.5 text-xs text-slate-600 dark:text-slate-400">{item.destination}</td>
                <td className="px-5 py-3.5 text-xs text-slate-500 dark:text-slate-500">{item.window}</td>
                <td className="px-5 py-3.5">
                  <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide", item.riskColor)}>
                    {item.risk}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                    <span className={cn("size-1.5 rounded-full shrink-0", item.statusColor)}></span>
                    {item.status}
                  </div>
                </td>
                <td className="px-5 py-3.5 text-right">
                  <MoreVertical className="ml-auto text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 size-4 transition-colors" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 flex items-center justify-between">
        <span className="text-[11px] text-slate-400">Showing {items.length} of 142 trips</span>
        <div className="flex gap-1">
          <button className="size-7 rounded-md flex items-center justify-center border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 transition-colors">
            <ChevronLeft className="size-3.5 text-slate-500" />
          </button>
          <button className="size-7 rounded-md flex items-center justify-center border bg-primary text-white text-[10px] font-bold">1</button>
          <button className="size-7 rounded-md flex items-center justify-center border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 transition-colors text-[10px] text-slate-600">2</button>
          <button className="size-7 rounded-md flex items-center justify-center border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 transition-colors">
            <ChevronRight className="size-3.5 text-slate-500" />
          </button>
        </div>
      </div>
    </Card>
  );
}
