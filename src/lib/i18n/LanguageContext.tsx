'use client'

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react'
import { setPreference, getPreference } from '@/lib/db/offline'
import type { Locale, Dictionary } from '@/lib/i18n/dictionaries'
import en from '@/lib/i18n/en.json'

interface LanguageContextValue {
  locale: Locale
  dict: Dictionary
  toggleLanguage: () => void
  isLoading: boolean
}

const LanguageContext = createContext<LanguageContextValue>({
  locale: 'en',
  dict: en as Dictionary,
  toggleLanguage: () => {},
  isLoading: false,
})

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>('en')
  const [dict, setDict] = useState<Dictionary>(en as Dictionary)
  const [isLoading, setIsLoading] = useState(false)

  // Load saved preference from IndexedDB on mount
  useEffect(() => {
    getPreference<Locale>('locale', 'en').then((saved) => {
      if (saved !== 'en') loadDict(saved)
    })
  }, [])

  const loadDict = useCallback(async (newLocale: Locale) => {
    setIsLoading(true)
    try {
      const module = await import(`@/lib/i18n/${newLocale}.json`)
      setDict(module.default as Dictionary)
      setLocale(newLocale)
      await setPreference('locale', newLocale)
      // Update <html lang> attribute for screen readers
      document.documentElement.lang = newLocale
    } finally {
      setIsLoading(false)
    }
  }, [])

  const toggleLanguage = useCallback(() => {
    const next: Locale = locale === 'en' ? 'te' : 'en'
    loadDict(next)
  }, [locale, loadDict])

  return (
    <LanguageContext.Provider value={{ locale, dict, toggleLanguage, isLoading }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  return useContext(LanguageContext)
}

/** Shorthand hook for just the translation function */
export function useT() {
  const { dict, locale } = useContext(LanguageContext)
  return {
    locale,
    t: (key: string, params?: Record<string, string | number>): string => {
      const keys = key.split('.')
      let value: unknown = dict
      for (const k of keys) {
        if (value && typeof value === 'object' && k in (value as object)) {
          value = (value as Record<string, unknown>)[k]
        } else {
          return key
        }
      }
      if (typeof value !== 'string') return key
      if (params) {
        return value.replace(/\{(\w+)\}/g, (_, k) => String(params[k] ?? `{${k}}`))
      }
      return value
    },
  }
}
