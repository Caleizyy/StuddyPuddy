const MS_PER_DAY = 86_400_000;

// All day arithmetic uses UTC calendar days, so results never depend on the server's time zone
export function startOfUtcDay(date: Date): number {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

export function daysBetween(from: Date, to: Date): number {
  return Math.round((startOfUtcDay(to) - startOfUtcDay(from)) / MS_PER_DAY);
}

export function addDays(base: Date, days: number): Date {
  return new Date(startOfUtcDay(base) + days * MS_PER_DAY);
}

export function dateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}
