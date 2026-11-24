// Splitting a big task into topics. Pure: no database, no clock.
// The hours are shared in quarter hours so they add up exactly to the task's estimate.

export const MAX_STEPS = 30;
const QUARTER = 0.25;

export type StepDraft = { title: string; hours: number };

// One step per module, but never more steps than there are quarter hours to give them.
// The leftover quarters go to the first steps, one each, so no step differs from another by more
// than a quarter hour. Example: 5 h over 3 modules gives 1.75, 1.75 and 1.5.
export function splitIntoSteps(estimatedHours: number, moduleCount: number): StepDraft[] {
  const quarters = Math.round(estimatedHours / QUARTER);
  const count = Math.min(Math.max(1, Math.floor(moduleCount)), quarters, MAX_STEPS);
  if (count < 1) return [];

  const base = Math.floor(quarters / count);
  const extra = quarters % count;
  return Array.from({ length: count }, (_, index) => ({
    title: `Topic ${index + 1}`,
    hours: (base + (index < extra ? 1 : 0)) * QUARTER,
  }));
}
