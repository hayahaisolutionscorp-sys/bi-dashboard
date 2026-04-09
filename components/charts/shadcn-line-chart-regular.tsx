import { useState, useMemo } from "react"
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"
import { format, parseISO, differenceInDays, startOfWeek, endOfWeek, startOfMonth } from "date-fns"
import { DateRange } from "react-day-picker"

import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig,
} from "@/components/ui/chart"
import { cn } from "@/lib/utils"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

export interface ShadcnLineChartRegularProps {
  /** Array of { [labelKey]: string, [dataKey]: number } */
  data: any[]
  config: ChartConfig
  title: string
  description?: string
  labelKey: string
  dataKey: string
  height?: string
  color?: string
  dateRange?: DateRange
  isCurrency?: boolean
}

type Granularity = "daily" | "weekly" | "monthly"

export function ShadcnLineChartRegular({
  data,
  config,
  title,
  description,
  labelKey,
  dataKey,
  height = "280px",
  color = "var(--chart-1)",
  dateRange,
  isCurrency = true
}: ShadcnLineChartRegularProps) {
  const [granularity, setGranularity] = useState<Granularity>("daily")

  const daysDiff = useMemo(() => {
    if (!dateRange?.from || !dateRange?.to) return 0
    return differenceInDays(dateRange.to, dateRange.from)
  }, [dateRange])

  const showToggle = daysDiff > 31

  const chartData = useMemo(() => {
    if (!showToggle || granularity === "daily") return data

    const aggregated: Record<string, any> = {}
    let skipAggregation = false;

    data.forEach((item) => {
      if (skipAggregation) return;
      
      const dateString = item[labelKey]
      if (!dateString) return;
      
      const date = (typeof dateString === 'string' && dateString.includes("-")) ? parseISO(dateString) : new Date(dateString)
      
      if (isNaN(date.getTime())) {
        skipAggregation = true;
        return;
      }
      
      let key = ""
      
      if (granularity === "weekly") {
        key = format(startOfWeek(date), "yyyy-MM-dd")
      } else if (granularity === "monthly") {
        key = format(startOfMonth(date), "yyyy-MM")
      }

      if (!aggregated[key]) {
        aggregated[key] = { [labelKey]: key, [dataKey]: 0 }
      }

      aggregated[key][dataKey] += (item[dataKey] || 0)
    })

    if (skipAggregation) return data;

    return Object.values(aggregated).sort((a, b) => 
      a[labelKey].localeCompare(b[labelKey])
    )
  }, [data, granularity, labelKey, dataKey, showToggle])

  const heightFillsCard =
    typeof height === "string" && height.trim().endsWith("%")

  return (
    <Card
      className={cn(
        "flex h-full flex-col border-none pt-2 shadow-none bg-transparent font-sans",
        heightFillsCard && "min-h-0"
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="grid gap-1">
          <CardTitle className="text-base font-semibold">{title}</CardTitle>
          {description && (
            <CardDescription className="text-xs">{description}</CardDescription>
          )}
        </div>

        {showToggle && (
          <ToggleGroup 
            type="single" 
            value={granularity} 
            onValueChange={(value) => value && setGranularity(value as Granularity)}
            className="border rounded-md p-1 bg-white/50 dark:bg-slate-900/50"
          >
            <ToggleGroupItem value="daily" className="px-2 py-1 h-7 text-[10px] data-[state=on]:bg-sky-100 data-[state=on]:text-sky-700 dark:data-[state=on]:bg-sky-900/40 dark:data-[state=on]:text-sky-400">
              Daily
            </ToggleGroupItem>
            <ToggleGroupItem value="weekly" className="px-2 py-1 h-7 text-[10px] data-[state=on]:bg-sky-100 data-[state=on]:text-sky-700 dark:data-[state=on]:bg-sky-900/40 dark:data-[state=on]:text-sky-400">
              Weekly
            </ToggleGroupItem>
            <ToggleGroupItem value="monthly" className="px-2 py-1 h-7 text-[10px] data-[state=on]:bg-sky-100 data-[state=on]:text-sky-700 dark:data-[state=on]:bg-sky-900/40 dark:data-[state=on]:text-sky-400">
              Monthly
            </ToggleGroupItem>
          </ToggleGroup>
        )}
      </CardHeader>
      <CardContent
        className={cn(
          "p-4 pt-0",
          heightFillsCard && "flex min-h-0 flex-1 flex-col"
        )}
        style={heightFillsCard ? undefined : { height }}
      >
        <ChartContainer
          config={config}
          className={cn(
            "min-h-0 w-full",
            heightFillsCard ? "h-full flex-1" : "h-full"
          )}
        >
          <LineChart
            accessibilityLayer
            data={chartData}
            margin={{ left: 12, right: 12, top: 10, bottom: 0 }}
          >
            <CartesianGrid
              vertical={false}
              strokeDasharray="3"
              stroke="var(--border)"
              opacity={0.3}
            />
            <XAxis
              dataKey={labelKey}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              fontSize={10}
              tickFormatter={(value) => {
                if (!value) return ""
                try {
                  const date = value.includes("-") ? parseISO(value) : new Date(value)
                  if (!isNaN(date.getTime())) {
                    if (granularity === "monthly") return format(date, "MMM yyyy")
                    if (granularity === "weekly") {
                      const start = startOfWeek(date)
                      const end = endOfWeek(date)
                      return `${format(start, "MMM d")} - ${format(end, "MMM d")}`
                    }
                    return format(date, "MMM d")
                  }
                } catch { /* noop */ }
                return value
              }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              fontSize={10}
              tickFormatter={(value) => {
                if (!isCurrency) return value.toLocaleString();
                if (value >= 1_000_000) return `₱${(value / 1_000_000).toFixed(1)}M`
                if (value >= 1_000) return `₱${(value / 1_000).toFixed(0)}K`
                return `₱${value}`
              }}
            />
            <ChartTooltip
              cursor={{ stroke: "rgba(0,0,0,0.1)", strokeWidth: 1 }}
              content={<ChartTooltipContent indicator="dashed" />}
            />
            <Line
              dataKey={dataKey}
              type="natural"
              stroke={config[dataKey]?.color as string || color || `var(--color-${dataKey})`}
              strokeWidth={2}
              dot={granularity === "daily" ? false : { r: 3 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
