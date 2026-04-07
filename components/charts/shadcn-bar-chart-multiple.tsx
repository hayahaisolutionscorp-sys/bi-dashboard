import { useState, useMemo, useEffect } from "react"
import { TrendingUp } from "lucide-react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { format, parseISO } from "date-fns"
import { DateRange } from "react-day-picker"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { cn } from "@/lib/utils"

export interface ShadcnBarChartMultipleProps {
  data: any[]
  config: ChartConfig
  title: string
  description?: string
  footerLabel?: string
  trendValue?: string
  labelKey: string
  series?: {
    dataKey: string
    color: string
    name: string
    yAxisId?: string
  }[]
  height?: string
  dateRange?: DateRange
  /** Bars (or x categories) per page when data length exceeds this value. */
  itemsPerPage?: number
}

export function ShadcnBarChartMultiple({
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
  itemsPerPage = 12,
}: ShadcnBarChartMultipleProps) {
  const [page, setPage] = useState(1)

  // Fallback: if series is not provided, derive it from config keys
  const series = useMemo(() => {
    return seriesProp || Object.keys(config).map(key => ({
      dataKey: key,
      name: config[key].label as string,
      color: (config[key].color as string) || `var(--color-${key})`
    }));
  }, [seriesProp, config]);

  const sortedFullData = useMemo(() => {
    return [...data].sort((a, b) =>
      String(a[labelKey] ?? "").localeCompare(String(b[labelKey] ?? ""))
    )
  }, [data, labelKey])

  const usePagination = sortedFullData.length > itemsPerPage

  const totalPages = useMemo(() => {
    if (!usePagination) return 1
    return Math.max(1, Math.ceil(sortedFullData.length / itemsPerPage))
  }, [usePagination, sortedFullData.length, itemsPerPage])

  useEffect(() => {
    setPage(1)
  }, [data, dateRange?.from, dateRange?.to, itemsPerPage])

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  const chartData = useMemo(() => {
    if (!usePagination) return data
    const start = (page - 1) * itemsPerPage
    return sortedFullData.slice(start, start + itemsPerPage)
  }, [data, usePagination, sortedFullData, page, itemsPerPage])

  const heightFillsCard =
    typeof height === "string" && height.trim().endsWith("%")

  return (
    <Card
      className={cn(
        "flex h-full flex-col border-none pt-2 shadow-none bg-transparent",
        heightFillsCard && "min-h-0"
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="grid gap-1">
          <CardTitle className="text-base font-semibold">{title}</CardTitle>
          {description && <CardDescription className="text-xs">{description}</CardDescription>}
        </div>

        {usePagination && (
          <div
            className="flex items-center gap-0.5 rounded-md border border-slate-200 bg-white/50 px-0.5 py-0.5 dark:border-slate-700 dark:bg-slate-900/50"
            role="navigation"
            aria-label="Chart pages"
          >
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0 font-mono text-sm leading-none text-slate-700 dark:text-slate-200"
              disabled={page <= 1}
              aria-label="Previous page"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              {"<"}
            </Button>
            <span className="min-w-[3.5rem] px-0.5 text-center text-[10px] font-medium tabular-nums text-slate-600 dark:text-slate-300">
              {page} / {totalPages}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0 font-mono text-sm leading-none text-slate-700 dark:text-slate-200"
              disabled={page >= totalPages}
              aria-label="Next page"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              {">"}
            </Button>
          </div>
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
          <BarChart
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
                  if (!isNaN(date.getTime())) {
                    return format(date, "MMM d")
                  }
                } catch {
                  return String(value)
                }
                return String(value || "")
              }}
            />
            <YAxis 
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                fontSize={10}
                tickFormatter={(value) => {
                    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                    if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
                    return value;
                }}
            />
            <ChartTooltip
              cursor={{ fill: "rgba(0,0,0,0.05)" }}
              content={<ChartTooltipContent indicator="dashed" />}
            />
            {series.map((s) => (
               <Bar 
                 key={s.dataKey} 
                 dataKey={s.dataKey} 
                 fill={s.color} 
                 radius={[2, 2, 0, 0]} 
                 barSize={Math.min(28, Math.max(8, Math.round(220 / Math.max(1, chartData.length))))}
               />
            ))}
          </BarChart>
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
