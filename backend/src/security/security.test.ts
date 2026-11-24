// Security checks that run without a database (the repositories are replaced by small fakes).
// Criteria S1 to S8 in docs/verification-security.md. Run them with:
//   npm run verify:security -w backend

import bcrypt from 'bcryptjs';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../app.js';
import * as userRepository from '../repositories/user.repository.js';
import { signToken } from '../utils/token.js';
import { forgedToken, listRoutes, unsignedToken } from './helpers.js';

vi.mock('../repositories/user.repository.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../repositories/user.repository.js')>();
  return {
    ...actual,
    findUserByEmailWithHash: vi.fn(),
    findUserById: vi.fn(),
    bumpTokenVersion: vi.fn(),
    createUser: vi.fn(),
  };
});

const app = createApp();
const password = 'correct-horse-battery';

// A tiny pretend user table, so "log out" really changes what the next request sees
type FakeUser = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  tokenVersion: number;
  role: 'user' | 'admin';
};
let users: FakeUser[] = [];

function addUser(id: string, role: 'user' | 'admin' = 'user'): FakeUser {
  const user = {
    id,
    name: `User ${id}`,
    email: `${id}@example.com`,
    passwordHash: bcrypt.hashSync(password, 4),
    tokenVersion: 0,
    role,
  };
  users.push(user);
  return user;
}

beforeEach(() => {
  vi.resetAllMocks();
  users = [];
  vi.mocked(userRepository.findUserById).mockImplementation(((id: string) =>
    Promise.resolve(users.find((user) => user.id === id) ?? null)) as never);
  vi.mocked(userRepository.findUserByEmailWithHash).mockImplementation(((email: string) =>
    Promise.resolve(users.find((user) => user.email === email) ?? null)) as never);
  vi.mocked(userRepository.bumpTokenVersion).mockImplementation((async (id: string) => {
    const user = users.find((candidate) => candidate.id === id);
    if (user) user.tokenVersion += 1;
  }) as never);
});

const PUBLIC_ROUTES = ['GET /api/health', 'POST /api/auth/register', 'POST /api/auth/login'];
const SAMPLE_ID = '507f1f77bcf86cd799439011';

describe('S1: every route except the three public ones needs a login', () => {
  const routes = listRoutes(app).map((route) => ({
    ...route,
    label: `${route.method} ${route.path}`,
    url: route.path.replace(':id', SAMPLE_ID),
  }));
  const protectedRoutes = routes.filter((route) => !PUBLIC_ROUTES.includes(route.label));

  it('finds the routes (guards against the discovery silently finding none)', () => {
    expect(routes.length).toBeGreaterThanOrEqual(16);
    expect(protectedRoutes.length).toBe(routes.length - PUBLIC_ROUTES.length);
  });

  it.each(protectedRoutes.map((route) => [route.label, route] as const))(
    '%s without a token is refused',
    async (_label, route) => {
      const method = route.method.toLowerCase() as 'get' | 'post' | 'put' | 'patch' | 'delete';
      const response = await request(app)[method](route.url).send({});
      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    },
  );

  it('refuses a header that is not a Bearer token', async () => {
    const response = await request(app).get('/api/tasks').set('Authorization', 'Basic YTpi');
    expect(response.status).toBe(401);
  });
});

describe('S2: forged, expired and out-of-date tokens are refused', () => {
  it.each(['wrong-secret', 'expired', 'other-algorithm'] as const)('a %s token', async (kind) => {
    addUser('u1');
    const token = await forgedToken(kind, 'u1', 0);
    const response = await request(app).get('/api/tasks').set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(401);
  });

  it('a token with no signature ("alg: none")', async () => {
    addUser('u1');
    const response = await request(app)
      .get('/api/tasks')
      .set('Authorization', `Bearer ${unsignedToken('u1', 0)}`);
    expect(response.status).toBe(401);
  });

  it('a correctly signed token for an account that no longer exists', async () => {
    const token = await signToken('deleted-user', 0);
    const response = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(401);
  });

  it('a correctly signed token carrying an old token version', async () => {
    const user = addUser('u1');
    user.tokenVersion = 3;
    const token = await signToken('u1', 2);
    const response = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(401);
  });

  it('S2b: logging out makes the old token useless', async () => {
    addUser('u1');
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'u1@example.com', password });
    const token = login.body.token as string;

    const before = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
    expect(before.status).toBe(200);
    await request(app).post('/api/auth/logout').set('Authorization', `Bearer ${token}`);
    const after = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
    expect(after.status).toBe(401);
  });
});

