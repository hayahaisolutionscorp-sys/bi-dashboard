"use client";

import { TopAgentItem } from "@/types/dashboard-widgets";
import { UserCheck } from "lucide-react";

export function TopAgentsTable({ agents }: { agents: TopAgentItem[] }) {
  if (agents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-40 text-muted-foreground text-sm gap-2">
        <UserCheck className="h-6 w-6 opacity-40" />
        <span>No agent bookings this period</span>
      </div>
    );
  }

  const maxRevenue = Math.max(...agents.map((a) => a.total_revenue), 1);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-xs text-muted-foreground uppercase tracking-wider border-b border-border">
            <th className="text-left px-4 py-2 font-medium">#</th>
            <th className="text-left px-4 py-2 font-medium">Agent</th>
            <th className="text-right px-4 py-2 font-medium">Revenue</th>
            <th className="text-right px-4 py-2 font-medium">Bookings</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {agents.map((agent, i) => {
            const barPct = (agent.total_revenue / maxRevenue) * 100;
            return (
              <tr key={agent.agent_id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 text-muted-foreground font-medium">{i + 1}</td>
                <td className="px-4 py-3">
                  <p className="font-medium leading-tight">{agent.agent_name}</p>
                  {agent.agent_email && (
                    <p className="text-xs text-muted-foreground truncate max-w-[160px]">
                      {agent.agent_email}
                    </p>
                  )}
                  <div className="mt-1 h-1 rounded-full bg-muted overflow-hidden w-24">
                    <div
                      className="h-full bg-[var(--primary)] rounded-full"
                      style={{ width: `${barPct}%` }}
                    />
                  </div>
                </td>
                <td className="px-4 py-3 text-right font-semibold tabular-nums">
                  ₱{agent.total_revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                  {agent.total_bookings.toLocaleString()}
                  <div className="text-[10px]">
                    {agent.pax_bookings}p · {agent.cargo_bookings}c
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
