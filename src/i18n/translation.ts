import { createContext } from 'react';
import type { TranslationDictionary } from './en';

export type Locale = 'en' | 'es';

export interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  dict: TranslationDictionary;
  t: (path: string, vars?: Record<string, string>) => string;
}

export const I18nContext = createContext<I18nContextValue | null>(null);

export function resolveTranslation(
  dict: Record<string, unknown>,
  path: string,
  vars?: Record<string, string>
): string {
  const parts = path.split('.');
  let current: unknown = dict;

  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return path;
    }
  }

  if (typeof current !== 'string') {
    return path;
  }

  if (!vars) {
    return current;
  }

  return Object.entries(vars).reduce(
    (acc, [key, value]) => acc.replaceAll(`{${key}}`, value),
    current
  );
}
