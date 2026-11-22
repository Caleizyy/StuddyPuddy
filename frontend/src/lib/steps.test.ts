import { describe, expect, it } from 'vitest';
import { stepProgress, validateRows } from './steps';

const step = (hours: number, done: boolean) => ({ id: `${hours}${done}`, title: 't', hours, done });

describe('stepProgress', () => {
  it('counts finished topics and the hours still to do', () => {
    expect(stepProgress([step(2, true), step(1.5, false), step(1, false)])).toEqual({
      done: 1,
      total: 3,
      hoursLeft: 2.5,
    });
    expect(stepProgress([])).toEqual({ done: 0, total: 0, hoursLeft: 0 });
  });
});

describe('validateRows', () => {
  const row = (title: string, hours: string) => ({ title, hours, done: false });
  it('accepts good rows', () => {
    expect(validateRows([row('Limits', '1.5'), row('Series', '2')])).toEqual([
      undefined,
      undefined,
    ]);
  });
  it('explains each problem on its own row', () => {
    expect(validateRows([row('', '1')])[0]).toBe('Give the topic a name');
    expect(validateRows([row('x', '')])[0]).toBe('Enter the hours');
    expect(validateRows([row('x', 'abc')])[0]).toBe('Enter the hours');
    expect(validateRows([row('x', '0.1')])[0]).toBe('At least 0.25 hours');
    expect(validateRows([row('x', '201')])[0]).toBe('At most 200 hours');
    expect(validateRows([row('x', '1.1')])[0]).toBe('Use steps of 0.25 hours');
    expect(validateRows([row('x'.repeat(81), '1')])[0]).toBe('The name is too long');
  });
});
