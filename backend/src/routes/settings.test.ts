import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../app.js';
import * as userRepository from '../repositories/user.repository.js';
import { signToken } from '../utils/token.js';

vi.mock('../repositories/user.repository.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../repositories/user.repository.js')>();
  return { ...actual, findUserById: vi.fn(), setMaxHoursPerDay: vi.fn() };
});

const app = createApp();

// A tiny fake database: the daily limit of each user, by id
let limits: Record<string, number | null>;
let tokenAda: string;
let tokenBen: string;

beforeEach(async () => {
  vi.resetAllMocks();
  limits = { ada: null, ben: null };
  vi.mocked(userRepository.findUserById).mockImplementation((async (id: string) => ({
    id,
    name: id,
    email: `${id}@example.com`,
    tokenVersion: 0,
    role: 'user',
    maxHoursPerDay: limits[id],
  })) as never);
  vi.mocked(userRepository.setMaxHoursPerDay).mockImplementation(async (id, value) => {
    limits[id] = value;
  });
  tokenAda = await signToken('ada', 0);
  tokenBen = await signToken('ben', 0);
});

const read = (token: string) =>
  request(app).get('/api/settings').set('Authorization', `Bearer ${token}`);
const save = (token: string, body: object) =>
  request(app).put('/api/settings').set('Authorization', `Bearer ${token}`).send(body);

describe('settings', () => {
  it('need a login', async () => {
    expect((await request(app).get('/api/settings')).status).toBe(401);
    expect((await request(app).put('/api/settings').send({ maxHoursPerDay: 2 })).status).toBe(401);
  });

  it('start with no daily limit', async () => {
    const response = await read(tokenAda);
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ settings: { maxHoursPerDay: null } });
  });

  it('save the daily limit and give it back', async () => {
    const response = await save(tokenAda, { maxHoursPerDay: 2.5 });
    expect(response.status).toBe(200);
    expect(response.body.settings.maxHoursPerDay).toBe(2.5);
    expect((await read(tokenAda)).body.settings.maxHoursPerDay).toBe(2.5);
  });

  it('remove the limit when null is sent', async () => {
    await save(tokenAda, { maxHoursPerDay: 2 });
    const response = await save(tokenAda, { maxHoursPerDay: null });
    expect(response.body.settings.maxHoursPerDay).toBeNull();
  });

  it("keep each user's setting separate", async () => {
    await save(tokenAda, { maxHoursPerDay: 2 });

    expect((await read(tokenBen)).body.settings.maxHoursPerDay).toBeNull();
    expect((await read(tokenAda)).body.settings.maxHoursPerDay).toBe(2);
  });

  it('change the account of the token, not an id sent in the request', async () => {
    const response = await request(app)
      .put('/api/settings?userId=ben')
      .set('Authorization', `Bearer ${tokenAda}`)
      .send({ maxHoursPerDay: 2, userId: 'ben', id: 'ben' });

    expect(response.status).toBe(200);
    expect(userRepository.setMaxHoursPerDay).toHaveBeenCalledWith('ada', 2);
    expect(limits).toEqual({ ada: 2, ben: null });
  });

  it('ignore a role in the body', async () => {
    await save(tokenAda, { maxHoursPerDay: 2, role: 'admin' });
    expect(vi.mocked(userRepository.setMaxHoursPerDay).mock.calls).toEqual([['ada', 2]]);
  });

  it.each([0, -1, 0.1, 0.3, 24.25, 25, '2', true, undefined])(
    'reject the limit %j',
    async (value) => {
      const response = await save(tokenAda, { maxHoursPerDay: value });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(limits.ada).toBeNull(); // nothing was saved
    },
  );
});
