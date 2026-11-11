import type { ReactNode } from 'react';
import { en } from './en';
import { I18nContext, resolveTranslation, type I18nContextValue, type Locale } from './translation';

export function I18nProvider({
  children,
  locale = 'en',
}: {
  children: ReactNode;
  locale?: Locale;
}) {
  const dict = en;
  const value: I18nContextValue = {
    locale,
    dict,
    t: (path, vars) => resolveTranslation(dict as unknown as Record<string, unknown>, path, vars),
  };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

