import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MotionConfig } from 'framer-motion';
import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';
import { HostAppShell } from '@/components/layout/HostAppShell';
import { Button } from '@/components/ui/button';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AuthPage } from '@/features/auth/AuthPage';
import { AuthProvider } from '@/features/auth/AuthProvider';
import { RequireAuth } from '@/features/auth/RequireAuth';
import { CreatorPage } from '@/features/creator/CreatorPage';
import { HostGamePage } from '@/features/host/HostGamePage';
import { LandingPage } from '@/features/landing/LandingPage';
import { LibraryPage } from '@/features/library/LibraryPage';
import { JoinPage } from '@/features/player/JoinPage';
import { PlayPage } from '@/features/player/PlayPage';
import { ReportDetailPage } from '@/features/reports/ReportDetailPage';
import { ReportsPage } from '@/features/reports/ReportsPage';
import { I18nProvider } from '@/i18n/I18nProvider';

function NotFoundPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-50 px-4 text-center">
      <h1 className="font-display text-3xl font-bold text-slate-900">Page not found</h1>
      <p className="text-sm text-slate-600">The requested route does not exist on Eroot.</p>
      <Button asChild>
        <Link to="/">Return home</Link>
      </Button>
    </main>
  );
}

export function App() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <AuthProvider>
          <TooltipProvider delayDuration={250}>
            <MotionConfig reducedMotion="user">
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/auth" element={<AuthPage />} />
                  <Route path="/join" element={<JoinPage />} />
                  <Route path="/play/:gameId" element={<PlayPage />} />

                  <Route element={<RequireAuth />}>
                    <Route path="/creator/:quizId" element={<CreatorPage />} />
                    <Route path="/host/:gameId" element={<HostGamePage />} />
                    <Route element={<HostAppShell />}>
                      <Route path="/library" element={<LibraryPage />} />
                      <Route path="/reports" element={<ReportsPage />} />
                      <Route path="/reports/:reportId" element={<ReportDetailPage />} />
                    </Route>
                  </Route>

                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </BrowserRouter>
            </MotionConfig>
          </TooltipProvider>
        </AuthProvider>
      </I18nProvider>
    </QueryClientProvider>
  );
}

