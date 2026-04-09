"use client";

import ReactECharts from "echarts-for-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useTheme } from "next-themes";
import { useChartColors } from "@/hooks/use-chart-colors";

export interface ScatterPlotProps {
  title: string;
  data: number[][]; // [x, y, category]
}

export function ScatterPlot({ title, data }: ScatterPlotProps) {
  const { theme } = useTheme();
  const { chart: chartColors, tooltipBg, tooltipBorder, splitLine } = useChartColors();
  const isDark = theme === "dark";

  const options = {
    grid: {
      top: '10%',
      right: '5%',
      bottom: '10%',
      left: '5%',
      containLabel: true
    },
    tooltip: {
      trigger: 'item',
      backgroundColor: tooltipBg,
      borderColor: tooltipBorder,
      formatter: (params: any) => {
          return `Hour: ${params.data[0]}:00<br/>Delay: ${params.data[1]}m`;
      }
    },
    xAxis: {
      type: 'value',
      min: 0,
      max: 24,
      interval: 6,
      splitLine: {
        show: true,
        lineStyle: { type: 'dashed', color: splitLine }
      },
      axisLabel: {
          formatter: '{value}:00'
      }
    },
    yAxis: {
      type: 'value',
      name: 'Delay (m)',
      splitLine: {
        show: true,
        lineStyle: { type: 'dashed', color: splitLine }
      }
    },
    series: [
      {
        type: 'scatter',
        symbolSize: (data: number[]) => {
            return data[2] === 2 ? 15 : data[2] === 1 ? 12 : 10;
        },
        data: data.map(item => {
            return {
                value: item,
                itemStyle: {
                    color: item[2] === 2 ? '#ef4444' : item[2] === 1 ? '#fb923c' : chartColors[0],
                    shadowBlur: 10,
                    shadowColor: item[2] === 2 ? 'rgba(239, 68, 68, 0.5)' : `${chartColors[0]}33`
                }
            }
        })
      }
    ]
  };

  return (
    <Card className="shadow-sm lg:col-span-2">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base font-bold">{title}</CardTitle>
        <div className="flex gap-2">
            <span className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground uppercase"><span className="size-2 rounded-full bg-primary"></span> Minor</span>
            <span className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground uppercase"><span className="size-2 rounded-full bg-orange-400"></span> Significant</span>
            <span className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground uppercase"><span className="size-2 rounded-full bg-red-500"></span> Critical</span>
        </div>
      </CardHeader>
      <CardContent>
        <ReactECharts
          option={options}
          style={{ height: "220px", width: "100%" }}
          opts={{ renderer: "svg" }}
        />
      </CardContent>
    </Card>
  );
}
