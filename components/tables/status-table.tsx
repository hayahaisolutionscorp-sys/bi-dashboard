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
        <Card className="rounded-xl shadow-sm overflow-hidden border">
            <div className="p-6 border-b flex justify-between items-center bg-card">
                <h3 className="font-bold text-lg">{title}</h3>
                <div className="flex gap-2">
                    <button className="px-3 py-1.5 border rounded-lg text-xs font-bold hover:bg-secondary transition-colors">Filter Status</button>
                    <button className="px-3 py-1.5 border rounded-lg text-xs font-bold hover:bg-secondary transition-colors">Select Fleet</button>
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-[#f8f9fb] dark:bg-secondary/50">
                        <tr>
                            <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase">Vessel Name</th>
                            <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase">Current Status</th>
                            <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase">Primary Cargo</th>
                            <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase">Capacity Load</th>
                            <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase text-right">ETA</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {items.map((item, i) => (
                            <tr key={i} className="hover:bg-secondary/30 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="size-8 rounded bg-secondary flex items-center justify-center">
                                            <Ship className="size-4 text-primary" />
                                        </div>
                                        <span className="text-sm font-bold">{item.name}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={cn("px-2.5 py-1 rounded-full text-[10px] font-black uppercase", item.statusColor)}>
                                        {item.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm">{item.type}</td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="flex-1 bg-secondary rounded-full h-1.5 max-w-[100px]">
                                            <div 
                                                className="bg-primary h-1.5 rounded-full" 
                                                style={{ width: `${item.load}%` }}
                                            ></div>
                                        </div>
                                        <span className="text-[10px] font-bold text-muted-foreground">{item.load}%</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm font-medium text-right">{item.eta}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="p-4 border-t flex justify-between items-center bg-[#f8f9fb] dark:bg-card">
                <span className="text-xs text-muted-foreground">Showing {items.length} of 86 active vessels</span>
                <div className="flex gap-1">
                    <button className="size-8 flex items-center justify-center rounded border hover:bg-background transition-colors">
                        <ChevronLeft className="size-4" />
                    </button>
                    <button className="size-8 flex items-center justify-center rounded border bg-primary text-primary-foreground font-bold text-xs">1</button>
                    <button className="size-8 flex items-center justify-center rounded border hover:bg-background transition-colors text-xs">2</button>
                    <button className="size-8 flex items-center justify-center rounded border hover:bg-background transition-colors text-xs">3</button>
                    <button className="size-8 flex items-center justify-center rounded border hover:bg-background transition-colors">
                        <ChevronRight className="size-4" />
                    </button>
                </div>
            </div>
        </Card>
    );
}
