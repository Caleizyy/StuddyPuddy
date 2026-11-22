// Makes many different inputs from a fixed starting number, so the same run gives the same
// inputs every time (a failing case can be reproduced) and nothing depends on chance.

import { addDays } from '../core/dates.js';
import type { PlanTask } from '../core/types.js';
import type { PlanCase } from './invariants.js';
import { NOW } from './scenarios.js';

// A tiny well-known random number generator (mulberry32). Same seed, same numbers.
export function makeRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const quarterHours = (random: () => number, min: number, max: number) =>
  min + Math.floor(random() * ((max - min) * 4 + 1)) / 4;
const whole = (random: () => number, min: number, max: number) =>
  min + Math.floor(random() * (max - min + 1));

export function randomCase(seed: number): PlanCase {
  const random = makeRandom(seed);

  // Some weekdays are free (0 h), others up to 12 h
  const hoursByWeekday = Array.from({ length: 7 }, () =>
    random() < 0.2 ? 0 : quarterHours(random, 0.25, 12),
  );

  const taskCount = whole(random, 0, 15);
  const tasks: PlanTask[] = Array.from({ length: taskCount }, (_, index) => ({
    id: `r${index}`,
    title: `Task ${index}`,
    // from 3 days overdue to 60 days away; some due today
    deadline: addDays(NOW, whole(random, -3, 60)),
    estimatedHours: quarterHours(random, 0.25, 40),
    createdAt: new Date(Date.UTC(2026, 10, 1, 0, index)),
    status: random() < 0.15 ? 'done' : random() < 0.5 ? 'in_progress' : 'todo',
  }));

  const settings = random() < 0.5 ? { maxHoursPerDay: quarterHours(random, 0.25, 24) } : undefined;
  return { tasks, hoursByWeekday, now: NOW, settings };
}
