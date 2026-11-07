import { describe, expect, it } from 'vitest';
import { addDays } from './dates.js';
import { PlanningInputError } from './errors.js';
import { buildPlan } from './plan.js';
import type { PlanTask } from './types.js';

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

function errorFrom(fn: () => unknown): unknown {
  try {
    fn();
  } catch (error) {
    return error;
  }
  return undefined;
}

describe('buildPlan', () => {
  it('normal case: the nearer deadline ranks first and everything fits', () => {
    const plan = buildPlan({
      tasks: [task('History', 7, 2), task('Math', 5, 6), task('Lab', 2, 3)],
      hoursByWeekday: everyDay(2),
      now,
    });

    expect(plan.items.map((i) => i.title)).toEqual(['Lab', 'Math', 'History']);
    expect(plan.items.map((i) => i.band)).toEqual(['high', 'high', 'low']);
    expect(plan.items.map((i) => i.scheduledHours)).toEqual([3, 6, 2]);
    expect(plan.warnings).toEqual([]);
    expect(plan.feasible).toBe(true);
  });

  it('conflict case: the 8 h task gets the 4 available hours and a warning is raised', () => {
    const plan = buildPlan({
      tasks: [task('Short', 2, 1), task('Long', 2, 8)],
      hoursByWeekday: everyDay(2),
      now,
    });

    expect(plan.items.map((i) => i.title)).toEqual(['Long', 'Short']);
    expect(plan.items[0]).toMatchObject({ scheduledHours: 4, unscheduledHours: 4 });
    expect(plan.items[1]).toMatchObject({ scheduledHours: 0, unscheduledHours: 1 });
    expect(plan.feasible).toBe(false);
    expect(plan.warnings.map((w) => w.title)).toEqual(['Long', 'Short']);
  });

  it('removes a finished task and recalculates the plan', () => {
    const lab = task('Lab', 2, 3);
    const math = task('Math', 5, 6);
    const input = { hoursByWeekday: everyDay(2), now };

    const before = buildPlan({ tasks: [lab, math], ...input });
    expect(before.items[0].title).toBe('Lab');

    const after = buildPlan({ tasks: [{ ...lab, status: 'done' }, math], ...input });
    expect(after.items.map((i) => i.title)).toEqual(['Math']);
    expect(after.schedule.every((entry) => entry.taskId !== lab.id)).toBe(true);
  });

  it('never schedules more hours on a day than the user has', () => {
    const hoursByWeekday = [1, 2, 3, 2, 1, 0, 4];
    const plan = buildPlan({
      tasks: [task('A', 3, 5), task('B', 6, 7), task('C', 1, 2), task('D', 10, 9)],
      hoursByWeekday,
      now,
    });

    const perDay = new Map<string, number>();
    for (const entry of plan.schedule) {
      perDay.set(entry.date, (perDay.get(entry.date) ?? 0) + entry.hours);
    }
    for (const [date, total] of perDay) {
      expect(total).toBeLessThanOrEqual(hoursByWeekday[new Date(date).getUTCDay()] + 1e-9);
    }
  });

  it('uses the hours of the matching weekday', () => {
    // Only Mondays have study time; today (2026-11-09) is a Monday
    const plan = buildPlan({
      tasks: [task('Report', 3, 2)],
      hoursByWeekday: [0, 3, 0, 0, 0, 0, 0],
      now,
    });
    expect(plan.schedule.map((e) => [e.date, e.hours])).toEqual([['2026-11-09', 2]]);
  });

  it('flags every task as risky when the user has no study time at all', () => {
    const plan = buildPlan({
      tasks: [task('A', 2, 1), task('B', 4, 2)],
      hoursByWeekday: everyDay(0),
      now,
    });
    expect(plan.items.every((i) => i.band === 'high' && i.atRisk)).toBe(true);
    expect(plan.schedule).toEqual([]);
    expect(plan.warnings).toHaveLength(2);
  });

  it('schedules a task due today on today only', () => {
    const plan = buildPlan({ tasks: [task('Today', 0, 1)], hoursByWeekday: everyDay(2), now });
    expect(plan.schedule.map((e) => e.date)).toEqual(['2026-11-09']);
    expect(plan.feasible).toBe(true);
  });

  it('reports an overdue task with a warning', () => {
    const plan = buildPlan({ tasks: [task('Late', -2, 2)], hoursByWeekday: everyDay(2), now });
    expect(plan.items[0].overdue).toBe(true);
    expect(plan.warnings[0].message).toContain('overdue');
  });

  it('rejects a task with zero or negative hours and names the field', () => {
    for (const hours of [0, -1]) {
      const error = errorFrom(() =>
        buildPlan({ tasks: [task('Bad', 2, hours)], hoursByWeekday: everyDay(2), now }),
      );
      expect(error).toBeInstanceOf(PlanningInputError);
      expect(error).toMatchObject({ field: 'estimatedHours' });
    }
  });

  it('rejects a task without a valid deadline', () => {
    const bad = { ...task('No deadline', 2, 2), deadline: new Date('invalid') };
    const error = errorFrom(() => buildPlan({ tasks: [bad], hoursByWeekday: everyDay(2), now }));
    expect(error).toMatchObject({ field: 'deadline' });
  });

  it('rejects invalid availability', () => {
    const error = errorFrom(() => buildPlan({ tasks: [], hoursByWeekday: [1, 2, 3], now }));
    expect(error).toMatchObject({ field: 'availability' });
  });

  it('rejects a day with more than 24 hours or a negative number', () => {
    for (const bad of [-1, 30]) {
      const error = errorFrom(() =>
        buildPlan({ tasks: [], hoursByWeekday: [bad, 2, 2, 2, 2, 2, 2], now }),
      );
      expect(error).toMatchObject({ field: 'availability' });
    }
  });
});
