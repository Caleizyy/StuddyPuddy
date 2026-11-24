// Topics against a real (in-memory) database: ticking one topic must never touch another task or
// another person's task, and ids must survive an edit.

import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../app.js';
import { TaskModel } from '../models/task.js';
import { UserModel } from '../models/user.js';
import { signToken } from '../utils/token.js';

const app = createApp();
let mongod: MongoMemoryServer;
let tokenAda: string;
let tokenBen: string;
let adaTaskId: string;
let benTaskId: string;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
}, 120_000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

beforeEach(async () => {
  await UserModel.deleteMany({});
  await TaskModel.deleteMany({});
  const [ada, ben] = await UserModel.create([
    { email: 'ada@example.com', name: 'Ada', passwordHash: 'x' },
    { email: 'ben@example.com', name: 'Ben', passwordHash: 'x' },
  ]);
  tokenAda = await signToken(ada.id, 0);
  tokenBen = await signToken(ben.id, 0);
  const base = {
    category: 'exam' as const,
    deadline: new Date('2026-12-20T12:00:00Z'),
    status: 'todo' as const,
  };
  const [a, b] = await TaskModel.create([
    { ...base, userId: ada.id, title: 'Ada exam', moduleCount: 3, estimatedHours: 6 },
    { ...base, userId: ben.id, title: 'Ben exam', moduleCount: 2, estimatedHours: 4 },
  ]);
  adaTaskId = a.id;
  benTaskId = b.id;
});

const as = (token: string) => ({ Authorization: `Bearer ${token}` });

describe('topics with a real database', () => {
  it('splits, ticks one topic and keeps ids when the list is saved again', async () => {
    const split = await request(app).post(`/api/tasks/${adaTaskId}/steps/split`).set(as(tokenAda));
    expect(split.status).toBe(201);
    const steps = split.body.task.steps as { id: string; hours: number; done: boolean }[];
    expect(steps.map((s) => s.hours)).toEqual([2, 2, 2]);

    const ticked = await request(app)
      .patch(`/api/tasks/${adaTaskId}/steps/${steps[1]!.id}`)
      .set(as(tokenAda))
      .send({ done: true });
    expect(ticked.body.task.steps.map((s: { done: boolean }) => s.done)).toEqual([
      false,
      true,
      false,
    ]);

    const saved = await request(app)
      .put(`/api/tasks/${adaTaskId}/steps`)
      .set(as(tokenAda))
      .send({ steps: ticked.body.task.steps });
    expect(saved.body.task.steps.map((s: { id: string }) => s.id)).toEqual(steps.map((s) => s.id));
    expect(saved.body.task.steps[1].done).toBe(true);
  });

  it("cannot split, replace or tick topics on someone else's task", async () => {
    expect(
      (await request(app).post(`/api/tasks/${benTaskId}/steps/split`).set(as(tokenAda))).status,
    ).toBe(404);
    expect(
      (
        await request(app)
          .put(`/api/tasks/${benTaskId}/steps`)
          .set(as(tokenAda))
          .send({ steps: [{ title: 'Hacked', hours: 1 }] })
      ).status,
    ).toBe(404);

    const split = await request(app).post(`/api/tasks/${benTaskId}/steps/split`).set(as(tokenBen));
    const benStep = split.body.task.steps[0].id as string;
    const tick = await request(app)
      .patch(`/api/tasks/${benTaskId}/steps/${benStep}`)
      .set(as(tokenAda))
      .send({ done: true });
    expect(tick.status).toBe(404);
    expect((await TaskModel.findById(benTaskId))?.steps[0]?.done).toBe(false);
  });

  it('cannot tick a topic through a different task of the same person', async () => {
    const mine = await request(app).post(`/api/tasks/${adaTaskId}/steps/split`).set(as(tokenAda));
    const other = await TaskModel.create({
      userId: (await UserModel.findOne({ email: 'ada@example.com' }))!.id,
      title: 'Second',
      category: 'quiz',
      deadline: new Date('2026-12-21T12:00:00Z'),
      moduleCount: 1,
      estimatedHours: 1,
    });
    const tick = await request(app)
      .patch(`/api/tasks/${other.id}/steps/${mine.body.task.steps[0].id}`)
      .set(as(tokenAda))
      .send({ done: true });
    expect(tick.status).toBe(404);
  });
});
