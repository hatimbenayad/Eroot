import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { GameOptions } from '../../shared/schemas/game';
import { enforceRateLimit, getAdminClient, getClientIp, sendError } from '../_lib/supabase-admin';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    sendError(res, 405, 'METHOD_NOT_ALLOWED', 'Use GET.');
    return;
  }

  const rawPin = typeof req.query.pin === 'string' ? req.query.pin.trim() : '';
  if (!/^\d{6,7}$/.test(rawPin)) {
    sendError(res, 400, 'INVALID_PIN', 'Enter a valid 6 or 7 digit Game PIN.');
    return;
  }

  const supabase = getAdminClient();
  const ip = getClientIp(req);
  const allowed = await enforceRateLimit(supabase, `lookup:${ip}`, 25, 60);
  if (!allowed) {
    sendError(res, 429, 'RATE_LIMITED', 'Too many PIN checks. Please wait a minute.');
    return;
  }

  const { data, error } = await supabase
    .from('games')
    .select('id, quiz_title, theme_id, settings, state')
    .eq('pin', rawPin)
    .neq('state', 'ended')
    .maybeSingle();

  if (error || !data) {
    sendError(res, 404, 'GAME_NOT_FOUND', 'No active game found for that PIN.');
    return;
  }

  const settings = (data.settings ?? {}) as Partial<GameOptions>;
  res.status(200).json({
    gameId: data.id,
    quizTitle: data.quiz_title,
    themeId: data.theme_id,
    requirePlayerIdentifier: Boolean(settings.requirePlayerIdentifier),
    playerIdentifierLabel: settings.playerIdentifierLabel || 'Full name or ID',
    friendlyNicknames: Boolean(settings.friendlyNicknames),
  });
}
