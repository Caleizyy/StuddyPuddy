// Predefined scenarios. The expected results were worked out by hand from the rules in
// backend/src/core/README.md, not copied from the planner's output.
//
// Common set-up: today is Monday 2026-11-09. A task "due in N days" has its deadline N days
// from today. The last study day for a task is the day before its deadline (a task due today
// is studied today).

import { addDays } from '../core/dates.js';
import type { PlanTask } from '../core/types.js';
import type { PlanCase } from './invariants.js';

export const NOW = new Date('2026-11-09T10:00:00Z');
const everyDay = (hours: number) => Array<number>(7).fill(hours);

let counter = 0;
function task(
  title: string,
  daysLeft: number,
  estimatedHours: number,
  status: PlanTask['status'] = 'todo',
  loggedHours = 0,
): PlanTask {
  counter += 1;
  return {
    id: `s${counter}`,
    title,
    deadline: addDays(NOW, daysLeft),
    estimatedHours,
    ...(loggedHours > 0 && { loggedHours }),
    createdAt: new Date(Date.UTC(2026, 10, 1, 0, counter)),
    status,
  };
}

export type ExpectedPlan = {
  order: string[]; // titles, most urgent first
  schedule: [date: string, title: string, hours: number][];
  unscheduled: Record<string, number>; // title -> hours that do not fit (missing = 0)
  feasible: boolean;
};

export type Scenario = {
  id: string;
  name: string;
  rule: string;
  input: PlanCase;
  expected: ExpectedPlan;
};

