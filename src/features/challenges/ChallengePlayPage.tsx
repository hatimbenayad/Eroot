import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { CheckCircle2, Dices, Loader2, Trophy } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { ErootLogo } from '@/components/eroot/ErootLogo';
import { HostStageShell } from '@/components/eroot/HostStageShell';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  fetchChallengePlayState,
  joinChallenge,
  submitChallengeAnswer,
  type ChallengePlayState,
} from '@/features/live/api';
import { PlayerSlideInput, type PlayerAnswerPayload } from '@/features/player/PlayerSlideInput';
import { cn } from '@/lib/cn';
import { getErootTheme } from '@shared/constants/themes';
import { generateFriendlyNickname } from '@shared/moderation/nickname';
import { isMediaSlideType } from '@shared/schemas/slide';

export function ChallengePlayPage() {
  const { pin } = useParams<{ pin: string }>();
  const storageKey = `eroot_challenge_token:${pin ?? ''}`;
  const [token, setToken] = useState<string>(() => {
    try {
      return localStorage.getItem(storageKey) ?? '';
    } catch {
      return '';
    }
  });

  const [state, setState] = useState<ChallengePlayState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nickname, setNickname] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [slideFeedback, setSlideFeedback] = useState<{
    isCorrect: boolean | null;
    pointsEarned: number;
  } | null>(null);
  const [skippedSlideIds, setSkippedSlideIds] = useState<Set<string>>(() => new Set());

  const slideStartedAtRef = useRef<number>(Date.now());

  const load = useCallback(async () => {
    if (!pin) return;
    try {
      const res = await fetchChallengePlayState({ pin }, token || undefined);
      setState(res);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Challenge unavailable.');
    } finally {
      setLoading(false);
    }
  }, [pin, token]);

  useEffect(() => {
    void load();
  }, [load]);

  const submittedSet = new Set([
    ...(state?.submittedSlideIds ?? []),
    ...Array.from(skippedSlideIds),
  ]);
  const slides = state?.challenge.slides ?? [];
  const nextSlideIndex = slides.findIndex((s) => !submittedSet.has(s.id));
  const currentSlide = nextSlideIndex >= 0 ? slides[nextSlideIndex] : null;
  const finished = Boolean(state?.player && nextSlideIndex === -1);

  useEffect(() => {
    slideStartedAtRef.current = Date.now();
  }, [currentSlide?.id]);

  async function handleJoin(e: FormEvent) {
    e.preventDefault();
    if (!pin) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await joinChallenge({
        pin,
        nickname: state?.challenge.friendlyNicknames ? undefined : nickname,
        identifier: state?.challenge.requirePlayerIdentifier ? identifier : undefined,
      });
      localStorage.setItem(storageKey, res.sessionToken);
      setToken(res.sessionToken);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to join challenge.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSubmitAnswer(slideId: string, payload: PlayerAnswerPayload) {
    if (!state || !token) return;
    setSubmitting(true);
    setError(null);
    try {
      const elapsedMs = Date.now() - slideStartedAtRef.current;
      const res = await submitChallengeAnswer(token, {
        gameId: state.challenge.id,
        slideId,
        ...payload,
        elapsedMs,
      });
      setSlideFeedback({ isCorrect: res.isCorrect, pointsEarned: res.pointsEarned });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not submit answer.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <HostStageShell className="flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
      </HostStageShell>
    );
  }

  if (!state) {
    return (
      <HostStageShell className="flex flex-col items-center justify-center gap-4 px-4">
        <Alert variant="error" className="max-w-sm">
          {error ?? 'Challenge not found.'}
        </Alert>
        <Button asChild variant="stage">
          <Link to="/join">Back to Join</Link>
        </Button>
      </HostStageShell>
    );
  }

  const theme = getErootTheme(state.challenge.themeId);

  return (
    <div className={cn('min-h-screen flex flex-col', theme.stageClass, theme.textClass)}>
      <header className="flex items-center justify-between border-b border-white/15 bg-black/25 px-4 py-3">
        <ErootLogo variant="dark" size="sm" />
        <div className="flex items-center gap-2 text-xs font-bold">
          <span>Challenge PIN {state.challenge.pin}</span>
          {state.player && (
            <span className="rounded-full bg-white px-3 py-1 text-slate-900">
              {state.player.totalScore.toLocaleString()} pts
            </span>
          )}
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-4 py-8">
        {error && (
          <div className="mb-4">
            <Alert variant="error">{error}</Alert>
          </div>
        )}

        {state.challenge.closed ? (
          <Card>
            <CardHeader className="text-center">
              <CardTitle>Challenge closed</CardTitle>
              <CardDescription>
                This self-paced challenge has ended or passed its deadline.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button asChild>
                <Link to="/join">Join another game</Link>
              </Button>
            </CardContent>
          </Card>
        ) : !state.player ? (
          <Card>
            <CardHeader className="text-center">
              <CardTitle>{state.challenge.quizTitle}</CardTitle>
              <CardDescription>
                Self-paced challenge · {slides.length} slides
                {state.challenge.accuracyOnly ? ' · Accuracy only' : ''}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={(e) => void handleJoin(e)} className="space-y-4">
                {state.challenge.requirePlayerIdentifier && (
                  <div className="space-y-1.5">
                    <Label htmlFor="ch-identifier">{state.challenge.playerIdentifierLabel}</Label>
                    <Input
                      id="ch-identifier"
                      required
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                    />
                  </div>
                )}
                {!state.challenge.friendlyNicknames && (
                  <div className="space-y-1.5">
                    <Label htmlFor="ch-nickname">Nickname</Label>
                    <div className="flex gap-2">
                      <Input
                        id="ch-nickname"
                        required
                        maxLength={24}
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        aria-label="Random nickname"
                        onClick={() => setNickname(generateFriendlyNickname())}
                      >
                        <Dices className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
                <Button type="submit" size="lg" className="w-full" loading={submitting}>
                  Start Challenge
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : finished ? (
          <Card>
            <CardHeader className="text-center space-y-2">
              <Trophy className="mx-auto h-12 w-12 text-amber-500" />
              <CardTitle className="text-2xl">Challenge complete!</CardTitle>
              <CardDescription>
                Great job, {state.player.nickname}! Final score:{' '}
                <strong className="text-indigo-700">{state.player.totalScore} pts</strong>
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button asChild>
                <Link to="/join">Done</Link>
              </Button>
            </CardContent>
          </Card>
        ) : slideFeedback ? (
          <Card>
            <CardHeader className="text-center space-y-2">
              <CheckCircle2 className="mx-auto h-10 w-10 text-indigo-600" />
              <CardTitle>
                {slideFeedback.isCorrect === true
                  ? `Correct! +${slideFeedback.pointsEarned} pts`
                  : slideFeedback.isCorrect === false
                    ? 'Incorrect (+0 pts)'
                    : 'Response saved'}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <Button
                type="button"
                size="lg"
                onClick={() => {
                  setSlideFeedback(null);
                  void load();
                }}
              >
                Next question
              </Button>
            </CardContent>
          </Card>
        ) : currentSlide ? (
          <div className="space-y-4">
            <div className="rounded-2xl bg-white p-5 text-center text-slate-900 shadow-lg space-y-2">
              <p className="text-xs font-bold uppercase text-indigo-600">
                Slide {nextSlideIndex + 1} of {slides.length}
              </p>
              <h1 className="font-display text-xl font-bold">{currentSlide.title}</h1>
              {currentSlide.mediaUrl && (
                <img
                  src={currentSlide.mediaUrl}
                  alt=""
                  className="mx-auto max-h-44 rounded-lg object-contain"
                />
              )}
            </div>

            {isMediaSlideType(currentSlide.type) ? (
              <Card>
                <CardContent className="p-6 text-center space-y-4">
                  <p className="text-sm text-slate-700">
                    {currentSlide.body || currentSlide.subtitle || currentSlide.quote || currentSlide.caption}
                  </p>
                  <Button
                    type="button"
                    onClick={() =>
                      setSkippedSlideIds((prev) => new Set(prev).add(currentSlide.id))
                    }
                  >
                    Continue
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <PlayerSlideInput
                slide={currentSlide}
                showQuestionOnDevices
                submitting={submitting}
                onSubmit={(payload) => void handleSubmitAnswer(currentSlide.id, payload)}
              />
            )}
          </div>
        ) : null}
      </main>
    </div>
  );
}

