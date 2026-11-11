import { Globe } from 'lucide-react';
import { useTranslation } from '@/i18n/useTranslation';
import { cn } from '@/lib/cn';

export function LanguageSwitcher({
  tone = 'light',
  className,
}: {
  tone?: 'light' | 'dark';
  className?: string;
}) {
  const { locale, setLocale } = useTranslation();

  return (
    <div
      role="group"
      aria-label="Language switcher"
      className={cn(
        'inline-flex items-center rounded-lg border p-0.5 text-xs font-bold',
        tone === 'dark'
          ? 'border-white/25 bg-black/25 text-white'
          : 'border-slate-300 bg-white text-slate-800',
        className
      )}
    >
      <Globe className="mx-1.5 h-3.5 w-3.5 opacity-80" aria-hidden="true" />
      <button
        type="button"
        aria-pressed={locale === 'en'}
        onClick={() => setLocale('en')}
        className={cn(
          'rounded-md px-2 py-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500',
          locale === 'en'
            ? tone === 'dark'
              ? 'bg-white text-slate-900'
              : 'bg-indigo-600 text-white'
            : tone === 'dark'
              ? 'text-indigo-100 hover:bg-white/10'
              : 'text-slate-600 hover:bg-slate-100'
        )}
      >
        EN
      </button>
      <button
        type="button"
        aria-pressed={locale === 'es'}
        onClick={() => setLocale('es')}
        className={cn(
          'rounded-md px-2 py-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500',
          locale === 'es'
            ? tone === 'dark'
              ? 'bg-white text-slate-900'
              : 'bg-indigo-600 text-white'
            : tone === 'dark'
              ? 'text-indigo-100 hover:bg-white/10'
              : 'text-slate-600 hover:bg-slate-100'
        )}
      >
        ES
      </button>
    </div>
  );
}

