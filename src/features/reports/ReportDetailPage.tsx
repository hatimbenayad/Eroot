import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  ArrowLeft,
  Download,
  Loader2,
  Play,
  RotateCcw,
  Sparkles,
  Trophy,
} from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/features/auth/useAuth';
import { GameOptionsModal } from '@/features/host/GameOptionsModal';
import { createDifficultQuestionsQuiz, fetchReportDetail } from '@/features/reports/api';
import { downloadReportCsv, downloadReportXlsx } from '@/features/reports/export';
import { cn } from '@/lib/cn';

export function ReportDetailPage() {
  const { reportId } = useParams<{ reportId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [podiumOpen, setPodiumOpen] = useState(false);
  const [podiumKey, setPodiumKey] = useState(0);
  const [playAgainOpen, setPlayAgainOpen] = useState(false);
  const [creatingQuiz, setCreatingQuiz] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const detailQuery = useQuery({
    queryKey: ['report-detail', reportId],
    queryFn: () => fetchReportDetail(reportId!),
    enabled: Boolean(reportId),
  });

  if (detailQuery.isLoading) {
    return (
      <div role="status" className="flex items-center justify-center py-20 text-slate-600">
        <Loader2 className="mr-2 h-6 w-6 animate-spin text-indigo-600" aria-hidden="true" />
        Loading report...
      </div>
    );
  }

  const report = detailQuery.data;
  if (!report) {
    return (
      <div className="space-y-4">
        <Alert variant="error">Report not found.</Alert>
        <Button asChild variant="outline">
          <Link to="/reports">Back to Reports</Link>
        </Button>
      </div>
    );
  }

  const { analytics } = report;
  const canGenerateDifficultQuiz = analytics.difficultQuestions.length >= 3;

  async function handleCreateDifficultQuiz() {
    if (!user || !report || !canGenerateDifficultQuiz) return;
    setCreatingQuiz(true);
    setActionError(null);
    try {
      const newQuizId = await createDifficultQuestionsQuiz(
        user.id,
        report.title,
        report.themeId,
        analytics.difficultQuestions.map((q) => q.slide)
      );
      navigate(`/creator/${newQuizId}`);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Unable to generate practice quiz.');
    } finally {
      setCreatingQuiz(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <Link
            to="/reports"
            className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:underline"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            All Reports
          </Link>
          <h1 className="font-display text-2xl font-bold text-slate-900">{report.title}</h1>
          <p className="text-xs text-slate-600">
            {new Date(report.createdAt).toLocaleString()} · Mode: {report.mode}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setPodiumKey((k) => k + 1);
              setPodiumOpen(true);
            }}
          >
            <Trophy className="h-4 w-4 text-amber-500" aria-hidden="true" />
            Replay podium
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => downloadReportCsv(report.title, analytics)}
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            CSV
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void downloadReportXlsx(report.title, analytics)}
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            XLSX
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={!report.quizId}
            onClick={() => setPlayAgainOpen(true)}
          >
            <Play className="h-4 w-4" aria-hidden="true" />
            Play again
          </Button>
        </div>
      </div>

      {actionError && <Alert variant="error">{actionError}</Alert>}

      <Tabs defaultValue="summary">
        <TabsList>
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="players">Players ({analytics.playerCount})</TabsTrigger>
          <TabsTrigger value="questions">Questions ({analytics.questionCount})</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Players</CardDescription>
                <CardTitle className="text-3xl">{analytics.playerCount}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Questions</CardDescription>
                <CardTitle className="text-3xl">{analytics.questionCount}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Average accuracy</CardDescription>
                <CardTitle className="text-3xl">{analytics.avgAccuracyPercent}%</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Avg response time</CardDescription>
                <CardTitle className="text-3xl">{analytics.avgResponseSec}s</CardTitle>
              </CardHeader>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Difficult Questions */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <AlertTriangle className="h-5 w-5 text-amber-600" aria-hidden="true" />
                      Difficult questions (&lt;35% correct)
                    </CardTitle>
                    <CardDescription>
                      Copy difficult questions into a new quiz when 3 or more exist.
                    </CardDescription>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    loading={creatingQuiz}
                    disabled={!canGenerateDifficultQuiz}
                    onClick={() => void handleCreateDifficultQuiz()}
                  >
                    <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                    Practice quiz
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {analytics.difficultQuestions.length === 0 ? (
                  <p className="text-sm text-slate-600">No difficult questions identified.</p>
                ) : (
                  analytics.difficultQuestions.map((q) => (
                    <div
                      key={q.slideId}
                      className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50/70 px-3 py-2 text-sm"
                    >
                      <span className="font-semibold text-slate-900">
                        Q{q.index}: {q.title}
                      </span>
                      <span className="font-bold text-amber-800">{q.correctPercent}%</span>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Players needing help & did not finish */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Players needing follow-up</CardTitle>
                <CardDescription>
                  Players below 50% accuracy or who did not finish all questions.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-xs font-bold uppercase text-slate-500 mb-1.5">
                    Need help ({analytics.playersNeedingHelp.length})
                  </h3>
                  {analytics.playersNeedingHelp.length === 0 ? (
                    <p className="text-sm text-slate-600">Everyone scored 50% or higher.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {analytics.playersNeedingHelp.map((p) => (
                        <span
                          key={p.playerId}
                          className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-800"
                        >
                          {p.nickname} ({p.accuracyPercent}%)
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="text-xs font-bold uppercase text-slate-500 mb-1.5">
                    Did not finish ({analytics.unfinishedPlayers.length})
                  </h3>
                  {analytics.unfinishedPlayers.length === 0 ? (
                    <p className="text-sm text-slate-600">All players answered every question.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {analytics.unfinishedPlayers.map((p) => (
                        <span
                          key={p.playerId}
                          className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700"
                        >
                          {p.nickname} ({p.answeredCount}/{analytics.questionCount})
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="players">
          <Card>
            <CardContent className="overflow-x-auto p-0">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-600">
                  <tr>
                    <th className="px-4 py-3">Rank</th>
                    <th className="px-4 py-3">Nickname</th>
                    <th className="px-4 py-3">Identifier</th>
                    <th className="px-4 py-3">Score</th>
                    <th className="px-4 py-3">Accuracy</th>
                    <th className="px-4 py-3">Answered</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {analytics.players.map((p) => (
                    <tr key={p.playerId}>
                      <td className="px-4 py-3 font-bold">#{p.rank}</td>
                      <td className="px-4 py-3 font-semibold text-slate-900">{p.nickname}</td>
                      <td className="px-4 py-3 text-slate-600">{p.identifier || '—'}</td>
                      <td className="px-4 py-3 font-bold text-indigo-700">
                        {p.totalScore.toLocaleString()}
                      </td>
                      <td className="px-4 py-3">{p.accuracyPercent}%</td>
                      <td className="px-4 py-3">
                        {p.answeredCount} / {analytics.questionCount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="questions" className="space-y-4">
          {analytics.questions.map((q) => (
            <Card key={q.slideId}>
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle className="text-base">
                    Q{q.index}: {q.title}
                  </CardTitle>
                  <div className="flex items-center gap-3 text-xs font-semibold">
                    <span className="rounded bg-slate-100 px-2 py-1">{q.type}</span>
                    {q.isScored && (
                      <span
                        className={cn(
                          'rounded px-2 py-1',
                          q.isDifficult
                            ? 'bg-amber-100 text-amber-900'
                            : 'bg-emerald-100 text-emerald-900'
                        )}
                      >
                        {q.correctPercent}% correct
                      </span>
                    )}
                    <span className="text-slate-600">Avg {q.avgResponseSec}s</span>
                  </div>
                </div>
              </CardHeader>
              {q.textResponses.length > 0 && (
                <CardContent className="flex flex-wrap gap-2 pt-0">
                  {q.textResponses.map((txt, idx) => (
                    <span
                      key={idx}
                      className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-800"
                    >
                      {txt}
                    </span>
                  ))}
                </CardContent>
              )}
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      {/* Podium Replay Dialog */}
      <Dialog open={podiumOpen} onOpenChange={setPodiumOpen}>
        <DialogContent className="max-w-2xl bg-slate-950 text-white border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-400" />
              Podium Replay — {report.title}
            </DialogTitle>
            <DialogDescription className="text-slate-300">
              Top 3 finishers from this session.
            </DialogDescription>
          </DialogHeader>

          <div key={podiumKey} className="grid grid-cols-3 items-end gap-4 pt-6 text-center">
            {[1, 0, 2].map((slotIdx) => {
              const winner = analytics.podium[slotIdx];
              const heights = [
                'h-36 bg-indigo-600',
                'h-48 bg-amber-400 text-slate-950',
                'h-28 bg-indigo-800',
              ];
              return (
                <motion.div
                  key={slotIdx}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: (2 - slotIdx) * 0.2, duration: 0.4 }}
                  className="flex flex-col items-center gap-1"
                >
                  <p className="font-bold truncate max-w-full">
                    {winner ? winner.nickname : '—'}
                  </p>
                  {winner && (
                    <p className="text-xs text-slate-300">
                      {winner.totalScore.toLocaleString()} pts
                    </p>
                  )}
                  <div
                    className={cn(
                      'flex w-full items-center justify-center rounded-t-xl font-display text-2xl font-black',
                      heights[slotIdx]
                    )}
                  >
                    {slotIdx === 0 ? '1st' : slotIdx === 1 ? '2nd' : '3rd'}
                  </div>
                </motion.div>
              );
            })}
          </div>

          <div className="flex justify-center pt-3">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setPodiumKey((k) => k + 1)}
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              Replay animation
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <GameOptionsModal
        open={playAgainOpen}
        onOpenChange={setPlayAgainOpen}
        quizId={report.quizId}
        quizTitle={report.title}
      />
    </div>
  );
}
