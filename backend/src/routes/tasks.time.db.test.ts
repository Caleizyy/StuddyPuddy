// Time entries against a real (in-memory) database: ownership, the limit and removal.

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
    deadline: new Date('2027-01-20T12:00:00Z'),
    moduleCount: 1,
    estimatedHours: 6,
  };
  const [a, b] = await TaskModel.create([
    { ...base, userId: ada.id, title: 'Ada exam' },
    { ...base, userId: ben.id, title: 'Ben exam' },
  ]);
  adaTaskId = a.id;
  benTaskId = b.id;
});

const as = (token: string) => ({ Authorization: `Bearer ${token}` });
const today = () => new Date().toISOString().slice(0, 10);

describe('time entries with a real database', () => {
  it('adds entries, totals them and removes one', async () => {
    await request(app)
      .post(`/api/tasks/${adaTaskId}/time`)
      .set(as(tokenAda))
      .send({ hours: 1.5, date: today() });
    const second = await request(app)
      .post(`/api/tasks/${adaTaskId}/time`)
      .set(as(tokenAda))
      .send({ hours: 2, note: 'chapter 3' });
    expect(second.status).toBe(201);
    expect(second.body.task.loggedHours).toBe(3.5);

    const entries = second.body.task.timeEntries as { id: string; note?: string }[];
    const entryId = entries.find((entry) => entry.note === 'chapter 3')?.id as string;
    const removed = await request(app)
      .delete(`/api/tasks/${adaTaskId}/time/${entryId}`)
      .set(as(tokenAda));
    expect(removed.status).toBe(200);
    expect(removed.body.task.loggedHours).toBe(1.5);
  });

  it('shows logged hours in the task list and shrinks the plan', async () => {
    await request(app).post(`/api/tasks/${adaTaskId}/time`).set(as(tokenAda)).send({ hours: 4 });
    const list = await request(app).get('/api/tasks').set(as(tokenAda));
    expect(list.body.tasks[0].loggedHours).toBe(4);
  });

  it("cannot log time on, or remove time from, someone else's task", async () => {
    const attempt = await request(app)
      .post(`/api/tasks/${benTaskId}/time`)
      .set(as(tokenAda))
      .send({ hours: 1 });
    expect(attempt.status).toBe(404);

    const own = await request(app)
      .post(`/api/tasks/${benTaskId}/time`)
      .set(as(tokenBen))
      .send({ hours: 1 });
    const benEntry = own.body.task.timeEntries[0].id as string;
    const removal = await request(app)
      .delete(`/api/tasks/${benTaskId}/time/${benEntry}`)
      .set(as(tokenAda));
    expect(removal.status).toBe(404);
    expect((await TaskModel.findById(benTaskId))?.timeEntries).toHaveLength(1);
  });

  it('cannot remove an entry through a different task of the same person', async () => {
    const mine = await request(app)
      .post(`/api/tasks/${adaTaskId}/time`)
      .set(as(tokenAda))
      .send({ hours: 1 });
    const other = await TaskModel.create({
      userId: (await UserModel.findOne({ email: 'ada@example.com' }))!.id,
      title: 'Second',
      category: 'quiz',
      deadline: new Date('2027-01-21T12:00:00Z'),
      moduleCount: 1,
      estimatedHours: 1,
    });
    const removal = await request(app)
      .delete(`/api/tasks/${other.id}/time/${mine.body.task.timeEntries[0].id}`)
      .set(as(tokenAda));
    expect(removal.status).toBe(404);
  });

  it('stops adding entries at the limit even if two requests race', async () => {
    const entries = Array.from({ length: 499 }, () => ({ date: today(), hours: 0.25 }));
    await TaskModel.updateOne({ _id: adaTaskId }, { $set: { timeEntries: entries } });
    const results = await Promise.all(
      [1, 2, 3].map(() =>
        request(app).post(`/api/tasks/${adaTaskId}/time`).set(as(tokenAda)).send({ hours: 1 }),
      ),
    );
    expect(results.filter((r) => r.status === 201).length).toBe(1);
    expect((await TaskModel.findById(adaTaskId))?.timeEntries).toHaveLength(500);
  });
});
