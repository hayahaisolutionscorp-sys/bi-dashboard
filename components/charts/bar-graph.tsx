"use client";

import ReactECharts from "echarts-for-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTheme } from "next-themes";
import { MoreHorizontal } from "lucide-react";
import { useChartColors } from "@/hooks/use-chart-colors";

export interface BarGraphProps {
  title: string;
  items?: { 
    label: string; 
    value: number; 
    colorClass?: string; 
  }[];
  data?: { // Alias for items, supporting legacy name -> label mapping
    name: string;
    value: number;
    colorClass?: string;
  }[]
}

export function BarGraph({ title, items = [], data = [] }: BarGraphProps) {
  // Normalize items/data input
  const chartItems = (items.length ? items : data).map(item => ({
    label: (item as any).label || (item as any).name,
    value: item.value,
    colorClass: item.colorClass
  }));
  const { theme } = useTheme();
  const { chart: chartColors, tooltipBg, tooltipBorder, tooltipText, axisLabel, splitLine } = useChartColors();
  const isDark = theme === "dark";

  const options = {
    tooltip: {
      trigger: "axis",
      backgroundColor: tooltipBg,
      borderColor: tooltipBorder,
      textStyle: { color: tooltipText },
      valueFormatter: (value: number) => `$${value.toLocaleString()}`,
    },
    grid: {
      top: "15%",
      left: "3%",
      right: "4%",
      bottom: "10%",
      containLabel: true,
    },
    xAxis: {
      type: "category",
      data: chartItems.map(item => item.label),
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        color: axisLabel,
        fontSize: 12,
        fontFamily: "var(--font-display)",
        interval: 0,
      },
    },
    yAxis: {
      type: "value",
      splitLine: {
        lineStyle: { color: splitLine },
      },
      axisLabel: {
        color: axisLabel,
        fontSize: 12,
        fontFamily: "var(--font-display)",
        formatter: (value: number) => {
          if (value >= 1000) return `${value / 1000}k`;
          return value;
        },
      },
    },
    series: [
      {
        name: title,
        type: "bar",
        barWidth: "50%",
        data: chartItems.map(item => item.value),
        itemStyle: {
            color: chartColors[0],
            borderRadius: 0
        },
        showBackground: false,
      },
    ],
  };

  return (
    <Card className="col-span-1 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
         <CardTitle className="text-lg font-bold">{title}</CardTitle>
         <button className="text-muted-foreground hover:text-primary"><MoreHorizontal className="size-5" /></button>
      </CardHeader>
      <CardContent>
        <ReactECharts
          option={options}
          style={{ height: "300px", width: "100%" }}
          opts={{ renderer: "svg" }}
        />
      </CardContent>
    </Card>
  );
}
