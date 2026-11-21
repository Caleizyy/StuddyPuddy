import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../app.js';
import * as taskRepository from '../repositories/task.repository.js';
import * as userRepository from '../repositories/user.repository.js';
import { signToken } from '../utils/token.js';

vi.mock('../repositories/user.repository.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../repositories/user.repository.js')>();
  return { ...actual, findUserById: vi.fn(), countAllUsers: vi.fn(), createUser: vi.fn() };
});
vi.mock('../repositories/task.repository.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../repositories/task.repository.js')>();
  return { ...actual, countAllOpenTasks: vi.fn(), countAllDoneTasks: vi.fn() };
});

const app = createApp();

function account(id: string, role: 'user' | 'admin') {
  return { id, name: id, email: `${id}@example.com`, tokenVersion: 0, role } as never;
}

const getUsage = (token?: string) => {
  const call = request(app).get('/api/admin/usage');
  return token ? call.set('Authorization', `Bearer ${token}`) : call;
};

describe('admin usage summary', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(userRepository.countAllUsers).mockResolvedValue(3);
    vi.mocked(taskRepository.countAllOpenTasks).mockResolvedValue(5);
    vi.mocked(taskRepository.countAllDoneTasks).mockResolvedValue(2);
  });

  it('needs a login', async () => {
    expect((await getUsage()).status).toBe(401);
    expect((await getUsage('nonsense')).status).toBe(401);
  });

  it('refuses a normal user with 403 and counts nothing', async () => {
    vi.mocked(userRepository.findUserById).mockResolvedValue(account('ben', 'user'));
    const token = await signToken('ben', 0);

    const response = await getUsage(token);

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe('FORBIDDEN');
    expect(userRepository.countAllUsers).not.toHaveBeenCalled();
  });

  it('gives the admin the numbers and nothing else', async () => {
    vi.mocked(userRepository.findUserById).mockResolvedValue(account('ada', 'admin'));
    const token = await signToken('ada', 0);

    const response = await getUsage(token);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ usage: { accounts: 3, tasks: { open: 5, done: 2 } } });
  });

  it('reads the role from the database on every request', async () => {
    const token = await signToken('ada', 0);

    vi.mocked(userRepository.findUserById).mockResolvedValue(account('ada', 'admin'));
    expect((await getUsage(token)).status).toBe(200);

    // The same token, but the account is no longer an admin
    vi.mocked(userRepository.findUserById).mockResolvedValue(account('ada', 'user'));
    expect((await getUsage(token)).status).toBe(403);
  });
});

describe('becoming an admin', () => {
  beforeEach(() => vi.resetAllMocks());

  it('is not possible through registration', async () => {
    vi.mocked(userRepository.createUser).mockResolvedValue({
      id: 'u1',
      name: 'Mallory',
      email: 'mallory@example.com',
      createdAt: new Date(),
    } as never);

    const response = await request(app).post('/api/auth/register').send({
      name: 'Mallory',
      email: 'mallory@example.com',
      password: 'a-long-enough-password',
      role: 'admin',
    });

    expect(response.status).toBe(201);
    const saved = vi.mocked(userRepository.createUser).mock.calls[0][0];
    expect(saved).not.toHaveProperty('role');
  });
});
