"use client";

import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import type { DecisionCard } from "@/hooks/use-executive-intelligence";
import { TinySparkline, severityClass, trendColor } from "./executive-shared";

export function ExecutiveDecisionCards({ cards }: { cards: DecisionCard[] }) {
  if (!cards.length) return null;

  return (
    <section className="grid grid-cols-1 gap-2 lg:grid-cols-5">
      {cards.map((card) => (
        <div key={card.title} className={`rounded-md border p-3 space-y-1.5 ${severityClass(card.severity)}`}>
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">{card.title}</p>
          <div className="flex items-end justify-between gap-2">
            <p className="text-lg font-bold tabular-nums">{card.value}</p>
            <span className={`text-[11px] font-medium ${trendColor(card.trend)}`}>{card.delta}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            {card.trend === "up" ? <TrendingUp className="h-3.5 w-3.5" /> : card.trend === "down" ? <TrendingDown className="h-3.5 w-3.5" /> : <Minus className="h-3.5 w-3.5" />}
            <span>{card.subtitle ?? "Monitoring"}</span>
          </div>
          <TinySparkline values={card.sparkline} />
        </div>
      ))}
    </section>
  );
}
