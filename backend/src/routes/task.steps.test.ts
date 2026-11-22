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
    setStepsForUser: vi.fn(),
    setStepDoneForUser: vi.fn(),
  };
});
vi.mock('../repositories/availability.repository.js', () => ({
  listAvailabilityForUser: vi.fn(),
  saveAvailabilityForUser: vi.fn(),
}));

const app = createApp();
const NOW = new Date('2026-11-09T10:00:00.000Z');
const TASK_ID = 'a'.repeat(24);
const STEP_ID = 'b'.repeat(24);
let token: string;

type StepDoc = { _id: string; title: string; hours: number; done: boolean };
const task = (steps: StepDoc[] = []) => ({
  id: TASK_ID,
  title: 'Maths exam',
  category: 'exam',
  deadline: new Date('2026-12-01T12:00:00Z'),
  moduleCount: 3,
  estimatedHours: 5,
  status: 'todo',
  createdAt: new Date('2026-11-01T00:00:00Z'),
  updatedAt: new Date('2026-11-01T00:00:00Z'),
  steps,
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
  vi.mocked(taskRepository.setStepsForUser).mockImplementation((async (
    _user: string,
    _task: string,
    steps: { id?: string; title: string; hours: number; done: boolean }[],
  ) => task(steps.map((s, i) => ({ ...s, _id: s.id ?? `${i}`.repeat(24) })))) as never);
});

const auth = () => ({ Authorization: `Bearer ${token}` });

describe('splitting a task into topics', () => {
  it('makes one topic per module and shares the hours', async () => {
    vi.mocked(taskRepository.findTaskForUser).mockResolvedValue(task() as never);
    const response = await request(app).post(`/api/tasks/${TASK_ID}/steps/split`).set(auth());
    expect(response.status).toBe(201);
    expect(response.body.task.steps.map((s: { hours: number }) => s.hours)).toEqual([
      1.75, 1.75, 1.5,
    ]);
    expect(response.body.task.steps.map((s: { title: string }) => s.title)).toEqual([
      'Topic 1',
      'Topic 2',
      'Topic 3',
    ]);
  });

  it('does not overwrite topics the person already has', async () => {
    vi.mocked(taskRepository.findTaskForUser).mockResolvedValue(
      task([{ _id: STEP_ID, title: 'Mine', hours: 2, done: false }]) as never,
    );
    const response = await request(app).post(`/api/tasks/${TASK_ID}/steps/split`).set(auth());
    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('STEPS_EXIST');
    expect(taskRepository.setStepsForUser).not.toHaveBeenCalled();
  });

  it('answers 404 for a task that is not theirs', async () => {
    vi.mocked(taskRepository.findTaskForUser).mockResolvedValue(null);
    const response = await request(app).post(`/api/tasks/${TASK_ID}/steps/split`).set(auth());
    expect(response.status).toBe(404);
  });
});

describe('editing the topics', () => {
  const put = (body: object) =>
    request(app).put(`/api/tasks/${TASK_ID}/steps`).set(auth()).send(body);

  it('replaces the list and keeps the ids that were sent', async () => {
    const response = await put({
      steps: [
        { id: STEP_ID, title: ' Limits ', hours: 2, done: true },
        { title: 'Series', hours: 1.5 },
      ],
    });
    expect(response.status).toBe(200);
    expect(response.body.task.steps).toEqual([
      { id: STEP_ID, title: 'Limits', hours: 2, done: true },
      { id: '1'.repeat(24), title: 'Series', hours: 1.5, done: false },
    ]);
  });

  it('refuses bad topics', async () => {
    const bad = [
      { steps: [{ title: '', hours: 1 }] },
      { steps: [{ title: 'x', hours: 0 }] },
      { steps: [{ title: 'x', hours: 1.1 }] },
      { steps: [{ title: 'x', hours: 1, id: 'not-an-id' }] },
      { steps: Array.from({ length: 31 }, (_, i) => ({ title: `T${i}`, hours: 1 })) },
      { steps: 'nope' },
      {},
    ];
    for (const body of bad) expect((await put(body)).status).toBe(400);
    expect(taskRepository.setStepsForUser).not.toHaveBeenCalled();
  });

  it('allows an empty list, which removes all topics', async () => {
    expect((await put({ steps: [] })).status).toBe(200);
  });
});

describe('ticking a topic', () => {
  const patch = (body: object) =>
    request(app).patch(`/api/tasks/${TASK_ID}/steps/${STEP_ID}`).set(auth()).send(body);

  it('marks the topic and returns the task', async () => {
    vi.mocked(taskRepository.setStepDoneForUser).mockResolvedValue(
      task([{ _id: STEP_ID, title: 'Limits', hours: 2, done: true }]) as never,
    );
    const response = await patch({ done: true });
    expect(response.status).toBe(200);
    expect(taskRepository.setStepDoneForUser).toHaveBeenCalledWith('u1', TASK_ID, STEP_ID, true);
    expect(response.body.task.steps[0].done).toBe(true);
  });

  it('answers 404 when the topic is not on one of their tasks', async () => {
    vi.mocked(taskRepository.setStepDoneForUser).mockResolvedValue(null);
    expect((await patch({ done: true })).status).toBe(404);
  });

  it('needs done to be true or false', async () => {
    expect((await patch({ done: 'yes' })).status).toBe(400);
    expect((await patch({})).status).toBe(400);
  });
});

describe('the plan names the next topic', () => {
  it('shows the first topic that is not done, and how many are done', async () => {
    vi.mocked(taskRepository.listTasksForUser).mockResolvedValue([
      {
        ...task([
          { _id: '1'.repeat(24), title: 'Limits', hours: 2, done: true },
          { _id: '2'.repeat(24), title: 'Series', hours: 2, done: false },
          { _id: '3'.repeat(24), title: 'Integrals', hours: 1, done: false },
        ]),
        id: 'task1',
      },
      { ...task(), id: 'task2', title: 'No topics', estimatedHours: 1 },
    ] as never);
    vi.mocked(availabilityRepository.listAvailabilityForUser).mockResolvedValue(
      Array.from({ length: 7 }, (_, weekday) => ({ weekday, hoursAvailable: 4 })) as never,
    );
    const { plan } = (await request(app).get('/api/plan').set(auth())).body;
    const byId = Object.fromEntries(plan.items.map((i: { taskId: string }) => [i.taskId, i]));
    expect(byId.task1).toMatchObject({ nextStep: 'Series', stepsDone: 1, stepsTotal: 3 });
    expect(byId.task2).toMatchObject({ nextStep: null, stepsDone: 0, stepsTotal: 0 });
  });
});
