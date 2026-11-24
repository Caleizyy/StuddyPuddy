import { z } from 'zod';
import { DEFAULT_PAGES, THEMES, WEEK_STARTS } from '../models/user.js';
import { newPasswordSchema } from './password.js';

// Only the fields that are sent change; anything else in the body is dropped
export const updatePreferencesSchema = z
  .object({
    theme: z.enum(THEMES),
    weekStart: z.enum(WEEK_STARTS),
    defaultPage: z.enum(DEFAULT_PAGES),
    compact: z.boolean(),
  })
  .partial()
  .refine((value) => Object.values(value).some((entry) => entry !== undefined), {
    message: 'Send at least one preference to change',
  });

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Enter your current password'),
  newPassword: newPasswordSchema,
});

export const deleteAccountSchema = z.object({
  password: z.string().min(1, 'Enter your password to confirm'),
});

export type UpdatePreferencesInput = z.infer<typeof updatePreferencesSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type DeleteAccountInput = z.infer<typeof deleteAccountSchema>;
