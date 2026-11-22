// The rules every plan must obey, written as plain checks.
// Each check returns a list of problems; an empty list means the plan is correct.
// Nothing here calls the planner: it only looks at an input and the plan made from it.

import { addDays, dateKey } from '../core/dates.js';
import type { Plan, PlanSettings, PlanTask } from '../core/types.js';

export type PlanCase = {
  tasks: PlanTask[];
  hoursByWeekday: number[]; // index 0 = Sunday
  now: Date;
  settings?: PlanSettings;
};

// The most hours the user allows on a given weekday: their own hours, lowered by the daily limit
export function allowedHours(input: PlanCase, weekday: number): number {
  const own = input.hoursByWeekday[weekday];
  const limit = input.settings?.maxHoursPerDay;
  return limit === null || limit === undefined ? own : Math.min(own, limit);
}

function sumByKey<T>(rows: T[], key: (row: T) => string, value: (row: T) => number) {
  const totals = new Map<string, number>();
  for (const row of rows) {
    totals.set(key(row), (totals.get(key(row)) ?? 0) + value(row));
  }
  return totals;
}

// R1: no day is planned for more hours than the user's maximum for that day
export function checkDailyMaximum(input: PlanCase, plan: Plan): string[] {
  const problems: string[] = [];
  const perDay = sumByKey(
    plan.schedule,
    (entry) => entry.date,
    (entry) => entry.hours,
  );
  for (const [date, total] of perDay) {
    const max = allowedHours(input, new Date(`${date}T00:00:00Z`).getUTCDay());
    if (total > max) problems.push(`${date}: ${total} h planned, the maximum is ${max} h`);
  }
  return problems;
}

// R2: hours add up. Scheduled plus unscheduled is exactly the estimate, and the list of
// days agrees with the task summary
export function checkHoursAddUp(input: PlanCase, plan: Plan): string[] {
  const problems: string[] = [];
  const perTask = sumByKey(
    plan.schedule,
    (entry) => entry.taskId,
    (entry) => entry.hours,
  );
  for (const item of plan.items) {
    const task = input.tasks.find((candidate) => candidate.id === item.taskId);
    if (!task) {
      problems.push(`${item.title}: appears in the plan but is not one of the tasks`);
      continue;
    }
    if (item.scheduledHours + item.unscheduledHours !== task.estimatedHours) {
      problems.push(`${item.title}: scheduled and unscheduled hours do not add up to the estimate`);
    }
    if ((perTask.get(item.taskId) ?? 0) !== item.scheduledHours) {
      problems.push(`${item.title}: the day-by-day hours differ from the task's scheduled hours`);
    }
  }
  return problems;
}

// R3: every entry is on a legal day: not in the past, and before the deadline day
// (a task due today can still be studied today)
export function checkDates(input: PlanCase, plan: Plan): string[] {
  const problems: string[] = [];
  const today = dateKey(input.now);
  for (const entry of plan.schedule) {
    const task = input.tasks.find((candidate) => candidate.id === entry.taskId);
    if (!task) continue; // reported by checkHoursAddUp through the item list
    const lastDay = dateKey(task.deadline) > today ? dateKey(addDays(task.deadline, -1)) : today;
    if (entry.date < today) problems.push(`${entry.title}: planned in the past (${entry.date})`);
    if (entry.date > lastDay) {
      problems.push(`${entry.title}: planned on ${entry.date}, after its last allowed day`);
    }
  }
  return problems;
}

// R4: exactly the unfinished tasks are planned, each once
export function checkWhichTasks(input: PlanCase, plan: Plan): string[] {
  const problems: string[] = [];
  const open = input.tasks.filter((task) => task.status !== 'done').map((task) => task.id);
  const planned = plan.items.map((item) => item.taskId);
  if ([...open].sort().join() !== [...planned].sort().join()) {
    problems.push('the planned tasks are not exactly the unfinished tasks');
  }
  return problems;
}

// R5: the warnings match the facts: feasible only when nothing is left unscheduled,
// and an overdue task never gets study hours
export function checkWarnings(plan: Plan): string[] {
  const problems: string[] = [];
  const leftOver = plan.items.filter((item) => item.unscheduledHours > 0);
  if (plan.feasible !== (leftOver.length === 0))
    problems.push('"feasible" does not match the hours');
  if (plan.warnings.length !== leftOver.length) {
    problems.push('the number of warnings does not match the tasks with unscheduled hours');
  }
  for (const item of plan.items) {
    if (item.overdue && item.scheduledHours > 0) {
      problems.push(`${item.title}: overdue but has study hours`);
    }
  }
  return problems;
}

// R6: every entry is a positive whole quarter hour
export function checkQuarterHours(plan: Plan): string[] {
  return plan.schedule
    .filter((entry) => !(entry.hours > 0 && entry.hours % 0.25 === 0))
    .map(
      (entry) => `${entry.date} ${entry.title}: ${entry.hours} h is not a positive quarter hour`,
    );
}

// R7: the most urgent task comes first, and the days are in date order
export function checkOrdering(plan: Plan): string[] {
  const problems: string[] = [];
  for (let i = 1; i < plan.items.length; i++) {
    if (plan.items[i].priorityScore > plan.items[i - 1].priorityScore) {
      problems.push(`${plan.items[i].title} is ranked below a less urgent task`);
    }
  }
  for (let i = 1; i < plan.schedule.length; i++) {
    if (plan.schedule[i].date < plan.schedule[i - 1].date) {
      problems.push('the schedule is not in date order');
    }
  }
  return problems;
}

export type NamedCheck = {
  id: string;
  name: string;
  run: (input: PlanCase, plan: Plan) => string[];
};

export const CHECKS: NamedCheck[] = [
  { id: 'R1', name: 'No day exceeds the daily maximum', run: checkDailyMaximum },
  { id: 'R2', name: 'Planned hours add up to each estimate', run: checkHoursAddUp },
  { id: 'R3', name: 'Every study day is before the deadline', run: checkDates },
  { id: 'R4', name: 'Exactly the unfinished tasks are planned', run: checkWhichTasks },
  {
    id: 'R5',
    name: 'Warnings and "feasible" match the hours',
    run: (_input, plan) => checkWarnings(plan),
  },
  {
    id: 'R6',
    name: 'Every entry is a positive quarter hour',
    run: (_input, plan) => checkQuarterHours(plan),
  },
  {
    id: 'R7',
    name: 'Tasks are ranked by urgency, days by date',
    run: (_input, plan) => checkOrdering(plan),
  },
];
