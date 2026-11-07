import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../app.js';
import { AvailabilityModel } from '../models/availability.js';
import { UserModel } from '../models/user.js';
import { signToken } from '../utils/token.js';

const app = createApp();
let mongod: MongoMemoryServer;
let tokenAda: string;
let tokenBen: string;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  await AvailabilityModel.init();
}, 120_000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

beforeEach(async () => {
  await Promise.all([UserModel.deleteMany({}), AvailabilityModel.deleteMany({})]);
  const [ada, ben] = await UserModel.create([
    { email: 'ada@example.com', name: 'Ada', passwordHash: 'not-used-in-these-tests' },
    { email: 'ben@example.com', name: 'Ben', passwordHash: 'not-used-in-these-tests' },
  ]);
  tokenAda = await signToken(ada.id, 0);
  tokenBen = await signToken(ben.id, 0);
});

const read = (token: string) =>
  request(app).get('/api/availability').set('Authorization', `Bearer ${token}`);
const save = (token: string, body: object) =>
  request(app).put('/api/availability').set('Authorization', `Bearer ${token}`).send(body);

describe('study time', () => {
  it('needs a login', async () => {
    expect((await request(app).get('/api/availability')).status).toBe(401);
    expect((await request(app).put('/api/availability').send({})).status).toBe(401);
  });

  it('starts with zero hours on every day', async () => {
    const response = await read(tokenAda);
    expect(response.status).toBe(200);
    expect(response.body.hoursByWeekday).toEqual([0, 0, 0, 0, 0, 0, 0]);
  });

  it('saves the hours and gives them back, Sunday first', async () => {
    const hours = [0, 2, 2, 1.5, 2, 0.25, 4];
    const response = await save(tokenAda, { hoursByWeekday: hours });
    expect(response.status).toBe(200);
    expect(response.body.hoursByWeekday).toEqual(hours);
    expect((await read(tokenAda)).body.hoursByWeekday).toEqual(hours);
  });

  it('replaces the old hours instead of adding more entries', async () => {
    await save(tokenAda, { hoursByWeekday: [1, 1, 1, 1, 1, 1, 1] });
    await save(tokenAda, { hoursByWeekday: [3, 3, 3, 3, 3, 3, 3] });

    expect((await read(tokenAda)).body.hoursByWeekday).toEqual([3, 3, 3, 3, 3, 3, 3]);
    expect(await AvailabilityModel.countDocuments()).toBe(7);
  });

  it("keeps each user's hours separate", async () => {
    await save(tokenAda, { hoursByWeekday: [5, 5, 5, 5, 5, 5, 5] });

    expect((await read(tokenBen)).body.hoursByWeekday).toEqual([0, 0, 0, 0, 0, 0, 0]);

    await save(tokenBen, { hoursByWeekday: [1, 1, 1, 1, 1, 1, 1] });
    expect((await read(tokenAda)).body.hoursByWeekday).toEqual([5, 5, 5, 5, 5, 5, 5]);
  });

  it('rejects the wrong number of days and bad hours', async () => {
    const bad = [
      { hoursByWeekday: [1, 2, 3] },
      { hoursByWeekday: [1, 1, 1, 1, 1, 1, 1, 1] },
      { hoursByWeekday: [25, 1, 1, 1, 1, 1, 1] },
      { hoursByWeekday: [-1, 1, 1, 1, 1, 1, 1] },
      { hoursByWeekday: [0.1, 1, 1, 1, 1, 1, 1] },
      { hoursByWeekday: ['a', 1, 1, 1, 1, 1, 1] },
      {},
    ];
    for (const body of bad) {
      const response = await save(tokenAda, body);
      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    }
    expect(await AvailabilityModel.countDocuments()).toBe(0);
  });
});
