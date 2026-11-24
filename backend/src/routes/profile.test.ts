import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../app.js';
import * as taskRepository from '../repositories/task.repository.js';
import * as userRepository from '../repositories/user.repository.js';
import { signToken } from '../utils/token.js';

vi.mock('../repositories/user.repository.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../repositories/user.repository.js')>();
  return {
    ...actual,
    findUserById: vi.fn(),
    findUserWithAvatar: vi.fn(),
    updateProfileFields: vi.fn(),
    setAvatar: vi.fn(),
    clearAvatar: vi.fn(),
  };
});
vi.mock('../repositories/task.repository.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../repositories/task.repository.js')>();
  return { ...actual, countOpenTasksForUser: vi.fn(), countDoneTasksForUser: vi.fn() };
});

const app = createApp();

// Small but real file starts: the server looks at these bytes, not at the header
const JPEG = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(200, 1)]);
const PNG = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  Buffer.alloc(100, 2),
]);
const WEBP = Buffer.concat([
  Buffer.from('RIFF'),
  Buffer.from([0x10, 0, 0, 0]),
  Buffer.from('WEBP'),
  Buffer.alloc(50, 3),
]);

let stored: { name: string; username?: string; avatar?: { data: Buffer; contentType: string } };
let token: string;

function account() {
  return {
    id: 'u1',
    name: stored.name,
    username: stored.username,
    email: 'ada@example.com',
    role: 'user',
    tokenVersion: 0,
    createdAt: new Date('2026-10-01T00:00:00Z'),
    avatar: stored.avatar,
  };
}

beforeEach(async () => {
  vi.resetAllMocks();
  stored = { name: 'Ada' };
  token = await signToken('u1', 0);
  vi.mocked(userRepository.findUserById).mockImplementation((async () => account()) as never);
  vi.mocked(userRepository.findUserWithAvatar).mockImplementation((async () => account()) as never);
  vi.mocked(taskRepository.countOpenTasksForUser).mockResolvedValue(3);
  vi.mocked(taskRepository.countDoneTasksForUser).mockResolvedValue(5);
  vi.mocked(userRepository.updateProfileFields).mockImplementation((async (
    _id: string,
    fields: { name?: string; username?: string | null },
  ) => {
    if (fields.name !== undefined) stored.name = fields.name;
    if (typeof fields.username === 'string') stored.username = fields.username;
    if (fields.username === null) delete stored.username;
  }) as never);
  vi.mocked(userRepository.setAvatar).mockImplementation((async (
    _id: string,
    data: Buffer,
    contentType: string,
  ) => {
    stored.avatar = { data, contentType };
  }) as never);
  vi.mocked(userRepository.clearAvatar).mockImplementation((async () => {
    delete stored.avatar;
  }) as never);
});

const auth = () => ({ Authorization: `Bearer ${token}` });

describe('the profile', () => {
  it('needs a login', async () => {
    expect((await request(app).get('/api/profile')).status).toBe(401);
    expect((await request(app).patch('/api/profile').send({ name: 'X' })).status).toBe(401);
    expect((await request(app).put('/api/profile/avatar')).status).toBe(401);
    expect((await request(app).delete('/api/profile/avatar')).status).toBe(401);
  });

  it('shows the profile with task counts and no picture yet', async () => {
    const response = await request(app).get('/api/profile').set(auth());
    expect(response.status).toBe(200);
    expect(response.body.profile).toMatchObject({
      id: 'u1',
      name: 'Ada',
      username: null,
      email: 'ada@example.com',
      role: 'user',
      avatar: null,
      stats: { openTasks: 3, doneTasks: 5 },
    });
    expect(JSON.stringify(response.body)).not.toMatch(/passwordHash|tokenVersion/);
  });

  it('changes the name and sets a username in lower case', async () => {
    const response = await request(app)
      .patch('/api/profile')
      .set(auth())
      .send({ name: '  Ada Lovelace ', username: 'Ada_L' });
    expect(response.status).toBe(200);
    expect(userRepository.updateProfileFields).toHaveBeenCalledWith('u1', {
      name: 'Ada Lovelace',
      username: 'ada_l',
    });
    expect(response.body.profile).toMatchObject({ name: 'Ada Lovelace', username: 'ada_l' });
  });

  it('removes the username when null is sent', async () => {
    stored.username = 'ada_l';
    const response = await request(app).patch('/api/profile').set(auth()).send({ username: null });
    expect(response.status).toBe(200);
    expect(response.body.profile.username).toBeNull();
  });

  it.each([
    ['too short', 'ab'],
    ['too long', 'a'.repeat(21)],
    ['starts with a digit', '1ada'],
    ['has a space', 'ada l'],
    ['has a dash', 'ada-l'],
    ['has an @', '@ada'],
    ['has a dot', 'ada.l'],
    ['is reserved', 'admin'],
    ['is reserved in capitals', 'ADMIN'],
    ['is not text', 42],
  ])('refuses a username that %s', async (_why, username) => {
    const response = await request(app).patch('/api/profile').set(auth()).send({ username });
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(userRepository.updateProfileFields).not.toHaveBeenCalled();
  });

  it('refuses an empty name and an empty request', async () => {
    expect((await request(app).patch('/api/profile').set(auth()).send({ name: ' ' })).status).toBe(
      400,
    );
    expect((await request(app).patch('/api/profile').set(auth()).send({})).status).toBe(400);
  });

  it('answers 409 when the username is taken', async () => {
    vi.mocked(userRepository.updateProfileFields).mockRejectedValue(
      new userRepository.DuplicateUsernameError('taken'),
    );
    const response = await request(app).patch('/api/profile').set(auth()).send({ username: 'ben' });
    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('USERNAME_TAKEN');
    expect(response.body.error.details[0].field).toBe('username');
  });

  it('ignores fields that are not meant to be edited here (email, role, id)', async () => {
    await request(app)
      .patch('/api/profile')
      .set(auth())
      .send({ name: 'Ada', email: 'evil@example.com', role: 'admin', id: 'someone-else' });
    expect(userRepository.updateProfileFields).toHaveBeenCalledWith('u1', { name: 'Ada' });
  });
});

