import { addDays, daysBetween } from './dates.js';
import type { PlanTask, PriorityBand, Ranked, TaskAssessment } from './types.js';

export const MAX_SCORE = 1_000_000;
export const HIGH_THRESHOLD = 0.1;
export const MEDIUM_THRESHOLD = 0.04;

export function bandFor(score: number): PriorityBand {
  if (score >= HIGH_THRESHOLD) return 'high';
  if (score >= MEDIUM_THRESHOLD) return 'medium';
  return 'low';
}

// Adds up the study hours of each day from today until the deadline
export function availableHoursUntil(days: number, hoursByWeekday: number[], now: Date): number {
  let total = 0;
  for (let day = 0; day < days; day++) {
    const weekday = addDays(now, day).getUTCDay();
    total += hoursByWeekday[weekday];
  }
  return total;
}

export function assessTask(task: PlanTask, hoursByWeekday: number[], now: Date): TaskAssessment {
  const daysLeft = daysBetween(now, task.deadline);

  if (daysLeft < 0) {
    return {
      remainingDays: 0,
      availableHours: 0,
      score: MAX_SCORE,
      band: 'high',
      atRisk: true,
      overdue: true,
    };
  }

  // A task due today still counts as one day, so we never divide by zero
  const remainingDays = Math.max(1, daysLeft);
  const availableHours = availableHoursUntil(remainingDays, hoursByWeekday, now);

  let score = MAX_SCORE; // no study time at all means maximum priority
  if (availableHours > 0) {
    score = (task.estimatedHours / availableHours) * (1 / remainingDays);
  }

  return {
    remainingDays,
    availableHours,
    score,
    band: bandFor(score),
    atRisk: availableHours < task.estimatedHours,
    overdue: false,
  };
}

// Used by sort(): a negative number means `a` goes first.
// Order: higher score, then earlier deadline, then longer task, then created earlier.
export function compareRanked(a: Ranked, b: Ranked): number {
  if (a.assessment.score !== b.assessment.score) {
    return b.assessment.score - a.assessment.score;
  }
  if (a.task.deadline.getTime() !== b.task.deadline.getTime()) {
    return a.task.deadline.getTime() - b.task.deadline.getTime();
  }
  if (a.task.estimatedHours !== b.task.estimatedHours) {
    return b.task.estimatedHours - a.task.estimatedHours;
  }
  if (a.task.createdAt.getTime() !== b.task.createdAt.getTime()) {
    return a.task.createdAt.getTime() - b.task.createdAt.getTime();
  }
  return a.task.id.localeCompare(b.task.id); // last resort, so the order is always the same
}
