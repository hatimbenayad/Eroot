import { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Compass, Copy, Loader2, Search, Sparkles } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ErootLogo } from '@/components/eroot/ErootLogo';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/features/auth/useAuth';
import {
  cloneQuizToMyLibrary,
  cloneTemplateToLibrary,
  fetchDiscoverQuizzes,
  fetchSharedQuizById,
} from '@/features/creator/api';
import { STARTER_TEMPLATES, type StarterTemplate } from '@shared/constants/templates';
import { getErootTheme } from '@shared/constants/themes';

export function DiscoverPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sharedQuizId = searchParams.get('shared');

  const [keyword, setKeyword] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [languageFilter, setLanguageFilter] = useState('all');
  const [actionError, setActionError] = useState<string | null>(null);

  const publicQuery = useQuery({
    queryKey: ['discover-public'],
    queryFn: fetchDiscoverQuizzes,
  });

  const sharedQuery = useQuery({
    queryKey: ['discover-shared', sharedQuizId],
    queryFn: () => fetchSharedQuizById(sharedQuizId!),
    enabled: Boolean(sharedQuizId),
  });

  const templateMutation = useMutation({
    mutationFn: (tpl: StarterTemplate) => cloneTemplateToLibrary(user!.id, tpl),
    onSuccess: (newQuizId) => navigate(`/creator/${newQuizId}`),
    onError: (err) => setActionError(err instanceof Error ? err.message : 'Could not use template'),
  });

  const copyQuizMutation = useMutation({
    mutationFn: (quizId: string) => cloneQuizToMyLibrary(quizId, user!.id),
    onSuccess: (newQuizId) => navigate(`/creator/${newQuizId}`),
    onError: (err) => setActionError(err instanceof Error ? err.message : 'Could not copy quiz'),
  });

  const publicQuizzes = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    return (publicQuery.data ?? []).filter((item) => {
      if (subjectFilter !== 'all' && item.quiz.subject !== subjectFilter) return false;
      if (languageFilter !== 'all' && item.quiz.language !== languageFilter) return false;
      if (q) {
        const hay = [
          item.quiz.title,
          item.quiz.description,
          item.quiz.subject ?? '',
          ...(item.quiz.tags ?? []),
        ]
          .join(' ')
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [publicQuery.data, keyword, subjectFilter, languageFilter]);

  const subjects = useMemo(() => {
    const set = new Set<string>();
    for (const item of publicQuery.data ?? []) {
      if (item.quiz.subject) set.add(item.quiz.subject);
    }
    return Array.from(set).sort();
  }, [publicQuery.data]);

  function handleUseTemplate(tpl: StarterTemplate) {
    if (!user) {
      navigate('/auth?redirect=%2Fdiscover');
      return;
    }
    setActionError(null);
    templateMutation.mutate(tpl);
  }

  function handleCopyPublic(quizId: string) {
    if (!user) {
      navigate('/auth?redirect=%2Fdiscover');
      return;
    }
    setActionError(null);
    copyQuizMutation.mutate(quizId);
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {!user && (
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
            <Link to="/" aria-label="Eroot home">
              <ErootLogo size="sm" />
            </Link>
            <div className="flex items-center gap-3">
              <Button asChild variant="outline" size="sm">
                <Link to="/join">Join game</Link>
              </Button>
              <Button asChild size="sm">
                <Link to="/auth">Host sign in</Link>
              </Button>
            </div>
          </div>
        </header>
      )}

      <main className="mx-auto w-full max-w-7xl flex-1 space-y-10 px-4 py-8 sm:px-6">
        <div className="space-y-1">
          <h1 className="font-display text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Compass className="h-6 w-6 text-indigo-600" aria-hidden="true" />
            Discover &amp; Starter Templates
          </h1>
          <p className="text-sm text-slate-600">
            Start quickly from a free template or copy public community quizzes into your library.
          </p>
        </div>

        {actionError && <Alert variant="error">{actionError}</Alert>}

        {sharedQuizId && sharedQuery.data && (
          <Card className="border-indigo-300 bg-indigo-50/70">
            <CardHeader>
              <CardTitle>Shared Quiz: {sharedQuery.data.quiz.title || 'Untitled'}</CardTitle>
              <CardDescription>
                {sharedQuery.data.slides.length} slides · {sharedQuery.data.quiz.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                type="button"
                loading={copyQuizMutation.isPending}
                onClick={() => handleCopyPublic(sharedQuery.data!.quiz.id)}
              >
                <Copy className="h-4 w-4" aria-hidden="true" />
                Copy to My Library
              </Button>
            </CardContent>
          </Card>
        )}

        {/* 5 Starter Templates */}
        <section className="space-y-4">
          <h2 className="font-display text-lg font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-indigo-600" aria-hidden="true" />
            Starter Templates
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {STARTER_TEMPLATES.map((tpl) => {
              const theme = getErootTheme(tpl.themeId);
              return (
                <Card key={tpl.id} className="overflow-hidden flex flex-col">
                  <div className={`h-20 w-full ${theme.canvasBackdropClass} p-4 flex items-end`}>
                    <span className="rounded-full bg-white/90 px-2.5 py-0.5 text-xs font-bold text-slate-900">
                      {tpl.subject}
                    </span>
                  </div>
                  <CardHeader className="flex-1 pb-3">
                    <CardTitle className="text-base">{tpl.title}</CardTitle>
                    <CardDescription>{tpl.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <Button
                      type="button"
                      size="sm"
                      className="w-full"
                      loading={templateMutation.isPending}
                      onClick={() => handleUseTemplate(tpl)}
                    >
                      Use template
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Public Discover Catalog */}
        <section className="space-y-4">
          <h2 className="font-display text-lg font-bold text-slate-900">Public Quizzes</h2>

          <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-4">
            <div className="relative sm:col-span-2">
              <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                aria-label="Search public quizzes"
                placeholder="Search by title, tag, or keyword..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="pl-9"
              />
            </div>

            <select
              aria-label="Filter by subject"
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm"
            >
              <option value="all">All subjects</option>
              {subjects.map((sub) => (
                <option key={sub} value={sub}>
                  {sub}
                </option>
              ))}
            </select>

            <select
              aria-label="Filter by language"
              value={languageFilter}
              onChange={(e) => setLanguageFilter(e.target.value)}
              className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm"
            >
              <option value="all">All languages</option>
              <option value="en">English</option>
              <option value="es">Spanish</option>
            </select>
          </div>

          {publicQuery.isLoading ? (
            <div role="status" className="flex items-center justify-center py-12 text-slate-600">
              <Loader2 className="mr-2 h-5 w-5 animate-spin text-indigo-600" aria-hidden="true" />
              Loading public quizzes...
            </div>
          ) : publicQuizzes.length === 0 ? (
            <Card className="border-dashed">
              <CardHeader className="text-center py-10">
                <CardTitle className="text-base">No public quizzes match yet</CardTitle>
                <CardDescription>
                  Publish any quiz as Public in My Library or try one of the Starter Templates above.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {publicQuizzes.map((item) => {
                const theme = getErootTheme(item.quiz.themeId);
                return (
                  <Card key={item.quiz.id} className="overflow-hidden flex flex-col">
                    <div className={`h-20 w-full ${theme.canvasBackdropClass}`} />
                    <CardHeader className="flex-1 pb-3">
                      <CardTitle className="text-base line-clamp-1">
                        {item.quiz.title || 'Untitled quiz'}
                      </CardTitle>
                      <CardDescription>
                        {item.slideCount} slides · {item.quiz.subject || 'General'} ·{' '}
                        {item.quiz.language.toUpperCase()}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="w-full"
                        loading={copyQuizMutation.isPending}
                        onClick={() => handleCopyPublic(item.quiz.id)}
                      >
                        <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                        Copy to My Library
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

