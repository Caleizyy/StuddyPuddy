import { addDays, daysBetween } from './dates.js';
import { remainingHours } from './validation.js';
import type { PlanTask, PriorityBand, Ranked, TaskAssessment } from './types.js';

export const MAX_SCORE = 1_000_000;
export const HIGH_THRESHOLD = 0.1;
export const MEDIUM_THRESHOLD = 0.04;

export function bandFor(score: number): PriorityBand {
  if (score >= HIGH_THRESHOLD) return 'high';
  if (score >= MEDIUM_THRESHOLD) return 'medium';
  return 'low';
}

export function availableHoursUntil(days: number, hoursByWeekday: number[], now: Date): number {
  const fullWeeks = Math.floor(days / 7);
  const leftoverDays = days % 7;

  let hoursPerWeek = 0;
  for (const hours of hoursByWeekday) {
    hoursPerWeek += hours;
  }

  let total = fullWeeks * hoursPerWeek;
  for (let i = 0; i < leftoverDays; i++) {
    const weekday = addDays(now, fullWeeks * 7 + i).getUTCDay();
    total += hoursByWeekday[weekday];
  }
  return total;
}

export function assessTask(task: PlanTask, hoursByWeekday: number[], now: Date): TaskAssessment {
  const daysLeft = daysBetween(now, task.deadline);
  const hoursNeeded = remainingHours(task);

  // Everything is already studied: there is nothing left to be late with, so it is not urgent
  if (hoursNeeded === 0) {
    const remainingDays = Math.max(1, daysLeft);
    return {
      remainingDays: daysLeft < 0 ? 0 : remainingDays,
      availableHours: daysLeft < 0 ? 0 : availableHoursUntil(remainingDays, hoursByWeekday, now),
      score: 0,
      band: 'low',
      atRisk: false,
      overdue: false,
    };
  }

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

  const remainingDays = Math.max(1, daysLeft);
  const availableHours = availableHoursUntil(remainingDays, hoursByWeekday, now);

  let score = MAX_SCORE; // no study time at all means maximum priority
  if (availableHours > 0) {
    score = (hoursNeeded / availableHours) * (1 / remainingDays);
  }

  return {
    remainingDays,
    availableHours,
    score,
    band: bandFor(score),
    atRisk: availableHours < hoursNeeded,
    overdue: false,
  };
}

export function compareRanked(a: Ranked, b: Ranked): number {
  if (a.assessment.score !== b.assessment.score) {
    return b.assessment.score - a.assessment.score;
  }
  if (a.task.deadline.getTime() !== b.task.deadline.getTime()) {
    return a.task.deadline.getTime() - b.task.deadline.getTime();
  }
  const aLeft = remainingHours(a.task);
  const bLeft = remainingHours(b.task);
  if (aLeft !== bLeft) return bLeft - aLeft;
  if (a.task.createdAt.getTime() !== b.task.createdAt.getTime()) {
    return a.task.createdAt.getTime() - b.task.createdAt.getTime();
  }
  return a.task.id.localeCompare(b.task.id); // last resort, so the order is always the same
}
