"use client";

import React, { useMemo, useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MoreHorizontal } from "lucide-react";
import { ChartContainerProps } from "./interfaces";
import ReactECharts from "echarts-for-react";
import { useTheme } from "next-themes";

const getMonthString = (dateObj: Date) => {
  return dateObj.toLocaleDateString("en-US", { year: "numeric", month: "short", timeZone: "UTC" });
};

const getWeekRangeString = (dateObj: Date) => {
  const d = new Date(dateObj);
  const day = d.getUTCDay();
  
  // Set to Sunday (start of week) in UTC
  const startOfWeek = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - day));
  
  // End of week (Saturday)
  const endOfWeek = new Date(Date.UTC(startOfWeek.getUTCFullYear(), startOfWeek.getUTCMonth(), startOfWeek.getUTCDate() + 6));
  
  const startStr = startOfWeek.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
  const endStr = endOfWeek.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
  
  return `${startStr} - ${endStr}`;
};

export function ChartContainer({
  children,
  title,
  subtext,
  height = "300px",
  theme,
  className,
  enableTimeToggle,
  option,
  echartsRef,
}: ChartContainerProps) {
  const { theme: appTheme } = useTheme();
  const isDark = appTheme === "dark";
  const internalResizeRef = useRef<ReactECharts>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const activeEchartsRef = echartsRef || internalResizeRef;

  const backgroundColor = theme?.backgroundColor;
  const titleColor = theme?.titleColor;
  const subtitleColor = theme?.subtitleColor;

  const [timeView, setTimeView] = useState<"day" | "week" | "month">("day");

  // Handle both standard options and responsive options with { baseOption, media }
  const isResponsiveOption = option && 'baseOption' in option;
  const activeOption = isResponsiveOption ? option.baseOption : option;

  const datesRaw = activeOption?.xAxis?.data as string[] | undefined;
  
  // Calculate actual days in range
  let diffDays = 0;
  if (datesRaw && datesRaw.length > 0) {
    const firstDate = new Date(datesRaw[0] + "T00:00:00Z");
    const lastDate = new Date(datesRaw[datesRaw.length - 1] + "T00:00:00Z");
    if (!isNaN(firstDate.getTime()) && !isNaN(lastDate.getTime())) {
      const diffTime = Math.abs(lastDate.getTime() - firstDate.getTime());
      diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    }
  }

  const canToggle = enableTimeToggle && datesRaw && diffDays > 30;

  const finalOption = useMemo(() => {
    if (!canToggle || !activeOption || !datesRaw) {
      return option; // Return original unchanged
    }

    const isDayView = timeView === "day";
    const AxisName = isDayView ? "Daily" : timeView === "week" ? "Weekly" : "Monthly";

    if (isDayView) {
      const dailyBaseOption = {
        ...activeOption,
        xAxis: {
          ...activeOption.xAxis,
          name: "", // Remove name to avoid clutter
          axisLabel: {
            ...activeOption.xAxis?.axisLabel,
            rotate: 45,
            formatter: (value: string) => {
              const d = new Date(value + "T00:00:00Z");
              return !isNaN(d.getTime()) ? d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" }).replace(" ", "-") : value;
            }
          }
        }
      };
      return isResponsiveOption ? { ...option, baseOption: dailyBaseOption } : dailyBaseOption;
    }

    const newXAxisData: string[] = [];
    const aggregatedSeries: any[] = activeOption.series.map((s: any) => ({
      ...s,
      data: []
    }));

    let currentGroupKey = "";
    let currentSums: number[] = new Array(activeOption.series.length).fill(0);
    let currentCounts = 0;
    let seriesCount = activeOption.series.length;

    const pushGroup = () => {
      newXAxisData.push(currentGroupKey);
      for (let i = 0; i < seriesCount; i++) {
        const s = activeOption.series[i];
        const val = currentSums[i];
        const rawVal = s.aggregation === "avg" ? (currentCounts > 0 ? val / currentCounts : 0) : val;
        const finalVal = s.aggregation === "avg" ? parseFloat(rawVal.toFixed(2)) : rawVal;
        aggregatedSeries[i].data.push(finalVal);
      }
    };

    datesRaw.forEach((dateStr, idx) => {
      const d = new Date(dateStr + "T00:00:00Z");
      let groupKey = "";
      if (timeView === "month") {
        groupKey = !isNaN(d.getTime()) ? getMonthString(d) : dateStr.slice(0, 7);
      } else if (timeView === "week") {
        groupKey = !isNaN(d.getTime()) ? getWeekRangeString(d) : dateStr;
      }

      if (groupKey !== currentGroupKey) {
        if (currentGroupKey !== "") pushGroup();
        currentGroupKey = groupKey;
        currentSums = new Array(seriesCount).fill(0);
        currentCounts = 0;
      }

      for (let i = 0; i < seriesCount; i++) {
        const val = activeOption.series[i].data[idx] || 0;
        currentSums[i] += Number(val);
      }
      currentCounts++;
    });

    if (currentGroupKey !== "") {
      pushGroup();
    }

    const aggregatedBaseOption = {
      ...activeOption,
      xAxis: {
        ...activeOption.xAxis,
        data: newXAxisData,
        name: "", // Remove name to avoid clutter
        axisLabel: {
          ...activeOption.xAxis?.axisLabel,
          rotate: timeView === "week" ? 35 : 0,
          interval: 0, // Force show all for aggregated views since labels are already sparse
          hideOverlap: true
        }
      },
      series: aggregatedSeries
    };

    if (isResponsiveOption) {
      // Ensure media queries don't override the interval when aggregated
      const newMedia = (option.media || []).map((m: any) => {
        if (m.option?.xAxis?.axisLabel) {
          return {
            ...m,
            option: {
              ...m.option,
              xAxis: {
                ...m.option.xAxis,
                axisLabel: {
                  ...m.option.xAxis.axisLabel,
                  interval: 0
                }
              }
            }
          };
        }
        return m;
      });

      return {
        ...option,
        baseOption: aggregatedBaseOption,
        media: newMedia
      };
    }

    return aggregatedBaseOption;
  }, [option, activeOption, isResponsiveOption, canToggle, timeView, datesRaw]);

  useEffect(() => {
    const resizeChart = () => {
      if ((activeEchartsRef as any)?.current) {
        (activeEchartsRef as any).current.getEchartsInstance().resize({
          animation: { duration: 120 }
        });
      }
    };

    const resizeObserver = new ResizeObserver(() => {
      resizeChart();
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    window.addEventListener("resize", resizeChart);
    const rafId = window.requestAnimationFrame(() => {
      resizeChart();
    });

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", resizeChart);
      window.cancelAnimationFrame(rafId);
    };
  }, [activeEchartsRef]);

  return (
    <Card 
      className={`shadow-sm border-0 ${className || ""}`}
      style={{ backgroundColor, color: titleColor }}
    >
      {(title || subtext || canToggle) && (
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="space-y-1">
            {title && (
              <CardTitle className="text-lg font-bold" style={{ color: titleColor }}>
                {title}
              </CardTitle>
            )}
            {subtext && (
              <CardDescription style={{ color: subtitleColor }}>
                {subtext}
              </CardDescription>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {canToggle && (
              <div className="inline-flex items-center rounded-md border border-slate-200 bg-slate-100 p-0.5 text-slate-500 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-400">
                {(["day", "week", "month"] as const).map((view) => (
                  <button
                    key={view}
                    onClick={() => setTimeView(view)}
                    className={`rounded-sm px-2.5 py-1 text-xs font-medium transition-all duration-200 ${
                      timeView === view
                        ? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-slate-100"
                        : "hover:bg-slate-200 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                    }`}
                  >
                    {view.charAt(0).toUpperCase() + view.slice(1)}
                  </button>
                ))}
              </div>
            )}
            <button 
              className="hover:text-primary transition-colors ml-1"
              style={{ color: subtitleColor || "inherit" }}
            >
              <MoreHorizontal className="h-5 w-5" />
            </button>
          </div>
        </CardHeader>
      )}
      <CardContent>
        <div ref={containerRef} style={{ height, width: "100%" }}>
          {option ? (
            <ReactECharts
              ref={activeEchartsRef as any}
              option={finalOption}
              style={{ height: '100%', width: '100%' }}
              theme={typeof theme === 'string' ? theme : undefined}
              opts={{ renderer: 'svg' }}
            />
          ) : (
            children
          )}
        </div>
      </CardContent>
    </Card>
  );
}
