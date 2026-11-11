import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BarChart3, Edit2, Loader2, Search, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
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
  deleteReportById,
  fetchReportsList,
  renameReportById,
  type ReportSummaryItem,
} from '@/features/reports/api';
import { useTranslation } from '@/i18n/useTranslation';

export function ReportsPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [modeFilter, setModeFilter] = useState<'all' | 'live' | 'challenge'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | '7d' | '30d'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'title'>('newest');

  const [renameTarget, setRenameTarget] = useState<ReportSummaryItem | null>(null);
  const [renameText, setRenameText] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<ReportSummaryItem | null>(null);

  const reportsQuery = useQuery({
    queryKey: ['reports-list', user?.id],
    queryFn: () => fetchReportsList(user!.id),
    enabled: Boolean(user?.id),
  });

  const renameMutation = useMutation({
    mutationFn: ({ id, title }: { id: string; title: string }) => renameReportById(id, title),
    onSuccess: () => {
      setRenameTarget(null);
      void queryClient.invalidateQueries({ queryKey: ['reports-list', user?.id] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteReportById(id),
    onSuccess: () => {
      setDeleteTarget(null);
      void queryClient.invalidateQueries({ queryKey: ['reports-list', user?.id] });
    },
  });

  const filtered = useMemo(() => {
    const now = Date.now();
    const list = (reportsQuery.data ?? []).filter((item) => {
      if (modeFilter !== 'all' && item.mode !== modeFilter) return false;
      if (search.trim() && !item.title.toLowerCase().includes(search.trim().toLowerCase())) {
        return false;
      }
      if (dateFilter !== 'all') {
        const days = dateFilter === '7d' ? 7 : 30;
        const cutoff = now - days * 24 * 60 * 60 * 1000;
        if (Date.parse(item.createdAt) < cutoff) return false;
      }
      return true;
    });

    return [...list].sort((a, b) => {
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      if (sortBy === 'oldest') return Date.parse(a.createdAt) - Date.parse(b.createdAt);
      return Date.parse(b.createdAt) - Date.parse(a.createdAt);
    });
  }, [reportsQuery.data, modeFilter, search, dateFilter, sortBy]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">{t('reports.title')}</h1>
          <p className="text-sm text-slate-600">
            Inspect post-game accuracy, difficult questions, and download spreadsheets.
          </p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-4">
        <div className="relative sm:col-span-2">
          <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <Input
            aria-label="Search reports"
            placeholder="Search by quiz title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <select
          aria-label="Filter by mode"
          value={modeFilter}
          onChange={(e) => setModeFilter(e.target.value as 'all' | 'live' | 'challenge')}
          className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm"
        >
          <option value="all">All game types</option>
          <option value="live">Live games</option>
          <option value="challenge">Self-paced challenges</option>
        </select>

        <div className="flex gap-2">
          <select
            aria-label="Filter by date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as 'all' | '7d' | '30d')}
            className="h-10 flex-1 rounded-lg border border-slate-300 bg-white px-2 text-sm"
          >
            <option value="all">All dates</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
          </select>

          <select
            aria-label="Sort reports"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest' | 'title')}
            className="h-10 flex-1 rounded-lg border border-slate-300 bg-white px-2 text-sm"
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="title">Title A–Z</option>
          </select>
        </div>
      </div>

      {reportsQuery.isError && (
        <Alert variant="error">
          {reportsQuery.error instanceof Error
            ? reportsQuery.error.message
            : 'Unable to load reports.'}
        </Alert>
      )}

      {reportsQuery.isLoading ? (
        <div role="status" className="flex items-center justify-center py-16 text-slate-600">
          <Loader2 className="mr-2 h-5 w-5 animate-spin text-indigo-600" aria-hidden="true" />
          {t('common.loading')}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardHeader className="items-center text-center py-12">
            <BarChart3 className="mb-2 h-8 w-8 text-indigo-500" aria-hidden="true" />
            <CardTitle>No reports match</CardTitle>
            <CardDescription>
              Run a live game or adjust your search/filter criteria.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => (
            <Card key={item.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/reports/${item.id}`}
                      className="font-display text-lg font-bold text-slate-900 hover:text-indigo-600 hover:underline truncate"
                    >
                      {item.title}
                    </Link>
                    <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold capitalize text-indigo-700">
                      {item.mode}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">
                    {new Date(item.createdAt).toLocaleString()} · {item.playerCount} players ·{' '}
                    {item.questionCount} questions
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button asChild size="sm" variant="outline">
                    <Link to={`/reports/${item.id}`}>Open report</Link>
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    aria-label={`Rename ${item.title}`}
                    onClick={() => {
                      setRenameTarget(item);
                      setRenameText(item.title);
                    }}
                  >
                    <Edit2 className="h-4 w-4" aria-hidden="true" />
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    aria-label={`Delete ${item.title}`}
                    onClick={() => setDeleteTarget(item)}
                    className="text-red-600 hover:bg-red-50 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Rename Modal */}
      <Dialog open={Boolean(renameTarget)} onOpenChange={(open) => !open && setRenameTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename report</DialogTitle>
            <DialogDescription>Give this report a memorable name.</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (renameTarget && renameText.trim()) {
                renameMutation.mutate({ id: renameTarget.id, title: renameText });
              }
            }}
            className="mt-3 space-y-4"
          >
            <div className="space-y-1.5">
              <Label htmlFor="rename-report-input">Report title</Label>
              <Input
                id="rename-report-input"
                value={renameText}
                onChange={(e) => setRenameText(e.target.value)}
                required
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setRenameTarget(null)}>
                Cancel
              </Button>
              <Button type="submit" loading={renameMutation.isPending}>
                Save
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Modal */}
      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete report?</DialogTitle>
            <DialogDescription>
              This permanently removes &ldquo;{deleteTarget?.title}&rdquo;.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              loading={deleteMutation.isPending}
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
