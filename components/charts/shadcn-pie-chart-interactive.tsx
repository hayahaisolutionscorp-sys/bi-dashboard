"use client"

import * as React from "react"
import { Label, Pie, PieChart, Sector } from "recharts"
import type { PieSectorDataItem } from "recharts/types/polar/Pie"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartStyle,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export interface CategoryDataItem {
  name: string
  value: number
  fill?: string
}

export interface ShadcnPieChartInteractiveProps {
  data: CategoryDataItem[]
  title?: string
  description?: string
  height?: string
}

const COLORS = [
  "var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)",
  "var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)",
]

export function ShadcnPieChartInteractive({
  data,
  title = "Expenses by Category",
  description,
  height = "400px",
}: ShadcnPieChartInteractiveProps) {
  const id = "pie-interactive"
  
  // Format currency for labels and tooltips
  const fmt = (v: number) => {
    if (v >= 1_000_000) return `₱${(v / 1_000_000).toFixed(2)}M`
    if (v >= 1_000) return `₱${(v / 1_000).toFixed(0)}K`
    return `₱${v.toLocaleString()}`
  }

  // Pre-process data to add keys
  const chartData = React.useMemo(() => {
    return data.map((item) => {
      const key = item.name.toLowerCase().replace(/\s+/g, "-")
      return {
        ...item,
        key,
        fill: `var(--color-${key})`,
      }
    })
  }, [data])

  // Generate config for ChartStyle with distinct colors
  const chartConfig = React.useMemo(() => {
    const config: ChartConfig = {
      value: { label: "Amount" }
    }
    chartData.forEach((item, idx) => {
      config[item.key] = {
        label: item.name,
        color: item.fill && !item.fill.includes("var(--color-") 
          ? item.fill 
          : COLORS[idx % COLORS.length]
      }
    })
    return config
  }, [chartData])

  const [activeKey, setActiveKey] = React.useState<string>(chartData[0]?.key || "")

  const activeIndex = React.useMemo(
    () => chartData.findIndex((item) => item.key === activeKey),
    [activeKey, chartData]
  )

  const keys = React.useMemo(() => chartData.map((item) => item.key), [chartData])

  // Sync activeKey if data changes
  React.useEffect(() => {
    if (chartData.length > 0 && !keys.includes(activeKey)) {
      setActiveKey(chartData[0].key)
    }
  }, [chartData, keys, activeKey])

  if (!chartData || chartData.length === 0) {
    return (
      <Card className="flex flex-col h-full border-none pt-2 shadow-none bg-transparent">
        <CardHeader>
          <CardTitle className="text-base font-semibold">{title}</CardTitle>
          {description && <CardDescription className="text-xs">{description}</CardDescription>}
        </CardHeader>
        <CardContent className="flex items-center justify-center" style={{ height }}>
          <p className="text-sm text-muted-foreground">No data available</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card data-chart={id} className="flex flex-col border-none shadow-none bg-transparent pt-2 h-full">
      <ChartStyle id={id} config={chartConfig} />
      <CardHeader className="flex-row items-start space-y-0 pb-0">
        <div className="grid gap-1">
          <CardTitle className="text-base font-semibold">{title}</CardTitle>
          {description && (
            <CardDescription className="text-xs">{description}</CardDescription>
          )}
        </div>
        <Select value={activeKey} onValueChange={setActiveKey}>
          <SelectTrigger
            className="ml-auto h-7 w-[130px] rounded-lg pl-2.5"
            aria-label="Select a category"
          >
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent align="end" className="rounded-xl">
            {keys.map((key) => {
              const config = chartConfig[key as keyof typeof chartConfig]
              if (!config) return null

              return (
                <SelectItem
                  key={key}
                  value={key}
                  className="rounded-lg [&_span]:flex"
                >
                  <div className="flex items-center gap-2 text-xs">
                    <span
                      className="flex h-3 w-3 shrink-0 rounded-xs"
                      style={{
                        backgroundColor: `var(--color-${key})`,
                      }}
                    />
                    {config?.label}
                  </div>
                </SelectItem>
              )
            })}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="flex flex-1 justify-center pb-0" style={{ minHeight: height }}>
        <ChartContainer
          id={id}
          config={chartConfig}
          className="mx-auto aspect-square w-full max-w-[300px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="key"
              innerRadius={60}
              strokeWidth={5}
              activeIndex={activeIndex}
              activeShape={({
                outerRadius = 0,
                ...props
              }: PieSectorDataItem) => (
                <g>
                  <Sector {...props} outerRadius={outerRadius + 10} />
                  <Sector
                    {...props}
                    outerRadius={outerRadius + 25}
                    innerRadius={outerRadius + 12}
                  />
                </g>
              )}
            >
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    const currentData = chartData[activeIndex] || chartData[0]
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-2xl font-bold"
                        >
                          {fmt(currentData.value)}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-muted-foreground text-[10px]"
                        >
                          {currentData.name}
                        </tspan>
                      </text>
                    )
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
