import { z } from 'zod';
import { TASK_CATEGORIES, TASK_STATUSES } from '../models/task.js';
import { MAX_STEPS } from '../core/steps.js';
import { isQuarterHours, MAX_TASK_HOURS } from '../core/validation.js';

export const createTaskSchema = z.object({
  title: z.string({ error: 'Title is required' }).trim().min(1, 'Title is required').max(120),
  category: z.enum(TASK_CATEGORIES, { error: 'Pick a valid category' }),
  // Must look like 2026-12-01T20:00:00.000Z. Turned into a real Date here.
  deadline: z.iso
    .datetime({ error: 'Deadline must be a valid date' })
    .transform((value) => new Date(value)),
  moduleCount: z.number({ error: 'Module count is required' }).int().min(1),
  estimatedHours: z
    .number({ error: 'Estimated hours is required' })
    .min(0.25, 'At least 0.25 hours')
    .max(MAX_TASK_HOURS, `At most ${MAX_TASK_HOURS} hours`)
    .refine(isQuarterHours, 'Use steps of 0.25 hours'),
  status: z.enum(TASK_STATUSES).optional(),
});

// Editing: every field is optional, and a task can also change status (this is how "done" works)
export const updateTaskSchema = createTaskSchema
  .partial()
  .refine((fields) => Object.keys(fields).length > 0, 'Send at least one field to change');

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;

const objectId = z.string().regex(/^[a-f0-9]{24}$/i, 'Not a valid id');

export const replaceStepsSchema = z.object({
  steps: z
    .array(
      z.object({
        id: objectId.optional(),
        title: z.string({ error: 'Title is required' }).trim().min(1, 'Title is required').max(80),
        hours: z
          .number({ error: 'Hours are required' })
          .min(0.25, 'At least 0.25 hours')
          .max(MAX_TASK_HOURS, `At most ${MAX_TASK_HOURS} hours`)
          .refine(isQuarterHours, 'Use steps of 0.25 hours'),
        done: z.boolean().default(false),
      }),
    )
    .max(MAX_STEPS, `At most ${MAX_STEPS} topics`),
});

export const stepDoneSchema = z.object({ done: z.boolean({ error: 'Send done: true or false' }) });

export type ReplaceStepsInput = z.infer<typeof replaceStepsSchema>;
export type StepDoneInput = z.infer<typeof stepDoneSchema>;
