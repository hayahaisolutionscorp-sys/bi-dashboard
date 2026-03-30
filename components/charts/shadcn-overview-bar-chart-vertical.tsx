"use client"

import { ChevronLeft, ChevronRight, TrendingUp } from "lucide-react"
import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis, ResponsiveContainer } from "recharts"

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

import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"

export interface ShadcnOverviewBarChartVerticalProps {
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

// Custom tick that only applies rotation/offset on mobile/tablet if needed
const ResponsiveTick = (props: any) => {
  const { x, y, payload, isMobile } = props;
  const value = payload.value || "";
  
  if (!isMobile) {
    const words = value.split(/\s+/);
    return (
      <g transform={`translate(${x},${y})`}>
        {words.map((word: string, index: number) => (
          <text
            key={index}
            x={0}
            y={index * 12}
            dy={12}
            textAnchor="middle"
            fill="currentColor"
            className="fill-muted-foreground text-[10px] font-medium"
          >
            {word}
          </text>
        ))}
      </g>
    );
  }

  // Mobile: rotate or truncate
  const displayValue = value.length > 10 ? value.substring(0, 8) + ".." : value;
  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={0}
        y={0}
        dy={10}
        textAnchor="end"
        fill="currentColor"
        transform="rotate(-45)"
        className="fill-muted-foreground text-[9px] font-medium"
      >
        {displayValue}
      </text>
    </g>
  );
};

const formatRevenue = (value: number) => {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
  return value.toString();
};

export function ShadcnOverviewBarChartVertical({
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
}: ShadcnOverviewBarChartVerticalProps) {
  const isMobile = useIsMobile();

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
      <CardContent className={cn(
        "flex-1 pt-0",
        isMobile ? "p-2 min-h-[300px]" : "p-4 min-h-[300px]"
      )}>
        <ChartContainer config={config} className="h-full w-full">
          <BarChart
            accessibilityLayer
            data={data}
            margin={isMobile ? {
              left: 5,
              right: 5,
              top: 25,
              bottom: 40,
            } : {
              left: 32,
              right: 12,
              top: 25,
              bottom: 80,
            }}
          >
            <CartesianGrid
              vertical={false}
              strokeDasharray="3"
              stroke="#9ca3af"
              opacity={isMobile ? 0.1 : 0.3}
            />
            <XAxis
              dataKey={labelKey}
              tickLine={false}
              axisLine={false}
              interval={isMobile ? "preserveStartEnd" : 0}
              height={isMobile ? 40 : 60}
              tick={(props) => <ResponsiveTick {...props} isMobile={isMobile} />}
            />
            <YAxis 
              tickLine={false}
              axisLine={false}
              fontSize={10}
              width={isMobile ? 35 : 45}
              tickFormatter={formatRevenue}
              hide={false}
            />
            <ChartTooltip
              cursor={{ fill: "rgba(0,0,0,0.05)" }}
              content={<ChartTooltipContent />}
            />
            <Bar 
              dataKey={dataKey} 
              radius={isMobile ? [4, 4, 0, 0] : [2, 2, 0, 0]} 
              barSize={isMobile ? 20 : 24}
              fill="var(--color-total_revenue)"
              minPointSize={4}
            >
              <LabelList
                dataKey={dataKey}
                position="top"
                content={(props: any) => {
                  const { x, y, width, index, fill } = props;
                  // Vertical bar: x is left of bar. width is its width. Center it.
                  const centerX = x + width / 2;
                  const revenueValue = data[index]?.[dataKey] ?? 0;
                  const formattedRevenue = formatRevenue(revenueValue);
                  
                  return (
                    <g>
                      <text
                        x={centerX}
                        y={y - 8}
                        className="fill-slate-900 dark:fill-slate-100 text-[10px] font-semibold"
                        textAnchor="middle"
                      >
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
