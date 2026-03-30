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
  dataKey: string
  labelKey: string
  colorKey?: string
  pagination?: {
    currentPage: number
    totalPages: number
    onNext: () => void
    onPrev: () => void
  }
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
  colorKey,
  pagination,
}: ShadcnBarChartVerticalProps) {
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
      <CardContent className="flex-1 p-4 pt-0 min-h-[300px]">
        <ChartContainer config={config} className="h-full w-full aspect-auto">
          <BarChart
            accessibilityLayer
            data={data}
            margin={{
              left: 32,
              right: 12,
              top: 10,
              bottom: 100,
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
              content={<ChartTooltipContent hideLabel />}
            />
            <Bar 
              dataKey={dataKey} 
              radius={[0, 0, 0, 0]} 
              barSize={24}
            />
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
