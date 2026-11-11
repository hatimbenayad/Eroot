import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export interface HealthReport {
  status: 'ok' | 'degraded';
  service: 'eroot-api';
  database: 'connected' | 'unconfigured' | 'error';
  timestamp: string;
}

export interface HealthCheckerDeps {
  supabaseUrl?: string;
  supabaseKey?: string;
  probeDatabase?: (url: string, key: string) => Promise<boolean>;
}

async function defaultProbeDatabase(url: string, key: string): Promise<boolean> {
  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error } = await supabase.from('quizzes').select('id', { count: 'exact', head: true }).limit(1);
  return !error;
}

export async function checkHealth(deps?: HealthCheckerDeps): Promise<{
  httpStatus: 200 | 503;
  body: HealthReport;
}> {
  const url = deps?.supabaseUrl ?? process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const key =
    deps?.supabaseKey ??
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.VITE_SUPABASE_ANON_KEY;

  const timestamp = new Date().toISOString();

  if (!url || !key) {
    return {
      httpStatus: 503,
      body: {
        status: 'degraded',
        service: 'eroot-api',
        database: 'unconfigured',
        timestamp,
      },
    };
  }

  try {
    const probe = deps?.probeDatabase ?? defaultProbeDatabase;
    const ok = await probe(url, key);
    if (!ok) {
      return {
        httpStatus: 503,
        body: {
          status: 'degraded',
          service: 'eroot-api',
          database: 'error',
          timestamp,
        },
      };
    }

    return {
      httpStatus: 200,
      body: {
        status: 'ok',
        service: 'eroot-api',
        database: 'connected',
        timestamp,
      },
    };
  } catch {
    return {
      httpStatus: 503,
      body: {
        status: 'degraded',
        service: 'eroot-api',
        database: 'error',
        timestamp,
      },
    };
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    res.status(405).json({ error: { code: 'METHOD_NOT_ALLOWED', message: 'Use GET' } });
    return;
  }

  const result = await checkHealth();
  res.setHeader('Cache-Control', 'no-store');
  res.status(result.httpStatus).json(result.body);
}