export function buildScenarios(): Scenario[] {
  counter = 0;
  const lab = task('Lab', 2, 3);
  const math = task('Math', 5, 6);
  const history = task('History', 7, 2);

  return [
    {
      id: 'S1',
      name: 'Normal workload, 2 h every day',
      rule: 'Nearest deadline first; everything fits; nothing after its deadline',
      input: { tasks: [history, math, lab], hoursByWeekday: everyDay(2), now: NOW },
      expected: {
        order: ['Lab', 'Math', 'History'],
        schedule: [
          ['2026-11-09', 'Lab', 2],
          ['2026-11-10', 'Lab', 1],
          ['2026-11-10', 'Math', 1],
          ['2026-11-11', 'Math', 2],
          ['2026-11-12', 'Math', 2],
          ['2026-11-13', 'Math', 1],
          ['2026-11-13', 'History', 1],
          ['2026-11-14', 'History', 1],
        ],
        unscheduled: {},
        feasible: true,
      },
    },
    {
      id: 'S2',
      name: 'Conflict: 9 h of work, 4 h available',
      rule: 'The more urgent task takes the hours; the rest is reported as unscheduled',
      input: {
        tasks: [task('Short', 2, 1), task('Long', 2, 8)],
        hoursByWeekday: everyDay(2),
        now: NOW,
      },
      expected: {
        order: ['Long', 'Short'],
        schedule: [
          ['2026-11-09', 'Long', 2],
          ['2026-11-10', 'Long', 2],
        ],
        unscheduled: { Long: 4, Short: 1 },
        feasible: false,
      },
    },
    {
      id: 'S3',
      name: 'A finished task leaves the plan',
      rule: 'Only unfinished tasks are planned; the others are recalculated',
      input: {
        tasks: [{ ...lab, status: 'done' }, math, history],
        hoursByWeekday: everyDay(2),
        now: NOW,
      },
      expected: {
        order: ['Math', 'History'],
        schedule: [
          ['2026-11-09', 'Math', 2],
          ['2026-11-10', 'Math', 2],
          ['2026-11-11', 'Math', 2],
          ['2026-11-12', 'History', 2],
        ],
        unscheduled: {},
        feasible: true,
      },
    },
    {
      id: 'S4',
      name: 'Only Monday has study time',
      rule: 'Hours are taken from the matching weekday only',
      input: {
        tasks: [task('Report', 3, 2)],
        hoursByWeekday: [0, 3, 0, 0, 0, 0, 0],
        now: NOW,
      },
      expected: {
        order: ['Report'],
        schedule: [['2026-11-09', 'Report', 2]],
        unscheduled: {},
        feasible: true,
      },
    },
    {
      id: 'S5',
      name: 'Task due today',
      rule: 'A task due today is studied today and not before',
      input: { tasks: [task('Today', 0, 1)], hoursByWeekday: everyDay(2), now: NOW },
      expected: {
        order: ['Today'],
        schedule: [['2026-11-09', 'Today', 1]],
        unscheduled: {},
        feasible: true,
      },
    },
    {
      id: 'S6',
      name: 'Overdue task',
      rule: 'An overdue task gets no hours and a warning',
      input: { tasks: [task('Late', -2, 3)], hoursByWeekday: everyDay(2), now: NOW },
      expected: { order: ['Late'], schedule: [], unscheduled: { Late: 3 }, feasible: false },
    },
    {
      id: 'S7',
      name: 'No study time at all',
      rule: 'Nothing is scheduled and every task is warned about',
      input: {
        tasks: [task('A', 2, 1), task('B', 4, 2)],
        hoursByWeekday: everyDay(0),
        now: NOW,
      },
      expected: { order: ['A', 'B'], schedule: [], unscheduled: { A: 1, B: 2 }, feasible: false },
    },
    {
      id: 'S8',
      name: '6 h in 2 days, 4 h per day, no daily limit',
      rule: 'Without a personal limit the user’s own hours are used',
      input: { tasks: [task('Essay', 2, 6)], hoursByWeekday: everyDay(4), now: NOW },
      expected: {
        order: ['Essay'],
        schedule: [
          ['2026-11-09', 'Essay', 4],
          ['2026-11-10', 'Essay', 2],
        ],
        unscheduled: {},
        feasible: true,
      },
    },
    {
      id: 'S9',
      name: 'Same as S8 with a daily limit of 2 h',
      rule: 'A personal limit caps every day, so the plan no longer fits',
      input: {
        tasks: [task('Essay', 2, 6)],
        hoursByWeekday: everyDay(4),
        now: NOW,
        settings: { maxHoursPerDay: 2 },
      },
      expected: {
        order: ['Essay'],
        schedule: [
          ['2026-11-09', 'Essay', 2],
          ['2026-11-10', 'Essay', 2],
        ],
        unscheduled: { Essay: 2 },
        feasible: false,
      },
    },
    {
      id: 'S10',
      name: 'Daily limit above the user’s own hours',
      rule: 'A limit never adds hours: the lower of the two applies',
      input: {
        tasks: [task('Essay', 2, 6)],
        hoursByWeekday: everyDay(4),
        now: NOW,
        settings: { maxHoursPerDay: 10 },
      },
      expected: {
        order: ['Essay'],
        schedule: [
          ['2026-11-09', 'Essay', 4],
          ['2026-11-10', 'Essay', 2],
        ],
        unscheduled: {},
        feasible: true,
      },
    },
    {
      id: 'S11',
      name: '6 h task with 4 h already logged',
      rule: 'Only the hours not yet studied are scheduled',
      input: {
        tasks: [task('Essay', 2, 6, 'in_progress', 4)],
        hoursByWeekday: everyDay(4),
        now: NOW,
      },
      expected: {
        order: ['Essay'],
        schedule: [['2026-11-09', 'Essay', 2]],
        unscheduled: {},
        feasible: true,
      },
    },
    {
      id: 'S12',
      name: 'Logged time lets a task that did not fit fit',
      rule: 'S9 with 2 h logged: 4 h are left and the limit of 2 h a day is enough',
      input: {
        tasks: [task('Essay', 2, 6, 'in_progress', 2)],
        hoursByWeekday: everyDay(4),
        now: NOW,
        settings: { maxHoursPerDay: 2 },
      },
      expected: {
        order: ['Essay'],
        schedule: [
          ['2026-11-09', 'Essay', 2],
          ['2026-11-10', 'Essay', 2],
        ],
        unscheduled: {},
        feasible: true,
      },
    },
    {
      id: 'S13',
      name: 'More time logged than estimated',
      rule: 'Nothing is left to schedule, nothing is urgent, and no warning is raised',
      input: {
        tasks: [task('Done in practice', 3, 2, 'in_progress', 3), task('Other', 3, 2)],
        hoursByWeekday: everyDay(2),
        now: NOW,
      },
      expected: {
        order: ['Other', 'Done in practice'],
        schedule: [['2026-11-09', 'Other', 2]],
        unscheduled: {},
        feasible: true,
      },
    },
    {
      id: 'S14',
      name: 'Everything logged on an overdue task',
      rule: 'An overdue task with nothing left is not reported as late',
      input: {
        tasks: [task('Finished late', -2, 2, 'in_progress', 2)],
        hoursByWeekday: everyDay(2),
        now: NOW,
      },
      expected: { order: ['Finished late'], schedule: [], unscheduled: {}, feasible: true },
    },
  ];
}
