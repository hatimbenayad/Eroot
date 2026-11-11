import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Users } from 'lucide-react';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
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
import { createLiveGame } from '@/features/live/api';
import { cn } from '@/lib/cn';
import {
  DEFAULT_TEAM_PRESETS,
  gameOptionsSchema,
  type GameOptions,
} from '@shared/schemas/game';

interface GameOptionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quizId: string | null;
  quizTitle: string;
}

export function GameOptionsModal({
  open,
  onOpenChange,
  quizId,
  quizTitle,
}: GameOptionsModalProps) {
  const { session } = useAuth();
  const navigate = useNavigate();

  const [options, setOptions] = useState<GameOptions>(() => gameOptionsSchema.parse({}));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function setTeamCount(count: number) {
    const clamped = Math.min(5, Math.max(2, count));
    setOptions((prev) => ({
      ...prev,
      teams: DEFAULT_TEAM_PRESETS.slice(0, clamped).map((preset, idx) => ({
        name: prev.teams[idx]?.name || preset.name,
        colorHex: preset.colorHex,
      })),
    }));
  }

  async function handleLaunch() {
    if (!quizId || !session?.access_token) {
      setError('You must be signed in as the quiz owner to host.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const parsed = gameOptionsSchema.parse(options);
      const { game } = await createLiveGame(session.access_token, quizId, parsed);
      onOpenChange(false);
      navigate(`/host/${game.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to launch live game.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Host Live Game</DialogTitle>
          <DialogDescription>
            Configure live options for{' '}
            <span className="font-semibold">{quizTitle || 'Untitled quiz'}</span>.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          {error && <Alert variant="error">{error}</Alert>}

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setOptions((o) => ({ ...o, mode: 'classic' }))}
              className={cn(
                'rounded-xl border-2 p-3 text-left transition-all',
                options.mode === 'classic'
                  ? 'border-indigo-600 bg-indigo-50/70'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              )}
            >
              <p className="text-sm font-bold text-slate-900">Classic (PvP)</p>
              <p className="text-xs text-slate-600">Individual player leaderboard</p>
            </button>

            <button
              type="button"
              onClick={() => setOptions((o) => ({ ...o, mode: 'team' }))}
              className={cn(
                'rounded-xl border-2 p-3 text-left transition-all',
                options.mode === 'team'
                  ? 'border-indigo-600 bg-indigo-50/70'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              )}
            >
              <p className="text-sm font-bold text-slate-900">Team mode</p>
              <p className="text-xs text-slate-600">2–5 teams · average member score</p>
            </button>
          </div>

          {options.mode === 'team' && (
            <div className="space-y-3 rounded-xl border border-indigo-200 bg-indigo-50/40 p-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="team-count-select">Number of teams</Label>
                <select
                  id="team-count-select"
                  value={options.teams.length}
                  onChange={(e) => setTeamCount(Number(e.target.value))}
                  className="h-8 rounded-md border border-slate-300 bg-white px-2 text-sm"
                >
                  {[2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>
                      {n} teams
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {options.teams.map((team, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span
                      style={{ backgroundColor: team.colorHex }}
                      className="h-4 w-4 shrink-0 rounded-full"
                    />
                    <Input
                      aria-label={`Team ${idx + 1} name`}
                      value={team.name}
                      maxLength={40}
                      onChange={(e) =>
                        setOptions((prev) => ({
                          ...prev,
                          teams: prev.teams.map((t, i) =>
                            i === idx ? { ...t, name: e.target.value } : t
                          ),
                        }))
                      }
                      className="h-8 text-xs"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2.5 rounded-xl border border-slate-200 p-4">
            <label className="flex items-center justify-between gap-3 text-sm">
              <span>Show questions &amp; answers on player devices</span>
              <input
                type="checkbox"
                checked={options.showQuestionOnDevices}
                onChange={(e) =>
                  setOptions((o) => ({ ...o, showQuestionOnDevices: e.target.checked }))
                }
                className="h-4 w-4 accent-indigo-600"
              />
            </label>

            <label className="flex items-center justify-between gap-3 text-sm">
              <span>Randomize question order</span>
              <input
                type="checkbox"
                checked={options.randomizeQuestions}
                onChange={(e) =>
                  setOptions((o) => ({ ...o, randomizeQuestions: e.target.checked }))
                }
                className="h-4 w-4 accent-indigo-600"
              />
            </label>

            <label className="flex items-center justify-between gap-3 text-sm">
              <span>Randomize answer order</span>
              <input
                type="checkbox"
                checked={options.randomizeAnswers}
                onChange={(e) => setOptions((o) => ({ ...o, randomizeAnswers: e.target.checked }))}
                className="h-4 w-4 accent-indigo-600"
              />
            </label>

            <label className="flex items-center justify-between gap-3 text-sm">
              <span>Friendly nicknames (auto-generate)</span>
              <input
                type="checkbox"
                checked={options.friendlyNicknames}
                onChange={(e) =>
                  setOptions((o) => ({ ...o, friendlyNicknames: e.target.checked }))
                }
                className="h-4 w-4 accent-indigo-600"
              />
            </label>

            <label className="flex items-center justify-between gap-3 text-sm">
              <span>Require player identifier (for reports only)</span>
              <input
                type="checkbox"
                checked={options.requirePlayerIdentifier}
                onChange={(e) =>
                  setOptions((o) => ({ ...o, requirePlayerIdentifier: e.target.checked }))
                }
                className="h-4 w-4 accent-indigo-600"
              />
            </label>

            {options.requirePlayerIdentifier && (
              <div className="pt-1 space-y-1">
                <Label htmlFor="identifier-label">Identifier prompt label</Label>
                <Input
                  id="identifier-label"
                  value={options.playerIdentifierLabel}
                  onChange={(e) =>
                    setOptions((o) => ({ ...o, playerIdentifierLabel: e.target.value }))
                  }
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="max-players-input" className="inline-flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" aria-hidden="true" />
                Max players
              </Label>
              <Input
                id="max-players-input"
                type="number"
                min={2}
                max={500}
                value={options.maxPlayers}
                onChange={(e) =>
                  setOptions((o) => ({
                    ...o,
                    maxPlayers: Math.min(500, Math.max(2, Number(e.target.value) || 100)),
                  }))
                }
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="music-toggle">Lobby music</Label>
              <div className="flex h-10 items-center justify-between rounded-lg border border-slate-300 px-3">
                <span className="text-sm">{options.musicEnabled ? 'On' : 'Muted'}</span>
                <input
                  id="music-toggle"
                  type="checkbox"
                  checked={options.musicEnabled}
                  onChange={(e) => setOptions((o) => ({ ...o, musicEnabled: e.target.checked }))}
                  className="h-4 w-4 accent-indigo-600"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="button" loading={submitting} onClick={() => void handleLaunch()}>
              <Play className="h-4 w-4" aria-hidden="true" />
              Open Lobby
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
