import { describe, expect, it } from 'vitest';
import { addDays } from './dates.js';
import { assessTask, compareRanked, MAX_SCORE } from './priority.js';
import type { PlanTask, Ranked } from './types.js';

const now = new Date('2026-11-09T10:00:00Z'); // a Monday
const everyDay = (hours: number) => Array<number>(7).fill(hours);

let counter = 0;
function task(title: string, daysLeft: number, estimatedHours: number): PlanTask {
  counter += 1;
  return {
    id: `t${counter}`,
    title,
    deadline: addDays(now, daysLeft),
    estimatedHours,
    createdAt: new Date(Date.UTC(2026, 10, 1, 0, counter)),
    status: 'todo',
  };
}

describe('assessTask', () => {
  it('applies the formula from the design document', () => {
    const result = assessTask(task('Lab', 2, 3), everyDay(2), now);
    expect(result.remainingDays).toBe(2);
    expect(result.availableHours).toBe(4);
    expect(result.score).toBeCloseTo(0.375);
    expect(result.band).toBe('high');
    expect(result.atRisk).toBe(false);
  });

  it('gives maximum priority and a risk flag when there is no study time', () => {
    const result = assessTask(task('Exam', 3, 2), everyDay(0), now);
    expect(result.score).toBe(MAX_SCORE);
    expect(result.band).toBe('high');
    expect(result.atRisk).toBe(true);
  });

  it('counts a deadline today as one remaining day without dividing by zero', () => {
    const result = assessTask(task('Today', 0, 1), everyDay(2), now);
    expect(result.remainingDays).toBe(1);
    expect(result.score).toBeCloseTo(0.5);
  });

  it('treats an overdue task as maximum priority', () => {
    const result = assessTask(task('Late', -2, 2), everyDay(2), now);
    expect(result.overdue).toBe(true);
    expect(result.score).toBe(MAX_SCORE);
  });

  it('flags risk when free time is smaller than the time needed', () => {
    const result = assessTask(task('Long', 2, 8), everyDay(2), now);
    expect(result.availableHours).toBe(4);
    expect(result.atRisk).toBe(true);
  });
});

describe('compareRanked tie-breaking', () => {
  const ranked = (t: PlanTask, score: number): Ranked => ({
    task: t,
    assessment: { ...assessTask(t, everyDay(2), now), score },
  });

  it('puts the higher score first', () => {
    const a = ranked(task('A', 3, 2), 0.2);
    const b = ranked(task('B', 3, 2), 0.5);
    expect(compareRanked(a, b)).toBeGreaterThan(0);
  });

  it('prefers the earlier deadline when scores are equal', () => {
    const early = ranked(task('Early', 2, 2), 0.3);
    const late = ranked(task('Late', 5, 2), 0.3);
    expect(compareRanked(early, late)).toBeLessThan(0);
  });

  it('prefers the longer task when scores and deadlines are equal', () => {
    const short = ranked(task('Short', 3, 1), 0.3);
    const long = ranked(task('Long', 3, 4), 0.3);
    expect(compareRanked(long, short)).toBeLessThan(0);
  });

  it('prefers the task created earlier when everything else is equal', () => {
    const first = ranked(task('First', 3, 2), 0.3);
    const second = ranked(task('Second', 3, 2), 0.3);
    expect(compareRanked(first, second)).toBeLessThan(0);
    expect(compareRanked(second, first)).toBeGreaterThan(0);
  });
});
