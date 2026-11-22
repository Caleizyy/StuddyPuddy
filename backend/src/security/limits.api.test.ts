// Criterion S12: the API as a whole is rate limited. The limit is lowered with an environment
// variable before the app is built, so the test stays small and fast.

import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';

vi.stubEnv('API_LIMIT_PER_IP', '5');
const { createApp } = await import('../app.js');
const app = createApp();

describe('S12: the API as a whole is rate limited', () => {
  it('never blocks the health check, which Docker calls every few seconds', async () => {
    for (let call = 0; call < 20; call++) {
      expect((await request(app).get('/api/health')).status).toBe(200);
    }
  });

  it('answers 429 after the limit, with the standard headers', async () => {
    for (let call = 0; call < 5; call++) {
      expect((await request(app).get('/api/tasks')).status).toBe(401);
    }
    const blocked = await request(app).get('/api/tasks');
    expect(blocked.status).toBe(429);
    expect(blocked.body.error.code).toBe('TOO_MANY_REQUESTS');
    expect(blocked.headers['ratelimit']).toBeDefined();
  });
});
