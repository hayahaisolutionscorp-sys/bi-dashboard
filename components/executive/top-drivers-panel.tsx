"use client";

interface Item {
  label: string;
  value: number;
  deltaPct?: number;
}

const fmt = (v: number) => (Math.abs(v) >= 1_000 ? `P${v.toLocaleString()}` : v.toLocaleString());

function List({ title, items }: { title: string; items: Item[] }) {
  return (
    <div className="rounded border border-border p-2">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">{title}</p>
      <div className="space-y-1">
        {items.map((i) => (
          <div key={i.label} className="flex items-center justify-between text-xs border-b border-border/40 py-1">
            <span className="truncate max-w-[55%]">{i.label}</span>
            <span className="tabular-nums">{fmt(i.value)}</span>
            <span className={`tabular-nums ${typeof i.deltaPct === "number" && i.deltaPct < 0 ? "text-rose-600" : "text-emerald-600"}`}>
              {typeof i.deltaPct === "number" ? `${i.deltaPct >= 0 ? "+" : ""}${i.deltaPct.toFixed(1)}%` : "-"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function TopDriversPanel({
  drivers,
  detractors,
  growth,
}: {
  drivers: Item[];
  detractors: Item[];
  growth: Item[];
}) {
  return (
    <section className="rounded-md border border-border bg-card p-3 space-y-2">
      <div>
        <h3 className="text-xs font-semibold">Top Drivers</h3>
        <p className="text-[11px] text-muted-foreground">What is pushing or pulling revenue right now</p>
      </div>
      <div className="grid grid-cols-1 gap-2 xl:grid-cols-3">
        <List title="Revenue Drivers" items={drivers} />
        <List title="Revenue Detractors" items={detractors} />
        <List title="Growth Contributors" items={growth} />
      </div>
    </section>
  );
}
