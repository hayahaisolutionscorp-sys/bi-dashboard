"use client";

import ReactECharts from "echarts-for-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTheme } from "next-themes";
import { MoreHorizontal } from "lucide-react";

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
  const isDark = theme === "dark";

  const options = {
    tooltip: {
      trigger: "axis",
      backgroundColor: isDark ? "#1f2937" : "#fff",
      borderColor: isDark ? "#374151" : "#e5e7eb",
      textStyle: {
        color: isDark ? "#fff" : "#111827",
      },
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
        color: "#9ca3af",
        fontSize: 12,
        fontFamily: "var(--font-display)",
        interval: 0, // Force show all labels
      },
    },
    yAxis: {
      type: "value",
      splitLine: {
        lineStyle: {
          color: isDark ? "#374151" : "#f3f4f6",
        },
      },
      axisLabel: {
        color: "#9ca3af",
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
            color: "#3b82f6", // Standard Blue
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
