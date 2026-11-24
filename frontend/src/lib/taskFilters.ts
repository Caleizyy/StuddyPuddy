import type { TaskCategory, TaskStatus } from './taskOptions';
import { TASK_CATEGORIES, TASK_STATUSES } from './taskOptions';

// What the filter bar on the Tasks page holds. It lives in the address (?status=open&q=lab),
// so a filtered list can be bookmarked and the back button works.

export const DUE_OPTIONS = ['any', 'overdue', 'week', 'month'] as const;
export const SORT_OPTIONS = ['priority', 'deadline', 'hours', 'title', 'newest'] as const;
export const STATUS_FILTERS = ['any', 'open', ...TASK_STATUSES] as const;

export type DueFilter = (typeof DUE_OPTIONS)[number];
export type SortOption = (typeof SORT_OPTIONS)[number];
export type StatusFilter = (typeof STATUS_FILTERS)[number];

export type TaskFilters = {
  q: string;
  status: StatusFilter;
  category: TaskCategory | 'any';
  due: DueFilter;
  sort: SortOption;
};

export const DEFAULT_FILTERS: TaskFilters = {
  q: '',
  status: 'any',
  category: 'any',
  due: 'any',
  sort: 'priority',
};

function pick<T extends string>(value: string | null, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

// Reads the filters from the address. Anything unknown falls back to "no filter".
export function filtersFromParams(params: URLSearchParams): TaskFilters {
  return {
    q: (params.get('q') ?? '').slice(0, 80),
    status: pick(params.get('status'), STATUS_FILTERS, 'any'),
    category: pick(params.get('category'), ['any', ...TASK_CATEGORIES] as const, 'any'),
    due: pick(params.get('due'), DUE_OPTIONS, 'any'),
    sort: pick(params.get('sort'), SORT_OPTIONS, 'priority'),
  };
}

// Writes only what differs from the default, so an unfiltered page has a clean address
export function filtersToParams(filters: TaskFilters): URLSearchParams {
  const params = new URLSearchParams();
  for (const key of Object.keys(DEFAULT_FILTERS) as (keyof TaskFilters)[]) {
    if (filters[key] !== DEFAULT_FILTERS[key]) params.set(key, filters[key]);
  }
  return params;
}

export function hasActiveFilters(filters: TaskFilters): boolean {
  return (
    filters.q.trim() !== '' ||
    filters.status !== 'any' ||
    filters.category !== 'any' ||
    filters.due !== 'any'
  );
}

const DAY = 24 * 60 * 60 * 1000;
const startOfUtcDay = (now: Date) =>
  Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());

export type TaskApiQuery = {
  status?: StatusFilter;
  category?: TaskCategory;
  q?: string;
  dueAfter?: string;
  dueBefore?: string;
  sort?: string;
};

const SERVER_SORT: Partial<Record<SortOption, string>> = {
  deadline: 'deadline',
  hours: '-hours',
  title: 'title',
  newest: 'newest',
};

// The query the server understands. Deadlines are whole UTC days (noon UTC), the same way the
// planner counts, so "this week" is today and the next 7 days.
export function toApiQuery(filters: TaskFilters, now: Date = new Date()): TaskApiQuery {
  const today = startOfUtcDay(now);
  const query: TaskApiQuery = {};

  if (filters.status !== 'any') query.status = filters.status;
  if (filters.category !== 'any') query.category = filters.category;
  if (filters.q.trim()) query.q = filters.q.trim();

  if (filters.due === 'overdue') {
    query.dueBefore = new Date(today).toISOString();
    // A finished task is never "overdue"
    if (!query.status) query.status = 'open';
  } else if (filters.due === 'week') {
    query.dueAfter = new Date(today).toISOString();
    query.dueBefore = new Date(today + 8 * DAY).toISOString();
  } else if (filters.due === 'month') {
    query.dueAfter = new Date(today).toISOString();
    query.dueBefore = new Date(today + 31 * DAY).toISOString();
  }

  const sort = SERVER_SORT[filters.sort];
  if (sort) query.sort = sort;
  return query;
}

export function queryString(query: TaskApiQuery): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) if (value) params.set(key, value);
  const text = params.toString();
  return text ? `?${text}` : '';
}

export const STATUS_FILTER_LABELS: Record<StatusFilter, string> = {
  any: 'All statuses',
  open: 'Not finished',
  todo: 'Not completed',
  in_progress: 'In progress',
  done: 'Completed',
} satisfies Record<StatusFilter | TaskStatus, string>;

export const DUE_LABELS: Record<DueFilter, string> = {
  any: 'Any deadline',
  overdue: 'Overdue',
  week: 'Next 7 days',
  month: 'Next 30 days',
};

export const SORT_LABELS: Record<SortOption, string> = {
  priority: 'Most urgent first',
  deadline: 'Earliest deadline',
  hours: 'Most work first',
  title: 'Title A to Z',
  newest: 'Newest first',
};
