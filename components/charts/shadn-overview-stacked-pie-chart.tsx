"use client"

import * as React from "react"
import { TrendingUp } from "lucide-react"
import { Pie, PieChart, Sector } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  type ChartConfig,
} from "@/components/ui/chart"

import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"

export interface ShadnOverviewStackedPieChartProps {
  innerData: any[]
  outerData: any[]
  config: ChartConfig
  title: string
  description?: string
  footerLabel?: string
  trendValue?: string
  innerDataKey: string
  outerDataKey: string
  nameKey: string
}

function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `₱${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `₱${(value / 1_000).toFixed(1)}K`
  return `₱${value.toLocaleString()}`
}

const RADIAN = Math.PI / 180

/** Renders a leader-line label outside each outer-ring slice */
function renderLeaderLabel(props: any) {
  const { cx, cy, midAngle, outerRadius, name, value, percent, fill } = props
  if (!name || percent === 0) return null

  const sin = Math.sin(-RADIAN * midAngle)
  const cos = Math.cos(-RADIAN * midAngle)
  const isRight = cos >= 0

  const sx = cx + (outerRadius + 6) * cos
  const sy = cy + (outerRadius + 6) * sin
  const mx = cx + (outerRadius + 24) * cos
  const my = cy + (outerRadius + 24) * sin
  const hLen = 28
  const ex = mx + (isRight ? hLen : -hLen)
  const ey = my

  const anchor = isRight ? "start" : "end"
  const tx = ex + (isRight ? 5 : -5)
  const pct = (percent * 100).toFixed(1)

  return (
    <g>
      <path
        d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`}
        stroke={fill}
        strokeWidth={1.5}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.9}
      />
      <circle cx={ex} cy={ey} r={2.5} fill={fill} />
      <text
        x={tx}
        y={ey - 8}
        textAnchor={anchor}
        dominantBaseline="middle"
        style={{ fontSize: "11px", fontWeight: 600, fill: "currentColor" }}
      >
        {name}
      </text>
      <text
        x={tx}
        y={ey + 8}
        textAnchor={anchor}
        dominantBaseline="middle"
        style={{ fontSize: "10px", fill, opacity: 0.85 }}
      >
        {pct}% · {formatCurrency(value)}
      </text>
    </g>
  )
}

export function ShadnOverviewStackedPieChart({
  innerData,
  outerData,
  config,
  title,
  description,
  footerLabel,
  trendValue,
  innerDataKey,
  outerDataKey,
  nameKey,
}: ShadnOverviewStackedPieChartProps) {
  const isMobile = useIsMobile()
  const [activeOuter, setActiveOuter] = React.useState<number | undefined>(undefined)

  return (
    <Card className="flex flex-col h-full border-none pt-2 shadow-none bg-transparent overflow-visible">
      <CardHeader className="items-start space-y-0 pb-1">
        <div>
          <CardTitle className="text-base font-semibold">{title}</CardTitle>
          {description && (
            <CardDescription className="text-xs mt-0.5">{description}</CardDescription>
          )}
        </div>
      </CardHeader>

      <CardContent
        className={cn(
          "flex-1 flex items-center justify-center overflow-visible p-2",
          isMobile ? "min-h-[320px]" : "min-h-[240px]"
        )}
      >
        <ChartContainer
          config={config}
          className="w-full overflow-visible"
          style={{ height: isMobile ? 320 : 260 }}
        >
          <PieChart
            margin={{
              top: isMobile ? 40 : 36,
              right: isMobile ? 90 : 80,
              bottom: isMobile ? 40 : 36,
              left: isMobile ? 90 : 80,
            }}
          >
            <ChartTooltip
              cursor={false}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null
                const data = payload[0].payload
                const breakdown = data.sourceBreakdown as
                  | { source: string; revenue: number }[]
                  | undefined
                return (
                  <div className="rounded-lg border bg-background p-2.5 shadow-md text-xs min-w-[150px]">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div
                        className="h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: data.fill }}
                      />
                      <span className="font-semibold text-foreground">{data.name}</span>
                    </div>
                    <div className="flex justify-between gap-4 text-muted-foreground">
                      <span>Total</span>
                      <span className="font-medium text-foreground">
                        ₱{data.value.toLocaleString()}
                      </span>
                    </div>
                    {breakdown && breakdown.length > 0 && (
                      <div className="mt-1.5 pt-1.5 border-t space-y-0.5">
                        {breakdown.map((s, i) => (
                          <div key={i} className="flex justify-between gap-4">
                            <span className="capitalize text-muted-foreground truncate max-w-[110px]">
                              {s.source.replace(/_/g, " ")}
                            </span>
                            <span className="font-medium shrink-0">
                              ₱{s.revenue.toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              }}
            />

            {/* Inner ring — breakdown detail, no labels */}
            <Pie
              data={innerData}
              dataKey={innerDataKey}
              nameKey={nameKey}
              innerRadius="0%"
              outerRadius="36%"
              strokeWidth={2}
              stroke="var(--background)"
            />

            {/* Outer ring — main categories with leader-line labels */}
            <Pie
              data={outerData}
              dataKey={outerDataKey}
              nameKey={nameKey}
              innerRadius="44%"
              outerRadius="62%"
              strokeWidth={2}
              stroke="var(--background)"
              label={renderLeaderLabel}
              labelLine={false}
              activeIndex={activeOuter}
              activeShape={(props: any) => (
                <Sector {...props} outerRadius={props.outerRadius + 5} />
              )}
              onMouseEnter={(_: any, idx: number) => setActiveOuter(idx)}
              onMouseLeave={() => setActiveOuter(undefined)}
            />
          </PieChart>
        </ChartContainer>
      </CardContent>

      {(footerLabel || trendValue) && (
        <CardFooter className="flex-col items-start gap-2 text-sm pt-0 pb-2 px-4">
          {trendValue && (
            <div className="flex gap-2 font-medium leading-none">
              {trendValue} <TrendingUp className="h-4 w-4" />
            </div>
          )}
          {footerLabel && (
            <div className="leading-none text-muted-foreground text-xs">{footerLabel}</div>
          )}
        </CardFooter>
      )}
    </Card>
  )
}
