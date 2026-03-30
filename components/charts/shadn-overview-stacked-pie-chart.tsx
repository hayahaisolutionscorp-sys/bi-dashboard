"use client"

import * as React from "react"
import { TrendingUp } from "lucide-react"
import { Pie, PieChart } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"

export interface ShadnOverviewStackedPieChartProps {
  innerData: any[]
  outerData: any[]
  config: ChartConfig
  title: string
  description?: string
  footerLabel?: string
  trendValue?: string
  innerDataKey: string
  outerDataKey: string
  nameKey: string
}

export function ShadnOverviewStackedPieChart({
  innerData,
  outerData,
  config,
  title,
  description,
  footerLabel,
  trendValue,
  innerDataKey,
  outerDataKey,
  nameKey,
}: ShadnOverviewStackedPieChartProps) {
  const isMobile = useIsMobile();

  return (
    <Card className="flex flex-col h-full border-none pt-2 shadow-none bg-transparent overflow-visible">
        <CardHeader className="grid-cols-2 items-start justify-between space-y-0">
        <div className="grid">
          <CardTitle className="text-base font-semibold">{title}</CardTitle>
          {description && <CardDescription className="text-xs">{description}</CardDescription>}
        </div>
      </CardHeader>
      <CardContent className={cn(
        "flex-1 flex flex-col items-center justify-center overflow-visible p-2",
        isMobile ? "min-h-[300px]" : "min-h-[150px]"
      )}>
        <ChartContainer
          config={config}
          className={cn(
            "mx-auto aspect-square w-full pt-0 mt-0 overflow-visible",
            isMobile ? "max-w-[280px] lg:max-w-[340px]" : "max-w-[280px]"
          )}
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              allowEscapeViewBox={{ x: true, y: true }}
              wrapperStyle={{ pointerEvents: 'auto', zIndex: 1000, outline: 'none' }}
              content={({ active, payload }) => {
                const isValid = active && payload && payload.length > 0;
                if (isValid) {
                  const data = payload[0].payload;
                  const breakdown = data.sourceBreakdown as { source: string; revenue: number }[];
                  const isInner = data.isInner === true;
                  const isCargo = data.category === 'cargo';
                  
                  return (
                    <div 
                      className="rounded-lg border bg-background p-2 shadow-md z-[1000] pointer-events-auto select-text relative"
                      style={{ 
                        width: isMobile ? '180px' : '200px',
                        transform: isMobile ? 'translate(-50%, -100%)' : 'translate(-50%, calc(-100% - 6px))',
                        marginTop: isMobile ? '-10px' : '0px'
                      }}
                    >
                      {/* Interactive bridge to keep tooltip open while moving mouse into it */}
                      <div className="absolute inset-x-0 -bottom-2 h-2 pointer-events-auto" />
                      
                      <div className="flex flex-col gap-1 relative z-10">
                        <div className="flex items-center gap-2 mb-0.5">
                          <div 
                            className="h-2 w-2 rounded-full shrink-0" 
                            style={{ backgroundColor: data.fill }}
                          />
                          <span className={cn("font-bold text-foreground truncate", isMobile ? "text-[11px] max-w-[140px]" : "text-[11px] max-w-[160px]")}>
                            {data.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-muted-foreground">Total:</span>
                          <span className="text-[10px] font-medium">₱{data.value.toLocaleString()}</span>
                        </div>
                        {isInner && breakdown && breakdown.length > 0 && (
                          <div className="mt-1 pt-1 border-t flex flex-col gap-0.5">
                            <span className="text-[9px] uppercase font-bold text-muted-foreground mb-1">
                              {isCargo ? 'Cargo Classes' : 'By Source'}
                            </span>
                            <div 
                              className={cn("flex flex-col gap-0.5", (isMobile ? breakdown.length > 3 : breakdown.length > 4) ? 'max-h-[100px] lg:max-h-[140px] overflow-y-auto pr-1.5' : '')}
                              style={{ 
                                scrollbarWidth: 'thin',
                                pointerEvents: 'auto'
                              }}
                            >
                              {breakdown.map((s, i) => (
                                <div key={i} className="flex items-center justify-between gap-4 py-0.5 pointer-events-auto">
                                  <span className={cn("text-[10px] text-muted-foreground capitalize truncate", isMobile ? "max-w-[100px]" : "max-w-[120px]")}>{s.source.replace(/_/g, ' ')}:</span>
                                  <span className="text-[10px] font-medium shrink-0">₱{s.revenue.toLocaleString()}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Pie 
              data={innerData} 
              dataKey={innerDataKey} 
              nameKey={nameKey}
              innerRadius="0%"
              outerRadius="38%" 
              strokeWidth={2}
              stroke="white"
            />
            <Pie
              data={outerData}
              dataKey={outerDataKey}
              nameKey={nameKey}
              innerRadius="45%"
              outerRadius="65%"
              strokeWidth={2}
              stroke="white"
            />
          </PieChart>
        </ChartContainer>
        {isMobile && (
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-4 px-4 h-auto min-h-[40px]">
              {outerData.map((d, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                      <div className="h-2 w-2 rounded-full" style={{ backgroundColor: d.fill }} />
                      <span className="text-[10px] font-medium text-slate-600 dark:text-slate-400">{d.name}</span>
                  </div>
              ))}
          </div>
        )}
      </CardContent>
      {(trendValue || footerLabel) && (
        <CardFooter className="flex-col items-start gap-1 p-4 pt-0 text-xs mt-auto">
          {trendValue && (
            <div className="flex gap-2 leading-none font-medium">
              {trendValue} <TrendingUp className="h-3 w-3" />
            </div>
          )}
          {footerLabel && (
            <div className="leading-none text-muted-foreground text-center w-full">
              {footerLabel}
            </div>
          )}
        </CardFooter>
      )}
    </Card>
  )
}
