"use client";

const fmt = (v: number) => `P${v.toLocaleString()}`;

export function TimeIntelligenceLayer({
  intraday,
  dayOfWeekText,
}: {
  intraday: { actual: number; expected: number; pacePct: number };
  dayOfWeekText: string;
}) {
  const width = Math.max(0, Math.min(100, intraday.pacePct));

  return (
    <section className="rounded-md border border-border bg-card p-3 space-y-2">
      <div>
        <h3 className="text-xs font-semibold">Time Intelligence</h3>
        <p className="text-[11px] text-muted-foreground">Intraday pace and day-of-week pattern</p>
      </div>

      <div className="rounded border border-border p-2 space-y-1">
        <p className="text-[11px] font-medium">Intraday Revenue Pace</p>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Actual {fmt(intraday.actual)}</span>
          <span>Expected {fmt(intraday.expected)}</span>
        </div>
        <div className="h-2 rounded bg-muted overflow-hidden">
          <div className={`h-full ${intraday.pacePct >= 100 ? "bg-emerald-500" : "bg-amber-500"}`} style={{ width: `${width}%` }} />
        </div>
        <p className="text-xs font-medium">{intraday.pacePct.toFixed(1)}% of expected curve</p>
      </div>

      <div className="rounded border border-border p-2">
        <p className="text-[11px] font-medium mb-1">Day-of-Week Pattern Analysis</p>
        <p className="text-xs text-muted-foreground">{dayOfWeekText}</p>
      </div>
    </section>
  );
}
