import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { BookOpen, BarChart3, LogOut } from 'lucide-react';
import { ErootLogo } from '@/components/eroot/ErootLogo';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/useAuth';
import { useTranslation } from '@/i18n/useTranslation';
import { cn } from '@/lib/cn';

export function HostAppShell() {
  const { user, signOut } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOut();
    navigate('/', { replace: true });
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-6">
            <Link to="/library" aria-label="Eroot Library">
              <ErootLogo size="sm" />
            </Link>

            <nav aria-label="Primary" className="flex items-center gap-1">
              <NavLink
                to="/library"
                className={({ isActive }) =>
                  cn(
                    'inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  )
                }
              >
                <BookOpen className="h-4 w-4" aria-hidden="true" />
                {t('nav.library')}
              </NavLink>
              <NavLink
                to="/reports"
                className={({ isActive }) =>
                  cn(
                    'inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  )
                }
              >
                <BarChart3 className="h-4 w-4" aria-hidden="true" />
                {t('nav.reports')}
              </NavLink>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {user?.email && (
              <span className="hidden text-sm text-slate-600 sm:inline">{user.email}</span>
            )}
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" aria-hidden="true" />
              {t('common.signOut')}
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
        <Outlet />
      </main>
    </div>
  );
}

