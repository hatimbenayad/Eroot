import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useTranslation } from '@/i18n/useTranslation';
import { useAuth } from './useAuth';

export function RequireAuth() {
  const { user, loading } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();

  if (loading) {
    return (
      <div
        role="status"
        aria-label={t('auth.checkingSession')}
        className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-50 text-slate-700"
      >
        <Loader2 className="h-7 w-7 animate-spin text-indigo-600" aria-hidden="true" />
        <p className="text-sm font-medium">{t('auth.checkingSession')}</p>
      </div>
    );
  }

  if (!user) {
    const redirectTarget = `${location.pathname}${location.search}`;
    return <Navigate to={`/auth?redirect=${encodeURIComponent(redirectTarget)}`} replace />;
  }

  return <Outlet />;
}

