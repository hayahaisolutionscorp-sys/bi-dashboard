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
    <Card className="rounded-xl shadow-sm overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
      <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Voucher Eligibility Rules</h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Active validation logic for voucher codes</p>
        </div>
        <button className="bg-primary/10 text-primary px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-primary/20 transition-colors">
          Add New Rule
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50 dark:bg-slate-800/50">
            <tr>
              <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Voucher Code</th>
              <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Eligibility Type</th>
              <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Target</th>
              <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Discount Value</th>
              <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Status</th>
              <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {items.map((item, i) => (
              <tr key={i} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                <td className="px-5 py-3.5 font-semibold text-xs text-primary">{item.code}</td>
                <td className="px-5 py-3.5">
                  <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide", item.typeColor)}>
                    {item.type}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-xs text-slate-600 dark:text-slate-400">{item.target}</td>
                <td className="px-5 py-3.5 text-xs font-semibold text-teal-600 dark:text-teal-400">{item.value}</td>
                <td className="px-5 py-3.5">
                  <span className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold", item.statusColor)}>
                    <span className={cn("size-1.5 rounded-full shrink-0", item.statusDot)}></span>
                    {item.status}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-right">
                  <button className="text-slate-400 hover:text-primary transition-colors">
                    <Edit className="size-3.5" />
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
