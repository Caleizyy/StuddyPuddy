// How the app looks and where it opens. The server keeps the saved copy; this file applies it
// to the page, and remembers the last copy on this device so the first screen already looks right.

export type Theme = 'system' | 'light' | 'dark';
export type WeekStart = 'monday' | 'sunday';
export type DefaultPage = 'dashboard' | 'tasks' | 'plan';

export type Preferences = {
  theme: Theme;
  weekStart: WeekStart;
  defaultPage: DefaultPage;
  compact: boolean;
};

export const DEFAULT_PREFERENCES: Preferences = {
  theme: 'system',
  weekStart: 'monday',
  defaultPage: 'dashboard',
  compact: false,
};

const STORAGE_KEY = 'studdypuddy.preferences';
const THEMES: Theme[] = ['system', 'light', 'dark'];
const WEEK_STARTS: WeekStart[] = ['monday', 'sunday'];
const PAGES: DefaultPage[] = ['dashboard', 'tasks', 'plan'];

function pick<T extends string>(value: unknown, allowed: T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

// Whatever came from storage or the server, turned into a complete and valid set
export function normalizePreferences(raw: unknown): Preferences {
  const source = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>;
  return {
    theme: pick(source.theme, THEMES, DEFAULT_PREFERENCES.theme),
    weekStart: pick(source.weekStart, WEEK_STARTS, DEFAULT_PREFERENCES.weekStart),
    defaultPage: pick(source.defaultPage, PAGES, DEFAULT_PREFERENCES.defaultPage),
    compact: source.compact === true,
  };
}

export function readStoredPreferences(): Preferences {
  try {
    return normalizePreferences(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null'));
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

function storePreferences(preferences: Preferences) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  } catch {
    /* storage unavailable: the choice still applies, it just is not remembered offline */
  }
}

// The theme that is actually shown: "system" follows the device
export function resolveTheme(theme: Theme, prefersDark: boolean): 'light' | 'dark' {
  if (theme === 'system') return prefersDark ? 'dark' : 'light';
  return theme;
}

const darkQuery = () => window.matchMedia('(prefers-color-scheme: dark)');

export function applyPreferences(preferences: Preferences) {
  const root = document.documentElement;
  root.dataset.theme = resolveTheme(preferences.theme, darkQuery().matches);
  root.dataset.density = preferences.compact ? 'compact' : 'comfortable';
  storePreferences(preferences);
}

// Keeps "system" in step when the device switches between light and dark. Returns a cleanup.
export function watchSystemTheme(getCurrent: () => Preferences): () => void {
  const query = darkQuery();
  const onChange = () => {
    const current = getCurrent();
    if (current.theme === 'system') applyPreferences(current);
  };
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}

export function pathForDefaultPage(page: DefaultPage): string {
  return `/${page}`;
}

// Day numbers as the planner counts them (0 is Sunday), in the order the user wants to see them
export function weekdayOrder(weekStart: WeekStart): number[] {
  return weekStart === 'sunday' ? [0, 1, 2, 3, 4, 5, 6] : [1, 2, 3, 4, 5, 6, 0];
}
