// The filters against a real (in-memory) database: matching, sorting and, above all, ownership.

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

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
}, 120_000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

const day = (n: number) => new Date(Date.UTC(2026, 11, n));

beforeEach(async () => {
  await UserModel.deleteMany({});
  await TaskModel.deleteMany({});
  const [ada, ben] = await UserModel.create([
    { email: 'ada@example.com', name: 'Ada', passwordHash: 'x' },
    { email: 'ben@example.com', name: 'Ben', passwordHash: 'x' },
  ]);
  tokenAda = await signToken(ada.id, 0);
  const base = { moduleCount: 1 };
  await TaskModel.create([
    {
      ...base,
      userId: ada.id,
      title: 'Maths exam',
      category: 'exam',
      deadline: day(10),
      estimatedHours: 8,
      status: 'todo',
    },
    {
      ...base,
      userId: ada.id,
      title: 'Physics lab report',
      category: 'lab',
      deadline: day(5),
      estimatedHours: 3,
      status: 'in_progress',
    },
    {
      ...base,
      userId: ada.id,
      title: 'History essay (draft)',
      category: 'homework',
      deadline: day(20),
      estimatedHours: 5,
      status: 'done',
    },
    {
      ...base,
      userId: ben.id,
      title: 'Ben secret lab',
      category: 'lab',
      deadline: day(6),
      estimatedHours: 2,
      status: 'todo',
    },
  ]);
});

const titles = async (query: string) => {
  const response = await request(app)
    .get(`/api/tasks${query}`)
    .set('Authorization', `Bearer ${tokenAda}`);
  expect(response.status).toBe(200);
  return (response.body.tasks as { title: string }[]).map((task) => task.title);
};

describe('filtering with a real database', () => {
  it('sorts by deadline by default and counts only my own tasks in total', async () => {
    const response = await request(app)
      .get('/api/tasks')
      .set('Authorization', `Bearer ${tokenAda}`);
    expect(response.body.tasks.map((t: { title: string }) => t.title)).toEqual([
      'Physics lab report',
      'Maths exam',
      'History essay (draft)',
    ]);
    expect(response.body.total).toBe(3);
  });

  it('filters by status, category and text', async () => {
    expect(await titles('?status=open')).toEqual(['Physics lab report', 'Maths exam']);
    expect(await titles('?status=done')).toEqual(['History essay (draft)']);
    expect(await titles('?category=lab')).toEqual(['Physics lab report']);
    expect(await titles('?q=MATHS')).toEqual(['Maths exam']);
  });

  it('treats search text literally', async () => {
    expect(await titles('?q=(draft)')).toEqual(['History essay (draft)']);
    expect(await titles('?q=.*')).toEqual([]);
  });

  it('filters by a deadline window', async () => {
    const after = encodeURIComponent(day(5).toISOString());
    const before = encodeURIComponent(day(10).toISOString());
    expect(await titles(`?dueAfter=${after}&dueBefore=${before}`)).toEqual(['Physics lab report']);
  });

  it('sorts by most hours first and by title', async () => {
    expect(await titles('?sort=-hours')).toEqual([
      'Maths exam',
      'History essay (draft)',
      'Physics lab report',
    ]);
    expect(await titles('?sort=title')).toEqual([
      'History essay (draft)',
      'Maths exam',
      'Physics lab report',
    ]);
  });

  it("never shows another person's tasks, however they are searched", async () => {
    expect(await titles('?q=secret')).toEqual([]);
    expect(await titles('?category=lab')).not.toContain('Ben secret lab');
  });
});
