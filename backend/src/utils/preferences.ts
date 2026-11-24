import type { DEFAULT_PAGES, THEMES, WEEK_STARTS } from '../models/user.js';

export type Preferences = {
  theme: (typeof THEMES)[number];
  weekStart: (typeof WEEK_STARTS)[number];
  defaultPage: (typeof DEFAULT_PAGES)[number];
  compact: boolean;
};

export const DEFAULT_PREFERENCES: Preferences = {
  theme: 'system',
  weekStart: 'monday',
  defaultPage: 'dashboard',
  compact: false,
};

// Always a complete set: accounts made before preferences existed get the defaults
export function toPreferences(stored: Partial<Preferences> | null | undefined): Preferences {
  return {
    theme: stored?.theme ?? DEFAULT_PREFERENCES.theme,
    weekStart: stored?.weekStart ?? DEFAULT_PREFERENCES.weekStart,
    defaultPage: stored?.defaultPage ?? DEFAULT_PREFERENCES.defaultPage,
    compact: stored?.compact ?? DEFAULT_PREFERENCES.compact,
  };
}
