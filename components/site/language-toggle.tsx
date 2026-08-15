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
      aria-label={locale === 'fr' ? 'Switch to English' : 'Passer en français'}
      className="gap-1.5 font-medium"
    >
      <Languages className="size-3.5" />
      <span className="tabular-nums">{locale === 'fr' ? 'FR' : 'EN'}</span>
    </Button>
  )
}
