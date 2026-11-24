import type { TaskStep } from '@/api/tasks';

export const MAX_STEPS = 30;

export function stepProgress(steps: TaskStep[]) {
  const done = steps.filter((step) => step.done).length;
  const hoursLeft = steps.filter((step) => !step.done).reduce((sum, step) => sum + step.hours, 0);
  return { done, total: steps.length, hoursLeft };
}

export type StepRow = { id?: string; title: string; hours: string; done: boolean };

export function rowsFromSteps(steps: TaskStep[]): StepRow[] {
  return steps.map((step) => ({
    id: step.id,
    title: step.title,
    hours: String(step.hours),
    done: step.done,
  }));
}

// Checks what the person typed. Returns a message per row (or undefined when the row is fine).
export function validateRows(rows: StepRow[]): (string | undefined)[] {
  return rows.map((row) => {
    if (row.title.trim() === '') return 'Give the topic a name';
    if (row.title.trim().length > 80) return 'The name is too long';
    const hours = Number(row.hours);
    if (row.hours.trim() === '' || !Number.isFinite(hours)) return 'Enter the hours';
    if (hours < 0.25) return 'At least 0.25 hours';
    if (hours > 200) return 'At most 200 hours';
    if (!Number.isInteger(hours * 4)) return 'Use steps of 0.25 hours';
    return undefined;
  });
}