describe('S3: a role allows one action and denies it to others', () => {
  it('a normal user is refused the admin page (an admin being allowed is tested in routes/admin.test.ts)', async () => {
    addUser('u1');
    const userToken = await signToken('u1', 0);

    const refused = await request(app)
      .get('/api/admin/usage')
      .set('Authorization', `Bearer ${userToken}`);
    expect(refused.status).toBe(403);
    expect(refused.body.error.code).toBe('FORBIDDEN');
  });

  it('asking to be an admin when registering does nothing', async () => {
    vi.mocked(userRepository.createUser).mockResolvedValue({
      id: 'new',
      name: 'Eve',
      email: 'eve@example.com',
      createdAt: new Date(),
    } as never);
    await request(app)
      .post('/api/auth/register')
      .send({ name: 'Eve', email: 'eve@example.com', password, role: 'admin' });
    const saved = vi.mocked(userRepository.createUser).mock.calls[0]?.[0] as unknown as object;
    expect(saved).not.toHaveProperty('role');
  });
});

describe('S4: input that is not what we expect is refused', () => {
  it.each([
    [
      'operator objects instead of text (NoSQL injection)',
      { email: { $ne: null }, password: { $ne: null } },
    ],
    ['arrays instead of text', { email: ['a@example.com'], password: [password] }],
    ['numbers instead of text', { email: 1, password: 2 }],
  ])('login with %s', async (_name, body) => {
    const response = await request(app).post('/api/auth/login').send(body);
    expect(response.status).toBe(400);
    expect(userRepository.findUserByEmailWithHash).not.toHaveBeenCalled();
  });

  it('a body above 100 kB is refused', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'a@example.com', password: 'x'.repeat(200_000) });
    expect(response.status).toBe(413);
    expect(response.body.error.code).toBe('PAYLOAD_TOO_LARGE');
  });

  it('broken JSON gets a clean 400 without internals', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send('{"email": ');
    expect(response.status).toBe(400);
    expect(JSON.stringify(response.body)).not.toMatch(/node_modules|at \w+ \(/);
  });
});

describe('S5: no secrets in responses', () => {
  it('login and "who am I" never contain the password hash or token version', async () => {
    const user = addUser('u1');
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'u1@example.com', password });
    const me = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${login.body.token as string}`);

    for (const text of [JSON.stringify(login.body.user), JSON.stringify(me.body)]) {
      expect(text).not.toContain(user.passwordHash);
      expect(text).not.toMatch(/passwordHash|tokenVersion/);
    }
  });

  it('an unexpected server error hides its details', async () => {
    addUser('u1');
    vi.mocked(userRepository.findUserByEmailWithHash).mockRejectedValue(
      new Error('connect ECONNREFUSED mongodb://admin:hunter2@db.internal:27017'),
    );
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'u1@example.com', password });
    spy.mockRestore();

    expect(response.status).toBe(500);
    expect(JSON.stringify(response.body)).not.toMatch(/hunter2|mongodb:\/\//);
  });
});

describe('S6: security headers', () => {
  it('are set, and the server does not announce that it is Express', async () => {
    const response = await request(app).get('/api/health');
    expect(response.headers['x-powered-by']).toBeUndefined();
    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['x-frame-options']).toBeDefined();
    expect(response.headers['strict-transport-security']).toBeDefined();
  });
});

describe('S7: only the configured web address may call the API from a browser', () => {
  it('answers the allowed origin', async () => {
    const response = await request(app)
      .get('/api/health')
      .set('Origin', process.env.CORS_ORIGIN ?? 'http://localhost:5173');
    expect(response.headers['access-control-allow-origin']).toBe(
      process.env.CORS_ORIGIN ?? 'http://localhost:5173',
    );
  });

  // The server answers with the one allowed address. A browser compares it with the page's
  // own address and blocks the page when they differ, so another origin gets no permission.
  it('never names another origin as allowed, and never uses "*"', async () => {
    const response = await request(app).get('/api/health').set('Origin', 'https://evil.example');
    expect(response.headers['access-control-allow-origin']).not.toBe('https://evil.example');
    expect(response.headers['access-control-allow-origin']).not.toBe('*');
  });
});
