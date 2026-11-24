// Criterion S13: creating accounts is limited per address (lowered here so the test is short).

import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../repositories/user.repository.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../repositories/user.repository.js')>();
  return {
    ...actual,
    createUser: vi.fn().mockResolvedValue({
      id: 'new',
      name: 'Eve',
      email: 'eve@example.com',
      createdAt: new Date(),
    }),
  };
});

vi.stubEnv('REGISTER_LIMIT_PER_IP', '2');
const { createApp } = await import('../app.js');
const app = createApp();

describe('S13: creating accounts is rate limited per address', () => {
  it('blocks the third account in a row, even with valid data', async () => {
    const register = () =>
      request(app)
        .post('/api/auth/register')
        .send({ name: 'Eve', email: 'eve@example.com', password: 'purple-rainy-tuesday' });

    expect((await register()).status).toBe(201);
    expect((await register()).status).toBe(201);
    const blocked = await register();
    expect(blocked.status).toBe(429);
    expect(blocked.body.error.code).toBe('TOO_MANY_REQUESTS');
  });
});
