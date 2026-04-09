'use client'
import { useBrandTheme } from '@/hooks/use-brand-theme'
import { BRAND_THEMES } from '@/lib/themes'
import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'

export function BrandThemePicker() {
  const { active, setTheme } = useBrandTheme()

  return (
    <div className="flex flex-wrap gap-2">
      {BRAND_THEMES.map((t) => (
        <button
          key={t.key}
          onClick={() => setTheme(t.key)}
          title={t.label}
          className={cn(
            'group relative flex items-center gap-2 rounded-md px-3 py-1.5',
            'text-[12px] font-medium border transition-all duration-[120ms]',
            active === t.key
              ? 'border-border bg-muted text-foreground'
              : 'border-transparent text-muted-foreground hover:bg-muted/60 hover:text-foreground'
          )}
        >
          <span
            className="h-3 w-3 rounded-full flex-shrink-0"
            style={{ background: `oklch(${t.l} ${t.c} ${t.h})` }}
          />
          {t.label}
          {active === t.key && <Check className="h-3 w-3 ml-0.5" />}
        </button>
      ))}
    </div>
  )
}
