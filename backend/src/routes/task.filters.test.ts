import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../app.js';
import * as taskRepository from '../repositories/task.repository.js';
import * as userRepository from '../repositories/user.repository.js';
import { signToken } from '../utils/token.js';

vi.mock('../repositories/user.repository.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../repositories/user.repository.js')>();
  return { ...actual, findUserById: vi.fn() };
});
vi.mock('../repositories/task.repository.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../repositories/task.repository.js')>();
  return { ...actual, searchTasksForUser: vi.fn(), countTasksForUser: vi.fn() };
});

const app = createApp();
let token: string;

beforeEach(async () => {
  vi.resetAllMocks();
  token = await signToken('u1', 0);
  vi.mocked(userRepository.findUserById).mockResolvedValue({
    id: 'u1',
    tokenVersion: 0,
    role: 'user',
  } as never);
  vi.mocked(taskRepository.searchTasksForUser).mockResolvedValue([]);
  vi.mocked(taskRepository.countTasksForUser).mockResolvedValue(7);
});

const get = (query: string) =>
  request(app).get(`/api/tasks${query}`).set('Authorization', `Bearer ${token}`);

describe('GET /api/tasks filters', () => {
  it('passes checked filters on, with the default sort, and reports the total', async () => {
    const response = await get('?status=open&category=lab&q=%20report%20');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ tasks: [], total: 7 });
    expect(taskRepository.searchTasksForUser).toHaveBeenCalledWith('u1', {
      status: 'open',
      category: 'lab',
      q: 'report',
      sort: 'deadline',
    });
  });

  it('works with no filters at all', async () => {
    expect((await get('')).status).toBe(200);
    expect(taskRepository.searchTasksForUser).toHaveBeenCalledWith('u1', { sort: 'deadline' });
  });

  it('refuses unknown values with a clear error', async () => {
    for (const query of [
      '?status=finished',
      '?category=party',
      '?sort=password',
      '?dueAfter=yesterday',
      `?q=${'x'.repeat(81)}`,
    ]) {
      const response = await get(query);
      expect(response.status, query).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    }
    expect(taskRepository.searchTasksForUser).not.toHaveBeenCalled();
  });

  it('cannot be given database operators through the address', async () => {
    // Express reads "status[$ne]" as a plain text key, not as a nested object, and the filter
    // check only accepts plain strings. Either way no operator reaches the database.
    for (const query of ['?status[$ne]=done', '?q[$regex]=.*', '?category[]=lab']) {
      const response = await get(query);
      expect(response.status, query).toBeLessThan(500);
    }
    for (const [, query] of vi.mocked(taskRepository.searchTasksForUser).mock.calls) {
      for (const value of Object.values(query)) expect(typeof value).toBe('string');
    }
  });

  it('needs a login', async () => {
    expect((await request(app).get('/api/tasks?status=open')).status).toBe(401);
  });
});
