import { describe, expect, it } from 'vitest';
import { MAX_STEPS, splitIntoSteps } from './steps.js';

const total = (steps: { hours: number }[]) => steps.reduce((sum, step) => sum + step.hours, 0);

describe('splitIntoSteps', () => {
  it('gives each module a step when the hours divide evenly', () => {
    expect(splitIntoSteps(6, 3)).toEqual([
      { title: 'Topic 1', hours: 2 },
      { title: 'Topic 2', hours: 2 },
      { title: 'Topic 3', hours: 2 },
    ]);
  });

  it('shares leftover quarter hours one each, starting with the first step', () => {
    expect(splitIntoSteps(5, 3).map((step) => step.hours)).toEqual([1.75, 1.75, 1.5]);
  });

  it('always adds up exactly to the estimate, in quarter hours', () => {
    for (let quarters = 1; quarters <= 120; quarters++) {
      for (const modules of [1, 2, 3, 5, 7, 12, 40]) {
        const hours = quarters / 4;
        const steps = splitIntoSteps(hours, modules);
        expect(total(steps)).toBe(hours);
        for (const step of steps) {
          expect(step.hours).toBeGreaterThanOrEqual(0.25);
          expect(step.hours % 0.25).toBe(0);
        }
        const sizes = steps.map((step) => step.hours);
        expect(Math.max(...sizes) - Math.min(...sizes)).toBeLessThanOrEqual(0.25);
      }
    }
  });

  it('makes fewer steps rather than steps smaller than a quarter hour', () => {
    expect(splitIntoSteps(0.5, 6)).toEqual([
      { title: 'Topic 1', hours: 0.25 },
      { title: 'Topic 2', hours: 0.25 },
    ]);
  });

  it('is one step for a one-module task and never more than the limit', () => {
    expect(splitIntoSteps(3, 1)).toEqual([{ title: 'Topic 1', hours: 3 }]);
    expect(splitIntoSteps(200, 500)).toHaveLength(MAX_STEPS);
  });
});
