import { describe, expect, it } from 'vitest';
import {
  DEFAULT_PREFERENCES,
  normalizePreferences,
  pathForDefaultPage,
  resolveTheme,
  weekdayOrder,
} from './preferences';

describe('normalizePreferences', () => {
  it('fills in everything that is missing', () => {
    expect(normalizePreferences(undefined)).toEqual(DEFAULT_PREFERENCES);
    expect(normalizePreferences({ theme: 'dark' })).toEqual({
      ...DEFAULT_PREFERENCES,
      theme: 'dark',
    });
  });
  it('drops values it does not know', () => {
    const result = normalizePreferences({ theme: 'neon', defaultPage: '/admin', compact: 'yes' });
    expect(result).toEqual(DEFAULT_PREFERENCES);
  });
});

describe('resolveTheme', () => {
  it('follows the device only for "system"', () => {
    expect(resolveTheme('system', true)).toBe('dark');
    expect(resolveTheme('system', false)).toBe('light');
    expect(resolveTheme('light', true)).toBe('light');
    expect(resolveTheme('dark', false)).toBe('dark');
  });
});

describe('weekdayOrder', () => {
  it('starts on the chosen day and shows all seven', () => {
    expect(weekdayOrder('monday')).toEqual([1, 2, 3, 4, 5, 6, 0]);
    expect(weekdayOrder('sunday')).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });
});

describe('pathForDefaultPage', () => {
  it('maps a page name to its address', () => {
    expect(pathForDefaultPage('tasks')).toBe('/tasks');
  });
});
