import { z } from 'zod';

// A short list of the passwords attackers try first. It is not a full breach list, just the
// worst offenders that still pass a length rule.
const COMMON_PASSWORDS = new Set([
  '12345678',
  '123456789',
  '1234567890',
  '11111111',
  '00000000',
  '87654321',
  '123123123',
  'password',
  'password1',
  'password12',
  'password123',
  'passw0rd',
  'p@ssw0rd',
  'p@ssword',
  'qwertyui',
  'qwerty123',
  'qwertyuiop',
  'asdfghjk',
  'asdf1234',
  'abcd1234',
  'abc12345',
  'iloveyou',
  'iloveyou1',
  'letmein1',
  'welcome1',
  'welcome123',
  'admin123',
  'administrator',
  'changeme',
  'changeme1',
  'football',
  'baseball',
  'monkey123',
  'dragon123',
  'sunshine',
  'princess',
  'trustno1',
  'whatever',
  'master123',
  'student123',
  'studdypuddy',
]);

export const MAX_PASSWORD_BYTES = 72; // bcrypt ignores everything after 72 bytes

// Used wherever a person chooses a new password (register, change password)
export const newPasswordSchema = z
  .string({ error: 'Password is required' })
  .min(8, 'Password must be at least 8 characters')
  .refine((value) => Buffer.byteLength(value, 'utf8') <= MAX_PASSWORD_BYTES, 'Password is too long')
  .refine((value) => !COMMON_PASSWORDS.has(value.toLowerCase()), 'This password is too common');
