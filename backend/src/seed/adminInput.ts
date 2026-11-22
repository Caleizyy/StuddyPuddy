import { z } from 'zod';

// The email and password for a new administrator, checked before anything touches the database.
// An admin is made by hand with a strong password, never through the app.
const adminSchema = z.object({
  email: z
    .string({ error: 'Set ADMIN_EMAIL' })
    .trim()
    .toLowerCase()
    .pipe(z.email('ADMIN_EMAIL is not a valid email address')),
  password: z
    .string({ error: 'Set ADMIN_PASSWORD' })
    .min(12, 'ADMIN_PASSWORD must be at least 12 characters')
    .refine((value) => Buffer.byteLength(value, 'utf8') <= 72, 'ADMIN_PASSWORD is too long'),
});

export type AdminInput = z.infer<typeof adminSchema>;

export function parseAdminInput(env: {
  ADMIN_EMAIL?: string;
  ADMIN_PASSWORD?: string;
}): AdminInput {
  const result = adminSchema.safeParse({ email: env.ADMIN_EMAIL, password: env.ADMIN_PASSWORD });
  if (!result.success) {
    throw new Error(result.error.issues.map((issue) => issue.message).join('. '));
  }
  return result.data;
}
