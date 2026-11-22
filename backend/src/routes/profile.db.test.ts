// The profile with a real (in-memory) database: the things a mock cannot prove, such as the
// unique username index and the picture being kept out of normal user lookups.

import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../app.js';
import { UserModel } from '../models/user.js';
import { findUserById } from '../repositories/user.repository.js';
import { signToken } from '../utils/token.js';

const app = createApp();
let mongod: MongoMemoryServer;
let adaId: string;
let tokenAda: string;
let tokenBen: string;

const JPEG = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(300, 7)]);

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  await UserModel.init(); // builds the unique username index before the tests rely on it
}, 120_000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

beforeEach(async () => {
  await UserModel.deleteMany({});
  const [ada, ben] = await UserModel.create([
    { email: 'ada@example.com', name: 'Ada', passwordHash: 'not-used-in-these-tests' },
    { email: 'ben@example.com', name: 'Ben', passwordHash: 'not-used-in-these-tests' },
  ]);
  adaId = ada.id;
  tokenAda = await signToken(ada.id, 0);
  tokenBen = await signToken(ben.id, 0);
});

const patch = (token: string, body: object) =>
  request(app).patch('/api/profile').set('Authorization', `Bearer ${token}`).send(body);

describe('usernames are unique', () => {
  it('lets many accounts have no username at all', async () => {
    const count = await UserModel.countDocuments({ username: { $exists: false } });
    expect(count).toBe(2);
  });

  it('refuses a username that another account has, in any letter case', async () => {
    expect((await patch(tokenAda, { username: 'ada_l' })).status).toBe(200);
    const taken = await patch(tokenBen, { username: 'ADA_L' });
    expect(taken.status).toBe(409);
    expect(taken.body.error.code).toBe('USERNAME_TAKEN');
    expect((await patch(tokenBen, { username: 'ben_b' })).status).toBe(200);
  });

  it('frees the username when its owner removes it', async () => {
    await patch(tokenAda, { username: 'ada_l' });
    expect((await patch(tokenAda, { username: null })).body.profile.username).toBeNull();
    expect((await patch(tokenBen, { username: 'ada_l' })).status).toBe(200);
  });

  it('lets the owner save their own username again', async () => {
    await patch(tokenAda, { username: 'ada_l' });
    expect((await patch(tokenAda, { username: 'ada_l', name: 'Ada L' })).status).toBe(200);
  });
});

describe('the picture', () => {
  it('is saved, shown to its owner and left out of normal user lookups', async () => {
    const saved = await request(app)
      .put('/api/profile/avatar')
      .set('Authorization', `Bearer ${tokenAda}`)
      .set('Content-Type', 'image/jpeg')
      .send(JPEG);
    expect(saved.status).toBe(200);

    const me = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${tokenAda}`);
    expect(me.body.user.avatar).toBe(`data:image/jpeg;base64,${JPEG.toString('base64')}`);

    const lightweight = await findUserById(adaId);
    expect(lightweight?.avatar).toBeUndefined();
  });

  it('is not shown to another account and can be removed', async () => {
    await request(app)
      .put('/api/profile/avatar')
      .set('Authorization', `Bearer ${tokenAda}`)
      .set('Content-Type', 'image/jpeg')
      .send(JPEG);

    const ben = await request(app).get('/api/profile').set('Authorization', `Bearer ${tokenBen}`);
    expect(ben.body.profile.avatar).toBeNull();

    const removed = await request(app)
      .delete('/api/profile/avatar')
      .set('Authorization', `Bearer ${tokenAda}`);
    expect(removed.body.profile.avatar).toBeNull();
  });
});
