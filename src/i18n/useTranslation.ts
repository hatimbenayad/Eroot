import { useContext } from 'react';
import { en } from './en';
import { I18nContext, resolveTranslation, type I18nContextValue } from './translation';

export function useTranslation(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    return {
      locale: 'en',
      dict: en,
      t: (path, vars) => resolveTranslation(en as unknown as Record<string, unknown>, path, vars),
    };
  }
  return ctx;
}

