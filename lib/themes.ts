export type ThemeKey = 'blue' | 'indigo' | 'violet' | 'rose' | 'orange' | 'amber' | 'green' | 'teal'

export interface BrandTheme {
  key:   ThemeKey
  label: string
  l:     number   // OKLCH lightness
  c:     number   // OKLCH chroma
  h:     number   // OKLCH hue
}

export const BRAND_THEMES: BrandTheme[] = [
  { key: 'blue',   label: 'Blue',   l: 0.52, c: 0.20, h: 240 },
  { key: 'indigo', label: 'Indigo', l: 0.50, c: 0.22, h: 265 },
  { key: 'violet', label: 'Violet', l: 0.52, c: 0.22, h: 290 },
  { key: 'rose',   label: 'Rose',   l: 0.52, c: 0.22, h: 10  },
  { key: 'orange', label: 'Orange', l: 0.60, c: 0.20, h: 40  },
  { key: 'amber',  label: 'Amber',  l: 0.68, c: 0.18, h: 72  },
  { key: 'green',  label: 'Green',  l: 0.55, c: 0.18, h: 142 },
  { key: 'teal',   label: 'Teal',   l: 0.55, c: 0.16, h: 180 },
]

export const DEFAULT_THEME: ThemeKey = 'blue'
