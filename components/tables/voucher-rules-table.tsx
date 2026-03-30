import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Edit } from "lucide-react";

export interface VoucherRulesTableProps {
  items: {
      code: string;
      type: string;
      typeColor: string;
      target: string;
      value: string;
      status: string;
      statusColor: string;
      statusDot: string;
  }[];
}

export function VoucherRulesTable({ items }: VoucherRulesTableProps) {
  return (
    <Card className="rounded-xl shadow-sm overflow-hidden border">
      <div className="p-6 border-b flex justify-between items-center bg-card">
        <div>
          <h3 className="text-lg font-bold">Voucher Eligibility Rules</h3>
          <p className="text-xs text-muted-foreground">Active validation logic for active voucher codes</p>
        </div>
        <button className="bg-primary/10 text-primary px-4 py-2 rounded-lg text-sm font-bold hover:bg-primary/20 transition-colors">
            Add New Rule
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="text-muted-foreground text-xs uppercase font-bold tracking-wider bg-secondary/50">
              <th className="px-6 py-4">Voucher Code</th>
              <th className="px-6 py-4">Eligibility Type</th>
              <th className="px-6 py-4">Target (Cargo/Route/Pass.)</th>
              <th className="px-6 py-4">Discount Value</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {items.map((item, i) => (
              <tr key={i} className="hover:bg-secondary/50 transition-colors">
                <td className="px-6 py-4 font-bold text-primary">{item.code}</td>
                <td className="px-6 py-4">
                  <span className={cn("px-2 py-1 rounded-full text-[10px] font-bold uppercase", item.typeColor)}>
                    {item.type}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm font-medium">{item.target}</td>
                <td className="px-6 py-4 font-semibold text-teal-500">{item.value}</td>
                <td className="px-6 py-4">
                  <span className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-bold", item.statusColor)}>
                    <span className={cn("w-1.5 h-1.5 rounded-full", item.statusDot)}></span> {item.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="text-muted-foreground hover:text-primary transition-colors">
                    <Edit className="size-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
