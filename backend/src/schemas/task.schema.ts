import { z } from 'zod';
import { TASK_CATEGORIES, TASK_STATUSES } from '../models/task.js';

// Hours must be in steps of 0.25, the same rule the planning core uses
const isQuarterHours = (value: number) => value % 0.25 === 0;

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
    .max(1000, 'At most 1000 hours')
    .refine(isQuarterHours, 'Use steps of 0.25 hours'),
});

// Editing: every field is optional, and a task can also change status (this is how "done" works)
export const updateTaskSchema = createTaskSchema
  .extend({ status: z.enum(TASK_STATUSES) })
  .partial()
  .refine((fields) => Object.keys(fields).length > 0, 'Send at least one field to change');

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
