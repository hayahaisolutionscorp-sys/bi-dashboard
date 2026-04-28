"use client";

const fmt = (v: number) => (Math.abs(v) >= 1_000 ? `P${v.toLocaleString()}` : v.toLocaleString());

export function ExecutiveComparisonPanel({
  rows,
}: {
  rows: Array<{ label: string; current: number; lastPeriod: number; samePeriodLastYear: number; target: number }>;
}) {
  if (!rows.length) return null;

  return (
    <section className="rounded-md border border-border bg-card p-3 space-y-2">
      <div>
        <h3 className="text-xs font-semibold">Executive Comparison Panel</h3>
        <p className="text-[11px] text-muted-foreground">Last period, same period last year, and target benchmark</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border/60 text-muted-foreground">
              <th className="text-left py-1">Metric</th>
              <th className="text-right py-1">Current</th>
              <th className="text-right py-1">Last Period</th>
              <th className="text-right py-1">Last Year</th>
              <th className="text-right py-1">Target</th>
              <th className="text-right py-1">Delta to Target</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const delta = r.target > 0 ? ((r.current - r.target) / r.target) * 100 : 0;
              return (
                <tr key={r.label} className="border-b border-border/40">
                  <td className="py-1.5 font-medium">{r.label}</td>
                  <td className="py-1.5 text-right tabular-nums">{fmt(r.current)}</td>
                  <td className="py-1.5 text-right tabular-nums">{fmt(r.lastPeriod)}</td>
                  <td className="py-1.5 text-right tabular-nums">{fmt(r.samePeriodLastYear)}</td>
                  <td className="py-1.5 text-right tabular-nums">{fmt(r.target)}</td>
                  <td className={`py-1.5 text-right tabular-nums font-medium ${delta >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                    {delta >= 0 ? "+" : ""}{delta.toFixed(1)}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
