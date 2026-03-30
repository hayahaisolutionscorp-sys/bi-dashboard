import React from 'react';

export interface TitleConfig {
  text: string;
  subtext?: string;
  left?: string;
}

export interface AxisConfig {
  name?: string;
  type?: 'value' | 'category' | 'time' | 'log';
  data?: string[]; // For category axis
  show?: boolean;
  position?: 'left' | 'right' | 'top' | 'bottom';
  axisLabel?: any;
  splitLine?: any;
  axisLine?: any;
  barwidth?: any;
  max?: number | string | any;
  min?: number | string | any;
}

export interface LegendConfig {
  show?: boolean;
  position?: 'top' | 'bottom' | 'left' | 'right';
  orient?: 'horizontal' | 'vertical';
}

export interface LineChartSeries {
  name: string;
  type: 'line';
  data: (number | [string | number, number] | { value: number; itemStyle?: any })[];
  smooth?: boolean;
  color?: string;
  cursor?: string
  yAxisIndex?: number;
  areaStyle?: any;
  lineStyle?:any;
  label?: Object;
  showSymbol?: boolean;
  aggregation?: 'sum' | 'avg'; // Default to 'sum'
}

export interface BarChartSeries {
  name: string;
  type: 'bar';
  data: (number | [string | number, number] | { value: number; itemStyle?: any })[];
  stack?: string;
  color?: string;
  cursor?: string
  yAxisIndex?: number;
  barWidth?: number | string;
  barMinWidth?: number;
  barMinHeight?: number;
  barMinAngle?: number;
  barGap?: number;
  label?: Object;
  itemStyle?: Object;
  aggregation?: 'sum' | 'avg'; // Default to 'sum'
}

export interface PieChartSeries {
  name: string;
  type: 'pie';
  data: { value: number; name: string; itemStyle?: { color: string } }[];
  radius?: string | [string, string];
  center?: [string, string];
  avoidLabelOverlap?: boolean;
  itemStyle?: Object;
  label?: Object;
  emphasis?: Object;
  labelLine?: Object;
}

export type SeriesConfig = LineChartSeries | BarChartSeries | PieChartSeries;

export interface MediaConfig {
  query: {
    minWidth?: number;
    maxWidth?: number;
    minHeight?: number;
    maxHeight?: number;
    minAspectRatio?: number;
  };
  option: any; // Partial ECharts option to apply when query matches
}

export interface ChartConfig {
  id: string;
  type: 'line' | 'bar' | 'pie';
  title?: TitleConfig;
  xAxis?: AxisConfig;
  yAxis?: AxisConfig | AxisConfig[];
  legend?: LegendConfig;
  series: SeriesConfig[];
  tooltip?: any;
  grid?: any;
  graphic?: any; // For custom graphics like center labels
  media?: MediaConfig[]; // ECharts media queries
  enableTimeToggle?: boolean; // Whether to show Day/Week/Month toggle
}

export interface ChartFactoryProps {
  config: ChartConfig;
  height?: string;
  theme?: any;
  className?: string;
}

export interface ChartContainerProps {
  children?: React.ReactNode;
  height?: string;
  theme?: any;
  title?: string;
  subtext?: string;
  className?: string;
  enableTimeToggle?: boolean;
  option?: any;
  echartsRef?: React.Ref<any>;
}
