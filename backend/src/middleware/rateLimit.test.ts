import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { errorHandler } from './errorHandler.js';
import { createLimiter } from './rateLimit.js';

function buildApp() {
  const app = express();
  app.use(express.json());
  app.post('/login', createLimiter({ windowMs: 60_000, max: 2, keyBy: 'email' }), (req, res) => {
    res.status(401).json({ error: 'bad credentials' });
  });
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
});
