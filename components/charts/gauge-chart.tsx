"use client";

import ReactECharts from "echarts-for-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTheme } from "next-themes";
import { MoreHorizontal } from "lucide-react";
import { useChartColors } from "@/hooks/use-chart-colors";

export interface GaugeChartProps {
  title: string;
  data: { value: number; name: string };
  description: string;
}

export function GaugeChart({ title, data, description }: GaugeChartProps) {
  const { theme } = useTheme();
  const { chart: chartColors, tooltipText, trackBg } = useChartColors();
  const isDark = theme === "dark";

  const options = {
    tooltip: { show: false },
    series: [
      {
        type: 'gauge',
        startAngle: 90,
        endAngle: -270,
        pointer: { show: false },
        progress: {
          show: true,
          overlap: false,
          roundCap: true,
          clip: false,
          itemStyle: {
            color: chartColors[0]
          }
        },
        axisLine: {
          lineStyle: {
            width: 12,
            color: [[1, trackBg]]
          }
        },
        splitLine: { show: false },
        axisTick: { show: false },
        axisLabel: { show: false },
        data: [{
          value: data.value,
          name: data.name,
          title: {
            offsetCenter: ['0%', '20%'],
            fontSize: 10,
            fontWeight: 'bold',
            color: '#646d87',
            textTransform: 'uppercase'
          },
          detail: {
            valueAnimation: true,
            offsetCenter: ['0%', '-10%'],
            fontSize: 30,
            fontWeight: 'bolder',
            color: tooltipText,
            formatter: '{value}%'
          }
        }],
        detail: {
            // Main value style is inside data item for ECharts usually, but can be global here
        }
      }
    ]
  };

  return (
    <Card className="shadow-sm flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
         <CardTitle className="text-base font-bold">{title}</CardTitle>
         <MoreHorizontal className="text-muted-foreground size-5" />
      </CardHeader>
      <CardContent className="flex-1 flex flex-col items-center">
        <ReactECharts
          option={options}
          style={{ height: "200px", width: "100%" }}
          opts={{ renderer: "svg" }}
        />
        <p className="text-xs text-muted-foreground text-center mt-2">{description}</p>
      </CardContent>
    </Card>
  );
}
