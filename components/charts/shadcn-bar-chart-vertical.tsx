"use client"

import { ChevronLeft, ChevronRight, TrendingUp } from "lucide-react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

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
  type ChartConfig,
} from "@/components/ui/chart"

export interface ShadcnBarChartVerticalProps {
  data: any[]
  config: ChartConfig
  title: string
  description?: string
  footerLabel?: string
  trendValue?: string
  labelKey: string
  // Optional: if provided, only these keys will be shown
  series?: {
    dataKey: string
    color: string
    name?: string
  }[]
  // Legacy support for single dataKey
  dataKey?: string
  pagination?: {
    currentPage: number
    totalPages: number
    onNext: () => void
    onPrev: () => void
  }
  minPointSize?: number
}

const VerticalTick = (props: any) => {
  const { x, y, payload } = props;
  const words = payload.value ? payload.value.split(/\s+/) : [];
  
  return (
    <g transform={`translate(${x},${y})`}>
      {words.map((word: string, index: number) => (
        <text
          key={index}
          x={0}
          y={index * 12}
          dy={10}
          textAnchor="middle"
          fill="currentColor"
          className="fill-muted-foreground text-[10px] font-medium"
        >
          {word}
        </text>
      ))}
    </g>
  );
};

export function ShadcnBarChartVertical({
  data,
  config,
  title,
  description,
  footerLabel,
  trendValue,
  dataKey,
  labelKey, 
  series: seriesProp,
  pagination,
  minPointSize,
}: ShadcnBarChartVerticalProps) {
  // Derive series from config if not provided
  const series = seriesProp || (dataKey ? [{ dataKey, color: (config[dataKey]?.color as string) || "var(--chart-1)" }] : Object.keys(config).map((key, idx) => ({
    dataKey: key,
    color: (config[key]?.color as string) || `var(--chart-${idx + 1})`
  })));

  return (
    <Card className="flex flex-col h-full border-none pt-2 shadow-none bg-transparent">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 p-4 pb-2">
        <div className="grid gap-1">
          <CardTitle className="text-base font-semibold">{title}</CardTitle>
          {description && <CardDescription className="text-xs">{description}</CardDescription>}
        </div>
        {pagination && (
          <div className="flex items-center gap-1 justify-end">
            <button
              onClick={pagination.onPrev}
              disabled={pagination.currentPage <= 0}
              className="p-1.5 rounded-md hover:bg-slate-100 disabled:opacity-30 dark:hover:bg-slate-800 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-[10px] font-medium text-muted-foreground w-12 text-center">
              {pagination.totalPages > 0 ? pagination.currentPage + 1 : 0} / {pagination.totalPages}
            </span>
            <button
              onClick={pagination.onNext}
              disabled={pagination.currentPage >= pagination.totalPages - 1}
              className="p-1.5 rounded-md hover:bg-slate-100 disabled:opacity-30 dark:hover:bg-slate-800 transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </CardHeader>
      <CardContent className="flex-1 p-4 pt-0 min-h-[350px]">
        <ChartContainer config={config} className="h-full w-full aspect-auto">
          <BarChart
            accessibilityLayer
            data={data}
            margin={{
              left: 12,
              right: 12,
              top: 10,
              bottom: 80,
            }}
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
              interval={0}
              height={60}
              tick={<VerticalTick />}
            />
            <YAxis 
              tickLine={false}
              axisLine={false}
              fontSize={10}
              tickFormatter={(value) => {
                if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
                return value;
              }}
            />
            <ChartTooltip
              cursor={{ fill: "rgba(0,0,0,0.05)" }}
              content={<ChartTooltipContent />}
            />
            {series.map((s) => (
              <Bar 
                key={s.dataKey}
                dataKey={s.dataKey} 
                fill={s.color}
                radius={[2, 2, 0, 0]} 
                barSize={Math.min(28, Math.max(8, Math.round(300 / Math.max(1, data.length * series.length))))}
                minPointSize={minPointSize ?? 0}
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
