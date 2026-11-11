import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Copy,
  Edit3,
  Folder,
  FolderPlus,
  Loader2,
  Play,
  Plus,
  Share2,
  Star,
  Trash2,
} from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/features/auth/useAuth';
import {
  createFolder,
  createNewQuiz,
  deleteFolder,
  deleteQuizById,
  duplicateQuizById,
  fetchFolders,
  fetchLibraryQuizzes,
  moveQuizToFolder,
  toggleQuizFavourite,
  updateQuizSharing,
  type LibraryQuizSummary,
} from '@/features/creator/api';
import { GameOptionsModal } from '@/features/host/GameOptionsModal';
import { useTranslation } from '@/i18n/useTranslation';
import { cn } from '@/lib/cn';
import { getErootTheme } from '@shared/constants/themes';
import type { QuizVisibility } from '@shared/types/database';

type LibraryTab = 'all' | 'drafts' | 'published' | 'favourites';

export function LibraryPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<LibraryTab>('all');
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const [deleteTarget, setDeleteTarget] = useState<LibraryQuizSummary | null>(null);
  const [hostTarget, setHostTarget] = useState<LibraryQuizSummary | null>(null);
  const [shareTarget, setShareTarget] = useState<LibraryQuizSummary | null>(null);
  const [shareVisibility, setShareVisibility] = useState<QuizVisibility>('private');
  const [shareSubject, setShareSubject] = useState('');
  const [shareTags, setShareTags] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const quizzesQuery = useQuery({
    queryKey: ['library-quizzes', user?.id],
    queryFn: () => fetchLibraryQuizzes(user!.id),
    enabled: Boolean(user?.id),
  });

  const foldersQuery = useQuery({
    queryKey: ['library-folders', user?.id],
    queryFn: () => fetchFolders(user!.id),
    enabled: Boolean(user?.id),
  });

  const invalidateAll = () => {
    void queryClient.invalidateQueries({ queryKey: ['library-quizzes', user?.id] });
    void queryClient.invalidateQueries({ queryKey: ['library-folders', user?.id] });
  };

  const createMutation = useMutation({
    mutationFn: () => createNewQuiz(user!.id),
    onSuccess: (quizId) => {
      invalidateAll();
      navigate(`/creator/${quizId}`);
    },
    onError: (err) => setActionError(err instanceof Error ? err.message : 'Could not create quiz'),
  });

  const duplicateMutation = useMutation({
    mutationFn: (quizId: string) => duplicateQuizById(quizId, user!.id),
    onSuccess: invalidateAll,
    onError: (err) =>
      setActionError(err instanceof Error ? err.message : 'Could not duplicate quiz'),
  });

  const deleteMutation = useMutation({
    mutationFn: (quizId: string) => deleteQuizById(quizId),
    onSuccess: () => {
      setDeleteTarget(null);
      invalidateAll();
    },
    onError: (err) => setActionError(err instanceof Error ? err.message : 'Could not delete quiz'),
  });

  const createFolderMutation = useMutation({
    mutationFn: (name: string) => createFolder(user!.id, name),
    onSuccess: () => {
      setNewFolderName('');
      setNewFolderOpen(false);
      invalidateAll();
    },
  });

  const deleteFolderMutation = useMutation({
    mutationFn: (folderId: string) => deleteFolder(folderId),
    onSuccess: (_d, folderId) => {
      if (activeFolderId === folderId) setActiveFolderId(null);
      invalidateAll();
    },
  });

  const favMutation = useMutation({
    mutationFn: ({ id, next }: { id: string; next: boolean }) => toggleQuizFavourite(id, next),
    onSuccess: invalidateAll,
  });

  const moveFolderMutation = useMutation({
    mutationFn: ({ id, folderId }: { id: string; folderId: string | null }) =>
      moveQuizToFolder(id, folderId),
    onSuccess: invalidateAll,
  });

  const shareMutation = useMutation({
    mutationFn: () =>
      updateQuizSharing(shareTarget!.quiz.id, {
        visibility: shareVisibility,
        subject: shareSubject,
        tags: shareTags
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      }),
    onSuccess: () => {
      setShareTarget(null);
      invalidateAll();
    },
  });

  const quizzes = useMemo(() => {
    const raw = quizzesQuery.data ?? [];
    return raw.filter((item) => {
      if (activeTab === 'drafts' && item.quiz.isPublished) return false;
      if (activeTab === 'published' && !item.quiz.isPublished) return false;
      if (activeTab === 'favourites' && !item.quiz.isFavourite) return false;
      if (activeFolderId && item.quiz.folderId !== activeFolderId) return false;
      return true;
    });
  }, [quizzesQuery.data, activeTab, activeFolderId]);

  const folders = foldersQuery.data ?? [];

  const shareUrl =
    shareTarget && typeof window !== 'undefined'
      ? `${window.location.origin}/discover?shared=${shareTarget.quiz.id}`
      : '';

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

        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" onClick={() => setNewFolderOpen(true)}>
            <FolderPlus className="h-4 w-4" aria-hidden="true" />
            New folder
          </Button>
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
      </div>

      {/* Filter Tabs & Folders Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3">
        <div className="flex flex-wrap gap-1">
          {(['all', 'drafts', 'published', 'favourites'] as LibraryTab[]).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={cn(
                'rounded-lg px-3 py-1.5 text-sm font-semibold capitalize transition-colors',
                activeTab === tab
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveFolderId(null)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold',
              activeFolderId === null
                ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            )}
          >
            All folders
          </button>
          {folders.map((folder) => (
            <div key={folder.id} className="inline-flex items-center gap-1">
              <button
                type="button"
                onClick={() => setActiveFolderId(folder.id)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold',
                  activeFolderId === folder.id
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                )}
              >
                <Folder className="h-3.5 w-3.5" aria-hidden="true" />
                {folder.name}
              </button>
              <button
                type="button"
                aria-label={`Delete folder ${folder.name}`}
                onClick={() => deleteFolderMutation.mutate(folder.id)}
                className="rounded-full p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 className="h-3 w-3" aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
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
            <div className="flex flex-wrap gap-2 pt-4">
              <Button type="button" onClick={() => createMutation.mutate()}>
                <Plus className="h-4 w-4" aria-hidden="true" />
                {t('library.createQuiz')}
              </Button>
              <Button asChild variant="outline">
                <Link to="/discover">Browse Templates &amp; Discover</Link>
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
                  <button
                    type="button"
                    aria-label={
                      item.quiz.isFavourite
                        ? `Unfavourite ${displayTitle}`
                        : `Favourite ${displayTitle}`
                    }
                    onClick={() =>
                      favMutation.mutate({
                        id: item.quiz.id,
                        next: !item.quiz.isFavourite,
                      })
                    }
                    className="absolute left-3 top-3 rounded-full bg-black/35 p-1.5 text-white hover:bg-black/55"
                  >
                    <Star
                      className={cn(
                        'h-4 w-4',
                        item.quiz.isFavourite && 'fill-amber-400 text-amber-400'
                      )}
                      aria-hidden="true"
                    />
                  </button>
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

                <CardHeader className="flex-1 pb-3 space-y-2">
                  <CardTitle className="line-clamp-1 text-lg">{displayTitle}</CardTitle>
                  <CardDescription>
                    {t('library.slidesCount', { count: String(item.slideCount) })} ·{' '}
                    {item.quiz.visibility}
                  </CardDescription>
                  {folders.length > 0 && (
                    <div>
                      <label htmlFor={`folder-select-${item.quiz.id}`} className="sr-only">
                        Move to folder
                      </label>
                      <select
                        id={`folder-select-${item.quiz.id}`}
                        value={item.quiz.folderId ?? ''}
                        onChange={(e) =>
                          moveFolderMutation.mutate({
                            id: item.quiz.id,
                            folderId: e.target.value || null,
                          })
                        }
                        className="h-8 w-full rounded-md border border-slate-200 bg-slate-50 px-2 text-xs text-slate-700"
                      >
                        <option value="">No folder</option>
                        {folders.map((f) => (
                          <option key={f.id} value={f.id}>
                            Folder: {f.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
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
                  >
                    <Play className="h-3.5 w-3.5" aria-hidden="true" />
                    {t('library.hostLive')}
                  </Button>

                  <div className="ml-auto flex items-center gap-1">
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      aria-label={`Share ${displayTitle}`}
                      onClick={() => {
                        setShareTarget(item);
                        setShareVisibility(item.quiz.visibility);
                        setShareSubject(item.quiz.subject ?? '');
                        setShareTags((item.quiz.tags ?? []).join(', '));
                        setCopiedLink(false);
                      }}
                    >
                      <Share2 className="h-4 w-4" aria-hidden="true" />
                    </Button>
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

      {/* New Folder Dialog */}
      <Dialog open={newFolderOpen} onOpenChange={setNewFolderOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create folder</DialogTitle>
            <DialogDescription>Group related quizzes together.</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (newFolderName.trim()) createFolderMutation.mutate(newFolderName);
            }}
            className="mt-3 space-y-4"
          >
            <div className="space-y-1.5">
              <Label htmlFor="folder-name-input">Folder name</Label>
              <Input
                id="folder-name-input"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                required
                maxLength={60}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setNewFolderOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={createFolderMutation.isPending}>
                Create
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Share & Discover Metadata Dialog */}
      <Dialog open={Boolean(shareTarget)} onOpenChange={(open) => !open && setShareTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share &amp; Visibility</DialogTitle>
            <DialogDescription>
              Publish to Discover or share a direct copy link.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-3 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="share-visibility">Visibility</Label>
              <select
                id="share-visibility"
                value={shareVisibility}
                onChange={(e) => setShareVisibility(e.target.value as QuizVisibility)}
                className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
              >
                <option value="private">Private (only you)</option>
                <option value="link">Shared by link</option>
                <option value="public">Public (Discover catalog)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="share-subject">Subject (for Discover)</Label>
              <Input
                id="share-subject"
                value={shareSubject}
                onChange={(e) => setShareSubject(e.target.value)}
                placeholder="e.g., Biology, Geography, Onboarding"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="share-tags">Tags (comma-separated)</Label>
              <Input
                id="share-tags"
                value={shareTags}
                onChange={(e) => setShareTags(e.target.value)}
                placeholder="trivia, science, review"
              />
            </div>

            {(shareVisibility === 'link' || shareVisibility === 'public') && shareUrl && (
              <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2">
                <span className="flex-1 truncate text-xs text-slate-600">{shareUrl}</span>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    void navigator.clipboard?.writeText(shareUrl);
                    setCopiedLink(true);
                  }}
                >
                  {copiedLink ? 'Copied' : 'Copy link'}
                </Button>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShareTarget(null)}>
                Cancel
              </Button>
              <Button
                type="button"
                loading={shareMutation.isPending}
                onClick={() => shareMutation.mutate()}
              >
                Save sharing
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
