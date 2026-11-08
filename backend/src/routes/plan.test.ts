import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../app.js';
import { AvailabilityModel } from '../models/availability.js';
import { TaskModel } from '../models/task.js';
import { UserModel } from '../models/user.js';
import { signToken } from '../utils/token.js';

const app = createApp();
const NOW = new Date('2026-11-09T10:00:00.000Z'); // a Monday
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const everyDay = (hours: number) => Array<number>(7).fill(hours);

let mongod: MongoMemoryServer;
let tokenAda: string;
let tokenBen: string;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  await AvailabilityModel.init();
  // Freeze only the date clock, so "today" is the same in every test run
  vi.useFakeTimers({ toFake: ['Date'] });
}, 120_000);

afterAll(async () => {
  vi.useRealTimers();
  await mongoose.disconnect();
  await mongod.stop();
});

beforeEach(async () => {
  vi.setSystemTime(NOW);
  await Promise.all([
    UserModel.deleteMany({}),
    TaskModel.deleteMany({}),
    AvailabilityModel.deleteMany({}),
  ]);
  const [ada, ben] = await UserModel.create([
    { email: 'ada@example.com', name: 'Ada', passwordHash: 'not-used-in-these-tests' },
    { email: 'ben@example.com', name: 'Ben', passwordHash: 'not-used-in-these-tests' },
  ]);
  tokenAda = await signToken(ada.id, 0);
  tokenBen = await signToken(ben.id, 0);
});

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

async function setHours(token: string, hoursByWeekday: number[]) {
  await request(app).put('/api/availability').set(auth(token)).send({ hoursByWeekday });
}

async function addTask(token: string, title: string, daysLeft: number, estimatedHours: number) {
  const deadline = new Date(NOW.getTime() + daysLeft * MS_PER_DAY).toISOString();
  const response = await request(app)
    .post('/api/tasks')
    .set(auth(token))
    .send({ title, category: 'homework', deadline, moduleCount: 1, estimatedHours });
  return response.body.task.id as string;
}

const getPlan = (token: string) => request(app).get('/api/plan').set(auth(token));

const titlesOf = (body: { plan: { items: { title: string }[] } }) =>
  body.plan.items.map((item) => item.title);

describe('GET /api/plan', () => {
  it('needs a login', async () => {
    expect((await request(app).get('/api/plan')).status).toBe(401);
  });

  it('normal case: the nearest deadline comes first and everything fits', async () => {
    await setHours(tokenAda, everyDay(2));
    await addTask(tokenAda, 'History', 7, 2);
    await addTask(tokenAda, 'Math', 5, 6);
    await addTask(tokenAda, 'Lab', 2, 3);

    const response = await getPlan(tokenAda);

    expect(response.status).toBe(200);
    expect(titlesOf(response.body)).toEqual(['Lab', 'Math', 'History']);
    expect(response.body.plan.feasible).toBe(true);
    expect(response.body.plan.warnings).toEqual([]);
  });

  it('conflict case: not everything fits, so the plan warns', async () => {
    await setHours(tokenBen, everyDay(2));
    await addTask(tokenBen, 'Short', 2, 1);
    await addTask(tokenBen, 'Long', 2, 8);

    const { plan } = (await getPlan(tokenBen)).body;

    expect(plan.items.map((item: { title: string }) => item.title)).toEqual(['Long', 'Short']);
    expect(plan.items[0]).toMatchObject({ scheduledHours: 4, unscheduledHours: 4 });
    expect(plan.feasible).toBe(false);
    expect(plan.warnings).toHaveLength(2);
  });

  it('warns about every task when no study hours are set', async () => {
    await addTask(tokenAda, 'Essay', 3, 2);

    const { plan } = (await getPlan(tokenAda)).body;

    expect(plan.items[0]).toMatchObject({ atRisk: true, band: 'high' });
    expect(plan.schedule).toEqual([]);
    expect(plan.feasible).toBe(false);
  });

  it('recalculates when a task is marked done', async () => {
    await setHours(tokenAda, everyDay(2));
    const labId = await addTask(tokenAda, 'Lab', 2, 3);
    await addTask(tokenAda, 'Math', 5, 6);
    expect(titlesOf((await getPlan(tokenAda)).body)).toEqual(['Lab', 'Math']);

    await request(app).patch(`/api/tasks/${labId}`).set(auth(tokenAda)).send({ status: 'done' });

    expect(titlesOf((await getPlan(tokenAda)).body)).toEqual(['Math']);
  });

  it("never mixes users: each plan holds only that user's tasks", async () => {
    await setHours(tokenAda, everyDay(2));
    await setHours(tokenBen, everyDay(3));
    await addTask(tokenAda, "Ada's essay", 4, 2);
    await addTask(tokenBen, "Ben's report", 4, 2);

    expect(titlesOf((await getPlan(tokenAda)).body)).toEqual(["Ada's essay"]);
    expect(titlesOf((await getPlan(tokenBen)).body)).toEqual(["Ben's report"]);
  });

  it('gives an empty, feasible plan when there are no tasks', async () => {
    const { plan } = (await getPlan(tokenAda)).body;
    expect(plan.items).toEqual([]);
    expect(plan.schedule).toEqual([]);
    expect(plan.feasible).toBe(true);
  });
});
