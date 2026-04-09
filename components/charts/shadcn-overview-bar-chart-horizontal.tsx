"use client"

import { ChevronLeft, ChevronRight, TrendingUp } from "lucide-react"
import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from "recharts"

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

export interface ShadcnOverviewBarChartHorizontalProps {
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

const formatRevenue = (value: number) => {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
  return value.toString();
};

export function ShadcnOverviewBarChartHorizontal({
  data,
  config,
  title,
  description,
  footerLabel,
  trendValue,
  dataKey,
  labelKey,
  colorKey,
  hideYAxis = true,
  pagination,
}: ShadcnOverviewBarChartHorizontalProps) {
  return (
   <Card className="flex flex-col h-full border-none pt-2 shadow-none bg-transparent overflow-hidden">
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
            <span className="text-[10px] font-medium text-muted-foreground min-w-[3rem] w-auto text-center px-2">
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
      <CardContent className="flex flex-col flex-1 py-0 px-6 sm:px-10 min-h-0 overflow-hidden">
        <ChartContainer config={config} className="flex-1 w-full !aspect-auto min-h-0">
          <BarChart
            accessibilityLayer
            data={data}
            layout="vertical"
            margin={{
              left: 0,
              right: 16,
              top: 25,
              bottom: 10,
            }}
            barCategoryGap={30}
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
              tickFormatter={formatRevenue}
              hide={false}
            />
            <YAxis
              dataKey={labelKey}
              type="category"
              tickLine={false}
              axisLine={false}
              hide={true}
            />
            <ChartTooltip
              cursor={{ fill: "rgba(0,0,0,0.05)" }}
              content={<ChartTooltipContent />}
            />
            <Bar
              dataKey={dataKey}
              radius={4}
              barSize={20}
              minPointSize={4}
            >
              <LabelList
                dataKey={labelKey}
                position="top"
                content={(props: any) => {
                  const { x, y, value, index, fill } = props;
                  const revenueValue = data[index]?.[dataKey] ?? 0;
                  const formattedRevenue = formatRevenue(revenueValue);
                  
                  return (
                    <g>
                      <text
                        x={x}
                        y={y - 8}
                        className="fill-slate-900 dark:fill-slate-100 text-[11px] font-semibold"
                        textAnchor="start"
                      >
                        {value}{" "}
                        <tspan fill={fill} className="font-bold">
                          ({formattedRevenue})
                        </tspan>
                      </text>
                    </g>
                  );
                }}
              />
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
