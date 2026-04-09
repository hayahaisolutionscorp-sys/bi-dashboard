"use client"

import { LabelList, Pie, PieChart, Cell, Tooltip } from "recharts"


import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ChartContainer, type ChartConfig } from "@/components/ui/chart"
import type { RevenueMixSubCategory, RevenueMixTypeSplit } from "@/types/sales"

const TYPE_COLORS: Record<string, string> = {
  PASSENGER: 'var(--chart-1)',
  CARGO:     'var(--chart-2)',
}
const FALLBACK_COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
]

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
interface RevenueMixTooltipProps {
  active?: boolean
  payload?: Array<{ payload: RevenueMixTypeSplit }>
  subCategories: RevenueMixSubCategory[]
}

function RevenueMixTooltip({ active, payload, subCategories }: RevenueMixTooltipProps) {
  if (!active || !payload?.length) return null

  const slice = payload[0].payload
  const matchingSubs = subCategories.filter((s) => s.payload_type === slice.type)
  const color = TYPE_COLORS[slice.type] || FALLBACK_COLORS[0]

  return (
    <div className="z-50 min-w-[180px] rounded-lg border border-border/50 bg-background px-3 py-2 text-xs shadow-xl">
      {/* Header: type + overall % */}
      <div className="mb-2 flex items-center gap-2 font-semibold text-sm">
        <span
          className="h-2.5 w-2.5 rounded-sm shrink-0"
          style={{ backgroundColor: color }}
        />
        <span className="capitalize">
          {slice.type.charAt(0) + slice.type.slice(1).toLowerCase()}
        </span>
        <span className="ml-auto text-foreground font-bold">
          {slice.percentage.toFixed(1)}%
        </span>
      </div>

      {/* Sub-category breakdown */}
      {matchingSubs.length > 0 && (
        <div className="border-t border-border/40 pt-1.5 flex flex-col gap-1">
          {matchingSubs.map((sub) => (
            <div key={sub.category} className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground truncate max-w-[130px]">
                {sub.category}
              </span>
              <span className="font-medium text-foreground shrink-0">
                {sub.count.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────
export interface ShadcnPieChartLabelListProps {
  typeSplit: RevenueMixTypeSplit[]
  subCategories: RevenueMixSubCategory[]
  title?: string
  description?: string
  height?: string
}

export function ShadcnPieChartLabelList({
  typeSplit,
  subCategories,
  title = "Revenue Mix",
  description,
  height = "300px",
}: ShadcnPieChartLabelListProps) {
  // Derive ChartConfig from the type_split so CSS vars are set
  const config: ChartConfig = typeSplit.reduce((acc, item, idx) => {
    const key = item.type.toLowerCase()
    acc[key] = {
      label: item.type.charAt(0) + item.type.slice(1).toLowerCase(),
      color: TYPE_COLORS[item.type] || FALLBACK_COLORS[idx % FALLBACK_COLORS.length],
    }
    return acc
  }, {} as ChartConfig)

  // Recharts data: add `fill` and lowercase `typeKey` used by ChartContainer vars
  const chartData = typeSplit.map((item, idx) => ({
    ...item,
    typeKey: item.type.toLowerCase(),
    fill:
      TYPE_COLORS[item.type] ||
      FALLBACK_COLORS[idx % FALLBACK_COLORS.length],
  }))

  return (
    <Card className="flex flex-col h-full border-none pt-2 shadow-none bg-transparent">
      <CardHeader className="items-start space-y-0 pb-2">
        <div className="grid gap-1">
          <CardTitle className="text-base font-semibold">{title}</CardTitle>
          {description && (
            <CardDescription className="text-xs">{description}</CardDescription>
          )}
        </div>
      </CardHeader>

      <CardContent
        className="p-4 pt-0 flex items-center justify-center"
        style={{ height }}
      >
        <ChartContainer
          config={config}
          className="h-full w-full [&_.recharts-text]:fill-background"
        >
          <PieChart>
            <Tooltip
              content={(props) => (
                <RevenueMixTooltip
                  active={props.active}
                  payload={props.payload as Array<{ payload: RevenueMixTypeSplit }>}
                  subCategories={subCategories}
                />
              )}
            />
            <Pie
              data={chartData}
              dataKey="percentage"
              nameKey="type"
              cx="50%"
              cy="50%"
              outerRadius="75%"
              paddingAngle={2}
              strokeWidth={2}
              stroke="var(--background)"
            >
              {chartData.map((entry, idx) => (
                <Cell
                  key={entry.type}
                  fill={entry.fill}
                  className="cursor-pointer outline-none focus:outline-none"
                />
              ))}
              <LabelList
                dataKey="type"
                stroke="none"
                fontSize={11}
                fontWeight={700}
                className="fill-background pointer-events-none"
                formatter={(value: string) =>
                  `${value.charAt(0) + value.slice(1).toLowerCase()}\n${
                    typeSplit.find((t) => t.type === value)?.percentage.toFixed(1) ?? ""
                  }%`
                }
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
