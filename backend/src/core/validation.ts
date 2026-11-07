import { PlanningInputError } from './errors.js';
import type { PlanTask } from './types.js';

export const MAX_TASK_HOURS = 1000;

export function isQuarterHours(value: number): boolean {
  return value % 0.25 === 0;
}

export function validateTask(task: PlanTask): void {
  if (Number.isNaN(task.deadline.getTime())) {
    throw new PlanningInputError('deadline', 'Deadline is required');
  }
  if (!Number.isFinite(task.estimatedHours) || task.estimatedHours <= 0) {
    throw new PlanningInputError('estimatedHours', 'Estimated hours must be greater than 0');
  }
  if (task.estimatedHours > MAX_TASK_HOURS || !isQuarterHours(task.estimatedHours)) {
    throw new PlanningInputError(
      'estimatedHours',
      `Estimated hours must be at most ${MAX_TASK_HOURS}, in steps of 0.25`,
    );
  }
}

export function validateAvailability(hoursByWeekday: number[]): void {
  if (hoursByWeekday.length !== 7) {
    throw new PlanningInputError('availability', 'Availability needs exactly 7 values');
  }
  for (const hours of hoursByWeekday) {
    if (!Number.isFinite(hours) || hours < 0 || hours > 24 || !isQuarterHours(hours)) {
      throw new PlanningInputError(
        'availability',
        'Each day needs 0 to 24 hours, in steps of 0.25',
      );
    }
  }
}