describe('the profile picture', () => {
  const upload = (bytes: Buffer | string, type: string) =>
    request(app).put('/api/profile/avatar').set(auth()).set('Content-Type', type).send(bytes);

  it.each([
    ['JPEG', JPEG, 'image/jpeg'],
    ['PNG', PNG, 'image/png'],
    ['WebP', WEBP, 'image/webp'],
  ])('stores a %s and returns it as a data URL', async (_name, bytes, type) => {
    const response = await upload(bytes, type);
    expect(response.status).toBe(200);
    expect(response.body.profile.avatar).toBe(`data:${type};base64,${bytes.toString('base64')}`);
    expect(userRepository.setAvatar).toHaveBeenCalledWith('u1', bytes, type);
  });

  it('decides the type from the bytes, not from the header', async () => {
    const response = await upload(PNG, 'image/jpeg');
    expect(response.status).toBe(200);
    expect(userRepository.setAvatar).toHaveBeenCalledWith('u1', PNG, 'image/png');
  });

  it('refuses a file that only claims to be an image', async () => {
    const response = await upload('<script>alert(1)</script>', 'image/png');
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('INVALID_IMAGE');
    expect(userRepository.setAvatar).not.toHaveBeenCalled();
  });

  it('refuses SVG, which can carry scripts', async () => {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>';
    const response = await upload(svg, 'image/svg+xml');
    expect(response.status).toBe(400);
    expect(userRepository.setAvatar).not.toHaveBeenCalled();
  });

  it('refuses a picture above 100 kB', async () => {
    const big = Buffer.concat([JPEG, Buffer.alloc(101 * 1024)]);
    const response = await upload(big, 'image/jpeg');
    expect(response.status).toBe(413);
    expect(userRepository.setAvatar).not.toHaveBeenCalled();
  });

  it('refuses JSON in place of a picture and an empty upload', async () => {
    const json = await request(app).put('/api/profile/avatar').set(auth()).send({ avatar: 'x' });
    expect(json.status).toBe(400);
    const empty = await request(app).put('/api/profile/avatar').set(auth());
    expect(empty.status).toBe(400);
  });

  it('removes the picture', async () => {
    stored.avatar = { data: JPEG, contentType: 'image/jpeg' };
    const response = await request(app).delete('/api/profile/avatar').set(auth());
    expect(response.status).toBe(200);
    expect(response.body.profile.avatar).toBeNull();
  });

  it('shows the picture to the signed-in person in "who am I"', async () => {
    stored.avatar = { data: JPEG, contentType: 'image/jpeg' };
    const response = await request(app).get('/api/auth/me').set(auth());
    expect(response.body.user.avatar).toBe(`data:image/jpeg;base64,${JPEG.toString('base64')}`);
  });
});

describe('only your own profile can be touched', () => {
  it('always uses the account in the token, never an id from the request', async () => {
    await request(app)
      .patch('/api/profile?id=u2&userId=u2')
      .set(auth())
      .send({ name: 'Ada', userId: 'u2' });
    expect(userRepository.updateProfileFields).toHaveBeenCalledWith('u1', { name: 'Ada' });
  });
});
