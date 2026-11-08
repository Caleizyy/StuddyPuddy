import { afterEach, describe, expect, it, vi } from 'vitest';

describe('login limit settings', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it.each(['', '0', '-3', 'abc', '2.5'])('rejects LOGIN_LIMIT_PER_IP=%j', async (value) => {
    vi.stubEnv('LOGIN_LIMIT_PER_IP', value);
    await expect(import('./index.js')).rejects.toThrow('LOGIN_LIMIT_PER_IP');
  });

  it('accepts a positive whole number', async () => {
    vi.stubEnv('LOGIN_LIMIT_PER_IP', '7');
    const { config } = await import('./index.js');
    expect(config.loginRateLimit.perIp).toBe(7);
  });

  it.each(['', '0', '-3', 'abc', '2.5'])('rejects PORT=%j', async (value) => {
    vi.stubEnv('PORT', value);
    await expect(import('./index.js')).rejects.toThrow('PORT');
  });
});
