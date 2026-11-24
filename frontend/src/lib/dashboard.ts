import type { Plan, PlanItem, ScheduleEntry } from '@/api/plan';
import type { Task } from '@/api/tasks';
import { daysUntil } from './deadline';
import { remainingOf } from './timeLog';

export function greetingFor(hour: number): string {
  if (hour < 5) return 'Still up';
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export function firstNameOf(name: string): string {
  return name.trim().split(/\s+/)[0] ?? '';
}

export type FocusEntry = ScheduleEntry & { item?: PlanItem };

// What the plan has for today. The planner counts UTC days, so "today" is its own date.
export function todaysFocus(plan: Plan): { entries: FocusEntry[]; hours: number } {
  const today = plan.generatedAt.slice(0, 10);
  const itemById = new Map(plan.items.map((item) => [item.taskId, item]));
  const entries = plan.schedule
    .filter((entry) => entry.date === today)
    .map((entry) => ({ ...entry, item: itemById.get(entry.taskId) }));
  return { entries, hours: entries.reduce((sum, entry) => sum + entry.hours, 0) };
}

// The unfinished tasks due soonest, with the days left
export function upcomingTasks(tasks: Task[], count: number, now: Date = new Date()) {
  return tasks
    .filter((task) => task.status !== 'done')
    .sort((a, b) => a.deadline.localeCompare(b.deadline))
    .slice(0, count)
    .map((task) => ({ task, daysLeft: daysUntil(task.deadline, now) }));
}

export function dashboardStats(tasks: Task[], studiedThisWeek: number, now: Date = new Date()) {
  const open = tasks.filter((task) => task.status !== 'done');
  return {
    open: open.length,
    hoursLeft: open.reduce((sum, task) => sum + remainingOf(task), 0),
    dueThisWeek: open.filter((task) => {
      const days = daysUntil(task.deadline, now);
      return days >= 0 && days <= 7;
    }).length,
    overdue: open.filter((task) => daysUntil(task.deadline, now) < 0).length,
    studiedThisWeek,
  };
}
