import { z } from 'zod';
import { newPasswordSchema } from './password.js';

export const registerSchema = z
  .object({
    name: z
      .string({ error: 'Name is required' })
      .trim()
      .min(1, 'Name is required')
      .max(80, 'Name must be at most 80 characters'),
    email: z
      .string({ error: 'Email is required' })
      .trim()
      .toLowerCase()
      .pipe(z.email('Enter a valid email address')),
    password: newPasswordSchema,
  })
  .refine((value) => value.password.toLowerCase() !== value.email, {
    path: ['password'],
    message: 'The password must not be your email address',
  });

export const loginSchema = z.object({
  email: z.string({ error: 'Email is required' }).trim().toLowerCase().min(1, 'Email is required'),
  password: z.string({ error: 'Password is required' }).min(1, 'Password is required'),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
