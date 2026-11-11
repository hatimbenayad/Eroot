import { describe, expect, it } from 'vitest';
import { checkHealth } from '../../api/health';

describe('/api/health checkHealth', () => {
  it('returns 503 degraded unconfigured when Supabase env vars are missing', async () => {
    const result = await checkHealth({ supabaseUrl: '', supabaseKey: '' });
    expect(result.httpStatus).toBe(503);
    expect(result.body.status).toBe('degraded');
    expect(result.body.database).toBe('unconfigured');
    expect(result.body.service).toBe('eroot-api');
  });

  it('returns 200 ok connected when database probe succeeds', async () => {
    const result = await checkHealth({
      supabaseUrl: 'https://demo.supabase.co',
      supabaseKey: 'service-key',
      probeDatabase: async () => true,
    });
    expect(result.httpStatus).toBe(200);
    expect(result.body.status).toBe('ok');
    expect(result.body.database).toBe('connected');
  });

  it('returns 503 degraded error when database probe fails or throws', async () => {
    const failed = await checkHealth({
      supabaseUrl: 'https://demo.supabase.co',
      supabaseKey: 'service-key',
      probeDatabase: async () => false,
    });
    expect(failed.httpStatus).toBe(503);
    expect(failed.body.database).toBe('error');

    const threw = await checkHealth({
      supabaseUrl: 'https://demo.supabase.co',
      supabaseKey: 'service-key',
      probeDatabase: async () => {
        throw new Error('timeout');
      },
    });
    expect(threw.httpStatus).toBe(503);
    expect(threw.body.database).toBe('error');
  });
});

