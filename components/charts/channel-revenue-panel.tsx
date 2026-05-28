"use client";

import { ChannelMetric } from "@/types/overview";
import { cn } from "@/lib/utils";
import { BarChart3, ArrowUpRight } from "lucide-react";

interface Props {
  channels: ChannelMetric[];
  /** Full unsliced list — used for the summary row so shares are always totals */
  allChannels?: ChannelMetric[];
}

const CHANNEL_COLORS: Record<string, string> = {
  OTC:             "bg-blue-500",
  Online:          "bg-violet-500",
  OTA:             "bg-teal-500",
  "Travel Agency": "bg-amber-500",
};

function getColor(channel: string) {
  return CHANNEL_COLORS[channel] ?? "bg-slate-400";
}

export function ChannelRevenuePanel({ channels, allChannels }: Props) {
  const fmtShort = (n: number) => {
    if (n >= 1_000_000) return `₱${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000)     return `₱${(n / 1_000).toFixed(0)}K`;
    return `₱${n.toLocaleString()}`;
  };

  // Use allChannels for the summary row (so it reflects the full dataset)
  const summaryChannels = allChannels ?? channels;

  if (!channels.length) {
    return (
      <div className="flex min-h-[320px] flex-col items-center justify-center px-6 text-center">
        <div className="relative mb-5 grid size-20 place-items-center rounded-[24px] border border-primary/20 bg-primary/10 text-primary shadow-[0_0_34px_var(--glow-color)]">
          <div className="absolute inset-3 rounded-2xl bg-primary/10 blur-xl" />
          <BarChart3 className="relative size-8" />
        </div>
        <p className="text-base font-semibold tracking-tight text-foreground">No channel data available</p>
        <p className="mt-1 max-w-xs text-sm leading-6 text-muted-foreground">
          Revenue sources will appear here once bookings match the selected date range.
        </p>
      </div>
    );
  }

  const maxNet = Math.max(...channels.map((c) => c.net_revenue), 1);

  return (
    <div className="space-y-4 p-5">
      {channels.map((c) => (
        <div key={c.channel} className="rounded-2xl border border-border/55 bg-muted/20 p-4 transition-all hover:border-primary/30 hover:bg-muted/35">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "inline-block h-2 w-2 rounded-full shrink-0",
                  getColor(c.channel),
                )}
              />
              <span className="text-sm font-medium">{c.channel}</span>
              <span className="text-[11px] text-muted-foreground">
                {c.booking_count.toLocaleString()} bookings
              </span>
            </div>
            <div className="flex items-center gap-3 text-right">
              <div>
                <p className="text-sm font-semibold tabular-nums">{fmtShort(c.net_revenue)}</p>
                <p className="text-[10px] text-muted-foreground">net</p>
              </div>
              <div>
                <p className="text-xs tabular-nums text-muted-foreground">{fmtShort(c.avg_ticket_size)}</p>
                <p className="text-[10px] text-muted-foreground">avg ticket</p>
              </div>
              <div className="w-10 text-right">
                <p className="text-[11px] font-medium">{c.revenue_share_pct.toFixed(1)}%</p>
              </div>
            </div>
          </div>
          <div className="mt-3 h-2 rounded-full bg-muted overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all duration-500", getColor(c.channel))}
              style={{ width: `${(c.net_revenue / maxNet) * 100}%` }}
            />
          </div>
        </div>
      ))}

      {/* Revenue share summary row — always uses full dataset */}
      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border/60 pt-4">
        {summaryChannels.map((c) => (
          <div key={c.channel} className="flex items-center gap-1.5 rounded-full bg-muted/35 px-2.5 py-1">
            <span className={cn("inline-block h-2 w-2 rounded-full", getColor(c.channel))} />
            <span className="text-[10px] text-muted-foreground">
              {c.channel} {c.revenue_share_pct.toFixed(0)}%
            </span>
          </div>
        ))}
        <span className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-primary">
          Mix analysis <ArrowUpRight className="size-3.5" />
        </span>
      </div>
    </div>
  );
}
