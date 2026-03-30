"use client";

import { useState } from "react";
import ReactECharts from "echarts-for-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useTheme } from "next-themes";
import { MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PieChartLegendItem {
  name: string;
  value: string;
  percentage: string;
  color: string;
  icon?: React.ReactNode;
}

export interface PieChartProps {
  title?: string;
  description?: string;
  data: { value: number; name: string; itemStyle: { color: string } }[];
  
  // Customization options
  variant?: "pie" | "donut"; // Default: "pie"
  radius?: string | [string, string];
  showLegend?: boolean; // Default: true
  legendPosition?: "top" | "bottom" | "left" | "right"; // Default: "bottom"
  showLabels?: boolean; // Default: true
  centerLabel?: { value: string; subtitle: string };
  customLegend?: boolean;
  legendItems?: PieChartLegendItem[]; // Custom legend with icons
  height?: string; 
  
  // Toggle buttons
  toggleOptions?: string[]; // e.g., ["This Month", "This Year"]
  defaultToggle?: string;
  onToggleChange?: (value: string) => void;
  
  // Card wrapper options
  showCard?: boolean; // Default: true
  cardClassName?: string;
  showHeaderActions?: boolean; // Show MoreHorizontal icon
}

export function PieChart({ 
  title, 
  description, 
  data,
  variant = "pie",
  radius,
  showLegend = true,
  legendPosition = "bottom",
  showLabels = true,
  centerLabel,
  customLegend = false,
  legendItems,
  height = "300px",
  toggleOptions,
  defaultToggle,
  onToggleChange,
  showCard = true,
  cardClassName,
  showHeaderActions = false
}: PieChartProps) {
  const [activeToggle, setActiveToggle] = useState(defaultToggle || toggleOptions?.[0] || "");
  
  const handleToggle = (value: string) => {
    setActiveToggle(value);
    onToggleChange?.(value);
  };
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // Calculate radius based on variant - thicker donut rings like ECharts example
  const chartRadius = radius || (variant === "donut" ? ["40%", "70%"] : "75%");

  const options = {
    tooltip: {
      trigger: "item",
      backgroundColor: isDark ? "#1f2937" : "#fff",
      borderColor: isDark ? "#374151" : "#e5e7eb",
      textStyle: {
        color: isDark ? "#fff" : "#111827",
      },
      formatter: "{b}: {d}%",
    },
    legend: showLegend && !customLegend ? {
      [legendPosition]: legendPosition === "bottom" || legendPosition === "top" ? "0%" : "center",
      [legendPosition === "bottom" || legendPosition === "top" ? "left" : "top"]: "center",
      orient: legendPosition === "left" || legendPosition === "right" ? "vertical" : "horizontal",
      icon: "circle",
      itemGap: 15,
      textStyle: {
        color: isDark ? "#fff" : "#111827",
        fontFamily: "var(--font-display)",
      },
    } : { show: false },
    series: [
      {
        name: title || "Distribution",
        type: "pie",
        radius: chartRadius,
        center: ["50%", "50%"],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: variant === "donut" ? 0 : 0, // No border radius for cleaner look
          borderColor: isDark ? "#1a1e2e" : "#fff",
          borderWidth: 2,
        },
        label: {
          show: false, // Hide labels by default like ECharts example
          position: "center",
        },
        emphasis: {
          label: {
            show: true, // Show label on hover
            fontSize: centerLabel ? 20 : 40, // Large font on hover
            fontWeight: "bold",
            color: isDark ? "#fff" : "#111827",
            formatter: "{d}%" // Show percentage on hover
          },
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: "rgba(0, 0, 0, 0.5)",
          },
        },
        labelLine: {
          show: false, // No label lines
        },
        data: data,
      },
    ],
  };

  const chartContent = (
    <div className="relative">
      <ReactECharts
        option={options}
        style={{ height, width: "100%" }}
        opts={{ renderer: "svg" }}
      />
      {/* Center Label for Donut Charts */}
      {centerLabel && variant === "donut" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-3xl font-black">{centerLabel.value}</span>
          <span className="text-[10px] text-muted-foreground uppercase font-bold">{centerLabel.subtitle}</span>
        </div>
      )}
    </div>
  );

  const customLegendContent = customLegend && (
    <div className="flex flex-col gap-6 min-w-[240px]">
      {(legendItems || data).map((item, i) => {
        const legendItem = legendItems ? item as PieChartLegendItem : null;
        const dataItem = !legendItems ? item as typeof data[0] : null;
        
        return (
          <div key={i} className="flex items-center gap-4">
            {legendItem?.icon && (
              <div className="p-3 rounded-lg flex items-center justify-center text-2xl" style={{ 
                backgroundColor: `${legendItem.color}15`,
                color: legendItem.color 
              }}>
                {legendItem.icon}
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2.5 h-2.5 rounded-full" style={{ 
                  backgroundColor: legendItem?.color || dataItem?.itemStyle.color 
                }}></span>
                <span className="text-sm font-medium text-slate-700">
                  {legendItem?.name || dataItem?.name}
                </span>
              </div>
              <p className="text-xl font-bold">
                {legendItem?.value || `${dataItem?.value}%`}
                {legendItem?.percentage && (
                  <span className="text-sm font-normal text-muted-foreground ml-2">
                    ({legendItem.percentage})
                  </span>
                )}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );

  if (!showCard) {
    return (
      <div className="flex items-center gap-6">
        {chartContent}
        {customLegendContent}
      </div>
    );
  }

  return (
    <Card className={cn("shadow-sm", cardClassName)}>
      {(title || description || toggleOptions) && (
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            {title && <CardTitle className="text-lg font-semibold text-slate-800">{title}</CardTitle>}
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          <div className="flex items-center gap-2">
            {toggleOptions && toggleOptions.length > 0 && (
              <div className="bg-slate-100 p-1 rounded-lg flex gap-1">
                {toggleOptions.map((option) => (
                  <button
                    key={option}
                    onClick={() => handleToggle(option)}
                    className={cn(
                      "px-4 py-1.5 text-xs font-semibold rounded-md transition-all",
                      activeToggle === option
                        ? "bg-white shadow-sm text-slate-900"
                        : "text-slate-500 hover:text-slate-700"
                    )}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}
            {showHeaderActions && <MoreHorizontal className="text-muted-foreground" />}
          </div>
        </CardHeader>
      )}
      <CardContent className={customLegend ? "flex flex-1 items-center justify-center gap-8 py-4 flex-col lg:flex-row" : undefined}>
        {customLegend ? (
          <>
            <div className="relative w-80 h-80 shrink-0">
              {chartContent}
            </div>
            {customLegendContent}
          </>
        ) : (
          chartContent
        )}
      </CardContent>
    </Card>
  );
}
