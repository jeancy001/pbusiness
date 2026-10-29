'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { dictionary, locales, type Locale, type TranslationKey } from './dictionary'
import { ee, gaa, tw } from './local-languages'
import eeDraft from './generated/ee.json'
import gaaDraft from './generated/gaa.json'
import twDraft from './generated/tw.json'

type Table = Partial<Record<TranslationKey, string>>

// Reviewed strings first, then machine drafts (scripts/translate-locales.mjs), then English.
const localDictionaries: Record<'tw' | 'gaa' | 'ee', Table[]> = {
  tw: [tw, twDraft as Table],
  gaa: [gaa, gaaDraft as Table],
  ee: [ee, eeDraft as Table],
}

function translate(locale: Locale, key: TranslationKey): string {
  if (locale === 'fr' || locale === 'en') return dictionary[locale][key] ?? dictionary.fr[key] ?? key
  for (const table of localDictionaries[locale]) if (table[key]) return table[key]
  return dictionary.en[key] ?? key
}

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
    if (stored && locales.includes(stored)) {
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

  const t = useCallback((key: TranslationKey) => translate(locale, key), [locale])

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
