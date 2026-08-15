'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { dictionary, type Locale, type TranslationKey } from './dictionary'

type LanguageContextValue = {
  locale: Locale
  setLocale: (locale: Locale) => void
  toggleLocale: () => void
  t: (key: TranslationKey) => string
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

const STORAGE_KEY = 'pbbo-locale'

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('fr')

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY) as Locale | null
    if (stored === 'fr' || stored === 'en') {
      setLocaleState(stored)
      document.documentElement.lang = stored
    }
  }, [])

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next)
    window.localStorage.setItem(STORAGE_KEY, next)
    document.documentElement.lang = next
  }, [])

  const toggleLocale = useCallback(() => {
    setLocale(locale === 'fr' ? 'en' : 'fr')
  }, [locale, setLocale])

  const t = useCallback(
    (key: TranslationKey) => dictionary[locale][key] ?? dictionary.fr[key] ?? key,
    [locale],
  )

  return (
    <LanguageContext.Provider value={{ locale, setLocale, toggleLocale, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider')
  return ctx
}

// Alias kept for ergonomics; identical to useLanguage.
export const useI18n = useLanguage
