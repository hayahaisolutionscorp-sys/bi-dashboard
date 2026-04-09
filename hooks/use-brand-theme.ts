'use client'
import { useCallback, useEffect, useState } from 'react'
import { BRAND_THEMES, BrandTheme, DEFAULT_THEME, ThemeKey } from '@/lib/themes'

const STORAGE_KEY = 'dashboard-brand-theme'

export function useBrandTheme() {
  const [active, setActive] = useState<ThemeKey>(DEFAULT_THEME)

  const applyTheme = useCallback((t: BrandTheme) => {
    const root = document.documentElement
    root.style.setProperty('--brand-l', String(t.l))
    root.style.setProperty('--brand-c', String(t.c))
    root.style.setProperty('--brand-h', String(t.h))
  }, [])

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as ThemeKey | null
    const key = stored ?? DEFAULT_THEME
    const theme = BRAND_THEMES.find(t => t.key === key) ?? BRAND_THEMES[0]
    setActive(theme.key)
    applyTheme(theme)
  }, [applyTheme])

  const setTheme = useCallback((key: ThemeKey) => {
    const theme = BRAND_THEMES.find(t => t.key === key)
    if (!theme) return
    setActive(key)
    applyTheme(theme)
    localStorage.setItem(STORAGE_KEY, key)
  }, [applyTheme])

  return { active, setTheme, themes: BRAND_THEMES }
}
