import { Card } from "@/components/ui/card";
import { Ship, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StatusTableItem {
    name: string;
    status: string;
    statusColor: string;
    type: string;
    load: number;
    eta: string;
}

export interface StatusTableProps {
    title: string;
    items: StatusTableItem[];
}

export function StatusTable({ title, items }: StatusTableProps) {
    return (
        <Card className="rounded-xl shadow-sm overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                <h3 className="font-semibold text-sm text-slate-900 dark:text-white">{title}</h3>
                <div className="flex gap-2">
                    <button className="px-3 py-1 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Filter Status</button>
                    <button className="px-3 py-1 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Select Fleet</button>
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800/50">
                        <tr>
                            <th className="px-5 py-3 text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Vessel Name</th>
                            <th className="px-5 py-3 text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                            <th className="px-5 py-3 text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Primary Cargo</th>
                            <th className="px-5 py-3 text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Load</th>
                            <th className="px-5 py-3 text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">ETA</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {items.map((item, i) => (
                            <tr key={i} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                                <td className="px-5 py-3.5">
                                    <div className="flex items-center gap-2.5">
                                        <div className="size-7 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                                            <Ship className="size-3.5 text-primary" />
                                        </div>
                                        <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{item.name}</span>
                                    </div>
                                </td>
                                <td className="px-5 py-3.5">
                                    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide", item.statusColor)}>
                                        {item.status}
                                    </span>
                                </td>
                                <td className="px-5 py-3.5 text-xs text-slate-600 dark:text-slate-400">{item.type}</td>
                                <td className="px-5 py-3.5">
                                    <div className="flex items-center gap-2.5">
                                        <div className="flex-1 bg-slate-100 dark:bg-slate-700 rounded-full h-1.5 max-w-[80px]">
                                            <div 
                                                className="bg-primary h-1.5 rounded-full transition-all" 
                                                style={{ width: `${item.load}%` }}
                                            ></div>
                                        </div>
                                        <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 w-7 text-right">{item.load}%</span>
                                    </div>
                                </td>
                                <td className="px-5 py-3.5 text-xs font-medium text-slate-600 dark:text-slate-400 text-right">{item.eta}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/20">
                <span className="text-[11px] text-slate-400">Showing {items.length} of 86 active vessels</span>
                <div className="flex gap-1">
                    <button className="size-7 flex items-center justify-center rounded-md border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 transition-colors">
                        <ChevronLeft className="size-3.5 text-slate-500" />
                    </button>
                    <button className="size-7 flex items-center justify-center rounded-md border bg-primary text-white text-[10px] font-bold">1</button>
                    <button className="size-7 flex items-center justify-center rounded-md border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 transition-colors text-[10px] text-slate-600">2</button>
                    <button className="size-7 flex items-center justify-center rounded-md border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 transition-colors text-[10px] text-slate-600">3</button>
                    <button className="size-7 flex items-center justify-center rounded-md border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 transition-colors">
                        <ChevronRight className="size-3.5 text-slate-500" />
                    </button>
                </div>
            </div>
        </Card>
    );
}
