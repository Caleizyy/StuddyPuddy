// S8: guessing passwords is slowed down. This is its own file because the counters live in
// memory for the whole test file, and these tests deliberately use them up.

import bcrypt from 'bcryptjs';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../app.js';
import * as userRepository from '../repositories/user.repository.js';

vi.mock('../repositories/user.repository.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../repositories/user.repository.js')>();
  return { ...actual, findUserByEmailWithHash: vi.fn() };
});

const app = createApp();
const password = 'correct-horse-battery';
const hash = bcrypt.hashSync(password, 4);

beforeEach(() => {
  vi.mocked(userRepository.findUserByEmailWithHash).mockImplementation((async (email: string) =>
    email.startsWith('victim')
      ? { id: 'v', name: 'V', email, passwordHash: hash, tokenVersion: 0, role: 'user' }
      : null) as never);
});

const login = (email: string, pass: string) =>
  request(app).post('/api/auth/login').send({ email, password: pass });

describe('S8: login attempts are limited', () => {
  it('locks one account after 5 wrong passwords, even for the right password', async () => {
    for (let attempt = 0; attempt < 5; attempt++) {
      expect((await login('victim@example.com', 'wrong-password')).status).toBe(401);
    }
    const blocked = await login('victim@example.com', password);
    expect(blocked.status).toBe(429);
    expect(blocked.body.error.code).toBe('TOO_MANY_REQUESTS');
    expect(blocked.body.token).toBeUndefined();
  });

  it('does not lock other accounts', async () => {
    const other = await login('victim2@example.com', password);
    expect(other.status).toBe(200);
  });

  it('slows one address that tries many accounts, and a spoofed forwarding header does not help', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    let firstBlocked = -1;
    for (let attempt = 1; attempt <= 40 && firstBlocked === -1; attempt++) {
      const response = await request(app)
        .post('/api/auth/login')
        .set('X-Forwarded-For', `203.0.113.${attempt}`) // pretends to be a new address each time
        .send({ email: `nobody${attempt}@example.com`, password: 'guess' });
      if (response.status === 429) firstBlocked = attempt;
    }
    spy.mockRestore();
    expect(firstBlocked).toBeGreaterThan(0);
    expect(firstBlocked).toBeLessThanOrEqual(21);
  });
});
