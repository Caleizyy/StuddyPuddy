import { describe, expect, it } from 'vitest';
import { assertSeedAllowed } from './guard.js';

describe('seed guard', () => {
  it('refuses to run in production, even with the opt-in set', () => {
    expect(() => assertSeedAllowed({ env: 'production', allowSeedWipe: true })).toThrow();
  });

  it('refuses to run without the explicit opt-in', () => {
    expect(() => assertSeedAllowed({ env: 'development', allowSeedWipe: false })).toThrow(
      /ALLOW_SEED_WIPE/,
    );
  });

  it('allows seeding outside production with the opt-in', () => {
    expect(() => assertSeedAllowed({ env: 'development', allowSeedWipe: true })).not.toThrow();
  });
});
