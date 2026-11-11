import { lazy, Suspense, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MotionConfig } from 'framer-motion';
import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';
import { HostAppShell } from '@/components/layout/HostAppShell';
import { Button } from '@/components/ui/button';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AuthPage } from '@/features/auth/AuthPage';
import { AuthProvider } from '@/features/auth/AuthProvider';
import { RequireAuth } from '@/features/auth/RequireAuth';
import { useAuth } from '@/features/auth/useAuth';
import { LandingPage } from '@/features/landing/LandingPage';
import { JoinPage } from '@/features/player/JoinPage';
import { PlayPage } from '@/features/player/PlayPage';
import { I18nProvider } from '@/i18n/I18nProvider';

const LibraryPage = lazy(() =>
  import('@/features/library/LibraryPage').then((m) => ({ default: m.LibraryPage }))
);
const CreatorPage = lazy(() =>
  import('@/features/creator/CreatorPage').then((m) => ({ default: m.CreatorPage }))
);
const HostGamePage = lazy(() =>
  import('@/features/host/HostGamePage').then((m) => ({ default: m.HostGamePage }))
);
const DiscoverPage = lazy(() =>
  import('@/features/discover/DiscoverPage').then((m) => ({ default: m.DiscoverPage }))
);
const ReportsPage = lazy(() =>
  import('@/features/reports/ReportsPage').then((m) => ({ default: m.ReportsPage }))
);
const ReportDetailPage = lazy(() =>
  import('@/features/reports/ReportDetailPage').then((m) => ({ default: m.ReportDetailPage }))
);
const ChallengesPage = lazy(() =>
  import('@/features/challenges/ChallengesPage').then((m) => ({ default: m.ChallengesPage }))
);
const ChallengePlayPage = lazy(() =>
  import('@/features/challenges/ChallengePlayPage').then((m) => ({ default: m.ChallengePlayPage }))
);

function RouteLoadingFallback() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="min-h-screen flex items-center justify-center bg-slate-50 text-sm font-semibold text-slate-600"
    >
      Loading...
    </div>
  );
}

function DiscoverRoute() {
  const { user } = useAuth();
  if (user) {
    return (
      <HostAppShell>
        <DiscoverPage />
      </HostAppShell>
    );
  }
  return <DiscoverPage />;
}

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
                <Suspense fallback={<RouteLoadingFallback />}>
                  <Routes>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/auth" element={<AuthPage />} />
                    <Route path="/join" element={<JoinPage />} />
                    <Route path="/play/:gameId" element={<PlayPage />} />
                    <Route path="/challenge/:pin" element={<ChallengePlayPage />} />
                    <Route path="/discover" element={<DiscoverRoute />} />

                    <Route element={<RequireAuth />}>
                      <Route path="/creator/:quizId" element={<CreatorPage />} />
                      <Route path="/host/:gameId" element={<HostGamePage />} />
                      <Route element={<HostAppShell />}>
                        <Route path="/library" element={<LibraryPage />} />
                        <Route path="/reports" element={<ReportsPage />} />
                        <Route path="/reports/:reportId" element={<ReportDetailPage />} />
                        <Route path="/challenges" element={<ChallengesPage />} />
                      </Route>
                    </Route>

                    <Route path="*" element={<NotFoundPage />} />
                  </Routes>
                </Suspense>
              </BrowserRouter>
            </MotionConfig>
          </TooltipProvider>
        </AuthProvider>
      </I18nProvider>
    </QueryClientProvider>
  );
}
