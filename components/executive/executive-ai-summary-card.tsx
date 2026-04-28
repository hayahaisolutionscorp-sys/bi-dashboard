"use client";

export function ExecutiveAISummaryCard({
  summary,
  topDriver,
  topDetractor,
  risk,
}: {
  summary: string;
  topDriver: string;
  topDetractor: string;
  risk: string;
}) {
  return (
    <section className="rounded-md border border-border bg-card p-3 space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold">AI Insight Summary</h3>
        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${risk === "High" ? "bg-rose-100 text-rose-700" : risk === "Medium" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>{risk} Risk</span>
      </div>
      <p className="text-sm leading-relaxed">{summary}</p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div className="rounded border border-border p-2">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Top Route Contributor</p>
          <p className="text-xs font-medium">{topDriver}</p>
        </div>
        <div className="rounded border border-border p-2">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Most At-Risk Route</p>
          <p className="text-xs font-medium">{topDetractor}</p>
        </div>
      </div>
    </section>
  );
}
