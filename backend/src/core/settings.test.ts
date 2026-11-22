import { describe, expect, it } from 'vitest';
import { addDays } from './dates.js';
import { PlanningInputError } from './errors.js';
import { buildPlan } from './plan.js';
import { MAX_DAILY_LIMIT, MIN_DAILY_LIMIT } from './settings.js';
import type { PlanTask } from './types.js';

const now = new Date('2026-11-09T10:00:00Z'); // a Monday
const everyDay = (hours: number) => Array<number>(7).fill(hours);

let counter = 0;
function task(title: string, daysLeft: number, estimatedHours: number): PlanTask {
  counter += 1;
  return {
    id: `s${counter}`,
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

describe('daily study limit', () => {
  it('changes nothing when there is no limit', () => {
    const tasks = [task('Essay', 5, 6), task('Lab', 2, 3)];
    const withoutSettings = buildPlan({ tasks, hoursByWeekday: everyDay(2), now });

    expect(buildPlan({ tasks, hoursByWeekday: everyDay(2), now, settings: {} })).toEqual(
      withoutSettings,
    );
    expect(
      buildPlan({ tasks, hoursByWeekday: everyDay(2), now, settings: { maxHoursPerDay: null } }),
    ).toEqual(withoutSettings);
  });

  it('keeps every day at or below the limit', () => {
    const plan = buildPlan({
      tasks: [task('Essay', 6, 4)],
      hoursByWeekday: everyDay(4),
      now,
      settings: { maxHoursPerDay: 1 },
    });

    expect(plan.schedule.map((entry) => entry.hours)).toEqual([1, 1, 1, 1]);
    expect(plan.feasible).toBe(true);
  });

  it('does nothing on days where the user has fewer hours than the limit', () => {
    const tasks = [task('Essay', 5, 4)];
    const withoutLimit = buildPlan({ tasks, hoursByWeekday: everyDay(2), now });
    const withBigLimit = buildPlan({
      tasks,
      hoursByWeekday: everyDay(2),
      now,
      settings: { maxHoursPerDay: 3 },
    });

    expect(withBigLimit).toEqual(withoutLimit);
  });

  it('applies the limit only to the days that are above it', () => {
    // Sunday first: Mon 1 h, Tue 3 h, Thu 4 h. With a limit of 2 h: Mon 1 h, Tue 2 h, Thu 2 h.
    const plan = buildPlan({
      tasks: [task('Essay', 7, 5)],
      hoursByWeekday: [0, 1, 3, 0, 4, 0, 0],
      now,
      settings: { maxHoursPerDay: 2 },
    });

    expect(plan.schedule).toEqual([
      { date: '2026-11-09', taskId: plan.items[0].taskId, title: 'Essay', hours: 1 },
      { date: '2026-11-10', taskId: plan.items[0].taskId, title: 'Essay', hours: 2 },
      { date: '2026-11-12', taskId: plan.items[0].taskId, title: 'Essay', hours: 2 },
    ]);
    expect(plan.feasible).toBe(true);
  });

  it('can make a plan that fits without the limit run out of time with it', () => {
    const tasks = [task('Report', 2, 6)]; // 6 h in 2 days

    const without = buildPlan({ tasks, hoursByWeekday: everyDay(4), now });
    expect(without.feasible).toBe(true);
    expect(without.items[0].atRisk).toBe(false);

    const limited = buildPlan({
      tasks,
      hoursByWeekday: everyDay(4),
      now,
      settings: { maxHoursPerDay: 2 },
    });
    expect(limited.feasible).toBe(false);
    expect(limited.items[0]).toMatchObject({
      atRisk: true,
      scheduledHours: 4,
      unscheduledHours: 2,
    });
    expect(limited.warnings).toHaveLength(1);
  });

  it('does not change the availability that was passed in', () => {
    const hours = everyDay(4);
    buildPlan({
      tasks: [task('Essay', 3, 2)],
      hoursByWeekday: hours,
      now,
      settings: { maxHoursPerDay: 1 },
    });
    expect(hours).toEqual(everyDay(4));
  });

  it.each([0, -1, 0.1, 0.3, 24.25, 25, Number.NaN, Number.POSITIVE_INFINITY])(
    'rejects the limit %s and names the field',
    (limit) => {
      const error = errorFrom(() =>
        buildPlan({
          tasks: [],
          hoursByWeekday: everyDay(2),
          now,
          settings: { maxHoursPerDay: limit },
        }),
      );

      expect(error).toBeInstanceOf(PlanningInputError);
      expect((error as PlanningInputError).field).toBe('maxHoursPerDay');
    },
  );

  it('accepts the smallest and the largest limit', () => {
    for (const limit of [MIN_DAILY_LIMIT, MAX_DAILY_LIMIT]) {
      expect(() =>
        buildPlan({
          tasks: [],
          hoursByWeekday: everyDay(2),
          now,
          settings: { maxHoursPerDay: limit },
        }),
      ).not.toThrow();
    }
  });
});
