import bcrypt from 'bcryptjs';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../app.js';
import * as availabilityRepository from '../repositories/availability.repository.js';
import * as taskRepository from '../repositories/task.repository.js';
import * as userRepository from '../repositories/user.repository.js';
import { signToken, verifyToken } from '../utils/token.js';

vi.mock('../repositories/user.repository.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../repositories/user.repository.js')>();
  return {
    ...actual,
    findUserById: vi.fn(),
    findUserWithAvatar: vi.fn(),
    findUserByIdWithHash: vi.fn(),
    setPreferences: vi.fn(),
    replacePasswordHash: vi.fn(),
    raiseTokenVersion: vi.fn(),
    deleteUser: vi.fn(),
  };
});
vi.mock('../repositories/task.repository.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../repositories/task.repository.js')>();
  return { ...actual, listTasksForUser: vi.fn(), deleteAllTasksForUser: vi.fn() };
});
vi.mock('../repositories/availability.repository.js', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('../repositories/availability.repository.js')>();
  return { ...actual, listAvailabilityForUser: vi.fn(), deleteAvailabilityForUser: vi.fn() };
});

const app = createApp();
const PASSWORD = 'correct horse 42';
const hash = bcrypt.hashSync(PASSWORD, 4);

let stored: { preferences?: Record<string, unknown> };
let token: string;

function account() {
  return {
    id: 'u1',
    name: 'Ada',
    email: 'ada@example.com',
    role: 'user',
    tokenVersion: 0,
    passwordHash: hash,
    createdAt: new Date('2026-10-01T00:00:00Z'),
    preferences: stored.preferences,
  };
}

beforeEach(async () => {
  vi.resetAllMocks();
  stored = {};
  token = await signToken('u1', 0);
  vi.mocked(userRepository.findUserById).mockImplementation((async () => account()) as never);
  vi.mocked(userRepository.findUserWithAvatar).mockImplementation((async () => account()) as never);
  vi.mocked(userRepository.findUserByIdWithHash).mockImplementation((async () =>
    account()) as never);
  vi.mocked(userRepository.setPreferences).mockImplementation((async (
    _id: string,
    changes: Record<string, unknown>,
  ) => {
    stored.preferences = { ...stored.preferences, ...changes };
  }) as never);
  vi.mocked(userRepository.replacePasswordHash).mockResolvedValue(1);
  vi.mocked(userRepository.raiseTokenVersion).mockResolvedValue(1);
  vi.mocked(taskRepository.listTasksForUser).mockResolvedValue([
    {
      title: 'Essay',
      category: 'essay',
      deadline: new Date('2026-12-01T00:00:00Z'),
      moduleCount: 1,
      estimatedHours: 4,
      status: 'todo',
    },
  ] as never);
  vi.mocked(availabilityRepository.listAvailabilityForUser).mockResolvedValue([
    { weekday: 2, hoursAvailable: 3 },
    { weekday: 0, hoursAvailable: 1 },
  ] as never);
});

const auth = () => ({ Authorization: `Bearer ${token}` });

describe('account routes need a login', () => {
  it('refuse every request without one', async () => {
    expect((await request(app).get('/api/preferences')).status).toBe(401);
    expect((await request(app).patch('/api/preferences').send({ theme: 'dark' })).status).toBe(401);
    expect((await request(app).post('/api/account/password').send({})).status).toBe(401);
    expect((await request(app).post('/api/account/sign-out-everywhere')).status).toBe(401);
    expect((await request(app).get('/api/account/export')).status).toBe(401);
    expect((await request(app).post('/api/account/delete').send({})).status).toBe(401);
  });
});

