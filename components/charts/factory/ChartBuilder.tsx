import React from "react";
import { ChartConfig, AxisConfig, LegendConfig, SeriesConfig } from "./interfaces";
import { ChartFactory } from "./ChartFactory";

export class ChartBuilder {
  private config: Partial<ChartConfig>;
  private height: string = "300px";
  private theme: any = undefined;
  private className?: string;

  constructor(id: string, type: 'line' | 'bar' | 'pie') {
    this.config = {
      id,
      type,
      series: []
    };
  }

  withTitle(text: string, subtext?: string): this {
    this.config.title = { text, subtext };
    return this;
  }

  withAxis(axis: "x" | "y", config: AxisConfig, index: number = 0): this {
    if (axis === "x") {
      this.config.xAxis = config;
    } else {
      if (index === 0 && !this.config.yAxis && !Array.isArray(this.config.yAxis)) {
          this.config.yAxis = config;
      } else {
          // Ensure it's an array for multiple axes or explicit index > 0
          if (!Array.isArray(this.config.yAxis)) {
              this.config.yAxis = this.config.yAxis ? [this.config.yAxis] : [];
          }
          (this.config.yAxis as AxisConfig[])[index] = config;
      }
    }
    return this;
  }

  clearAxes(): this {
    this.config.xAxis = undefined;
    this.config.yAxis = undefined;
    if (this.config.grid) {
        this.config.grid = undefined;
    }
    return this;
  }

  withLegend(show: boolean = true, position: LegendConfig['position'] = 'bottom'): this {
    this.config.legend = { show, position };
    return this;
  }

  addSeries(series: SeriesConfig): this {
    if (!this.config.series) {
      this.config.series = [];
    }
    this.config.series.push(series);
    return this;
  }

  withHeight(height: string): this {
    this.height = height;
    return this;
  }

  withTheme(theme: any): this {
    this.theme = theme;
    return this;
  }

  withTimeToggle(enable: boolean = true): this {
    this.config.enableTimeToggle = enable;
    return this;
  }

  withClassName(className: string): this {
    this.className = className;
    return this;
  }

  withMedia(media: { query: any; option: any }[]): this {
    this.config.media = media;
    return this;
  }

  withGraphic(graphic: any): this {
    this.config.graphic = graphic;
    return this;
  }

  withTooltip(tooltip: any): this {
    this.config.tooltip = tooltip;
    return this;
  }

  withGrid(grid: any): this {
    this.config.grid = grid;
    return this;
  }

  getConfig(): ChartConfig {
    return this.config as ChartConfig;
  }

  build(): React.ReactElement {
    if (!this.config.series || this.config.series.length === 0) {
      console.warn(`ChartBuilder: No series data added for chart ${this.config.id}`);
    }
    
    return (
      <ChartFactory
        config={this.config as ChartConfig}
        height={this.height}
        theme={this.theme}
        className={this.className}
      />
    );
  }
}
