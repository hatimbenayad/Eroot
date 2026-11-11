import { useEffect, useState, type ReactNode } from 'react';
import { en } from './en';
import { es } from './es';
import { I18nContext, resolveTranslation, type I18nContextValue, type Locale } from './translation';

const STORAGE_KEY = 'eroot_locale';

function readInitialLocale(explicit?: Locale): Locale {
  if (explicit) return explicit;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'en' || stored === 'es') return stored;
  } catch {
    // Ignore storage restrictions
  }
  return 'en';
}

export function I18nProvider({
  children,
  locale: explicitLocale,
}: {
  children: ReactNode;
  locale?: Locale;
}) {
  const [locale, setLocaleState] = useState<Locale>(() => readInitialLocale(explicitLocale));

  useEffect(() => {
    if (explicitLocale) {
      setLocaleState(explicitLocale);
    }
  }, [explicitLocale]);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  function setLocale(next: Locale) {
    setLocaleState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Ignore storage errors
    }
  }

  const dict = locale === 'es' ? es : en;
  const value: I18nContextValue = {
    locale,
    setLocale,
    dict,
    t: (path, vars) => resolveTranslation(dict as unknown as Record<string, unknown>, path, vars),
  };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