describe('preferences', () => {
  it('start with the defaults', async () => {
    const response = await request(app).get('/api/preferences').set(auth());
    expect(response.body.preferences).toEqual({
      theme: 'system',
      weekStart: 'monday',
      defaultPage: 'dashboard',
      compact: false,
    });
  });

  it('change only what is sent', async () => {
    const response = await request(app)
      .patch('/api/preferences')
      .set(auth())
      .send({ theme: 'dark', compact: true });
    expect(response.status).toBe(200);
    expect(response.body.preferences).toMatchObject({
      theme: 'dark',
      compact: true,
      weekStart: 'monday',
    });
  });

  it('refuse unknown values and an empty change', async () => {
    const bad = await request(app).patch('/api/preferences').set(auth()).send({ theme: 'neon' });
    expect(bad.status).toBe(400);
    const page = await request(app)
      .patch('/api/preferences')
      .set(auth())
      .send({ defaultPage: '/admin' });
    expect(page.status).toBe(400);
    const empty = await request(app).patch('/api/preferences').set(auth()).send({ role: 'admin' });
    expect(empty.status).toBe(400);
    expect(userRepository.setPreferences).not.toHaveBeenCalled();
  });

  it('are part of who-am-I', async () => {
    stored.preferences = { theme: 'light' };
    const me = await request(app).get('/api/auth/me').set(auth());
    expect(me.body.user.preferences).toMatchObject({ theme: 'light', weekStart: 'monday' });
  });
});

describe('changing the password', () => {
  const send = (body: object) => request(app).post('/api/account/password').set(auth()).send(body);

  it('saves a new hash and returns a token that works with the new version', async () => {
    const response = await send({ currentPassword: PASSWORD, newPassword: 'a brand new phrase' });
    expect(response.status).toBe(200);
    const [, newHash] = vi.mocked(userRepository.replacePasswordHash).mock.calls[0]!;
    expect(newHash).not.toBe(hash);
    expect(await bcrypt.compare('a brand new phrase', newHash)).toBe(true);
    expect(await verifyToken(response.body.token)).toEqual({ userId: 'u1', tokenVersion: 1 });
  });

  it('needs the right current password', async () => {
    const response = await send({
      currentPassword: 'wrong one',
      newPassword: 'a brand new phrase',
    });
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('INVALID_PASSWORD');
    expect(userRepository.replacePasswordHash).not.toHaveBeenCalled();
  });

  it('refuses a weak, unchanged or email-like new password', async () => {
    for (const newPassword of ['short', 'password123', PASSWORD, 'ada@example.com']) {
      const response = await send({ currentPassword: PASSWORD, newPassword });
      expect(response.status).toBe(400);
    }
    expect(userRepository.replacePasswordHash).not.toHaveBeenCalled();
  });

  it('never returns the hash', async () => {
    const response = await send({ currentPassword: PASSWORD, newPassword: 'a brand new phrase' });
    expect(JSON.stringify(response.body)).not.toContain(hash);
  });
});

describe('signing out everywhere', () => {
  it('raises the token version and keeps this session alive', async () => {
    const response = await request(app).post('/api/account/sign-out-everywhere').set(auth());
    expect(response.status).toBe(200);
    expect(userRepository.raiseTokenVersion).toHaveBeenCalledWith('u1');
    expect((await verifyToken(response.body.token)).tokenVersion).toBe(1);
  });
});

describe('exporting data', () => {
  it('returns the account, tasks and availability as a download, without secrets', async () => {
    const response = await request(app).get('/api/account/export').set(auth());
    expect(response.status).toBe(200);
    expect(response.headers['content-disposition']).toContain('attachment');
    expect(response.body.account).toMatchObject({ email: 'ada@example.com', name: 'Ada' });
    expect(response.body.tasks).toHaveLength(1);
    expect(response.body.availability).toEqual([
      { weekday: 0, hoursAvailable: 1 },
      { weekday: 2, hoursAvailable: 3 },
    ]);
    expect(JSON.stringify(response.body)).not.toMatch(/passwordHash|tokenVersion|"avatar"/);
  });
});

describe('deleting the account', () => {
  const send = (body: object) => request(app).post('/api/account/delete').set(auth()).send(body);

  it('removes the tasks, availability and the user after the password is confirmed', async () => {
    const response = await send({ password: PASSWORD });
    expect(response.status).toBe(204);
    expect(taskRepository.deleteAllTasksForUser).toHaveBeenCalledWith('u1');
    expect(availabilityRepository.deleteAvailabilityForUser).toHaveBeenCalledWith('u1');
    expect(userRepository.deleteUser).toHaveBeenCalledWith('u1');
  });

  it('deletes nothing when the password is wrong or missing', async () => {
    expect((await send({ password: 'nope' })).status).toBe(400);
    expect((await send({})).status).toBe(400);
    expect(taskRepository.deleteAllTasksForUser).not.toHaveBeenCalled();
    expect(userRepository.deleteUser).not.toHaveBeenCalled();
  });
});
