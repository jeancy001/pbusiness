'use client'

import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown, Languages } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/lib/i18n/context'
import { localeNames, locales } from '@/lib/i18n/dictionary'
import { cn } from '@/lib/utils'

export function LanguageToggle() {
  const { locale, setLocale, t } = useLanguage()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointer = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={ref} className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t('nav.language')}
        className="
          gap-1.5
          border-[#064E3B]/30
          font-medium
          text-[#064E3B]
          transition-colors
          hover:border-[#064E3B]
          hover:bg-[#064E3B]
          hover:text-white
          dark:border-emerald-800
          dark:text-emerald-400
          dark:hover:border-[#064E3B]
          dark:hover:bg-[#064E3B]
          dark:hover:text-white
        "
      >
        <Languages className="size-3.5" />
        <span className="tabular-nums">{localeNames[locale].short}</span>
        <ChevronDown className={cn('size-3 transition-transform', open && 'rotate-180')} />
      </Button>

      {open && (
        <ul
          role="listbox"
          aria-label={t('nav.language')}
          className="
            absolute right-0 z-50 mt-2 w-44 overflow-hidden
            rounded-xl border border-border bg-popover p-1
            text-popover-foreground shadow-lg
          "
        >
          {locales.map((code) => (
            <li key={code}>
              <button
                type="button"
                role="option"
                aria-selected={code === locale}
                onClick={() => {
                  setLocale(code)
                  setOpen(false)
                }}
                className={cn(
                  'flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors',
                  code === locale
                    ? 'bg-[#064E3B]/10 font-medium text-[#064E3B] dark:bg-emerald-950/50 dark:text-emerald-400'
                    : 'hover:bg-muted',
                )}
              >
                <span>{localeNames[code].native}</span>
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  {localeNames[code].short}
                  {code === locale && <Check className="size-3.5 text-[#064E3B] dark:text-emerald-400" />}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
