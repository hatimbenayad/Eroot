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
import { gameOptionsSchema, type GameOptions } from '@shared/schemas/game';

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
            Configure live options for <span className="font-semibold">{quizTitle || 'Untitled quiz'}</span>.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          {error && <Alert variant="error">{error}</Alert>}

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border-2 border-indigo-600 bg-indigo-50/70 p-3">
              <p className="text-sm font-bold text-indigo-950">Classic (PvP)</p>
              <p className="text-xs text-indigo-800">Individual player leaderboard</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 opacity-65">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-700">Team mode</p>
                <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-bold">R3</span>
              </div>
              <p className="text-xs text-slate-500">2–5 teams (Unit U8)</p>
            </div>
          </div>

          <div className="space-y-2.5 rounded-xl border border-slate-200 p-4">
            <label className="flex items-center justify-between gap-3 text-sm">
              <span>Show questions & answers on player devices</span>
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

