import { describe, expect, it } from 'vitest';
import {
  DEFAULT_FILTERS,
  filtersFromParams,
  filtersToParams,
  hasActiveFilters,
  queryString,
  toApiQuery,
} from './taskFilters';

const NOW = new Date('2026-11-22T20:30:00Z'); // evening, so "today" must not shift

describe('filters in the address', () => {
  it('round-trips and keeps the address clean when nothing is set', () => {
    expect(filtersToParams(DEFAULT_FILTERS).toString()).toBe('');
    const filters = {
      ...DEFAULT_FILTERS,
      status: 'open' as const,
      q: 'lab',
      sort: 'title' as const,
    };
    expect(filtersFromParams(filtersToParams(filters))).toEqual(filters);
  });

  it('ignores values it does not know', () => {
    const params = new URLSearchParams('status=finished&category=party&due=soon&sort=random');
    expect(filtersFromParams(params)).toEqual(DEFAULT_FILTERS);
  });

  it('knows whether anything narrows the list (sorting does not)', () => {
    expect(hasActiveFilters(DEFAULT_FILTERS)).toBe(false);
    expect(hasActiveFilters({ ...DEFAULT_FILTERS, sort: 'title' })).toBe(false);
    expect(hasActiveFilters({ ...DEFAULT_FILTERS, q: ' x ' })).toBe(true);
    expect(hasActiveFilters({ ...DEFAULT_FILTERS, due: 'week' })).toBe(true);
  });
});

describe('toApiQuery', () => {
  it('sends nothing for the default view (the page sorts by priority itself)', () => {
    expect(toApiQuery(DEFAULT_FILTERS, NOW)).toEqual({});
  });

  it('trims the search text and maps sorts to the server names', () => {
    expect(toApiQuery({ ...DEFAULT_FILTERS, q: '  exam ', sort: 'hours' }, NOW)).toEqual({
      q: 'exam',
      sort: '-hours',
    });
  });

  it('counts "next 7 days" from the start of today in UTC, inclusive of day 7', () => {
    const query = toApiQuery({ ...DEFAULT_FILTERS, due: 'week' }, NOW);
    expect(query.dueAfter).toBe('2026-11-22T00:00:00.000Z');
    expect(query.dueBefore).toBe('2026-11-30T00:00:00.000Z'); // a task on 29 Nov (day 7) is in
  });

  it('treats overdue as unfinished tasks before today', () => {
    const query = toApiQuery({ ...DEFAULT_FILTERS, due: 'overdue' }, NOW);
    expect(query).toEqual({ dueBefore: '2026-11-22T00:00:00.000Z', status: 'open' });
  });

  it('keeps an explicit status together with overdue', () => {
    const query = toApiQuery({ ...DEFAULT_FILTERS, due: 'overdue', status: 'in_progress' }, NOW);
    expect(query.status).toBe('in_progress');
  });
});

describe('queryString', () => {
  it('encodes values and is empty for an empty query', () => {
    expect(queryString({})).toBe('');
    expect(queryString({ status: 'open', q: 'a&b' })).toBe('?status=open&q=a%26b');
  });
});
