import { z } from 'zod';
import { isQuarterHours } from '../core/validation.js';

const hoursForOneDay = z
  .number({ error: 'Hours must be a number' })
  .min(0, 'Hours cannot be negative')
  .max(24, 'A day has only 24 hours')
  .refine(isQuarterHours, 'Use steps of 0.25 hours');

// Seven numbers, Sunday first: [Sun, Mon, Tue, Wed, Thu, Fri, Sat]
export const setAvailabilitySchema = z.object({
  hoursByWeekday: z.array(hoursForOneDay).length(7, 'Send exactly 7 values, Sunday first'),
});

export type SetAvailabilityInput = z.infer<typeof setAvailabilitySchema>;
