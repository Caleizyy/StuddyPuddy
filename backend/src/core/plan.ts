import { addDays, dateKey } from './dates.js';
import { assessTask, compareRanked } from './priority.js';
import { applyDailyLimit, validateSettings } from './settings.js';
import type {
  Plan,
  PlanItem,
  PlanSettings,
  PlanTask,
  PlanWarning,
  Ranked,
  ScheduleEntry,
} from './types.js';
import {
  MAX_OPEN_TASKS,
  remainingHours,
  validateAvailability,
  validateTask,
} from './validation.js';
import { PlanningInputError } from './errors.js';

export type PlanInput = {
  tasks: PlanTask[];
  hoursByWeekday: number[]; // index 0 = Sunday
  now: Date;
  settings?: PlanSettings; // the client's own settings, for example a daily study limit
};

export function buildPlan({
  tasks,
  hoursByWeekday: userHours,
  now,
  settings = {},
}: PlanInput): Plan {
  validateAvailability(userHours);
  validateSettings(settings);

  // From here on, every rule uses the hours the user can really study on each day
  const hoursByWeekday = applyDailyLimit(userHours, settings);

  const openTasks = tasks.filter((task) => task.status !== 'done');
  if (openTasks.length > MAX_OPEN_TASKS) {
    throw new PlanningInputError(
      'tasks',
      `You can have at most ${MAX_OPEN_TASKS} unfinished tasks`,
    );
  }
  for (const task of openTasks) {
    validateTask(task);
  }

  const ranked: Ranked[] = openTasks.map((task) => ({
    task,
    assessment: assessTask(task, hoursByWeekday, now),
  }));
  ranked.sort(compareRanked);

  const freeHours: number[] = [];
  let firstFreeDay = 0; // every day before this one is already full

  const items: PlanItem[] = [];
  const schedule: ScheduleEntry[] = [];
  const warnings: PlanWarning[] = [];

  for (const { task, assessment } of ranked) {
    const toSchedule = remainingHours(task);
    let hoursLeft = toSchedule;

    if (assessment.availableHours > 0) {
      for (let day = firstFreeDay; day < assessment.remainingDays; day++) {
        if (hoursLeft <= 0) break;

        if (day >= freeHours.length) {
          freeHours.push(hoursByWeekday[addDays(now, day).getUTCDay()]);
        }

        const hours = Math.min(freeHours[day], hoursLeft);
        if (hours <= 0) continue; // this day is already full

        freeHours[day] -= hours;
        hoursLeft -= hours;
        schedule.push({
          date: dateKey(addDays(now, day)),
          taskId: task.id,
          title: task.title,
          hours,
        });
      }
    }

    while (firstFreeDay < freeHours.length && freeHours[firstFreeDay] === 0) {
      firstFreeDay++;
    }

    items.push({
      taskId: task.id,
      title: task.title,
      deadline: task.deadline,
      priorityScore: assessment.score,
      band: assessment.band,
      atRisk: assessment.atRisk,
      overdue: assessment.overdue,
      remainingDays: assessment.remainingDays,
      availableHours: assessment.availableHours,
      scheduledHours: toSchedule - hoursLeft,
      unscheduledHours: hoursLeft,
      loggedHours: task.loggedHours ?? 0,
      remainingHours: toSchedule,
    });

    if (hoursLeft > 0) {
      const message = assessment.overdue
        ? `"${task.title}" is overdue`
        : `Not enough study time before the deadline for "${task.title}": ${hoursLeft} h cannot be scheduled`;
      warnings.push({ taskId: task.id, title: task.title, unscheduledHours: hoursLeft, message });
    }
  }

  schedule.sort((a, b) => a.date.localeCompare(b.date));

  return { items, schedule, warnings, feasible: warnings.length === 0 };
}
