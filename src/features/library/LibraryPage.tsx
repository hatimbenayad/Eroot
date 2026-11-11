import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Copy, Edit3, FolderPlus, Loader2, Play, Plus, Trash2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAuth } from '@/features/auth/useAuth';
import {
  createNewQuiz,
  deleteQuizById,
  duplicateQuizById,
  fetchLibraryQuizzes,
  type LibraryQuizSummary,
} from '@/features/creator/api';
import { GameOptionsModal } from '@/features/host/GameOptionsModal';
import { useTranslation } from '@/i18n/useTranslation';
import { getErootTheme } from '@shared/constants/themes';

export function LibraryPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [deleteTarget, setDeleteTarget] = useState<LibraryQuizSummary | null>(null);
  const [hostTarget, setHostTarget] = useState<LibraryQuizSummary | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const quizzesQuery = useQuery({
    queryKey: ['library-quizzes', user?.id],
    queryFn: () => fetchLibraryQuizzes(user!.id),
    enabled: Boolean(user?.id),
  });

  const createMutation = useMutation({
    mutationFn: () => createNewQuiz(user!.id),
    onSuccess: (quizId) => {
      void queryClient.invalidateQueries({ queryKey: ['library-quizzes', user?.id] });
      navigate(`/creator/${quizId}`);
    },
    onError: (err) => setActionError(err instanceof Error ? err.message : 'Could not create quiz'),
  });

  const duplicateMutation = useMutation({
    mutationFn: (quizId: string) => duplicateQuizById(quizId, user!.id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['library-quizzes', user?.id] });
    },
    onError: (err) =>
      setActionError(err instanceof Error ? err.message : 'Could not duplicate quiz'),
  });

  const deleteMutation = useMutation({
    mutationFn: (quizId: string) => deleteQuizById(quizId),
    onSuccess: () => {
      setDeleteTarget(null);
      void queryClient.invalidateQueries({ queryKey: ['library-quizzes', user?.id] });
    },
    onError: (err) => setActionError(err instanceof Error ? err.message : 'Could not delete quiz'),
  });

  const quizzes = quizzesQuery.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">{t('library.title')}</h1>
          <p className="text-sm text-slate-600">
            {t('library.signedInAs')}{' '}
            <span className="font-medium text-slate-900">{user?.email}</span>
          </p>
        </div>

        <Button
          type="button"
          loading={createMutation.isPending}
          onClick={() => {
            setActionError(null);
            createMutation.mutate();
          }}
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          {t('library.createQuiz')}
        </Button>
      </div>

      {actionError && <Alert variant="error">{actionError}</Alert>}
      {quizzesQuery.isError && (
        <Alert variant="error">
          {quizzesQuery.error instanceof Error
            ? quizzesQuery.error.message
            : 'Failed to load quizzes.'}
        </Alert>
      )}

      {quizzesQuery.isLoading ? (
        <div role="status" className="flex items-center justify-center py-16 text-slate-600">
          <Loader2 className="mr-2 h-5 w-5 animate-spin text-indigo-600" aria-hidden="true" />
          {t('common.loading')}
        </div>
      ) : quizzes.length === 0 ? (
        <Card className="border-dashed">
          <CardHeader className="items-center text-center py-12">
            <div className="mb-3 rounded-full bg-indigo-50 p-3 text-indigo-600">
              <FolderPlus className="h-7 w-7" aria-hidden="true" />
            </div>
            <CardTitle>{t('library.emptyTitle')}</CardTitle>
            <CardDescription className="max-w-md">{t('library.emptyDescription')}</CardDescription>
            <div className="pt-4">
              <Button type="button" onClick={() => createMutation.mutate()}>
                <Plus className="h-4 w-4" aria-hidden="true" />
                {t('library.createQuiz')}
              </Button>
            </div>
          </CardHeader>
          <CardContent />
        </Card>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {quizzes.map((item) => {
            const theme = getErootTheme(item.quiz.themeId);
            const displayTitle = item.quiz.title.trim() || t('library.untitledQuiz');

            return (
              <Card key={item.quiz.id} className="overflow-hidden flex flex-col">
                <div className={`relative h-28 w-full ${theme.canvasBackdropClass}`}>
                  {item.quiz.coverImageUrl && (
                    <img
                      src={item.quiz.coverImageUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  )}
                  <span
                    className={`absolute right-3 top-3 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      item.quiz.isValid
                        ? 'bg-emerald-100 text-emerald-900'
                        : 'bg-violet-100 text-violet-900'
                    }`}
                  >
                    {item.quiz.isValid ? t('library.readyBadge') : t('library.draftBadge')}
                  </span>
                </div>

                <CardHeader className="flex-1 pb-3">
                  <CardTitle className="line-clamp-1 text-lg">{displayTitle}</CardTitle>
                  <CardDescription>
                    {t('library.slidesCount', { count: String(item.slideCount) })} ·{' '}
                    {item.quiz.visibility}
                  </CardDescription>
                </CardHeader>

                <CardContent className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
                  <Button asChild size="sm" variant="outline">
                    <Link to={`/creator/${item.quiz.id}`}>
                      <Edit3 className="h-3.5 w-3.5" aria-hidden="true" />
                      {t('library.editQuiz')}
                    </Link>
                  </Button>

                  <Button
                    type="button"
                    size="sm"
                    disabled={!item.quiz.isValid}
                    onClick={() => setHostTarget(item)}
                    title={
                      item.quiz.isValid
                        ? 'Launch live game'
                        : 'Fix invalid slides before hosting'
                    }
                  >
                    <Play className="h-3.5 w-3.5" aria-hidden="true" />
                    {t('library.hostLive')}
                  </Button>

                  <div className="ml-auto flex items-center gap-1">
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      aria-label={`Duplicate ${displayTitle}`}
                      onClick={() => duplicateMutation.mutate(item.quiz.id)}
                    >
                      <Copy className="h-4 w-4" aria-hidden="true" />
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      aria-label={`Delete ${displayTitle}`}
                      onClick={() => setDeleteTarget(item)}
                      className="text-red-600 hover:bg-red-50 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('library.confirmDeleteTitle')}</DialogTitle>
            <DialogDescription>
              {t('library.confirmDeleteDesc', {
                title: deleteTarget?.quiz.title.trim() || t('library.untitledQuiz'),
              })}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setDeleteTarget(null)}>
              {t('common.cancel')}
            </Button>
            <Button
              type="button"
              variant="danger"
              loading={deleteMutation.isPending}
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.quiz.id)}
            >
              {t('common.delete')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <GameOptionsModal
        open={Boolean(hostTarget)}
        onOpenChange={(open) => !open && setHostTarget(null)}
        quizId={hostTarget?.quiz.id ?? null}
        quizTitle={hostTarget?.quiz.title ?? ''}
      />
    </div>
  );
}
