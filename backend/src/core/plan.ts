import { addDays, dateKey } from './dates.js';
import { assessTask, compareRanked } from './priority.js';
import type { Plan, PlanItem, PlanTask, PlanWarning, Ranked, ScheduleEntry } from './types.js';
import { validateAvailability, validateTask } from './validation.js';

export type PlanInput = {
  tasks: PlanTask[];
  hoursByWeekday: number[]; // index 0 = Sunday
  now: Date;
};

export function buildPlan({ tasks, hoursByWeekday, now }: PlanInput): Plan {
  validateAvailability(hoursByWeekday);

  const openTasks = tasks.filter((task) => task.status !== 'done');
  for (const task of openTasks) {
    validateTask(task);
  }

  const ranked: Ranked[] = openTasks.map((task) => ({
    task,
    assessment: assessTask(task, hoursByWeekday, now),
  }));
  ranked.sort(compareRanked);

  let lastDay = 0;
  for (const { assessment } of ranked) {
    if (assessment.remainingDays > lastDay) lastDay = assessment.remainingDays;
  }
  const freeHours: number[] = [];
  for (let day = 0; day < lastDay; day++) {
    freeHours.push(hoursByWeekday[addDays(now, day).getUTCDay()]);
  }

  const items: PlanItem[] = [];
  const schedule: ScheduleEntry[] = [];
  const warnings: PlanWarning[] = [];

  for (const { task, assessment } of ranked) {
    let hoursLeft = task.estimatedHours;

    for (let day = 0; day < assessment.remainingDays; day++) {
      if (hoursLeft <= 0) break;

      const hours = Math.min(freeHours[day], hoursLeft);
      if (hours <= 0) continue; // this day is already full

      freeHours[day] -= hours; // those hours are now used up
      hoursLeft -= hours;
      schedule.push({
        date: dateKey(addDays(now, day)),
        taskId: task.id,
        title: task.title,
        hours,
      });
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
      scheduledHours: task.estimatedHours - hoursLeft,
      unscheduledHours: hoursLeft,
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
