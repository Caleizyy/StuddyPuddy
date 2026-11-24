import { describe, expect, it } from 'vitest';
import { hoursPerDay, loggedPercent, localDateKey, remainingOf, validateLog } from './timeLog';

describe('localDateKey', () => {
  it('uses the local calendar day with two-digit month and day', () => {
    expect(localDateKey(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
  });
});

describe('remaining and percent', () => {
  it('never goes below zero or above 100', () => {
    expect(remainingOf({ estimatedHours: 6, loggedHours: 2.5 })).toBe(3.5);
    expect(remainingOf({ estimatedHours: 2, loggedHours: 3 })).toBe(0);
    expect(loggedPercent({ estimatedHours: 4, loggedHours: 1 })).toBe(25);
    expect(loggedPercent({ estimatedHours: 2, loggedHours: 3 })).toBe(100);
  });
});

describe('validateLog', () => {
  const today = '2026-11-22';
  it('accepts a normal entry', () => {
    expect(validateLog('1.5', '2026-11-20', today)).toBeNull();
    expect(validateLog('0.25', today, today)).toBeNull();
  });
  it('explains each problem', () => {
    expect(validateLog('', today, today)).toMatch(/Enter/);
    expect(validateLog('abc', today, today)).toMatch(/Enter/);
    expect(validateLog('0', today, today)).toMatch(/0.25/);
    expect(validateLog('25', today, today)).toMatch(/24/);
    expect(validateLog('1.1', today, today)).toMatch(/0.25 hours/);
    expect(validateLog('1', '', today)).toMatch(/day/);
    expect(validateLog('1', '2026-11-23', today)).toMatch(/not happened/);
  });
});

describe('hoursPerDay', () => {
  it('adds the entries of all tasks per day, with zeros for quiet days', () => {
    const tasks = [
      { timeEntries: [{ id: '1', date: '2026-11-22', hours: 1.5, note: null }] },
      {
        timeEntries: [
          { id: '2', date: '2026-11-22', hours: 0.5, note: null },
          { id: '3', date: '2026-11-20', hours: 2, note: null },
          { id: '4', date: '2026-10-01', hours: 9, note: null }, // outside the window
        ],
      },
    ];
    expect(hoursPerDay(tasks, 3, '2026-11-22')).toEqual([
      { date: '2026-11-20', hours: 2 },
      { date: '2026-11-21', hours: 0 },
      { date: '2026-11-22', hours: 2 },
    ]);
  });
});
