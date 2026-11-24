import { describe, expect, it } from 'vitest';
import { parseAdminInput } from './adminInput.js';

describe('parseAdminInput', () => {
  it('accepts a valid email and a long password, and tidies the email', () => {
    expect(
      parseAdminInput({ ADMIN_EMAIL: ' Boss@Example.com ', ADMIN_PASSWORD: 'a-long-password-1' }),
    ).toEqual({ email: 'boss@example.com', password: 'a-long-password-1' });
  });

  it.each([
    [{}, 'ADMIN_EMAIL'],
    [{ ADMIN_EMAIL: 'boss@example.com' }, 'ADMIN_PASSWORD'],
    [{ ADMIN_EMAIL: 'not-an-email', ADMIN_PASSWORD: 'a-long-password-1' }, 'valid email'],
    [{ ADMIN_EMAIL: 'boss@example.com', ADMIN_PASSWORD: 'short' }, 'at least 12'],
    [{ ADMIN_EMAIL: 'boss@example.com', ADMIN_PASSWORD: 'x'.repeat(73) }, 'too long'],
  ])('rejects %j', (env, message) => {
    expect(() => parseAdminInput(env)).toThrow(message);
  });
});
