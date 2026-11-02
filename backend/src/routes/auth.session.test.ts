import bcrypt from 'bcryptjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import * as userRepository from '../repositories/user.repository.js';

vi.mock('../repositories/user.repository.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../repositories/user.repository.js')>();
  return {
    ...actual,
    findUserByEmailWithHash: vi.fn(),
    findUserById: vi.fn(),
    bumpTokenVersion: vi.fn(),
  };
});

const app = createApp();
const password = 'correct-horse-battery';
const storedUser = {
  id: 'u1',
  name: 'Ada',
  email: 'ada@example.com',
  passwordHash: bcrypt.hashSync(password, 4),
  tokenVersion: 0,
};

async function loginAndGetToken() {
  vi.mocked(userRepository.findUserByEmailWithHash).mockResolvedValue(storedUser as never);
  const response = await request(app)
    .post('/api/auth/login')
    .send({ email: storedUser.email, password });
  return response.body.token as string;
}

describe('login', () => {
  beforeEach(() => vi.resetAllMocks());

  it('returns a token and the user for correct credentials', async () => {
    const token = await loginAndGetToken();
    expect(token).toEqual(expect.any(String));
  });

  it('rejects a wrong password with a generic 401', async () => {
    vi.mocked(userRepository.findUserByEmailWithHash).mockResolvedValue(storedUser as never);
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: storedUser.email, password: 'wrong-password' });
    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
    expect(response.body.token).toBeUndefined();
  });

  it('gives the same answer for an unknown email', async () => {
    vi.mocked(userRepository.findUserByEmailWithHash).mockResolvedValue(null);
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password });
    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
  });
});

describe('protected routes', () => {
  beforeEach(() => vi.resetAllMocks());

  it('rejects a request without a token', async () => {
    const response = await request(app).get('/api/auth/me');
    expect(response.status).toBe(401);
  });

  it('rejects a garbage token', async () => {
    const response = await request(app).get('/api/auth/me').set('Authorization', 'Bearer nonsense');
    expect(response.status).toBe(401);
  });

  it('returns the current user for a valid token', async () => {
    const token = await loginAndGetToken();
    vi.mocked(userRepository.findUserById).mockResolvedValue(storedUser as never);
    const response = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(200);
    expect(response.body.user.email).toBe('ada@example.com');
  });

  it('rejects the old token after logout', async () => {
    const token = await loginAndGetToken();
    vi.mocked(userRepository.findUserById).mockResolvedValue(storedUser as never);
    const logout = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${token}`);
    expect(logout.status).toBe(204);
    expect(userRepository.bumpTokenVersion).toHaveBeenCalledWith('u1');

    // after the bump, the stored version no longer matches the one inside the token
    vi.mocked(userRepository.findUserById).mockResolvedValue({
      ...storedUser,
      tokenVersion: 1,
    } as never);
    const response = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(401);
  });

  it('returns a validation error, not a 500, when the email is not a string', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: { toString: null }, password: 'x' });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(userRepository.findUserByEmailWithHash).not.toHaveBeenCalled();
  });
});
