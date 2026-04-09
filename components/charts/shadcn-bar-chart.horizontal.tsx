"use client"

import { ChevronLeft, ChevronRight, TrendingUp } from "lucide-react"
import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis, Cell } from "recharts"

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

export interface ShadcnBarChartHorizontalProps {
  data: any[]
  config: ChartConfig
  title: string
  description?: string
  footerLabel?: string
  trendValue?: string
  dataKey: string
  labelKey: string
  colorKey?: string
  hideYAxis?: boolean
  pagination?: {
    currentPage: number
    totalPages: number
    onNext: () => void
    onPrev: () => void
  }
}

export function ShadcnBarChartHorizontal({
  data,
  config,
  title,
  description,
  footerLabel,
  trendValue,
  dataKey,
  labelKey,
  colorKey,
  hideYAxis = false,
  pagination,
}: ShadcnBarChartHorizontalProps) {
  return (
   <Card className="flex flex-col h-full border-none pt-2 shadow-none bg-transparent">
      <CardHeader className="grid-cols-2 items-start justify-between space-y-0">
        <div className="grid">
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
            <span className="text-[10px] font-medium text-muted-foreground w-8 text-center">
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
      <CardContent className="p-0 px-2" style={{ height: "300px" }}>
        <ChartContainer config={config} className="h-full w-full">
          <BarChart
            accessibilityLayer
            data={data}
            layout="vertical"
            margin={{
              left: hideYAxis ? 0 : 32,
              right: 16,
              top: 10,
              bottom: 10,
            }}
          >
            <CartesianGrid
              vertical={false}
              strokeDasharray="3"
              stroke="var(--border)"
              opacity={0.3}
            />
            <XAxis 
              type="number" 
              dataKey={dataKey} 
              tickLine={false}
              axisLine={false}
              fontSize={10}
              tickFormatter={(value) => {
                if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
                return value;
              }}
            />
            <YAxis
              dataKey={labelKey}
              type="category"
              tickLine={false}
              axisLine={false}
              hide={hideYAxis}
              fontSize={12}
              width={hideYAxis ? 0 : 80}
              tickFormatter={(value) => value}
            />
            <ChartTooltip
              cursor={{ fill: "rgba(0,0,0,0.05)" }}
              content={<ChartTooltipContent hideLabel />}
            />
            <Bar
              dataKey={dataKey}
              radius={4}
              barSize={20}
              minPointSize={4}
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.fill || config[dataKey]?.color || `var(--chart-1)`} 
                />
              ))}
              <LabelList
                dataKey={dataKey}
                position="right"
                offset={8}
                className="fill-slate-500 dark:fill-slate-400 font-medium text-[10px]"
                formatter={(value: number) => {
                  if (value >= 1000000) return `(${(value / 1000000).toFixed(1)}M)`;
                  if (value >= 1000) return `(${(value / 1000).toFixed(0)}k)`;
                  return `(${value})`;
                }}
              />
              {hideYAxis && (
                <LabelList
                  dataKey={labelKey}
                  position="insideLeft"
                  offset={12}
                  className="fill-white font-semibold text-[10px]"
                  formatter={(value: string) => value.toUpperCase()}
                />
              )}
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
      {(trendValue || footerLabel) && (
        <CardFooter className="flex-col items-start gap-1 p-4 pt-0 text-xs">
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
