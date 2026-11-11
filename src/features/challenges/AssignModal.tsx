import { useState } from 'react';
import { CalendarClock, Check, Copy } from 'lucide-react';
import { Link } from 'react-router-dom';
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
import { createChallenge } from '@/features/live/api';

interface AssignModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quizId: string | null;
  quizTitle: string;
}

function defaultDeadlineValue(): string {
  const dt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  dt.setMinutes(dt.getMinutes() - dt.getTimezoneOffset());
  return dt.toISOString().slice(0, 16);
}

export function AssignModal({ open, onOpenChange, quizId, quizTitle }: AssignModalProps) {
  const { session } = useAuth();
  const [deadlineLocal, setDeadlineLocal] = useState(defaultDeadlineValue);
  const [timerEnabled, setTimerEnabled] = useState(true);
  const [accuracyOnly, setAccuracyOnly] = useState(false);
  const [requireIdentifier, setRequireIdentifier] = useState(false);
  const [identifierLabel, setIdentifierLabel] = useState('Full name or ID');
  const [friendlyNicknames, setFriendlyNicknames] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ gameId: string; pin: string } | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleAssign() {
    if (!quizId || !session?.access_token) return;
    setSubmitting(true);
    setError(null);
    try {
      const isoDeadline = new Date(deadlineLocal).toISOString();
      const res = await createChallenge(session.access_token, {
        quizId,
        deadline: isoDeadline,
        timerEnabled,
        accuracyOnly,
        requirePlayerIdentifier: requireIdentifier,
        playerIdentifierLabel: identifierLabel,
        friendlyNicknames,
        maxPlayers: 100,
      });
      setCreated(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to assign challenge.');
    } finally {
      setSubmitting(false);
    }
  }

  const shareUrl =
    created && typeof window !== 'undefined'
      ? `${window.location.origin}/challenge/${created.pin}`
      : '';

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          setCreated(null);
          setError(null);
          setCopied(false);
        }
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-indigo-600" aria-hidden="true" />
            Assign Self-Paced Challenge
          </DialogTitle>
          <DialogDescription>
            Share <span className="font-semibold">{quizTitle || 'Untitled quiz'}</span> for async
            completion before a deadline.
          </DialogDescription>
        </DialogHeader>

        {created ? (
          <div className="mt-4 space-y-4">
            <Alert variant="success" title="Challenge ready!">
              Players can join until {new Date(deadlineLocal).toLocaleString()} using PIN{' '}
              <span className="font-bold">{created.pin}</span>.
            </Alert>
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2.5">
              <span className="flex-1 truncate text-xs font-mono text-slate-700">{shareUrl}</span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  void navigator.clipboard?.writeText(shareUrl);
                  setCopied(true);
                }}
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? 'Copied' : 'Copy'}
              </Button>
            </div>
            <div className="flex justify-end gap-2">
              <Button asChild variant="outline">
                <Link to="/challenges">Manage Challenges</Link>
              </Button>
              <Button type="button" onClick={() => onOpenChange(false)}>
                Done
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            {error && <Alert variant="error">{error}</Alert>}

            <div className="space-y-1.5">
              <Label htmlFor="challenge-deadline">Deadline</Label>
              <Input
                id="challenge-deadline"
                type="datetime-local"
                value={deadlineLocal}
                onChange={(e) => setDeadlineLocal(e.target.value)}
              />
            </div>

            <div className="space-y-2.5 rounded-xl border border-slate-200 p-4 text-sm">
              <label className="flex items-center justify-between gap-2">
                <span>Question timer enabled</span>
                <input
                  type="checkbox"
                  checked={timerEnabled}
                  onChange={(e) => setTimerEnabled(e.target.checked)}
                  className="h-4 w-4 accent-indigo-600"
                />
              </label>

              <label className="flex items-center justify-between gap-2">
                <span>Accuracy-only scoring (no speed bonus)</span>
                <input
                  type="checkbox"
                  checked={accuracyOnly}
                  onChange={(e) => setAccuracyOnly(e.target.checked)}
                  className="h-4 w-4 accent-indigo-600"
                />
              </label>

              <label className="flex items-center justify-between gap-2">
                <span>Friendly nicknames</span>
                <input
                  type="checkbox"
                  checked={friendlyNicknames}
                  onChange={(e) => setFriendlyNicknames(e.target.checked)}
                  className="h-4 w-4 accent-indigo-600"
                />
              </label>

              <label className="flex items-center justify-between gap-2">
                <span>Require player identifier</span>
                <input
                  type="checkbox"
                  checked={requireIdentifier}
                  onChange={(e) => setRequireIdentifier(e.target.checked)}
                  className="h-4 w-4 accent-indigo-600"
                />
              </label>

              {requireIdentifier && (
                <Input
                  aria-label="Identifier label"
                  value={identifierLabel}
                  onChange={(e) => setIdentifierLabel(e.target.value)}
                />
              )}
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="button" loading={submitting} onClick={() => void handleAssign()}>
                Create Challenge
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

