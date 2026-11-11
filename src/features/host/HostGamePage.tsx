import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Copy,
  Loader2,
  RotateCcw,
  SkipForward,
  Trophy,
  UserX,
  Users,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Link, useParams } from 'react-router-dom';
import { ErootLogo } from '@/components/eroot/ErootLogo';
import { HostStageShell } from '@/components/eroot/HostStageShell';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/useAuth';
import { HostActiveSlideView, HostRevealSlideView } from '@/features/host/HostSlideViews';
import {
  advanceGameState,
  fetchHostGameSession,
  kickGamePlayer,
  subscribeToGameChannel,
} from '@/features/live/api';
import { erootAudio } from '@/lib/audio';
import { cn } from '@/lib/cn';
import { getErootTheme } from '@shared/constants/themes';
import type { LobbyPlayerSummary, PublicGameSnapshot } from '@shared/schemas/game';
import { isMediaSlideType } from '@shared/schemas/slide';
import type { GameAction } from '@shared/state-machine/game-state';

export function HostGamePage() {
  const { gameId } = useParams<{ gameId: string }>();
  const { session } = useAuth();
  const accessToken = session?.access_token ?? '';

  const [game, setGame] = useState<PublicGameSnapshot | null>(null);
  const [roster, setRoster] = useState<LobbyPlayerSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedPin, setCopiedPin] = useState(false);
  const [muted, setMuted] = useState(false);
  const [remainingSec, setRemainingSec] = useState<number>(20);
  const [revealProgress, setRevealProgress] = useState<number>(1);
  const [podiumRunKey, setPodiumRunKey] = useState(0);
  const [busyAction, setBusyAction] = useState(false);

  const loadSession = useCallback(async () => {
    if (!gameId || !accessToken) return;
    try {
      const res = await fetchHostGameSession(accessToken, gameId);
      setGame(res.game);
      setRoster(res.roster);
      setMuted(!res.game.settings.musicEnabled);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load host game.');
    } finally {
      setLoading(false);
    }
  }, [gameId, accessToken]);

  useEffect(() => {
    void loadSession();
  }, [loadSession]);

  // Subscribe to Realtime broadcast + fallback reconciliation poll
  useEffect(() => {
    if (!gameId || !accessToken) return;

    const unsubscribe = subscribeToGameChannel(gameId, {
      onLobbyRoster: (players) => setRoster(players),
      onGameState: (nextGame) => setGame(nextGame),
      onAnswerCount: (slideId, count) => {
        setGame((prev) => {
          if (!prev) return prev;
          const active = prev.slides[prev.currentSlideIndex];
          if (active?.id !== slideId) return prev;
          return { ...prev, answerCount: count };
        });
      },
      onPlayerKicked: (_pid, players) => setRoster(players),
    });

    const poll = window.setInterval(() => {
      void loadSession();
    }, 3000);

    return () => {
      unsubscribe();
      window.clearInterval(poll);
    };
  }, [gameId, accessToken, loadSession]);

  // Audio lifecycle
  useEffect(() => {
    if (!game) return;
    erootAudio.setVolume(game.settings.musicVolume ?? 0.5);
    erootAudio.setMuted(muted);

    if (game.state === 'lobby' && !muted) {
      erootAudio.startLobbyMusic('chill-pulse');
    } else {
      erootAudio.stopLobbyMusic();
    }

    if (game.state === 'question_reveal' && !muted) {
      erootAudio.playRevealChime();
    } else if (game.state === 'podium' && !muted) {
      erootAudio.playPodiumFanfare();
    }

    return () => {
      erootAudio.stopLobbyMusic();
    };
  }, [game, muted]);

  const handleAction = useCallback(
    async (action: GameAction) => {
      if (!gameId || !accessToken || busyAction) return;
      setBusyAction(true);
      try {
        const res = await advanceGameState(accessToken, gameId, action);
        setGame(res.game);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to advance game.');
      } finally {
        setBusyAction(false);
      }
    },
    [gameId, accessToken, busyAction]
  );

  // Auto-advance question_intro -> question_active after 2.2s
  useEffect(() => {
    if (!game || game.state !== 'question_intro') return;
    const timer = window.setTimeout(() => {
      void handleAction('begin_question');
    }, 2200);
    return () => window.clearTimeout(timer);
  }, [game, handleAction]);

  // Sync countdown timer on question_active and auto-reveal on 0
  useEffect(() => {
    if (!game || game.state !== 'question_active') return;
    const slide = game.slides[game.currentSlideIndex];
    if (!slide || isMediaSlideType(slide.type)) return;

    const startMs = game.questionStartedAt ? Date.parse(game.questionStartedAt) : Date.now();
    const totalMs = slide.timeLimit * 1000;

    const tick = () => {
      const elapsed = Date.now() - startMs;
      const left = Math.max(0, Math.ceil((totalMs - elapsed) / 1000));
      setRemainingSec(left);
      setRevealProgress(Math.min(1, Math.max(0, elapsed / totalMs)));
      if (elapsed >= totalMs) {
        void handleAction('reveal');
      }
    };

    tick();
    const interval = window.setInterval(tick, 250);
    return () => window.clearInterval(interval);
  }, [game, handleAction]);

  // Keyboard shortcut: Space = primary progression action
  useEffect(() => {
    if (!game) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.code !== 'Space') return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'BUTTON') return;
      e.preventDefault();

      if (!game) return;
      if (game.state === 'lobby' && roster.length >= 1) void handleAction('start');
      else if (game.state === 'question_intro') void handleAction('begin_question');
      else if (game.state === 'question_active') void handleAction('reveal');
      else if (game.state === 'question_reveal' || game.state === 'scoreboard')
        void handleAction('next');
      else if (game.state === 'podium') void handleAction('end');
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [game, roster.length, handleAction]);

  async function handleKick(playerId: string) {
    if (!gameId || !accessToken) return;
    try {
      const res = await kickGamePlayer(accessToken, gameId, playerId);
      setRoster(res.players);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to kick player.');
    }
  }

  if (loading) {
    return (
      <HostStageShell className="flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-amber-400" aria-label="Loading host stage" />
      </HostStageShell>
    );
  }

  if (!game) {
    return (
      <HostStageShell className="flex flex-col items-center justify-center gap-4 px-4">
        <Alert variant="error" title="Game unavailable">
          {error ?? 'Could not load this live game.'}
        </Alert>
        <Button asChild variant="stage">
          <Link to="/library">Back to Library</Link>
        </Button>
      </HostStageShell>
    );
  }

  const theme = getErootTheme(game.themeId);
  const currentSlide = game.slides[game.currentSlideIndex];
  const joinUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/join?pin=${game.pin}`
      : `/join?pin=${game.pin}`;

  return (
    <div className={cn('min-h-screen w-full flex flex-col', theme.stageClass, theme.textClass)}>
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/15 bg-black/20 px-6 py-3 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <ErootLogo variant="dark" size="sm" />
          <span className="hidden text-sm font-semibold opacity-90 sm:inline">
            {game.quizTitle}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="rounded-full bg-white/15 px-4 py-1 text-sm font-extrabold tracking-widest text-white">
            PIN: {game.pin}
          </div>

          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-sm font-semibold">
            <Users className="h-4 w-4" aria-hidden="true" />
            <span data-testid="host-player-count">
              {roster.length} / {game.maxPlayers}
            </span>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-label={muted ? 'Unmute audio' : 'Mute audio'}
            onClick={() => setMuted((m) => !m)}
            className="text-white hover:bg-white/15 hover:text-white"
          >
            {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </Button>

          {game.state !== 'ended' && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void handleAction('end')}
              className="border-white/30 bg-transparent text-white hover:bg-white/15 hover:text-white"
            >
              End game
            </Button>
          )}
        </div>
      </header>

      {error && (
        <div className="mx-auto mt-3 w-full max-w-2xl px-4">
          <Alert variant="error">{error}</Alert>
        </div>
      )}

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-6 py-8">
        {game.state === 'lobby' && (
          <div className="grid gap-8 lg:grid-cols-5 lg:items-center">
            <div className="lg:col-span-2 rounded-3xl bg-white p-6 text-center text-slate-900 shadow-2xl space-y-4">
              <p className="text-xs font-bold uppercase tracking-widest text-indigo-600">
                Join at /join with Game PIN
              </p>
              <p
                data-testid="lobby-pin"
                className="font-display text-4xl font-black tracking-widest text-slate-950 sm:text-5xl"
              >
                {game.pin}
              </p>
              <div className="flex justify-center py-2">
                <QRCodeSVG value={joinUrl} size={160} includeMargin />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => {
                  void navigator.clipboard?.writeText(joinUrl);
                  setCopiedPin(true);
                  window.setTimeout(() => setCopiedPin(false), 1800);
                }}
              >
                <Copy className="h-4 w-4" aria-hidden="true" />
                {copiedPin ? 'Join link copied!' : 'Copy join link'}
              </Button>
            </div>

            <div className="lg:col-span-3 space-y-6">
              <div className="flex items-center justify-between">
                <h1 className="font-display text-3xl font-extrabold">
                  Waiting for players ({roster.length})
                </h1>
                <Button
                  type="button"
                  variant="stage"
                  size="lg"
                  disabled={roster.length === 0 || busyAction}
                  onClick={() => void handleAction('start')}
                >
                  Start Game
                  <ArrowRight className="h-5 w-5" aria-hidden="true" />
                </Button>
              </div>

              {roster.length === 0 ? (
                <div className="rounded-2xl border border-white/20 bg-white/10 p-10 text-center">
                  <p className="text-lg font-medium opacity-90">
                    Share the PIN or QR code so players can join from their phones.
                  </p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-3">
                  {roster.map((player) => (
                    <button
                      key={player.id}
                      type="button"
                      title={`Click to kick ${player.nickname}`}
                      onClick={() => void handleKick(player.id)}
                      className="group inline-flex items-center gap-2 rounded-full bg-white/95 px-4 py-2 text-base font-bold text-slate-900 shadow hover:bg-red-50 hover:text-red-700"
                    >
                      <span>{player.nickname}</span>
                      <UserX
                        className="h-4 w-4 text-slate-400 group-hover:text-red-600"
                        aria-hidden="true"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {game.state === 'question_intro' && currentSlide && (
          <div className="mx-auto max-w-3xl text-center space-y-6">
            <span className="inline-block rounded-full bg-white/20 px-4 py-1.5 text-sm font-bold uppercase tracking-wider">
              Slide {game.currentSlideIndex + 1} of {game.slides.length}
            </span>
            <h1 className="font-display text-4xl font-black sm:text-5xl">
              {currentSlide.title}
            </h1>
            <p className="text-lg opacity-85">Get ready...</p>
            <Button
              type="button"
              variant="stage"
              onClick={() => void handleAction('begin_question')}
            >
              Show now (Space)
            </Button>
          </div>
        )}

        {game.state === 'question_active' && currentSlide && (
          <div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
              {isMediaSlideType(currentSlide.type) ? (
                <span className="rounded-full bg-white/15 px-4 py-1.5 text-sm font-bold">
                  Info Slide
                </span>
              ) : (
                <div className="flex items-center gap-4">
                  <div
                    data-testid="host-timer"
                    className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-600 text-2xl font-black text-white shadow-lg ring-4 ring-white/30"
                  >
                    {remainingSec}
                  </div>
                  <div className="rounded-2xl bg-white/15 px-4 py-2 text-center">
                    <p className="text-2xl font-black" data-testid="host-answer-count">
                      {game.answerCount}
                    </p>
                    <p className="text-xs uppercase tracking-wider opacity-80">Answers</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2">
                {isMediaSlideType(currentSlide.type) ? (
                  <Button
                    type="button"
                    variant="stage"
                    onClick={() => void handleAction('next')}
                  >
                    <SkipForward className="h-4 w-4" aria-hidden="true" />
                    Next (Space)
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="stage"
                    onClick={() => void handleAction('reveal')}
                  >
                    End question early (Space)
                  </Button>
                )}
              </div>
            </div>

            <HostActiveSlideView slide={currentSlide} revealProgress={revealProgress} />
          </div>
        )}

        {game.state === 'question_reveal' && currentSlide && game.revealPayload && (
          <div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
              <h1 className="font-display text-2xl font-extrabold sm:text-3xl">
                {currentSlide.title}
              </h1>
              <Button type="button" variant="stage" onClick={() => void handleAction('next')}>
                Next (Space)
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>

            <HostRevealSlideView slide={currentSlide} reveal={game.revealPayload} />
          </div>
        )}

        {game.state === 'scoreboard' && (
          <div className="mx-auto w-full max-w-2xl space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="font-display text-3xl font-black">Scoreboard — Top 5</h1>
              <Button type="button" variant="stage" onClick={() => void handleAction('next')}>
                Next (Space)
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>

            <div className="space-y-3">
              {game.scoreboard.map((entry) => (
                <div
                  key={entry.playerId}
                  className="flex items-center justify-between rounded-2xl bg-white px-5 py-4 text-slate-900 shadow-lg"
                >
                  <div className="flex items-center gap-4">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 font-black text-indigo-700">
                      #{entry.rank}
                    </span>
                    <span className="text-lg font-bold">{entry.nickname}</span>
                  </div>
                  <span className="font-display text-xl font-black text-indigo-700">
                    {entry.totalScore.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {game.state === 'podium' && (
          <div className="mx-auto w-full max-w-3xl text-center space-y-8">
            <div className="space-y-2">
              <Trophy className="mx-auto h-12 w-12 text-amber-400" aria-hidden="true" />
              <h1 className="font-display text-4xl font-black">Final Podium</h1>
            </div>

            <div
              key={podiumRunKey}
              className="grid grid-cols-3 items-end gap-4 pt-6"
              data-testid="podium-stage"
            >
              {[1, 0, 2].map((slotIdx) => {
                const winner = game.podium[slotIdx];
                const heights = ['h-44 bg-indigo-600', 'h-56 bg-amber-400 text-slate-950', 'h-36 bg-indigo-800'];
                const podiumHeight = heights[slotIdx] ?? 'h-36 bg-indigo-800';
                const rankLabel = slotIdx === 0 ? '1st' : slotIdx === 1 ? '2nd' : '3rd';

                return (
                  <motion.div
                    key={slotIdx}
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: (2 - slotIdx) * 0.2, duration: 0.45 }}
                    className="flex flex-col items-center gap-2"
                  >
                    <p className="text-lg font-extrabold truncate max-w-full">
                      {winner ? winner.nickname : '—'}
                    </p>
                    {winner && (
                      <p className="text-sm font-bold opacity-90">
                        {winner.totalScore.toLocaleString()} pts
                      </p>
                    )}
                    <div
                      className={cn(
                        'flex w-full items-center justify-center rounded-t-2xl font-display text-3xl font-black shadow-2xl',
                        podiumHeight
                      )}
                    >
                      {rankLabel}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            <div className="flex flex-wrap justify-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setPodiumRunKey((k) => k + 1);
                  erootAudio.playPodiumFanfare();
                }}
                className="border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white"
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                Replay podium
              </Button>
              <Button type="button" variant="stage" onClick={() => void handleAction('end')}>
                Finish & Save Report
              </Button>
            </div>
          </div>
        )}

        {game.state === 'ended' && (
          <div className="mx-auto max-w-lg rounded-3xl bg-white p-8 text-center text-slate-900 shadow-2xl space-y-4">
            <Trophy className="mx-auto h-10 w-10 text-indigo-600" aria-hidden="true" />
            <h1 className="font-display text-2xl font-bold">Game ended</h1>
            <p className="text-sm text-slate-600">
              A report for <span className="font-semibold">{game.quizTitle}</span> has been saved.
            </p>
            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <Button asChild variant="outline">
                <Link to="/library">Back to Library</Link>
              </Button>
              <Button asChild>
                <Link to="/reports">View Reports</Link>
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

