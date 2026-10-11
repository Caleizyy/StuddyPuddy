import { z } from 'zod';

export const createTaskSchema = z.object({
  title: z.string().min(1).max(120),
  deadline: z.iso.datetime(),
  estimatedHours: z.number().positive().max(100),
});
