import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../app.js';
import * as availabilityRepository from '../repositories/availability.repository.js';
import * as taskRepository from '../repositories/task.repository.js';
import * as userRepository from '../repositories/user.repository.js';
import { signToken } from '../utils/token.js';

vi.mock('../repositories/user.repository.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../repositories/user.repository.js')>();
  return { ...actual, findUserById: vi.fn() };
});
vi.mock('../repositories/task.repository.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../repositories/task.repository.js')>();
  return {
    ...actual,
    findTaskForUser: vi.fn(),
    listTasksForUser: vi.fn(),
    addTimeEntryForUser: vi.fn(),
    removeTimeEntryForUser: vi.fn(),
  };
});
vi.mock('../repositories/availability.repository.js', () => ({
  listAvailabilityForUser: vi.fn(),
  saveAvailabilityForUser: vi.fn(),
}));

const app = createApp();
const NOW = new Date('2026-11-09T10:00:00.000Z');
const TASK_ID = 'a'.repeat(24);
const ENTRY_ID = 'c'.repeat(24);
let token: string;

type EntryDoc = { _id: string; date: string; hours: number; note?: string };
const task = (timeEntries: EntryDoc[] = []) => ({
  id: TASK_ID,
  title: 'Essay',
  category: 'homework',
  deadline: new Date(NOW.getTime() + 2 * 86400000),
  moduleCount: 1,
  estimatedHours: 6,
  status: 'in_progress',
  createdAt: new Date('2026-11-01T00:00:00Z'),
  updatedAt: new Date('2026-11-01T00:00:00Z'),
  steps: [],
  timeEntries,
});

beforeAll(() => vi.useFakeTimers({ toFake: ['Date'] }));
afterAll(() => vi.useRealTimers());

beforeEach(async () => {
  vi.resetAllMocks();
  vi.setSystemTime(NOW);
  token = await signToken('u1', 0);
  vi.mocked(userRepository.findUserById).mockResolvedValue({
    id: 'u1',
    tokenVersion: 0,
    role: 'user',
  } as never);
  vi.mocked(taskRepository.findTaskForUser).mockResolvedValue(task() as never);
  vi.mocked(taskRepository.addTimeEntryForUser).mockImplementation((async (
    _u: string,
    _t: string,
    entry: { date: string; hours: number; note?: string },
  ) => task([{ _id: ENTRY_ID, ...entry }])) as never);
});

const auth = () => ({ Authorization: `Bearer ${token}` });
const log = (body: object) =>
  request(app).post(`/api/tasks/${TASK_ID}/time`).set(auth()).send(body);

describe('logging time', () => {
  it('adds an entry for today by default and returns the total', async () => {
    const response = await log({ hours: 1.5, note: ' reading ' });
    expect(response.status).toBe(201);
    expect(taskRepository.addTimeEntryForUser).toHaveBeenCalledWith('u1', TASK_ID, {
      date: '2026-11-09',
      hours: 1.5,
      note: 'reading',
    });
    expect(response.body.task.loggedHours).toBe(1.5);
    expect(response.body.task.timeEntries[0]).toMatchObject({ date: '2026-11-09', hours: 1.5 });
  });

  it('accepts a day in the past and tomorrow, but nothing later', async () => {
    expect((await log({ hours: 1, date: '2026-11-01' })).status).toBe(201);
    expect((await log({ hours: 1, date: '2026-11-10' })).status).toBe(201);
    expect((await log({ hours: 1, date: '2026-11-11' })).status).toBe(400);
  });

  it('refuses bad hours and bad days', async () => {
    const bad = [
      { hours: 0 },
      { hours: -1 },
      { hours: 25 },
      { hours: 1.1 },
      { hours: '2' },
      {},
      { hours: 1, date: 'yesterday' },
      { hours: 1, date: '2026-02-30' },
      { hours: 1, date: '2019-12-31' },
      { hours: 1, note: 'x'.repeat(121) },
    ];
    for (const body of bad) expect((await log(body)).status, JSON.stringify(body)).toBe(400);
    expect(taskRepository.addTimeEntryForUser).not.toHaveBeenCalled();
  });

  it('answers 404 for a task that is not theirs', async () => {
    vi.mocked(taskRepository.findTaskForUser).mockResolvedValue(null);
    expect((await log({ hours: 1 })).status).toBe(404);
    expect(taskRepository.addTimeEntryForUser).not.toHaveBeenCalled();
  });

  it('stops at the entry limit', async () => {
    const many = Array.from({ length: 500 }, (_, i) => ({
      _id: `${i}`.padStart(24, '0'),
      date: '2026-11-01',
      hours: 0.25,
    }));
    vi.mocked(taskRepository.findTaskForUser).mockResolvedValue(task(many) as never);
    const response = await log({ hours: 1 });
    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('TIME_LOG_FULL');
  });
});

describe('removing an entry', () => {
  it('removes it and returns the task', async () => {
    vi.mocked(taskRepository.removeTimeEntryForUser).mockResolvedValue(task() as never);
    const response = await request(app)
      .delete(`/api/tasks/${TASK_ID}/time/${ENTRY_ID}`)
      .set(auth());
    expect(response.status).toBe(200);
    expect(taskRepository.removeTimeEntryForUser).toHaveBeenCalledWith('u1', TASK_ID, ENTRY_ID);
    expect(response.body.task.loggedHours).toBe(0);
  });

  it('answers 404 when the entry is not on one of their tasks', async () => {
    vi.mocked(taskRepository.removeTimeEntryForUser).mockResolvedValue(null);
    const response = await request(app)
      .delete(`/api/tasks/${TASK_ID}/time/${ENTRY_ID}`)
      .set(auth());
    expect(response.status).toBe(404);
  });
});

describe('logged time changes the plan', () => {
  it('schedules only the hours that are left', async () => {
    vi.mocked(taskRepository.listTasksForUser).mockResolvedValue([
      {
        ...task([
          { _id: '1'.repeat(24), date: '2026-11-08', hours: 2 },
          { _id: '2'.repeat(24), date: '2026-11-09', hours: 1.5 },
        ]),
        id: 'task1',
      },
    ] as never);
    vi.mocked(availabilityRepository.listAvailabilityForUser).mockResolvedValue(
      Array.from({ length: 7 }, (_, weekday) => ({ weekday, hoursAvailable: 4 })) as never,
    );
    const { plan } = (await request(app).get('/api/plan').set(auth())).body;
    expect(plan.items[0]).toMatchObject({
      loggedHours: 3.5,
      remainingHours: 2.5,
      scheduledHours: 2.5,
      unscheduledHours: 0,
    });
    const planned = plan.schedule.reduce((sum: number, e: { hours: number }) => sum + e.hours, 0);
    expect(planned).toBe(2.5);
  });
});
