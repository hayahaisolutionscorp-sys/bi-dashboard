"use client"

import { Pie, PieChart, Cell } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

export interface ShadcnPieChartLegendProps {
  data: any[]
  config: ChartConfig
  title: string
  description?: string
  dataKey: string
  nameKey: string
  height?: string
}

export function ShadcnPieChartLegend({
  data,
  config,
  title,
  description,
  dataKey,
  nameKey,
  height = "300px"
}: ShadcnPieChartLegendProps) {
  return (
    <Card className="flex flex-col h-full border-none pt-2 shadow-none bg-transparent">
      <CardHeader className="items-start space-y-0 pb-2">
        <div className="grid gap-1">
          <CardTitle className="text-base font-semibold">{title}</CardTitle>
          {description && <CardDescription className="text-xs">{description}</CardDescription>}
        </div>
      </CardHeader>
      <CardContent className="pb-0 px-2" style={{ height }}>
        <ChartContainer
          config={config}
          className="mx-auto w-full h-full"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie 
                data={data} 
                dataKey={dataKey} 
                nameKey={nameKey}
                outerRadius={80}
                paddingAngle={2}
            >
                {data.map((entry, index) => (
                    <Cell 
                        key={`cell-${index}`} 
                        fill={config[entry[nameKey] as keyof typeof config]?.color || `var(--chart-${(index % 5) + 1})`} 
                    />
                ))}
            </Pie>
            <ChartLegend
              content={<ChartLegendContent nameKey={nameKey} />}
              className="mt-4 flex-wrap gap-2 justify-center text-[10px]"
            />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
