import type { Task } from '@/api/tasks';

// Today as the person's own calendar day (2026-11-22), not the UTC day
export function localDateKey(now: Date = new Date()): string {
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

export function remainingOf(task: Pick<Task, 'estimatedHours' | 'loggedHours'>): number {
  return Math.max(0, task.estimatedHours - task.loggedHours);
}

// How much of the estimate is studied, 0 to 100 (more than the estimate still shows 100)
export function loggedPercent(task: Pick<Task, 'estimatedHours' | 'loggedHours'>): number {
  if (task.estimatedHours <= 0) return 0;
  return Math.min(100, Math.round((task.loggedHours / task.estimatedHours) * 100));
}

// Checks what was typed in the log form. Returns a message, or null when it is fine.
export function validateLog(hoursText: string, date: string, today: string): string | null {
  const hours = Number(hoursText);
  if (hoursText.trim() === '' || !Number.isFinite(hours)) return 'Enter the hours you studied';
  if (hours < 0.25) return 'At least 0.25 hours';
  if (hours > 24) return 'A day has only 24 hours';
  if (!Number.isInteger(hours * 4)) return 'Use steps of 0.25 hours';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return 'Pick the day you studied';
  if (date > today) return 'You cannot log time for a day that has not happened yet';
  return null;
}

// Hours logged on each of the last `days` calendar days ending today, oldest first
export function hoursPerDay(
  tasks: Pick<Task, 'timeEntries'>[],
  days: number,
  today: string,
): { date: string; hours: number }[] {
  const end = new Date(`${today}T00:00:00Z`);
  const keys = Array.from({ length: days }, (_, index) => {
    const day = new Date(end.getTime() - (days - 1 - index) * 24 * 60 * 60 * 1000);
    return day.toISOString().slice(0, 10);
  });
  const totals = new Map(keys.map((key) => [key, 0]));
  for (const task of tasks) {
    for (const entry of task.timeEntries) {
      if (totals.has(entry.date))
        totals.set(entry.date, (totals.get(entry.date) ?? 0) + entry.hours);
    }
  }
  return keys.map((date) => ({ date, hours: totals.get(date) ?? 0 }));
}
