"use client";

import React, { useMemo } from "react";
import { ChartFactoryProps } from "./interfaces";
import { ChartContainer } from "./ChartContainer";
import { useTheme } from "next-themes";

export function ChartFactory({
  config,
  height = "300px",
  theme,
  className
}: ChartFactoryProps) {
  const { theme: appTheme } = useTheme();
  const isDark = appTheme === "dark";

  // Compute ECharts option based on config
  const option = useMemo(() => {
    const { 
      type, 
      title, 
      xAxis, 
      yAxis, 
      legend, 
      series, 
      tooltip,
      grid,
      graphic,
      media,
      enableTimeToggle
    } = config;

    // Base option
    const baseOption: any = {
      // Use transparent background so ChartContainer handles it
      backgroundColor: 'transparent', 
      tooltip: {
        trigger: type === 'pie' ? 'item' : 'axis',
        axisPointer: { type: 'shadow' },
        ...tooltip
      },
      legend: legend?.show !== false ? {
        top: legend?.position === 'bottom' ? 'bottom' : 'top',
        orient: legend?.orient || 'horizontal',
        // Theme text color fallback
        textStyle: {
          color: theme?.legendTextColor || (isDark ? '#fff' : '#333')
        },
        ...legend
      } : { show: false },
      grid: {
        containLabel: true,
        left: '0%',
        right: '1%',
        bottom: '0%',
        top: title ? '15%' : '5%', // Adjust top based on title presence
        ...grid
      },
      graphic,
      series: series.map((s, index) => {
        // Safe access to specific properties based on type
        const color = 'color' in s ? s.color : undefined;
        const areaStyle = 'areaStyle' in s ? s.areaStyle : undefined;

        // Theme color injection for bar/line
        const itemStyle = color ? { color } : undefined;
        
        // Cycle through theme colors if available and color not set
        // This is primarily for bar/line charts where we want distinct colors per series
        if (!itemStyle && theme?.color && Array.isArray(theme.color)) {
             return {
                 ...s,
                 itemStyle: {
                     color: theme.color[index % theme.color.length]
                 }
             }
        }
        
        return {
          ...s,
          itemStyle: { ...itemStyle }
        };
      })
    };

    // Axis configuration (only for cartesian charts)
    if (type !== 'pie') {
      baseOption.xAxis = {
        type: xAxis?.type || 'category',
        name: xAxis?.name,
        data: xAxis?.data,
        axisLine: {
             lineStyle: {
                 color: theme?.axes?.[1]?.axisLineColor || (isDark ? '#555' : '#ccc')
             }
        },
        axisLabel: {
            color: theme?.axes?.[1]?.axisLabelColor || (isDark ? '#aaa' : '#666')
        },
        splitLine: {
            show: xAxis?.type === 'value',
            lineStyle: {
                color: theme?.axes?.[2]?.splitLineColor[0] || (isDark ? '#333' : '#eee')
            }
        },
        ...xAxis
      };

      baseOption.yAxis = Array.isArray(yAxis) ? yAxis.map(axis => ({
        type: axis.type || 'value',
        name: axis.name,
        position: axis.position || 'left', // Ensure position is respected
        axisLine: {
             lineStyle: {
                 color: theme?.axes?.[1]?.axisLineColor || (isDark ? '#555' : '#ccc')
             }
        },
        axisLabel: {
            color: theme?.axes?.[1]?.axisLabelColor || (isDark ? '#aaa' : '#666')
        },
        splitLine: {
            show: true,
            lineStyle: {
                color: theme?.axes?.[2]?.splitLineColor[0] || (isDark ? '#333' : '#eee')
            }
        },
        ...axis
      })) : {
        type: yAxis?.type || 'value',
        name: yAxis?.name,
        axisLine: {
             lineStyle: {
                 color: theme?.axes?.[1]?.axisLineColor || (isDark ? '#555' : '#ccc')
             }
        },
        axisLabel: {
            color: theme?.axes?.[1]?.axisLabelColor || (isDark ? '#aaa' : '#666')
        },
        splitLine: {
            show: true,
            lineStyle: {
                color: theme?.axes?.[2]?.splitLineColor[0] || (isDark ? '#333' : '#eee')
            }
        },
        ...yAxis
      };
    }

    // If media queries are provided, structure option as { baseOption, media }
    if (config.media && config.media.length > 0) {
      return {
        baseOption,
        media: config.media
      };
    }

    return baseOption;
  }, [config, isDark, theme]);

  return (
    <ChartContainer 
      title={config.title?.text} 
      subtext={config.title?.subtext}
      height={height}
      theme={theme}
      className={className}
      enableTimeToggle={config.enableTimeToggle}
      option={option}
    />
  );
}
