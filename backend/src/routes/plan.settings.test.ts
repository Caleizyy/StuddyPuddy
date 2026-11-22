import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../app.js';
import * as availabilityRepository from '../repositories/availability.repository.js';
import * as taskRepository from '../repositories/task.repository.js';
import * as userRepository from '../repositories/user.repository.js';
import { signToken } from '../utils/token.js';

vi.mock('../repositories/user.repository.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../repositories/user.repository.js')>();
  return { ...actual, findUserById: vi.fn(), setMaxHoursPerDay: vi.fn() };
});
vi.mock('../repositories/task.repository.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../repositories/task.repository.js')>();
  return { ...actual, listTasksForUser: vi.fn() };
});
vi.mock('../repositories/availability.repository.js', () => ({
  listAvailabilityForUser: vi.fn(),
  saveAvailabilityForUser: vi.fn(),
}));

const app = createApp();
const NOW = new Date('2026-11-09T10:00:00.000Z'); // a Monday
const MS_PER_DAY = 24 * 60 * 60 * 1000;

// Ada and Ben have exactly the same task and the same hours. Only the limits can differ.
let limits: Record<string, number | null>;
let tokenAda: string;
let tokenBen: string;

beforeAll(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
});
afterAll(() => {
  vi.useRealTimers();
});

beforeEach(async () => {
  vi.resetAllMocks();
  vi.setSystemTime(NOW);
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

  // One task: 6 hours of work, due in 2 days
  vi.mocked(taskRepository.listTasksForUser).mockResolvedValue([
    {
      id: 'task1',
      title: 'Report',
      deadline: new Date(NOW.getTime() + 2 * MS_PER_DAY),
      estimatedHours: 6,
      createdAt: new Date('2026-11-01T00:00:00Z'),
      status: 'todo',
    },
  ] as never);
  // Four study hours on every weekday
  vi.mocked(availabilityRepository.listAvailabilityForUser).mockResolvedValue(
    Array.from({ length: 7 }, (_, weekday) => ({ weekday, hoursAvailable: 4 })) as never,
  );

  tokenAda = await signToken('ada', 0);
  tokenBen = await signToken('ben', 0);
});

const getPlan = (token: string) =>
  request(app).get('/api/plan').set('Authorization', `Bearer ${token}`);
const saveLimit = (token: string, maxHoursPerDay: number | null) =>
  request(app)
    .put('/api/settings')
    .set('Authorization', `Bearer ${token}`)
    .send({ maxHoursPerDay });

describe('a client setting in the plan', () => {
  it('without a limit the 6 h task fits into 2 days of 4 h', async () => {
    const { plan } = (await getPlan(tokenAda)).body;
    expect(plan.feasible).toBe(true);
    expect(plan.settings).toEqual({ maxHoursPerDay: null });
  });

  it("changes only that client's plan", async () => {
    await saveLimit(tokenAda, 2);

    const ada = (await getPlan(tokenAda)).body.plan;
    const ben = (await getPlan(tokenBen)).body.plan;

    // Ada: 2 h a day for 2 days is 4 h, so 2 h of the task do not fit
    expect(ada.settings).toEqual({ maxHoursPerDay: 2 });
    expect(ada.feasible).toBe(false);
    expect(ada.items[0]).toMatchObject({ scheduledHours: 4, unscheduledHours: 2, atRisk: true });
    expect(ada.schedule.every((entry: { hours: number }) => entry.hours <= 2)).toBe(true);

    // Ben did nothing, so his plan is the same as before
    expect(ben.settings).toEqual({ maxHoursPerDay: null });
    expect(ben.feasible).toBe(true);
    expect(ben.items[0]).toMatchObject({ scheduledHours: 6, unscheduledHours: 0, atRisk: false });
  });

  it('is applied again as soon as the setting is changed back', async () => {
    await saveLimit(tokenAda, 2);
    expect((await getPlan(tokenAda)).body.plan.feasible).toBe(false);

    await saveLimit(tokenAda, null);
    expect((await getPlan(tokenAda)).body.plan.feasible).toBe(true);
  });

  it('is reported, not silently used, when a saved limit is invalid', async () => {
    limits.ada = 30; // something the settings endpoint would never have saved

    const response = await getPlan(tokenAda);

    expect(response.status).toBe(422);
    expect(response.body.error.code).toBe('PLANNING_INPUT_INVALID');
    expect(response.body.error.details[0].field).toBe('maxHoursPerDay');
  });
});
