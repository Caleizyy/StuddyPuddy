import { describe, expect, it } from 'vitest';
import type { Plan, PlanItem } from '@/api/plan';
import type { Task } from '@/api/tasks';
import { dashboardStats, firstNameOf, greetingFor, todaysFocus, upcomingTasks } from './dashboard';

const NOW = new Date('2026-11-22T10:00:00Z');
const day = (n: number) => new Date(NOW.getTime() + n * 86400000).toISOString();

const task = (id: string, daysLeft: number, extra: Partial<Task> = {}): Task => ({
  id,
  title: id,
  category: 'homework',
  deadline: day(daysLeft),
  moduleCount: 1,
  estimatedHours: 4,
  status: 'todo',
  steps: [],
  loggedHours: 0,
  timeEntries: [],
  createdAt: day(-5),
  updatedAt: day(-5),
  ...extra,
});

describe('greetingFor', () => {
  it('follows the hour of the day', () => {
    expect(greetingFor(3)).toBe('Still up');
    expect(greetingFor(9)).toBe('Good morning');
    expect(greetingFor(12)).toBe('Good afternoon');
    expect(greetingFor(18)).toBe('Good evening');
  });
});

describe('firstNameOf', () => {
  it('takes the first word', () => {
    expect(firstNameOf('  Ada Lovelace ')).toBe('Ada');
    expect(firstNameOf('')).toBe('');
  });
});

describe('todaysFocus', () => {
  it('keeps only today, adds up the hours and attaches the plan item', () => {
    const item = { taskId: 'a', title: 'A', nextStep: 'Topic 2' } as PlanItem;
    const plan = {
      generatedAt: '2026-11-22T10:00:00.000Z',
      items: [item],
      schedule: [
        { date: '2026-11-22', taskId: 'a', title: 'A', hours: 1.5 },
        { date: '2026-11-22', taskId: 'b', title: 'B', hours: 0.5 },
        { date: '2026-11-23', taskId: 'a', title: 'A', hours: 2 },
      ],
    } as Plan;
    const focus = todaysFocus(plan);
    expect(focus.hours).toBe(2);
    expect(focus.entries.map((entry) => entry.taskId)).toEqual(['a', 'b']);
    expect(focus.entries[0].item?.nextStep).toBe('Topic 2');
    expect(focus.entries[1].item).toBeUndefined();
  });
});

describe('upcomingTasks', () => {
  it('lists unfinished tasks by deadline and cuts the list', () => {
    const tasks = [
      task('late', 9),
      task('done', 1, { status: 'done' }),
      task('soon', 2),
      task('overdue', -1),
    ];
    const result = upcomingTasks(tasks, 2, NOW);
    expect(result.map((entry) => entry.task.id)).toEqual(['overdue', 'soon']);
    expect(result.map((entry) => entry.daysLeft)).toEqual([-1, 2]);
  });
});

describe('dashboardStats', () => {
  it('counts open work, hours left, due this week and overdue', () => {
    const tasks = [
      task('a', 3, { estimatedHours: 4, loggedHours: 1 }),
      task('b', 7),
      task('c', 8),
      task('d', -2),
      task('e', 1, { status: 'done' }),
    ];
    expect(dashboardStats(tasks, 5.5, NOW)).toEqual({
      open: 4,
      hoursLeft: 3 + 4 + 4 + 4,
      dueThisWeek: 2,
      overdue: 1,
      studiedThisWeek: 5.5,
    });
  });
});
