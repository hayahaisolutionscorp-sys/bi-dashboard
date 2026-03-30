"use client"

import { useState, useMemo } from "react"
import { TrendingUp } from "lucide-react"
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"
import { format, parseISO, differenceInDays, startOfWeek, startOfMonth, startOfHour, startOfDay, endOfDay } from "date-fns"
import { DateRange } from "react-day-picker"

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
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

export interface ShadcnLineChartMultipleProps {
  data: any[]
  config: ChartConfig
  title?: string
  description?: string
  footerLabel?: string
  trendValue?: string
  labelKey: string
  series?: {
    dataKey: string
    color: string
    name: string
  }[]
  height?: string
  dateRange?: DateRange
  valueFormatter?: (value: number | string) => string | React.ReactNode
}

type Granularity = "daily" | "weekly" | "monthly"

export function ShadcnLineChartMultiple({
  data,
  config,
  title,
  description,
  footerLabel,
  trendValue,
  labelKey,
  series: seriesProp,
  height = "300px",
  dateRange,
  valueFormatter
}: ShadcnLineChartMultipleProps) {
  const [granularity, setGranularity] = useState<Granularity>("daily")

  // Fallback: if series is not provided, derive it from config keys
  const series = useMemo(() => {
    return seriesProp || Object.keys(config).map(key => ({
      dataKey: key,
      name: config[key].label as string,
      color: (config[key].color as string) || `var(--color-${key})`
    }));
  }, [seriesProp, config]);

  const daysDiff = useMemo(() => {
    if (!dateRange?.from || !dateRange?.to) return 0
    return differenceInDays(dateRange.to, dateRange.from)
  }, [dateRange])

  const showToggle = daysDiff > 31

  const chartData = useMemo(() => {
    if (!showToggle || granularity === "daily") return data

    const aggregated: Record<string, any> = {}

    data.forEach((item) => {
      const date = parseISO(item[labelKey])
      let key = ""
      
      if (granularity === "weekly") {
        key = format(startOfWeek(date), "yyyy-MM-dd")
      } else if (granularity === "monthly") {
        key = format(startOfMonth(date), "yyyy-MM")
      }

      if (!aggregated[key]) {
        aggregated[key] = { [labelKey]: key }
        series.forEach((s) => {
          aggregated[key][s.dataKey] = 0
        })
      }

      series.forEach((s) => {
        aggregated[key][s.dataKey] += (item[s.dataKey] || 0)
      })
    })

    return Object.values(aggregated).sort((a, b) => 
      a[labelKey].localeCompare(b[labelKey])
    )
  }, [data, granularity, labelKey, series, showToggle])

  return (
    <Card className="flex flex-col h-full border-none pt-2 shadow-none bg-transparent">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        {title ? (
          <div className="grid gap-1">
            <CardTitle className="text-base font-semibold">{title}</CardTitle>
            {description && <CardDescription className="text-xs">{description}</CardDescription>}
          </div>
        ) : (
          <div />
        )}
        
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
      
      <CardContent className="p-4 pt-0" style={{ height }}>
        <ChartContainer config={config} className="h-full w-full">
          <LineChart
            accessibilityLayer
            data={chartData}
            margin={{
              left: 12,
              right: 12,
              top: 10,
              bottom: 0,
            }}
          >
            <CartesianGrid
              vertical={false}
              strokeDasharray="3"
              stroke="#9ca3af"
              opacity={0.3}
            />
            <XAxis
              dataKey={labelKey}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                if (!value) return ""
                try {
                  const date = value.includes("-") ? parseISO(value) : new Date(value)
                  if (granularity === "monthly") return format(date, "MMM yyyy")
                  if (granularity === "weekly") return `Wk ${format(date, "w, MMM d")}`
                  return format(date, "MMM d")
                } catch(e) {
                  return value
                }
              }}
            />
            <YAxis 
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                fontSize={10}
                domain={[0, "auto"]}
                tickFormatter={(value) => {
                    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
                    if (value >= 1000) return `${(value / 1000).toFixed(1)}k`
                    return value
                }}
            />
            <ChartTooltip
              cursor={{ stroke: "rgba(0,0,0,0.1)", strokeWidth: 1 }}
              content={<ChartTooltipContent indicator="line" />}
            />
            <ChartLegend content={<ChartLegendContent />} />
            {series.map((s) => (
               <Line 
                 key={s.dataKey} 
                 dataKey={s.dataKey} 
                 type="monotone"
                 stroke={s.color} 
                 strokeWidth={2}
                 dot={{ r: 3, fill: s.color }}
                 activeDot={{ r: 5 }}
               />
            ))}
          </LineChart>
        </ChartContainer>
      </CardContent>
      
      {(trendValue || footerLabel) && (
        <CardFooter className="flex-col items-start gap-1 p-4 pt-0 text-xs mt-auto">
          {trendValue && (
            <div className="flex gap-2 leading-none font-medium">
              {trendValue} <TrendingUp className="h-3 w-3" />
            </div>
          )}
          {footerLabel && (
            <div className="leading-none text-muted-foreground">
              {footerLabel}
            </div>
          )}
        </CardFooter>
      )}
    </Card>
  )
}
