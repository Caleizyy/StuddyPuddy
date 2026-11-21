import { PlanningInputError } from './errors.js';
import type { PlanSettings } from './types.js';
import { isQuarterHours } from './validation.js';

export const MIN_DAILY_LIMIT = 0.25;
export const MAX_DAILY_LIMIT = 24;

// Checks the client's settings. No limit (null or missing) is always fine.
export function validateSettings(settings: PlanSettings): void {
  const limit = settings.maxHoursPerDay;
  if (limit === undefined || limit === null) return;

  if (
    !Number.isFinite(limit) ||
    limit < MIN_DAILY_LIMIT ||
    limit > MAX_DAILY_LIMIT ||
    !isQuarterHours(limit)
  ) {
    throw new PlanningInputError(
      'maxHoursPerDay',
      `The daily limit must be ${MIN_DAILY_LIMIT} to ${MAX_DAILY_LIMIT} hours, in steps of 0.25`,
    );
  }
}

// The hours the user can study on each weekday after the personal daily limit.
// A day never gets more than the limit, and a day with fewer hours keeps them.
export function applyDailyLimit(hoursByWeekday: number[], settings: PlanSettings): number[] {
  const limit = settings.maxHoursPerDay;
  if (limit === undefined || limit === null) return hoursByWeekday;
  return hoursByWeekday.map((hours) => Math.min(hours, limit));
}
