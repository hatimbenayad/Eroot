import type { VercelRequest, VercelResponse } from '@vercel/node';
import { kickPlayerRequestSchema } from '../../shared/schemas/game';
import {
  broadcastGameEvent,
  getAdminClient,
  requireHostUser,
  sendError,
} from '../_lib/supabase-admin';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    sendError(res, 405, 'METHOD_NOT_ALLOWED', 'Use POST.');
    return;
  }

  const parsed = kickPlayerRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, 400, 'INVALID_REQUEST', parsed.error.issues[0]?.message ?? 'Invalid payload.');
    return;
  }

  const supabase = getAdminClient();
  const user = await requireHostUser(req, supabase);
  if (!user) {
    sendError(res, 401, 'UNAUTHORIZED', 'Host authentication required.');
    return;
  }

  const { gameId, playerId } = parsed.data;

  const { data: game } = await supabase
    .from('games')
    .select('id')
    .eq('id', gameId)
    .eq('host_id', user.id)
    .maybeSingle();

  if (!game) {
    sendError(res, 404, 'GAME_NOT_FOUND', 'Game not found.');
    return;
  }

  const { error: updateErr } = await supabase
    .from('players')
    .update({ is_kicked: true })
    .eq('id', playerId)
    .eq('game_id', gameId);

  if (updateErr) {
    sendError(res, 500, 'KICK_FAILED', 'Unable to kick player.');
    return;
  }

  const { data: remaining } = await supabase
    .from('players')
    .select('id, nickname')
    .eq('game_id', gameId)
    .eq('is_kicked', false);

  const roster = remaining ?? [];
  await broadcastGameEvent(supabase, gameId, 'player_kicked', {
    playerId,
    players: roster,
  });

  res.status(200).json({ ok: true, players: roster });
}
