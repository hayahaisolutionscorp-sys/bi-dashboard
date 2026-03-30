"use client";

import React from "react";
import { ChartBuilder } from "./ChartBuilder";
import purplePassion from "@/theme/purple-passion.project.json";

export function ChartFactoryExample() {
  // 1. Bar Chart Example using Builder Pattern
  const barChart = new ChartBuilder("bar-example", "bar")
    .withTitle("Revenue by Region", "Quarterly Performance")
    .withAxis("x", { type: "category", data: ["North", "South", "East", "West"] })
    .withAxis("y", { type: "value", name: "Revenue (k)" })
    .withLegend(true)
    .addSeries({
      name: "Q1",
      type: "bar",
      data: [120, 200, 150, 80]
    })
    .addSeries({
      name: "Q2",
      type: "bar",
      data: [180, 240, 180, 100]
    })
    .withTheme(purplePassion.theme)
    .withHeight("350px")
    .build();

  // 2. Line Chart Example with Mixed Types
  const mixedChart = new ChartBuilder("mixed-example", "line")
    .withTitle("Traffic vs Sales")
    .withAxis("x", { type: "category", data: ["Mon", "Tue", "Wed", "Thu", "Fri"] })
    .withAxis("y", { type: "value" })
    .addSeries({
      name: "Traffic",
      type: "line",
      smooth: true,
      data: [820, 932, 901, 934, 1290],
      areaStyle: { opacity: 0.3 }
    })
    .addSeries({
      name: "Sales",
      type: "bar",
      data: [220, 182, 191, 234, 290]
    })
    .withTheme(purplePassion.theme)
    .build();

  // 3. Pie Chart Example
  const pieChart = new ChartBuilder("pie-example", "pie")
    .withTitle("Traffic Sources")
    .addSeries({
      name: "Source",
      type: "pie",
      radius: ["40%", "70%"],
      data: [
        { value: 1048, name: 'Search Engine' },
        { value: 735, name: 'Direct' },
        { value: 580, name: 'Email' },
        { value: 484, name: 'Union Ads' },
        { value: 300, name: 'Video Ads' }
      ]
    })
    .withTheme(purplePassion.theme)
    .withHeight("400px")
    .build();

  // 4. Responsive Chart Example (Media Queries)
  const responsiveChart = new ChartBuilder("responsive-example", "bar")
    .withTitle("Responsive Sales Data", "Resize window to see changes")
    .withAxis("x", { type: "category", data: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"] })
    .withAxis("y", { type: "value" })
    .addSeries({
      name: "Sales",
      type: "bar",
      data: [150, 230, 224, 218, 135, 147]
    })
    .withTheme(purplePassion.theme)
    .withMedia([
      {
        query: { maxWidth: 500 }, // Mobile
        option: {
          legend: { show: false }, // Hide legend on mobile
          title: { text: "Sales (Mobile)" }, // Simplify title
          yAxis: { show: false }, // Hide Y-axis to save space
          series: [{ label: { show: true, position: 'top' } }] // Show labels on bars instead
        }
      }
    ])
    .build();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-slate-50 dark:bg-slate-900">
      <div className="col-span-1 md:col-span-2">
        <h2 className="text-2xl font-bold mb-4">Chart Factory Design Pattern</h2>
        <p className="mb-6 text-muted-foreground">
            Demonstrating the new Factory Pattern implementation for standarized, theme-aware charts.
        </p>
      </div>
      
      {/* Render Charts */}
      {barChart}
      {mixedChart}
      {pieChart}
      {responsiveChart}
    </div>
  );
}
