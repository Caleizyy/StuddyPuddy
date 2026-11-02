import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { errorHandler } from './errorHandler.js';
import { createLimiter } from './rateLimit.js';

function buildApp() {
  const app = express();
  app.set('trust proxy', 1);
  app.use(express.json());
  app.post(
    '/login',
    createLimiter({ windowMs: 60_000, max: 2, keyBy: 'ip-and-email' }),
    (req, res) => {
      res.status(401).json({ error: 'bad credentials' });
    },
  );
  app.use(errorHandler);
  return app;
}

describe('login rate limiter', () => {
  it('blocks an email after too many failed attempts but not other emails', async () => {
    const app = buildApp();
    await request(app).post('/login').send({ email: 'a@example.com' });
    await request(app).post('/login').send({ email: 'a@example.com' });

    const blocked = await request(app).post('/login').send({ email: 'A@example.com ' });
    expect(blocked.status).toBe(429);
    expect(blocked.body.error.code).toBe('TOO_MANY_REQUESTS');

    const other = await request(app).post('/login').send({ email: 'b@example.com' });
    expect(other.status).toBe(401);
  });

  it('blocks an email only for the address that failed, not for others', async () => {
    const app = buildApp();
    await request(app).post('/login').send({ email: 'a@example.com' });
    await request(app).post('/login').send({ email: 'a@example.com' });

    const blocked = await request(app).post('/login').send({ email: 'a@example.com' });
    expect(blocked.status).toBe(429);

    const otherAddress = await request(app)
      .post('/login')
      .set('X-Forwarded-For', '203.0.113.9')
      .send({ email: 'a@example.com' });
    expect(otherAddress.status).toBe(401);
  });

  it('does not crash on a non-string email', async () => {
    const response = await request(buildApp())
      .post('/login')
      .send({ email: { toString: null } });
    expect(response.status).toBe(401);
  });
});
