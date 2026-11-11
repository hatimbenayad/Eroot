import { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, Flame, Loader2, Trophy, XCircle } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { AnswerTile } from '@/components/eroot/AnswerTile';
import { ErootLogo } from '@/components/eroot/ErootLogo';
import { HostStageShell } from '@/components/eroot/HostStageShell';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ApiError,
  fetchPlayerGameSession,
  submitPlayerAnswer,
  subscribeToGameChannel,
} from '@/features/live/api';
import { clearPlayerSession, loadPlayerSession } from '@/features/player/session-storage';
import { cn } from '@/lib/cn';
import { getErootTheme } from '@shared/constants/themes';
import type { PlayerQuestionFeedback, PublicGameSnapshot } from '@shared/schemas/game';

export function PlayPage() {
  const { gameId } = useParams<{ gameId: string }>();
  const storedSession = gameId ? loadPlayerSession(gameId) : null;

  const [game, setGame] = useState<PublicGameSnapshot | null>(null);
  const [nickname, setNickname] = useState(storedSession?.nickname ?? '');
  const [totalScore, setTotalScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [rank, setRank] = useState(1);
  const [totalPlayers, setTotalPlayers] = useState(1);
  const [submittedSlides, setSubmittedSlides] = useState<Set<string>>(() => new Set());
  const [feedback, setFeedback] = useState<PlayerQuestionFeedback | null>(null);
  const [kicked, setKicked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submittingOptionId, setSubmittingOptionId] = useState<string | null>(null);

  const sessionToken = storedSession?.sessionToken ?? '';
  const playerId = storedSession?.playerId ?? '';

  const reconcileSession = useCallback(async () => {
    if (!gameId || !sessionToken) {
      setLoading(false);
      return;
    }
    try {
      const res = await fetchPlayerGameSession(sessionToken, gameId);
      setGame(res.game);
      setNickname(res.player.nickname);
      setTotalScore(res.player.totalScore);
      setStreak(res.player.streak);
      setRank(res.player.rank);
      setTotalPlayers(res.player.totalPlayers);
      setSubmittedSlides(new Set(res.submittedSlideIds));
      setFeedback(res.feedback);
      setError(null);
    } catch (err) {
      if (err instanceof ApiError && err.code === 'PLAYER_KICKED') {
        setKicked(true);
        if (gameId) clearPlayerSession(gameId);
      } else {
        setError(err instanceof Error ? err.message : 'Unable to connect to game.');
      }
    } finally {
      setLoading(false);
    }
  }, [gameId, sessionToken]);

  useEffect(() => {
    void reconcileSession();
  }, [reconcileSession]);

  useEffect(() => {
    if (!gameId || !sessionToken || kicked) return;

    const unsubscribe = subscribeToGameChannel(gameId, {
      onGameState: (nextGame) => {
        setGame(nextGame);
        if (
          nextGame.state === 'question_reveal' ||
          nextGame.state === 'scoreboard' ||
          nextGame.state === 'podium' ||
          nextGame.state === 'ended'
        ) {
          void reconcileSession();
        }
      },
      onPlayerKicked: (kickedId) => {
        if (kickedId === playerId) {
          setKicked(true);
          clearPlayerSession(gameId);
        }
      },
    });

    const poll = window.setInterval(() => {
      void reconcileSession();
    }, 2500);

    return () => {
      unsubscribe();
      window.clearInterval(poll);
    };
  }, [gameId, sessionToken, playerId, kicked, reconcileSession]);

  async function handleSelectOption(slideId: string, optionId: string) {
    if (!gameId || !sessionToken || submittingOptionId || submittedSlides.has(slideId)) return;
    setSubmittingOptionId(optionId);
    setError(null);
    try {
      await submitPlayerAnswer(sessionToken, { gameId, slideId, optionId });
      setSubmittedSlides((prev) => new Set(prev).add(slideId));
    } catch (err) {
      if (err instanceof ApiError && err.code === 'ALREADY_ANSWERED') {
        setSubmittedSlides((prev) => new Set(prev).add(slideId));
      } else if (err instanceof ApiError && err.code === 'PLAYER_KICKED') {
        setKicked(true);
        clearPlayerSession(gameId);
      } else {
        setError(err instanceof Error ? err.message : 'Failed to submit answer.');
      }
    } finally {
      setSubmittingOptionId(null);
    }
  }

  if (loading) {
    return (
      <HostStageShell className="flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-amber-400" aria-label="Connecting to game" />
      </HostStageShell>
    );
  }

  if (!storedSession) {
    return (
      <HostStageShell className="flex flex-col items-center justify-center gap-4 px-4 text-center">
        <ErootLogo variant="dark" size="lg" />
        <Alert variant="error" title="No active player session" className="max-w-sm">
          Join with a Game PIN first to enter this game.
        </Alert>
        <Button asChild variant="stage">
          <Link to="/join">Go to Join</Link>
        </Button>
      </HostStageShell>
    );
  }

  if (kicked) {
    return (
      <HostStageShell className="flex flex-col items-center justify-center gap-4 px-4 text-center">
        <Card className="max-w-sm w-full">
          <CardHeader>
            <CardTitle>Removed from game</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-600">
              The host removed your nickname from this lobby.
            </p>
            <Button asChild className="w-full">
              <Link to="/join">Join another game</Link>
            </Button>
          </CardContent>
        </Card>
      </HostStageShell>
    );
  }

  if (!game) {
    return (
      <HostStageShell className="flex flex-col items-center justify-center gap-4 px-4 text-center">
        <Alert variant="error" className="max-w-sm">
          {error ?? 'Could not connect to game.'}
        </Alert>
        <Button asChild variant="stage">
          <Link to="/join">Back to Join</Link>
        </Button>
      </HostStageShell>
    );
  }

  const theme = getErootTheme(game.themeId);
  const currentSlide = game.slides[game.currentSlideIndex];
  const hasSubmittedCurrent = Boolean(currentSlide && submittedSlides.has(currentSlide.id));

  return (
    <div className={cn('min-h-screen w-full flex flex-col', theme.stageClass, theme.textClass)}>
      {/* Top player status bar */}
      <header className="flex items-center justify-between gap-2 border-b border-white/15 bg-black/25 px-4 py-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="truncate rounded-full bg-white/15 px-3 py-1 text-sm font-bold">
            {nickname}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {streak >= 2 && (
            <span
              data-testid="player-streak-badge"
              className="inline-flex items-center gap-1 rounded-full bg-amber-400 px-2.5 py-1 text-xs font-black text-slate-950"
            >
              <Flame className="h-3.5 w-3.5" aria-hidden="true" />
              {streak}x Streak
            </span>
          )}
          <span
            data-testid="player-score-badge"
            className="rounded-full bg-white px-3 py-1 text-sm font-black text-slate-900"
          >
            {totalScore.toLocaleString()} pts
          </span>
        </div>
      </header>

      {error && (
        <div className="mx-auto mt-3 w-full max-w-md px-4">
          <Alert variant="error">{error}</Alert>
        </div>
      )}

      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-4 py-6">
        {game.state === 'lobby' && (
          <div className="rounded-3xl bg-white/10 p-8 text-center backdrop-blur-sm space-y-3">
            <CheckCircle2 className="mx-auto h-12 w-12 text-amber-400" aria-hidden="true" />
            <h1 className="font-display text-3xl font-black">You&apos;re in!</h1>
            <p className="text-base opacity-90">
              See your nickname <span className="font-bold">{nickname}</span> on the host screen?
            </p>
          </div>
        )}

        {game.state === 'question_intro' && currentSlide && (
          <div className="rounded-3xl bg-white/10 p-8 text-center backdrop-blur-sm space-y-3">
            <p className="text-xs font-bold uppercase tracking-widest opacity-80">
              Question {game.currentSlideIndex + 1} of {game.slides.length}
            </p>
            <h1 className="font-display text-2xl font-black">Get ready!</h1>
            {game.settings.showQuestionOnDevices && (
              <p className="text-base font-medium opacity-95">{currentSlide.title}</p>
            )}
          </div>
        )}

        {game.state === 'question_active' && currentSlide && (
          <div className="space-y-4">
            {currentSlide.type === 'classic' ? (
              <div className="rounded-3xl bg-white/10 p-8 text-center backdrop-blur-sm space-y-2">
                <h1 className="font-display text-2xl font-bold">Look at the host screen</h1>
                {game.settings.showQuestionOnDevices && (
                  <p className="text-sm opacity-90">{currentSlide.title}</p>
                )}
              </div>
            ) : hasSubmittedCurrent ? (
              <div
                data-testid="player-answer-locked"
                className="rounded-3xl bg-white/15 p-8 text-center backdrop-blur-sm space-y-3"
              >
                <Loader2 className="mx-auto h-10 w-10 animate-spin text-amber-400" aria-hidden="true" />
                <h1 className="font-display text-2xl font-black">Answer locked in!</h1>
                <p className="text-sm opacity-85">Waiting for everyone else...</p>
              </div>
            ) : (
              <>
                {game.settings.showQuestionOnDevices && (
                  <div className="rounded-2xl bg-white p-4 text-center text-slate-900 shadow">
                    <h1 className="font-display text-lg font-bold">{currentSlide.title}</h1>
                    {currentSlide.mediaUrl && (
                      <img
                        src={currentSlide.mediaUrl}
                        alt="Question visual"
                        className="mx-auto mt-3 max-h-40 rounded-lg object-contain"
                      />
                    )}
                  </div>
                )}

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {currentSlide.options.map((opt, idx) => (
                    <AnswerTile
                      key={opt.id}
                      index={idx}
                      label={game.settings.showQuestionOnDevices ? opt.text : undefined}
                      imageUrl={game.settings.showQuestionOnDevices ? opt.imageUrl : undefined}
                      disabled={Boolean(submittingOptionId)}
                      onClick={() => void handleSelectOption(currentSlide.id, opt.id)}
                      className="min-h-[96px]"
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {game.state === 'question_reveal' && currentSlide && (
          <div
            data-testid="player-reveal-feedback"
            className="rounded-3xl bg-white p-7 text-center text-slate-900 shadow-2xl space-y-4"
          >
            {currentSlide.type === 'poll' ? (
              <>
                <CheckCircle2 className="mx-auto h-12 w-12 text-indigo-600" aria-hidden="true" />
                <h1 className="font-display text-2xl font-black">Vote recorded</h1>
                <p className="text-sm text-slate-600">See live poll results on the host screen.</p>
              </>
            ) : feedback?.isCorrect ? (
              <>
                <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" aria-hidden="true" />
                <h1 className="font-display text-3xl font-black text-emerald-700">Correct!</h1>
                <p
                  data-testid="player-points-earned"
                  className="inline-block rounded-full bg-emerald-100 px-4 py-1.5 text-lg font-extrabold text-emerald-900"
                >
                  +{feedback.pointsEarned} pts
                </p>
              </>
            ) : (
              <>
                <XCircle className="mx-auto h-12 w-12 text-red-600" aria-hidden="true" />
                <h1 className="font-display text-3xl font-black text-red-700">
                  {feedback?.submittedOptionId ? 'Not quite' : 'Time up'}
                </h1>
                <p className="text-base font-bold text-slate-600">+0 pts</p>
              </>
            )}

            <div className="border-t border-slate-200 pt-4 text-sm font-semibold text-slate-700">
              Rank #{rank} of {totalPlayers}
              {streak >= 2 && (
                <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-900">
                  <Flame className="h-3.5 w-3.5" aria-hidden="true" />
                  {streak}x Streak
                </span>
              )}
            </div>
          </div>
        )}

        {game.state === 'scoreboard' && (
          <div className="rounded-3xl bg-white/10 p-8 text-center backdrop-blur-sm space-y-3">
            <p className="text-sm uppercase tracking-wider opacity-85">Current standing</p>
            <h1 className="font-display text-5xl font-black">#{rank}</h1>
            <p className="text-lg font-bold">{totalScore.toLocaleString()} points</p>
          </div>
        )}

        {(game.state === 'podium' || game.state === 'ended') && (
          <div className="rounded-3xl bg-white p-8 text-center text-slate-900 shadow-2xl space-y-4">
            <Trophy className="mx-auto h-12 w-12 text-amber-500" aria-hidden="true" />
            <h1 className="font-display text-3xl font-black">
              {game.state === 'ended' ? 'Thanks for playing!' : 'Final Results'}
            </h1>
            <p className="text-lg font-bold text-indigo-700">
              Final Rank: #{rank} of {totalPlayers}
            </p>
            <p className="text-base font-semibold text-slate-700">
              Score: {totalScore.toLocaleString()} pts
            </p>
            <Button asChild className="w-full">
              <Link to="/join">Join another game</Link>
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}

