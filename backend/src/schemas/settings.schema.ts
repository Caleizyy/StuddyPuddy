import { z } from 'zod';
import { MAX_DAILY_LIMIT, MIN_DAILY_LIMIT } from '../core/settings.js';
import { isQuarterHours } from '../core/validation.js';

// null removes the limit. Any other field in the body (for example "role") is dropped.
export const updateSettingsSchema = z.object({
  maxHoursPerDay: z
    .number({ error: 'The daily limit must be a number, or null for no limit' })
    .min(MIN_DAILY_LIMIT, `The daily limit must be at least ${MIN_DAILY_LIMIT} hours`)
    .max(MAX_DAILY_LIMIT, `A day has only ${MAX_DAILY_LIMIT} hours`)
    .refine(isQuarterHours, 'Use steps of 0.25 hours')
    .nullable(),
});

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
