import { describe, expect, it } from 'vitest';
import { getStatus } from './health.service.js';

describe('getStatus', () => {
  it('reports ok and a non-negative uptime', () => {
    const result = getStatus();
    expect(result.status).toBe('ok');
    expect(result.uptime).toBeGreaterThanOrEqual(0);
  });
});
