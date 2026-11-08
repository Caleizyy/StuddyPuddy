const MS_PER_DAY = 24 * 60 * 60 * 1000;

function utcDay(date: Date): number {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

// Whole calendar days from today until the deadline (UTC days, the same way the planner counts)
export function daysUntil(deadlineIso: string, now: Date = new Date()): number {
  return (utcDay(new Date(deadlineIso)) - utcDay(now)) / MS_PER_DAY;
}

// Deadlines are stored as noon UTC, so we show the UTC date
export function formatDeadline(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export function describeDeadline(iso: string): { label: string; overdue: boolean } {
  const days = daysUntil(iso);
  if (days < 0) {
    return { label: `Overdue by ${-days} ${days === -1 ? 'day' : 'days'}`, overdue: true };
  }
  if (days === 0) return { label: 'Due today', overdue: false };
  if (days === 1) return { label: 'Due tomorrow', overdue: false };
  return { label: `${days} days left`, overdue: false };
}
