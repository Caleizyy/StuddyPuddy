import { describe, expect, it } from 'vitest';
import {
  checkDailyMaximum,
  checkDates,
  checkHoursAddUp,
  checkOrdering,
  checkQuarterHours,
  checkWarnings,
  checkWhichTasks,
} from './invariants.js';
import { makeRandom, randomCase } from './random.js';
import { buildScenarios, NOW } from './scenarios.js';
import { runCorrectnessChecks, runPlan, scenarioMismatch } from './run.js';

describe('correctness: predefined scenarios', () => {
  it.each(buildScenarios().map((scenario) => [scenario.id, scenario.name, scenario] as const))(
    '%s %s',
    (_id, _name, scenario) => {
      expect(scenarioMismatch(scenario)).toBeNull();
    },
  );
});

describe('correctness: the whole check', () => {
  it('passes every row of the results table', () => {
    const failed = runCorrectnessChecks().filter((row) => !row.passed);
    expect(failed).toEqual([]);
  });
});

// A check that can never fail proves nothing. These feed each check a plan that is wrong on
// purpose and require it to be noticed.
describe('correctness: the checks can fail', () => {
  const input = buildScenarios()[0].input; // S1
  const good = runPlan(input);
  const copy = () => structuredClone(good);

  it('accepts the real plan', () => {
    expect(checkDailyMaximum(input, good)).toEqual([]);
    expect(checkHoursAddUp(input, good)).toEqual([]);
    expect(checkDates(input, good)).toEqual([]);
    expect(checkWhichTasks(input, good)).toEqual([]);
    expect(checkWarnings(good)).toEqual([]);
    expect(checkQuarterHours(good)).toEqual([]);
    expect(checkOrdering(good)).toEqual([]);
  });

  it('notices a day with too many hours', () => {
    const bad = copy();
    bad.schedule[0].hours = 3; // the user has 2 h
    expect(checkDailyMaximum(input, bad)).not.toEqual([]);
  });

  it('notices a day above the personal limit even when the weekday allows more', () => {
    const limited = {
      ...input,
      hoursByWeekday: Array<number>(7).fill(4),
      settings: { maxHoursPerDay: 2 },
    };
    const bad = copy();
    bad.schedule[0].hours = 3;
    expect(checkDailyMaximum(limited, bad)).not.toEqual([]);
  });

  it('notices hours that do not add up', () => {
    const bad = copy();
    bad.items[0].scheduledHours += 1;
    expect(checkHoursAddUp(input, bad)).not.toEqual([]);
  });

  it('notices a study day after the deadline and one in the past', () => {
    const late = copy();
    late.schedule[0].date = '2026-12-31';
    expect(checkDates(input, late)).not.toEqual([]);
    const past = copy();
    past.schedule[0].date = '2026-11-01';
    expect(checkDates(input, past)).not.toEqual([]);
  });

  it('notices a missing task and a finished task that is still planned', () => {
    const missing = copy();
    missing.items.pop();
    expect(checkWhichTasks(input, missing)).not.toEqual([]);
    const doneInput = {
      ...input,
      tasks: input.tasks.map((t, i) => (i === 0 ? { ...t, status: 'done' as const } : t)),
    };
    expect(checkWhichTasks(doneInput, good)).not.toEqual([]);
  });

  it('notices a wrong "feasible" flag and an overdue task with hours', () => {
    const flag = copy();
    flag.feasible = false;
    expect(checkWarnings(flag)).not.toEqual([]);
    const overdue = copy();
    overdue.items[0].overdue = true;
    expect(checkWarnings(overdue)).not.toEqual([]);
  });

  it('notices a fractional entry, a wrong rank and unordered days', () => {
    const odd = copy();
    odd.schedule[0].hours = 0.3;
    expect(checkQuarterHours(odd)).not.toEqual([]);
    const rank = copy();
    rank.items[1].priorityScore = rank.items[0].priorityScore + 1;
    expect(checkOrdering(rank)).not.toEqual([]);
    const order = copy();
    order.schedule.reverse();
    expect(checkOrdering(order)).not.toEqual([]);
  });
});

describe('correctness: logged time', () => {
  const input = buildScenarios().find((scenario) => scenario.id === 'S11')!.input;

  it('accepts a plan that schedules only what is left', () => {
    expect(checkHoursAddUp(input, runPlan(input))).toEqual([]);
  });

  it('notices a plan that ignores the logged hours', () => {
    const ignoring = runPlan({
      ...input,
      tasks: input.tasks.map((task) => ({ ...task, loggedHours: 0 })),
    });
    expect(checkHoursAddUp(input, ignoring)).not.toEqual([]);
  });

  it('notices a planner that is made to treat logged time as extra work (R9)', () => {
    // a task whose logged hours are ignored would not get a quarter hour off, so R9 would fire
    const target = runPlan(input).items[0];
    expect(target.remainingHours).toBe(2);
    const more = runPlan({
      ...input,
      tasks: input.tasks.map((task) => ({ ...task, loggedHours: 4.25 })),
    }).items[0];
    expect(more.remainingHours).toBe(1.75);
    expect(more.priorityScore).toBeLessThanOrEqual(target.priorityScore);
  });
});

describe('correctness: the random inputs are repeatable', () => {
  it('gives the same numbers for the same seed', () => {
    const a = makeRandom(42);
    const b = makeRandom(42);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });

  it('builds the same case for the same seed and uses the fixed "today"', () => {
    expect(JSON.stringify(randomCase(7))).toBe(JSON.stringify(randomCase(7)));
    expect(randomCase(7).now).toEqual(NOW);
  });
});
