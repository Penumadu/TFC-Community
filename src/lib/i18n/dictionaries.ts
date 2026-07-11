import 'server-only'

import en from './en.json'
import te from './te.json'

const dictionaries = {
  en: () => Promise.resolve(en),
  te: () => Promise.resolve(te),
}

export type Locale = keyof typeof dictionaries
export type Dictionary = typeof en

export const SUPPORTED_LOCALES: Locale[] = ['en', 'te']
export const DEFAULT_LOCALE: Locale = 'en'

export const hasLocale = (locale: string): locale is Locale =>
  locale in dictionaries

export const getDictionary = async (locale: Locale): Promise<Dictionary> =>
  dictionaries[locale]() as Promise<Dictionary>

/** Deep-get a nested translation key: t('nav.directory') */
export function t(dict: Dictionary, key: string, params?: Record<string, string | number>): string {
  const keys = key.split('.')
  let value: unknown = dict
  for (const k of keys) {
    if (value && typeof value === 'object' && k in (value as object)) {
      value = (value as Record<string, unknown>)[k]
    } else {
      return key // fallback to key if not found
    }
  }
  if (typeof value !== 'string') return key

  if (params) {
    return value.replace(/\{(\w+)\}/g, (_, k) => String(params[k] ?? `{${k}}`))
  }
  return value
}
