import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import * as userRepository from '../repositories/user.repository.js';

vi.mock('../repositories/user.repository.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../repositories/user.repository.js')>();
  return { ...actual, createUser: vi.fn() };
});

const app = createApp();
const validBody = { name: 'Ada', email: 'Ada@Example.com', password: 'correct-horse-battery' };

describe('POST /api/auth/register', () => {
  beforeEach(() => {
    vi.mocked(userRepository.createUser).mockReset();
  });

  it('registers a user, stores a hash instead of the password, and never returns it', async () => {
    vi.mocked(userRepository.createUser).mockResolvedValue({
      id: '1',
      name: 'Ada',
      email: 'ada@example.com',
      createdAt: new Date(),
    } as never);

    const response = await request(app).post('/api/auth/register').send(validBody);

    expect(response.status).toBe(201);
    expect(response.body.user.email).toBe('ada@example.com');
    expect(JSON.stringify(response.body)).not.toContain('passwordHash');

    const saved = vi.mocked(userRepository.createUser).mock.calls[0][0];
    expect(saved.email).toBe('ada@example.com');
    expect(saved.passwordHash).not.toBe(validBody.password);
    expect(saved.passwordHash).toMatch(/^\$2[aby]\$/);
  });

  it('rejects a duplicate email and names the email field', async () => {
    vi.mocked(userRepository.createUser).mockRejectedValue(
      new userRepository.DuplicateEmailError('duplicate'),
    );

    const response = await request(app).post('/api/auth/register').send(validBody);

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('EMAIL_TAKEN');
    expect(response.body.error.details[0].field).toBe('email');
  });

  it('rejects invalid input and names every field to fix', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({ name: '', email: 'not-an-email', password: 'short' });

    expect(response.status).toBe(400);
    const fields = response.body.error.details.map((detail: { field: string }) => detail.field);
    expect(fields).toEqual(expect.arrayContaining(['name', 'email', 'password']));
    expect(userRepository.createUser).not.toHaveBeenCalled();
  });
});
