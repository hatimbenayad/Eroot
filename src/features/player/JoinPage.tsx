import { useEffect, useState, type FormEvent } from 'react';
import { Dices } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ErootLogo } from '@/components/eroot/ErootLogo';
import { LanguageSwitcher } from '@/components/eroot/LanguageSwitcher';
import { HostStageShell } from '@/components/eroot/HostStageShell';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { joinGame, lookupGameByPin, type LookupGameResponse } from '@/features/live/api';
import {
  loadLastPlayerGameId,
  loadPlayerSession,
  savePlayerSession,
} from '@/features/player/session-storage';
import { useTranslation } from '@/i18n/useTranslation';
import { generateFriendlyNickname } from '@shared/moderation/nickname';

export function JoinPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialPin = searchParams.get('pin')?.replace(/\D/g, '') ?? '';

  const [pin, setPin] = useState(initialPin);
  const [lookupInfo, setLookupInfo] = useState<LookupGameResponse | null>(null);
  const [nickname, setNickname] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lastGameId = loadLastPlayerGameId();
  const resumable = lastGameId ? loadPlayerSession(lastGameId) : null;

  useEffect(() => {
    if (/^\d{6,7}$/.test(initialPin)) {
      setLoading(true);
      lookupGameByPin(initialPin)
        .then((info) => {
          if (info.mode === 'challenge') {
            navigate(`/challenge/${initialPin}`, { replace: true });
            return;
          }
          setLookupInfo(info);
          setError(null);
        })
        .catch((err) => {
          setError(err instanceof Error ? err.message : 'Game not found.');
        })
        .finally(() => setLoading(false));
    }
  }, [initialPin, navigate]);

  async function handlePinSubmit(event: FormEvent) {
    event.preventDefault();
    const cleaned = pin.replace(/\D/g, '');
    if (!/^\d{6,7}$/.test(cleaned)) {
      setError('Enter a valid 6 or 7 digit Game PIN.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const info = await lookupGameByPin(cleaned);
      if (info.mode === 'challenge') {
        navigate(`/challenge/${cleaned}`);
        return;
      }
      setPin(cleaned);
      setLookupInfo(info);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No active game found for that PIN.');
    } finally {
      setLoading(false);
    }
  }

  async function handleJoinSubmit(event: FormEvent) {
    event.preventDefault();
    if (!lookupInfo) return;

    setLoading(true);
    setError(null);
    try {
      const res = await joinGame({
        pin,
        nickname: lookupInfo.friendlyNicknames ? undefined : nickname,
        identifier: lookupInfo.requirePlayerIdentifier ? identifier : undefined,
        teamId: selectedTeamId || undefined,
      });

      savePlayerSession({
        gameId: res.gameId,
        playerId: res.playerId,
        sessionToken: res.sessionToken,
        nickname: res.nickname,
      });

      navigate(`/play/${res.gameId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to join game.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <HostStageShell className="flex flex-col justify-between px-4 py-8">
      <header className="mx-auto flex w-full max-w-md items-center justify-between gap-2">
        <Link to="/" aria-label="Eroot home">
          <ErootLogo variant="dark" size="md" />
        </Link>
        <div className="flex items-center gap-2">
          <LanguageSwitcher tone="dark" />
          <Link to="/auth" className="text-sm font-medium text-indigo-200 hover:text-white">
            {t('nav.hostSignIn')}
          </Link>
        </div>
      </header>

      <main className="mx-auto my-8 w-full max-w-md space-y-4">
        {resumable && !lookupInfo && (
          <Card className="border-indigo-300 bg-indigo-50">
            <CardContent className="flex items-center justify-between gap-3 p-4">
              <div>
                <p className="text-sm font-bold text-indigo-950">Resume previous game?</p>
                <p className="text-xs text-indigo-800">Playing as {resumable.nickname}</p>
              </div>
              <Button asChild size="sm">
                <Link to={`/play/${resumable.gameId}`}>Rejoin</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="text-center">
            <CardTitle>{lookupInfo ? lookupInfo.quizTitle : t('join.title')}</CardTitle>
            <CardDescription>
              {lookupInfo
                ? 'Choose your nickname to enter the lobby.'
                : t('join.subtitle')}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {error && <Alert variant="error">{error}</Alert>}

            {!lookupInfo ? (
              <form onSubmit={(e) => void handlePinSubmit(e)} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="join-pin">{t('join.pinPlaceholder')}</Label>
                  <Input
                    id="join-pin"
                    inputMode="numeric"
                    autoComplete="off"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="1234567"
                    className="h-12 text-center text-xl font-black tracking-widest"
                  />
                </div>
                <Button type="submit" size="lg" className="w-full" loading={loading}>
                  Enter
                </Button>
              </form>
            ) : (
              <form onSubmit={(e) => void handleJoinSubmit(e)} className="space-y-4">
                {lookupInfo.requirePlayerIdentifier && (
                  <div className="space-y-1.5">
                    <Label htmlFor="player-identifier">{lookupInfo.playerIdentifierLabel}</Label>
                    <Input
                      id="player-identifier"
                      required
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder={lookupInfo.playerIdentifierLabel}
                      className="h-11"
                    />
                  </div>
                )}

                {lookupInfo.friendlyNicknames ? (
                  <Alert variant="info">
                    Friendly nickname mode is on — you will receive an auto-generated nickname upon
                    joining.
                  </Alert>
                ) : (
                  <div className="space-y-1.5">
                    <Label htmlFor="player-nickname">Nickname</Label>
                    {lookupInfo.mode === 'team' && lookupInfo.teams && lookupInfo.teams.length > 0 && (
                  <div className="space-y-1.5">
                    <Label htmlFor="player-team-select">Choose team</Label>
                    <select
                      id="player-team-select"
                      value={selectedTeamId}
                      onChange={(e) => setSelectedTeamId(e.target.value)}
                      className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold"
                    >
                      <option value="">Auto-assign balanced team</option>
                      {lookupInfo.teams.map((tm) => (
                        <option key={tm.id} value={tm.id}>
                          {tm.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex gap-2">
                      <Input
                        id="player-nickname"
                        required
                        maxLength={24}
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                        placeholder="Your nickname"
                        className="h-11 font-semibold"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        aria-label="Random nickname"
                        onClick={() => setNickname(generateFriendlyNickname())}
                        className="h-11 shrink-0"
                      >
                        <Dices className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    </div>
                  </div>
                )}

                {lookupInfo.mode === 'team' && lookupInfo.teams && lookupInfo.teams.length > 0 && (
                  <div className="space-y-1.5">
                    <Label htmlFor="player-team-select">Choose team</Label>
                    <select
                      id="player-team-select"
                      value={selectedTeamId}
                      onChange={(e) => setSelectedTeamId(e.target.value)}
                      className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold"
                    >
                      <option value="">Auto-assign balanced team</option>
                      {lookupInfo.teams.map((tm) => (
                        <option key={tm.id} value={tm.id}>
                          {tm.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setLookupInfo(null);
                      setError(null);
                    }}
                  >
                    Change PIN
                  </Button>
                  <Button type="submit" size="lg" className="flex-1" loading={loading}>
                    OK, go!
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </main>

      <footer className="text-center text-xs text-indigo-200/80">
        {t('common.appName')} — {t('common.tagline')}
      </footer>
    </HostStageShell>
  );
}

