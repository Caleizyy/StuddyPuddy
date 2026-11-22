import { z } from 'zod';
import { TASK_CATEGORIES, TASK_STATUSES } from '../models/task.js';

export const TASK_SORTS = ['deadline', '-deadline', 'title', '-hours', 'newest'] as const;

// What the task list accepts in the address (?status=open&q=lab). Everything is optional.
// Values must be plain strings, so nothing like ?status[$ne]=x can reach the database.
export const taskQuerySchema = z.object({
  // "open" means everything that is not done
  status: z.enum([...TASK_STATUSES, 'open'], { error: 'Unknown status' }).optional(),
  category: z.enum(TASK_CATEGORIES, { error: 'Unknown category' }).optional(),
  q: z.string().trim().max(80, 'Search text is too long').optional(),
  // A window for the deadline. The browser works out "this week" in the user's own time zone.
  dueAfter: z.iso.datetime({ error: 'dueAfter must be a valid date' }).optional(),
  dueBefore: z.iso.datetime({ error: 'dueBefore must be a valid date' }).optional(),
  sort: z.enum(TASK_SORTS, { error: 'Unknown sort' }).default('deadline'),
});

export type TaskQuery = z.infer<typeof taskQuerySchema>;
