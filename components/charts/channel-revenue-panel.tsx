"use client";

import { ChannelMetric } from "@/types/overview";
import { cn } from "@/lib/utils";

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
      <div className="flex items-center justify-center h-24 text-sm text-muted-foreground">
        No channel data available
      </div>
    );
  }

  const maxNet = Math.max(...channels.map((c) => c.net_revenue), 1);

  return (
    <div className="space-y-3 p-3">
      {channels.map((c) => (
        <div key={c.channel} className="space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "inline-block h-2 w-2 rounded-full shrink-0",
                  getColor(c.channel),
                )}
              />
              <span className="text-xs font-medium">{c.channel}</span>
              <span className="text-[11px] text-muted-foreground">
                {c.booking_count.toLocaleString()} bookings
              </span>
            </div>
            <div className="flex items-center gap-3 text-right">
              <div>
                <p className="text-xs font-semibold tabular-nums">{fmtShort(c.net_revenue)}</p>
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
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all duration-500", getColor(c.channel))}
              style={{ width: `${(c.net_revenue / maxNet) * 100}%` }}
            />
          </div>
        </div>
      ))}

      {/* Revenue share summary row — always uses full dataset */}
      <div className="mt-3 pt-3 border-t border-border flex items-center gap-1 flex-wrap">
        {summaryChannels.map((c) => (
          <div key={c.channel} className="flex items-center gap-1">
            <span className={cn("inline-block h-2 w-2 rounded-full", getColor(c.channel))} />
            <span className="text-[10px] text-muted-foreground">
              {c.channel} {c.revenue_share_pct.toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
