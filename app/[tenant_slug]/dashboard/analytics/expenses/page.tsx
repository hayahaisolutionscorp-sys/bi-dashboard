"use client";

import { Receipt, AlertTriangle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { SimpleKpiCard } from "@/components/charts/simple-kpi-card";
import { BiFilterBar } from "@/components/bi-filter-bar";
import { ShadcnBarChartHorizontal } from "@/components/charts/shadcn-bar-chart.horizontal";
import { NoDataPlaceholder } from "@/components/charts/no-data-placeholder";
import { useExpenses, useReconciliation } from "@/services/bi/bi.hooks";
import { cn } from "@/lib/utils";

const fmtM = (n: number) => n >= 1_000_000 ? `₱${(n / 1_000_000).toFixed(2)}M` : `₱${n.toLocaleString()}`;

export default function ExpensesAnalyticsPage() {
  const { data: exp, isLoading: expLoading } = useExpenses();
  const { data: rec, isLoading: recLoading } = useReconciliation();

  const s    = exp?.summary;
  const rs   = rec?.summary;

  const purposeData = (exp?.trends ?? [])
    .slice().sort((a, b) => b.total - a.total)
    .map((t) => ({ label: t.purpose, amount: t.total }));

  const expenseRows = (exp?.breakdown ?? []).slice(0, 20);

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-base font-semibold">Expenses & Financials</h1>
        <BiFilterBar />
      </div>

      <section className="grid grid-cols-2 gap-3">
        <SimpleKpiCard label="Total Expenses"    value={expLoading ? "…" : fmtM(s?.total_expenses ?? 0)}         icon={Receipt}       colorClass="text-rose-500" />
        <SimpleKpiCard label="Expense Line Items" value={expLoading ? "…" : (s?.expense_line_count ?? 0).toLocaleString()} icon={Receipt} colorClass="text-muted-foreground" />
      </section>

      {/* Expenses by Purpose */}
      <section>
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          {expLoading ? (
            <div className="p-4 space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-8 w-full rounded" />)}</div>
          ) : purposeData.length === 0 ? (
            <NoDataPlaceholder height="200px" message="No expense data for selected period" />
          ) : (
            <ShadcnBarChartHorizontal data={purposeData} config={{ amount: { label: "Amount", color: "var(--chart-5)" } }} title="Expenses by Purpose" description="Total disbursement per expense category" dataKey="amount" labelKey="label" />
          )}
        </div>
      </section>

      {/* Expense Detail Table */}
      <section>
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="px-4 pt-4 pb-2">
            <h2 className="text-xs font-semibold">Expense Line Items</h2>
            <p className="text-[11px] text-muted-foreground">Latest 20 disbursement records</p>
          </div>
          {expLoading ? (
            <div className="p-4 space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full rounded" />)}</div>
          ) : expenseRows.length === 0 ? (
            <NoDataPlaceholder height="160px" message="No expense records" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">Purpose</th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">Route</th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">Vessel</th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">Teller</th>
                    <th className="px-3 py-2 text-right font-medium text-muted-foreground">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {expenseRows.map((r, i) => (
                    <tr key={i} className="border-b border-border/60 hover:bg-muted/30 transition-colors">
                      <td className="px-3 py-2 font-medium">{r.purpose}</td>
                      <td className="px-3 py-2 text-muted-foreground">{r.route_name}</td>
                      <td className="px-3 py-2 text-muted-foreground">{r.vessel_name}</td>
                      <td className="px-3 py-2 text-muted-foreground">{r.teller}</td>
                      <td className="px-3 py-2 text-right font-mono tabular-nums">{fmtM(r.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* Reconciliation Alerts */}
      <section>
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="px-4 pt-4 pb-2 flex items-center gap-2">
            <AlertTriangle className={cn("h-4 w-4", (rs?.discrepancy_count ?? 0) > 0 ? "text-rose-500" : "text-green-600")} />
            <h2 className="text-xs font-semibold">Reconciliation</h2>
          </div>
          {recLoading ? (
            <div className="p-4"><Skeleton className="h-20 w-full rounded" /></div>
          ) : !rs ? (
            <NoDataPlaceholder height="120px" message="No reconciliation data" />
          ) : (
            <div className="px-4 pb-4 grid grid-cols-3 gap-3">
              <div className="rounded-md border border-border p-3">
                <p className="text-[11px] text-muted-foreground uppercase tracking-wide mb-1">Discrepancies</p>
                <p className={cn("text-lg font-bold tabular-nums", rs.discrepancy_count > 0 ? "text-rose-500" : "text-green-600")}>{rs.discrepancy_count}</p>
              </div>
              <div className="rounded-md border border-border p-3">
                <p className="text-[11px] text-muted-foreground uppercase tracking-wide mb-1">Net Discrepancy</p>
                <p className={cn("text-lg font-bold tabular-nums", rs.net_discrepancy !== 0 ? "text-amber-500" : "text-green-600")}>{fmtM(Math.abs(rs.net_discrepancy))}</p>
              </div>
              <div className="rounded-md border border-border p-3">
                <p className="text-[11px] text-muted-foreground uppercase tracking-wide mb-1">Matched</p>
                <p className="text-lg font-bold tabular-nums text-green-600">{rs.matched} / {rs.total_bookings_checked}</p>
              </div>
            </div>
          )}
          {!recLoading && (rec?.discrepancies ?? []).length > 0 && (
            <div className="overflow-x-auto border-t border-border">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-muted/40">
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">Booking ID</th>
                    <th className="px-3 py-2 text-right font-medium text-muted-foreground">Payment Total</th>
                    <th className="px-3 py-2 text-right font-medium text-muted-foreground">Item Total</th>
                    <th className="px-3 py-2 text-right font-medium text-muted-foreground">Delta</th>
                  </tr>
                </thead>
                <tbody>
                  {rec!.discrepancies.map((d) => (
                    <tr key={d.booking_id} className="border-b border-border/60 bg-rose-50/40 dark:bg-rose-950/20">
                      <td className="px-3 py-2 font-mono text-rose-700 dark:text-rose-400">{d.booking_id}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{fmtM(d.payment_total)}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{fmtM(d.item_total)}</td>
                      <td className="px-3 py-2 text-right tabular-nums font-semibold text-rose-600">{fmtM(Math.abs(d.delta))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
