import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';

export function getAdminClient(): SupabaseClient {
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error('Server Supabase configuration missing (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).');
  }

  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function sendError(
  res: VercelResponse,
  status: number,
  code: string,
  message: string
): void {
  res.status(status).json({ error: { code, message } });
}

export function getClientIp(req: VercelRequest): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0]?.trim() || 'unknown';
  }
  if (Array.isArray(forwarded) && forwarded.length > 0) {
    return forwarded[0] ?? 'unknown';
  }
  return req.socket?.remoteAddress ?? 'unknown';
}

export async function requireHostUser(
  req: VercelRequest,
  supabase: SupabaseClient
): Promise<User | null> {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return null;
  }
  const token = header.slice('Bearer '.length).trim();
  if (!token) return null;

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    return null;
  }
  return data.user;
}

export async function enforceRateLimit(
  supabase: SupabaseClient,
  bucketKey: string,
  maxHits: number,
  windowSeconds: number
): Promise<boolean> {
  const { data, error } = await supabase.rpc('check_rate_limit', {
    p_bucket_key: bucketKey,
    p_max_hits: maxHits,
    p_window_seconds: windowSeconds,
  });

  if (error) {
    // Fail open only if rate limiter RPC isn't provisioned yet, logging warning
    console.warn(JSON.stringify({ event: 'rate_limit_rpc_warn', message: error.message }));
    return true;
  }

  return Boolean(data);
}

export async function broadcastGameEvent(
  supabase: SupabaseClient,
  gameId: string,
  event: string,
  payload: Record<string, unknown>
): Promise<void> {
  const channel = supabase.channel(`game:${gameId}`);
  try {
    await channel.httpSend(event, payload);
  } catch (err) {
    console.warn(
      JSON.stringify({
        event: 'realtime_broadcast_error',
        gameId,
        broadcastEvent: event,
        error: err instanceof Error ? err.message : 'unknown',
      })
    );
  } finally {
    await supabase.removeChannel(channel);
  }
}

