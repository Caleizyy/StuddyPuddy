import { describe, expect, it } from 'vitest';
import { buildTaskFilter } from './task.repository.js';

describe('buildTaskFilter', () => {
  it('always starts with the owner, whatever else is asked for', () => {
    const filters = [
      {},
      { status: 'open' as const },
      { q: 'anything' },
      { dueAfter: '2026-01-01T00:00:00.000Z', dueBefore: '2027-01-01T00:00:00.000Z' },
      { category: 'exam' as const, status: 'done' as const, q: 'x' },
    ];
    for (const query of filters) {
      expect(buildTaskFilter('user-1', query).userId).toBe('user-1');
    }
  });

  it('turns "open" into "not done" and a real status into itself', () => {
    expect(buildTaskFilter('u', { status: 'open' }).status).toEqual({ $ne: 'done' });
    expect(buildTaskFilter('u', { status: 'in_progress' }).status).toBe('in_progress');
  });

  it('searches the title as plain text, never as a pattern', () => {
    const filter = buildTaskFilter('u', { q: 'a.b*(c)' });
    expect(filter.title).toEqual({ $regex: 'a\\.b\\*\\(c\\)', $options: 'i' });
  });

  it('builds a deadline window with an inclusive start and an exclusive end', () => {
    const filter = buildTaskFilter('u', {
      dueAfter: '2026-12-01T00:00:00.000Z',
      dueBefore: '2026-12-08T00:00:00.000Z',
    });
    expect(filter.deadline).toEqual({
      $gte: new Date('2026-12-01T00:00:00.000Z'),
      $lt: new Date('2026-12-08T00:00:00.000Z'),
    });
  });

  it('leaves out filters that were not given', () => {
    expect(buildTaskFilter('u', {})).toEqual({ userId: 'u' });
  });
});
