import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../app.js';
import { TaskModel } from '../models/task.js';
import { UserModel } from '../models/user.js';
import { signToken } from '../utils/token.js';
import { MAX_OPEN_TASKS } from '../core/validation.js';

const app = createApp();
let mongod: MongoMemoryServer;
let adaId: string;
let tokenAda: string;
let tokenBen: string;

const physicsLab = {
  title: 'Physics lab',
  category: 'lab',
  deadline: '2026-12-01T20:00:00.000Z',
  moduleCount: 1,
  estimatedHours: 3,
};

// Gives Ada exactly the maximum number of unfinished tasks
async function fillToLimit() {
  await TaskModel.insertMany(
    Array.from({ length: MAX_OPEN_TASKS }, (_, i) => ({
      userId: adaId,
      title: `Task ${i}`,
      category: 'homework',
      deadline: new Date('2026-12-01T12:00:00Z'),
      moduleCount: 1,
      estimatedHours: 1,
    })),
  );
}

// The first run downloads a MongoDB binary, so this step gets extra time
beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
}, 120_000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

// Before every test: empty database and two fresh users, Ada and Ben
beforeEach(async () => {
  await Promise.all([UserModel.deleteMany({}), TaskModel.deleteMany({})]);
  const [ada, ben] = await UserModel.create([
    { email: 'ada@example.com', name: 'Ada', passwordHash: 'not-used-in-these-tests' },
    { email: 'ben@example.com', name: 'Ben', passwordHash: 'not-used-in-these-tests' },
  ]);
  adaId = ada.id;
  tokenAda = await signToken(ada.id, 0);
  tokenBen = await signToken(ben.id, 0);
});

function asUser(token: string) {
  return {
    list: () => request(app).get('/api/tasks').set('Authorization', `Bearer ${token}`),
    get: (id: string) =>
      request(app).get(`/api/tasks/${id}`).set('Authorization', `Bearer ${token}`),
    create: (body: object) =>
      request(app).post('/api/tasks').set('Authorization', `Bearer ${token}`).send(body),
    update: (id: string, body: object) =>
      request(app).patch(`/api/tasks/${id}`).set('Authorization', `Bearer ${token}`).send(body),
    remove: (id: string) =>
      request(app).delete(`/api/tasks/${id}`).set('Authorization', `Bearer ${token}`),
  };
}

async function adaCreatesTask(): Promise<string> {
  const response = await asUser(tokenAda).create(physicsLab);
  return response.body.task.id as string;
}

describe('tasks need a login', () => {
  it('rejects requests without a token', async () => {
    const id = new mongoose.Types.ObjectId().toString();
    const calls = [
      request(app).get('/api/tasks'),
      request(app).post('/api/tasks').send(physicsLab),
      request(app).get(`/api/tasks/${id}`),
      request(app).patch(`/api/tasks/${id}`).send({ title: 'x' }),
      request(app).delete(`/api/tasks/${id}`),
    ];
    for (const call of calls) {
      expect((await call).status).toBe(401);
    }
  });
});

describe('creating and reading your own tasks', () => {
  it('creates a task that belongs to the logged-in user', async () => {
    const response = await asUser(tokenAda).create(physicsLab);

    expect(response.status).toBe(201);
    expect(response.body.task).toMatchObject({ title: 'Physics lab', status: 'todo' });
    expect(response.body.task.userId).toBeUndefined(); // the owner id is never sent out

    const saved = await TaskModel.findById(response.body.task.id);
    expect(String(saved?.userId)).toBe(adaId);
  });

  it('ignores a userId sent in the body', async () => {
    const benId = (await UserModel.findOne({ email: 'ben@example.com' }))!.id;
    const response = await asUser(tokenAda).create({ ...physicsLab, userId: benId });

    const saved = await TaskModel.findById(response.body.task.id);
    expect(String(saved?.userId)).toBe(adaId);
  });

  it('lists only your own tasks, earliest deadline first', async () => {
    await asUser(tokenAda).create({
      ...physicsLab,
      title: 'Later',
      deadline: '2026-12-10T20:00:00.000Z',
    });
    await asUser(tokenAda).create({
      ...physicsLab,
      title: 'Sooner',
      deadline: '2026-12-02T20:00:00.000Z',
    });
    await asUser(tokenBen).create({ ...physicsLab, title: "Ben's task" });

    const ada = await asUser(tokenAda).list();
    const ben = await asUser(tokenBen).list();

    expect(ada.body.tasks.map((t: { title: string }) => t.title)).toEqual(['Sooner', 'Later']);
    expect(ben.body.tasks.map((t: { title: string }) => t.title)).toEqual(["Ben's task"]);
  });

  it('lets the owner change, finish and delete a task', async () => {
    const id = await adaCreatesTask();

    const renamed = await asUser(tokenAda).update(id, { title: 'Renamed' });
    expect(renamed.body.task.title).toBe('Renamed');

    const done = await asUser(tokenAda).update(id, { status: 'done' });
    expect(done.body.task.status).toBe('done');

    expect((await asUser(tokenAda).remove(id)).status).toBe(204);
    expect((await asUser(tokenAda).get(id)).status).toBe(404);
  });

  it('uses the status you send, and todo (Not completed) when you send none', async () => {
    const chosen = await asUser(tokenAda).create({ ...physicsLab, status: 'in_progress' });
    const none = await asUser(tokenAda).create(physicsLab);
    expect(chosen.body.task.status).toBe('in_progress');
    expect(none.body.task.status).toBe('todo');
  });

  it('stops a user from creating more unfinished tasks than the limit', async () => {
    await fillToLimit();

    const response = await asUser(tokenAda).create(physicsLab);
    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('TASK_LIMIT_REACHED');

    expect((await asUser(tokenBen).create(physicsLab)).status).toBe(201);
  });

  it('stops a finished task from being reopened past the limit', async () => {
    const id = await adaCreatesTask();
    await asUser(tokenAda).update(id, { status: 'done' });
    await fillToLimit();

    const reopen = await asUser(tokenAda).update(id, { status: 'todo' });
    expect(reopen.status).toBe(409);
    expect(reopen.body.error.code).toBe('TASK_LIMIT_REACHED');
    expect((await TaskModel.findById(id))?.status).toBe('done'); // unchanged

    // Editing a task that is already unfinished is still allowed
    const unfinished = await TaskModel.findOne({ userId: adaId, title: 'Task 0' });
    const edit = await asUser(tokenAda).update(unfinished!.id, { title: 'Renamed' });
    expect(edit.status).toBe(200);

    // Once there is room again, the task can be reopened
    await TaskModel.deleteOne({ _id: unfinished!.id });
    expect((await asUser(tokenAda).update(id, { status: 'todo' })).status).toBe(200);
  });
});

