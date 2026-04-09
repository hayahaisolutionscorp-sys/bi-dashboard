"use client"

import { TrendingUp } from "lucide-react"
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"

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

export interface ShadcnOverviewRegularLineChartProps {
  data: any[]
  config: ChartConfig
  title: string
  description?: string
  footerLabel?: string
  trendValue?: string
  dataKey: string
  labelKey: string
  color?: string
}

export function ShadcnOverviewRegularLineChart({
  data,
  config,
  title,
  description,
  footerLabel,
  trendValue,
  dataKey,
  labelKey,
  color = "var(--chart-1)",
}: ShadcnOverviewRegularLineChartProps) {
  const isMobile = useIsMobile();
  
  return (
    <Card className="flex flex-col h-full border-none pt-2 shadow-none bg-transparent">
        <CardHeader className="grid-cols-2 items-start justify-between space-y-0">
        <div className="grid">
          <CardTitle className="text-base font-semibold">{title}</CardTitle>
          {description && <CardDescription className="text-xs">{description}</CardDescription>}
        </div>
      </CardHeader>
      <CardContent className={cn(
        "flex-1 pt-0",
        isMobile ? "p-3 min-h-[300px]" : "p-1 min-h-[200px]"
      )}>
        <ChartContainer config={config} className="h-full w-full aspect-auto">
          <LineChart
            accessibilityLayer
            data={data}
            margin={{
              left: isMobile ? 10 : 5,
              right: isMobile ? 10 : 20,
              top: isMobile ? 10 : 0,
              bottom: isMobile ? 40 : 50,
            }}
          >
            <CartesianGrid
              vertical={false}
              strokeDasharray="3"
              stroke="var(--border)"   // Tailwind gray-400
              opacity={isMobile ? 0.3 : 0.8}
            />

            <XAxis
              dataKey={labelKey}
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              fontSize={10}
              interval={isMobile ? "preserveStartEnd" : undefined}
              minTickGap={isMobile ? 20 : undefined}
              tickFormatter={(value) => {
                if (typeof value === 'string' && value.includes('-')) {
                  const parts = value.split('-');
                  if (parts.length === 3) return `${parts[1]}/${parts[2]}`;
                  if (parts.length === 2) {
                    const monthNames = ["Jan", "Feb", "March", "April", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                    const monthIdx = parseInt(parts[1]) - 1;
                    return monthNames[monthIdx] || value;
                  }
                }
                return value;
              }}
            />
            <YAxis 
              fontSize={10} 
              tickLine={false} 
              axisLine={false} 
              width={isMobile ? 40 : 50}
              tickFormatter={(value) => {
                if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
                return value;
              }}
            />
            <ChartTooltip
              cursor={{ stroke: "var(--border)", strokeWidth: 1, strokeDasharray: "4 4" }}
              content={<ChartTooltipContent />}
            />
            <Line
              dataKey={dataKey}
              type="monotone"
              stroke={color}
              strokeWidth={isMobile ? 2 : 3}
              dot={{ r: 2, fill: color, strokeWidth: 0 }}
              activeDot={{ r: isMobile ? 4 : 5, strokeWidth: 0 }}
            />
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
