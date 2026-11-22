// Criteria S9 to S11 in docs/verification-security.md: how the API treats the request itself
// (content type, caching, password choice). No database needed.

import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../app.js';
import * as userRepository from '../repositories/user.repository.js';

vi.mock('../repositories/user.repository.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../repositories/user.repository.js')>();
  return { ...actual, findUserByEmailWithHash: vi.fn(), createUser: vi.fn() };
});

const app = createApp();

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(userRepository.findUserByEmailWithHash).mockResolvedValue(null as never);
  vi.mocked(userRepository.createUser).mockResolvedValue({
    id: 'new',
    name: 'Eve',
    email: 'eve@example.com',
    createdAt: new Date(),
  } as never);
});

describe('S9: a body must be JSON', () => {
  it.each([
    ['a web form', 'application/x-www-form-urlencoded', 'email=a%40example.com&password=guess'],
    ['plain text', 'text/plain', '{"email":"a@example.com","password":"guess"}'],
    ['XML', 'application/xml', '<login/>'],
  ])('refuses %s', async (_name, type, body) => {
    const response = await request(app)
      .post('/api/auth/login')
      .set('Content-Type', type)
      .send(body);
    expect(response.status).toBe(415);
    expect(response.body.error.code).toBe('UNSUPPORTED_MEDIA_TYPE');
    expect(userRepository.findUserByEmailWithHash).not.toHaveBeenCalled();
  });

  it('accepts JSON with a charset', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json; charset=utf-8')
      .send('{"email":"a@example.com","password":"guess"}');
    expect(response.status).toBe(401);
  });

  it('does not mind a request without a body', async () => {
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
  });
});

describe('S10: private answers are not cached', () => {
  it.each(['/api/health', '/api/tasks', '/api/does-not-exist'])('%s says no-store', async (url) => {
    const response = await request(app).get(url);
    expect(response.headers['cache-control']).toBe('no-store');
  });
});

describe('S11: a new password must not be an easy guess', () => {
  const register = (password: string, email = 'eve@example.com') =>
    request(app).post('/api/auth/register').send({ name: 'Eve', email, password });

  it.each(['password123', 'PASSWORD123', '12345678', 'qwerty123', 'studdypuddy'])(
    'refuses the common password %s',
    async (password) => {
      const response = await register(password);
      expect(response.status).toBe(400);
      expect(response.body.error.details[0].message).toMatch(/too common/);
      expect(userRepository.createUser).not.toHaveBeenCalled();
    },
  );

  it('refuses a password that is the email address', async () => {
    const response = await register('eve@example.com');
    expect(response.status).toBe(400);
    expect(userRepository.createUser).not.toHaveBeenCalled();
  });

  it('refuses a password longer than bcrypt can use (72 bytes)', async () => {
    expect((await register('x'.repeat(73))).status).toBe(400);
  });

  it('accepts a normal passphrase', async () => {
    expect((await register('purple-rainy-tuesday')).status).toBe(201);
  });
});
