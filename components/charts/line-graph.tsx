import { useState } from "react";
import ReactECharts from "echarts-for-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";


export interface LineGraphSeries {
  name: string;
  data: number[];
  color: string;
  yAxisIndex?: number; // For dual Y-axis
}

export interface LineGraphProps {
  title: string;
  description?: string;
  tabs?: { label: string; value: string }[];
  years?: string[];
  data?: {
    // If years provided & tabs provided: Record<Year, Record<Tab, ChartData>>
    // If years provided & tabs missing: Record<Year, ChartData>
    // If years missing & tabs provided: Record<Tab, ChartData>
    // If years missing & tabs missing: ChartData
    [key: string]: any; 
  };
  
  // NEW: Multi-series support
  series?: LineGraphSeries[];
  xAxisData?: string[]; // Explicit X-axis labels
  
  // NEW: Customization
  showArea?: boolean; // Default: true
  smooth?: boolean; // Default: true
  showSymbols?: boolean; // Default: false
  height?: string; // Default: "350px"
  yAxisFormatter?: (value: number) => string;
  tooltipFormatter?: (value: number) => string;
  
  // NEW: Custom legend for multi-series
  customLegend?: boolean; // Render legend outside chart
  legendItems?: { name: string; color: string }[];
}

export function LineGraph({ 
  title, 
  description, 
  tabs, 
  years, 
  data,
  series,
  xAxisData,
  showArea = true,
  smooth = true,
  showSymbols = false,
  height = "350px",
  yAxisFormatter,
  tooltipFormatter,
  customLegend = false,
  legendItems
}: LineGraphProps) {
  const [activeTab, setActiveTab] = useState(tabs ? tabs[0].value : undefined);
  const [activeYear, setActiveYear] = useState(years ? years[years.length - 1] : undefined);
  const { theme } = useTheme();
  
  // Resolve data based on configuration
  let currentData;
  if (data) {
    if (activeYear) {
        if (activeTab) {
            // Years + Tabs
            currentData = data[activeYear][activeTab];
        } else {
            // Years only
            currentData = data[activeYear];
        }
    } else {
        if (activeTab) {
            // Tabs only
            currentData = data[activeTab];
        } else {
            // Neither
            currentData = data;
        }
    }
  }

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
      bottom: "3%",
      containLabel: true,
    },
    xAxis: {
      type: "category",
      boundaryGap: false,
      data: xAxisData || currentData?.xAxis || [],
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        color: "#9ca3af",
        fontSize: 12,
        fontFamily: "var(--font-display)",
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
        formatter: yAxisFormatter || ((value: number) => {
          if (value >= 1000) return `${value / 1000}k`;
          return value;
        }),
      },
    },
    series: series ? series.map(s => ({
      name: s.name,
      type: "line",
      smooth,
      showSymbol: showSymbols,
      symbolSize: 8,
      data: s.data,
      itemStyle: { color: s.color },
      areaStyle: showArea ? {
        color: {
          type: "linear",
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: `${s.color}33` },
            { offset: 1, color: `${s.color}00` },
          ],
        },
      } : undefined,
      lineStyle: { width: 3 },
      tooltip: tooltipFormatter ? {
        valueFormatter: tooltipFormatter
      } : undefined,
    })) : [
      {
        name: title,
        type: "line",
        smooth,
        showSymbol: showSymbols,
        symbolSize: 8,
        data: currentData?.series || [],
        itemStyle: {
          color: "#3f68e4", // Primary
        },
        areaStyle: showArea ? {
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: "rgba(63, 104, 228, 0.2)" },
              { offset: 1, color: "rgba(63, 104, 228, 0)" },
            ],
          },
        } : undefined,
        lineStyle: {
          width: 3,
        },
      },
    ],
  };

  return (
    <Card className="col-span-1 lg:col-span-2 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="space-y-1">
          <CardTitle className="text-xl font-bold">{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </div>
        <div className="flex items-center gap-2">
          {/* Year Toggle Button */}
          {years && activeYear && (
             <DropdownMenu>
             <DropdownMenuTrigger asChild>
               <Button variant="outline" size="sm" className="h-9 gap-1 text-xs">
                 {activeYear}
                 <ChevronDown className="h-3 w-3 opacity-50" />
               </Button>
             </DropdownMenuTrigger>
             <DropdownMenuContent align="end">
               {years.map((year) => (
                 <DropdownMenuItem 
                   key={year} 
                   onClick={() => setActiveYear(year)}
                   className={year === activeYear ? "bg-accent" : ""}
                 >
                   {year}
                 </DropdownMenuItem>
               ))}
             </DropdownMenuContent>
           </DropdownMenu>
          )}

          {tabs && activeTab && (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
              <TabsList>
                {tabs.map((tab) => (
                  <TabsTrigger key={tab.value} value={tab.value}>
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Custom Legend for Multi-Series */}
        {customLegend && legendItems && (
          <div className="flex gap-4 mb-4">
            {legendItems.map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></span>
                <span className="text-xs font-medium">{item.name}</span>
              </div>
            ))}
          </div>
        )}
        <ReactECharts
          option={options}
          style={{ height, width: "100%" }}
          opts={{ renderer: "svg" }}
        />
      </CardContent>
    </Card>
  );
}