describe("another user's task", () => {
  it('cannot be read by someone else', async () => {
    const id = await adaCreatesTask();
    const response = await asUser(tokenBen).get(id);
    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('TASK_NOT_FOUND');
  });

  it('cannot be changed by someone else', async () => {
    const id = await adaCreatesTask();
    const response = await asUser(tokenBen).update(id, { title: 'Hacked' });
    expect(response.status).toBe(404);

    const saved = await TaskModel.findById(id);
    expect(saved?.title).toBe('Physics lab'); // unchanged
  });

  it('cannot be deleted by someone else', async () => {
    const id = await adaCreatesTask();
    const response = await asUser(tokenBen).remove(id);
    expect(response.status).toBe(404);
    expect(await TaskModel.findById(id)).not.toBeNull(); // still there
  });

  it('gives the same answer as a task that does not exist', async () => {
    const id = await adaCreatesTask();
    const foreign = await asUser(tokenBen).get(id);
    const missing = await asUser(tokenBen).get(new mongoose.Types.ObjectId().toString());
    expect(foreign.status).toBe(missing.status);
    expect(foreign.body).toEqual(missing.body);
  });

  it('answers 404, not a server error, for a malformed id', async () => {
    expect((await asUser(tokenAda).get('not-an-id')).status).toBe(404);
  });

  it('ignores a userId in the query string', async () => {
    const ben = await UserModel.findOne({ email: 'ben@example.com' });
    await asUser(tokenBen).create({ ...physicsLab, title: "Ben's task" });

    const response = await request(app)
      .get(`/api/tasks?userId=${ben!.id}`)
      .set('Authorization', `Bearer ${tokenAda}`);

    expect(response.status).toBe(200);
    expect(response.body.tasks).toEqual([]);
  });

  it('cannot be handed to another owner through an edit', async () => {
    const id = await adaCreatesTask();
    const ben = await UserModel.findOne({ email: 'ben@example.com' });

    await asUser(tokenAda).update(id, { title: 'Still mine', userId: ben!.id });

    const saved = await TaskModel.findById(id);
    expect(String(saved?.userId)).toBe(adaId);
    expect(saved?.title).toBe('Still mine');
  });
});

describe('invalid tasks are rejected', () => {
  it('rejects missing fields, bad hours and bad dates', async () => {
    const bad = [
      { ...physicsLab, title: '' },
      { ...physicsLab, category: 'party' },
      { ...physicsLab, deadline: 'tomorrow' },
      { ...physicsLab, estimatedHours: 0 },
      { ...physicsLab, estimatedHours: 1.3 },
      { ...physicsLab, estimatedHours: 201 },
      { ...physicsLab, moduleCount: 0 },
      { ...physicsLab, status: 'finished' },
    ];
    for (const body of bad) {
      const response = await asUser(tokenAda).create(body);
      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    }
    expect(await TaskModel.countDocuments()).toBe(0);
  });

  it('rejects an empty edit', async () => {
    const id = await adaCreatesTask();
    expect((await asUser(tokenAda).update(id, {})).status).toBe(400);
  });

  it('applies the same hours rules when editing a task', async () => {
    const id = await adaCreatesTask();

    for (const estimatedHours of [1.3, 0, 201]) {
      const response = await asUser(tokenAda).update(id, { estimatedHours });
      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    }
    expect((await TaskModel.findById(id))?.estimatedHours).toBe(3); // unchanged

    const valid = await asUser(tokenAda).update(id, { estimatedHours: 1.25 });
    expect(valid.status).toBe(200);
    expect(valid.body.task.estimatedHours).toBe(1.25);
  });
});
