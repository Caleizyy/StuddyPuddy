import { PlanningInputError } from './errors.js';
import type { PlanTask } from './types.js';

export function validateTask(task: PlanTask): void {
  if (Number.isNaN(task.deadline.getTime())) {
    throw new PlanningInputError('deadline', 'Deadline is required');
  }
  if (Number.isNaN(task.estimatedHours) || task.estimatedHours <= 0) {
    throw new PlanningInputError('estimatedHours', 'Estimated hours must be greater than 0');
  }
}

export function validateAvailability(hoursByWeekday: number[]): void {
  if (hoursByWeekday.length !== 7) {
    throw new PlanningInputError('availability', 'Availability needs exactly 7 values');
  }
  for (const hours of hoursByWeekday) {
    if (Number.isNaN(hours) || hours < 0 || hours > 24) {
      throw new PlanningInputError('availability', 'Each day needs between 0 and 24 hours');
    }
  }
}
