import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarClock, Copy, Loader2, StopCircle, UserX } from 'lucide-react';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/features/auth/useAuth';
import {
  fetchHostChallenges,
  manageChallenge,
  type HostChallengeItem,
} from '@/features/live/api';

export function ChallengesPage() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const token = session?.access_token ?? '';
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deadlineDraft, setDeadlineDraft] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const listQuery = useQuery({
    queryKey: ['host-challenges', token],
    queryFn: () => fetchHostChallenges(token),
    enabled: Boolean(token),
  });

  const manageMutation = useMutation({
    mutationFn: (payload: {
      gameId: string;
      deadline?: string;
      endEarly?: boolean;
      removePlayerId?: string;
    }) => manageChallenge(token, payload),
    onSuccess: () => {
      setEditingId(null);
      void queryClient.invalidateQueries({ queryKey: ['host-challenges', token] });
    },
  });

  const challenges = listQuery.data ?? [];

  function startEditDeadline(item: HostChallengeItem) {
    setEditingId(item.id);
    if (item.challenge_deadline) {
      const dt = new Date(item.challenge_deadline);
      dt.setMinutes(dt.getMinutes() - dt.getTimezoneOffset());
      setDeadlineDraft(dt.toISOString().slice(0, 16));
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900">Self-Paced Challenges</h1>
        <p className="text-sm text-slate-600">
          Manage assigned deadlines, close challenges early, or remove participants.
        </p>
      </div>

      {listQuery.isError && (
        <Alert variant="error">
          {listQuery.error instanceof Error ? listQuery.error.message : 'Unable to load challenges.'}
        </Alert>
      )}

      {listQuery.isLoading ? (
        <div role="status" className="flex items-center justify-center py-16 text-slate-600">
          <Loader2 className="mr-2 h-5 w-5 animate-spin text-indigo-600" aria-hidden="true" />
          Loading challenges...
        </div>
      ) : challenges.length === 0 ? (
        <Card className="border-dashed">
          <CardHeader className="items-center text-center py-12">
            <CalendarClock className="mb-2 h-8 w-8 text-indigo-500" aria-hidden="true" />
            <CardTitle>No assigned challenges yet</CardTitle>
            <CardDescription>
              Click <strong>Assign</strong> on any ready quiz in My Library to generate a
              self-paced challenge link.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="space-y-4">
          {challenges.map((ch) => {
            const activePlayers = (ch.players ?? []).filter((p) => !p.is_kicked);
            const isEnded =
              ch.state === 'ended' ||
              (ch.challenge_deadline ? Date.now() > Date.parse(ch.challenge_deadline) : false);
            const shareUrl =
              typeof window !== 'undefined'
                ? `${window.location.origin}/challenge/${ch.pin}`
                : `/challenge/${ch.pin}`;

            return (
              <Card key={ch.id}>
                <CardHeader className="pb-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-lg">{ch.quiz_title}</CardTitle>
                      <CardDescription>
                        PIN: <span className="font-bold text-slate-900">{ch.pin}</span> ·{' '}
                        {isEnded ? 'Closed' : 'Open'} · Deadline:{' '}
                        {ch.challenge_deadline
                          ? new Date(ch.challenge_deadline).toLocaleString()
                          : 'None'}{' '}
                        · {ch.challenge_accuracy_only ? 'Accuracy only' : 'Speed bonus'}
                      </CardDescription>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          void navigator.clipboard?.writeText(shareUrl);
                          setCopiedId(ch.id);
                          window.setTimeout(() => setCopiedId(null), 1500);
                        }}
                      >
                        <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                        {copiedId === ch.id ? 'Copied!' : 'Copy link'}
                      </Button>

                      {!isEnded && (
                        <>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => startEditDeadline(ch)}
                          >
                            Edit deadline
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="danger"
                            onClick={() =>
                              manageMutation.mutate({ gameId: ch.id, endEarly: true })
                            }
                          >
                            <StopCircle className="h-3.5 w-3.5" aria-hidden="true" />
                            End early
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  {editingId === ch.id && (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        manageMutation.mutate({
                          gameId: ch.id,
                          deadline: new Date(deadlineDraft).toISOString(),
                        });
                      }}
                      className="flex flex-wrap items-center gap-2 rounded-xl bg-slate-50 p-3"
                    >
                      <Input
                        type="datetime-local"
                        value={deadlineDraft}
                        onChange={(e) => setDeadlineDraft(e.target.value)}
                        className="w-auto"
                      />
                      <Button type="submit" size="sm">
                        Save deadline
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingId(null)}
                      >
                        Cancel
                      </Button>
                    </form>
                  )}

                  <div className="space-y-1.5">
                    <p className="text-xs font-bold uppercase text-slate-500">
                      Participants ({activePlayers.length})
                    </p>
                    {activePlayers.length === 0 ? (
                      <p className="text-xs text-slate-500">No submissions yet.</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {activePlayers.map((p) => (
                          <span
                            key={p.id}
                            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold"
                          >
                            <span>
                              {p.nickname} ({p.total_score} pts)
                            </span>
                            <button
                              type="button"
                              aria-label={`Remove ${p.nickname}`}
                              onClick={() =>
                                manageMutation.mutate({ gameId: ch.id, removePlayerId: p.id })
                              }
                              className="text-slate-400 hover:text-red-600"
                            >
                              <UserX className="h-3.5 w-3.5" aria-hidden="true" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

