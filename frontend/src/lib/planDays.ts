import type { Plan, ScheduleEntry } from '@/api/plan';

export type PlanDay = { date: string; entries: ScheduleEntry[]; totalHours: number };

const MIN_DAYS = 7; // always show at least a week
const MAX_DAYS = 28; // and never more than four weeks
const MS_PER_DAY = 24 * 60 * 60 * 1000;

// Dates are 2026-11-09 style text, counted as UTC days like the planner does
function dayNumber(dateKey: string): number {
  return Date.parse(`${dateKey}T00:00:00Z`) / MS_PER_DAY;
}

function addDays(dateKey: string, days: number): string {
  return new Date((dayNumber(dateKey) + days) * MS_PER_DAY).toISOString().slice(0, 10);
}

export function buildDays(plan: Plan): { days: PlanDay[]; continuesUntil: string | null } {
  const today = plan.generatedAt.slice(0, 10);
  const lastEntry = plan.schedule[plan.schedule.length - 1];
  const lastDate = lastEntry ? lastEntry.date : today;
  const daysNeeded = dayNumber(lastDate) - dayNumber(today) + 1;
  const count = Math.min(MAX_DAYS, Math.max(MIN_DAYS, daysNeeded));

  const entriesByDate: Record<string, ScheduleEntry[]> = {};
  for (const entry of plan.schedule) {
    if (!entriesByDate[entry.date]) entriesByDate[entry.date] = [];
    entriesByDate[entry.date].push(entry);
  }

  const days: PlanDay[] = [];
  for (let i = 0; i < count; i++) {
    const date = addDays(today, i);
    const entries = entriesByDate[date] ?? [];
    const totalHours = entries.reduce((sum, entry) => sum + entry.hours, 0);
    days.push({ date, entries, totalHours });
  }

  return { days, continuesUntil: daysNeeded > MAX_DAYS ? lastDate : null };
}

export function formatDay(dateKey: string): string {
  return new Date(`${dateKey}T00:00:00Z`).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  });
}

export function dayLabel(dateKey: string, today: string): string {
  const difference = dayNumber(dateKey) - dayNumber(today);
  if (difference === 0) return `Today · ${formatDay(dateKey)}`;
  if (difference === 1) return `Tomorrow · ${formatDay(dateKey)}`;
  return formatDay(dateKey);
}
