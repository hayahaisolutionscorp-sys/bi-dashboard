'use client'

import { useCallback, useEffect, useState } from 'react'

/** CSS variable strings for Recharts (SVG renders CSS vars natively) */
export const CHART_CSS_VARS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
] as const

/**
 * Resolves a CSS custom property to its computed color value.
 * Uses a temporary DOM element so color-mix() and oklch() are fully resolved
 * by the browser — necessary for canvas-based renderers (ECharts).
 */
function resolveColor(varName: string): string {
  if (typeof window === 'undefined') return 'rgb(100,100,100)'
  const el = document.createElement('div')
  el.style.color = `var(${varName})`
  document.documentElement.appendChild(el)
  const resolved = window.getComputedStyle(el).color
  document.documentElement.removeChild(el)
  return resolved
}

export interface ChartThemeColors {
  /** Resolved chart palette — use for ECharts canvas series colors */
  chart: string[]
  /** Tooltip background (--card) */
  tooltipBg: string
  /** Tooltip border (--border) */
  tooltipBorder: string
  /** Primary text color (--foreground) */
  tooltipText: string
  /** Axis label color (--muted-foreground) */
  axisLabel: string
  /** Grid / split line color (--border) */
  splitLine: string
  /** Track / gauge background color (--muted) */
  trackBg: string
}

const CHART_VARS = ['--chart-1', '--chart-2', '--chart-3', '--chart-4', '--chart-5']
const SEMANTIC_VARS = ['--card', '--border', '--foreground', '--muted-foreground', '--border', '--muted']

function readColors(): ChartThemeColors {
  const chart = CHART_VARS.map(resolveColor)
  const [tooltipBg, tooltipBorder, tooltipText, axisLabel, splitLine, trackBg] =
    SEMANTIC_VARS.map(resolveColor)
  return { chart, tooltipBg, tooltipBorder, tooltipText, axisLabel, splitLine, trackBg }
}

/**
 * Hook that returns resolved chart colors.
 * Re-reads whenever the brand or light/dark theme changes.
 * Use for canvas-based chart libraries (ECharts).
 */
export function useChartColors(): ChartThemeColors {
  const [colors, setColors] = useState<ChartThemeColors>(() => ({
    chart: CHART_VARS.map(() => 'rgb(100,100,100)'),
    tooltipBg: 'rgb(22,22,22)',
    tooltipBorder: 'rgb(46,46,46)',
    tooltipText: 'rgb(240,240,240)',
    axisLabel: 'rgb(120,120,120)',
    splitLine: 'rgb(46,46,46)',
    trackBg: 'rgb(36,36,36)',
  }))

  const refresh = useCallback(() => {
    setColors(readColors())
  }, [])

  useEffect(() => {
    refresh()
    // Re-read when --brand-* properties change (set via style attribute)
    // or when light/dark class toggles
    const observer = new MutationObserver(refresh)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['style', 'class'],
    })
    return () => observer.disconnect()
  }, [refresh])

  return colors
}
