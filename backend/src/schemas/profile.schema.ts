import { z } from 'zod';

// Names that could be mistaken for the service itself or for a route
const RESERVED = new Set([
  'admin',
  'administrator',
  'root',
  'support',
  'help',
  'staff',
  'system',
  'moderator',
  'studdypuddy',
  'api',
  'me',
  'null',
  'undefined',
  'login',
  'logout',
  'register',
  'settings',
]);

export const usernameSchema = z
  .string({ error: 'Username must be text' })
  .trim()
  .toLowerCase()
  .regex(
    /^[a-z][a-z0-9_]{2,19}$/,
    'Use 3 to 20 characters: letters, digits or underscores, starting with a letter',
  )
  .refine((value) => !RESERVED.has(value), 'This username is not available');

export const updateProfileSchema = z
  .object({
    name: z
      .string({ error: 'Name must be text' })
      .trim()
      .min(1, 'Name is required')
      .max(80, 'Name must be at most 80 characters')
      .optional(),
    // null removes the username
    username: usernameSchema.nullable().optional(),
  })
  .refine((fields) => Object.keys(fields).length > 0, 'Send at least one field to change');

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
