'use client'

import { Languages } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/lib/i18n/context'

export function LanguageToggle() {
  const { locale, toggleLocale } = useLanguage()

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleLocale}
      aria-label={
        locale === 'fr'
          ? 'Switch to English'
          : 'Passer en français'
      }
      className="
        gap-1.5
        border-[#064E3B]/30
        font-medium
        text-[#064E3B]
        transition-colors

        hover:bg-[#064E3B]
        hover:text-white
        hover:border-[#064E3B]

        dark:border-emerald-800
        dark:text-emerald-400
        dark:hover:bg-[#064E3B]
        dark:hover:text-white
        dark:hover:border-[#064E3B]
      "
    >
      <Languages className="size-3.5" />

      <span className="tabular-nums">
        {locale === 'fr' ? 'FR' : 'EN'}
      </span>
    </Button>
  )
}