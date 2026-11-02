import 'dotenv/config';

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

const bcryptRounds = Number(process.env.BCRYPT_ROUNDS ?? 12);
const minBcryptRounds = process.env.NODE_ENV === 'test' ? 4 : 10;
if (!Number.isInteger(bcryptRounds) || bcryptRounds < minBcryptRounds) {
  throw new Error(`BCRYPT_ROUNDS must be an integer of at least ${minBcryptRounds}`);
}

const jwtSecret = required('JWT_SECRET');
if (jwtSecret.length < 32) {
  throw new Error('JWT_SECRET must be at least 32 characters');
}

function positiveIntFromEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined) return fallback;
  if (!/^[1-9]\d*$/.test(raw.trim())) {
    throw new Error(`${name} must be a positive whole number, got "${raw}"`);
  }
  return Number(raw);
}

export const config = {
  env: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 3000),
  mongoUri: required('MONGODB_URI'),
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  bcryptRounds,
  seedPassword: process.env.SEED_PASSWORD, // only used by `npm run seed`
  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  loginRateLimit: {
    windowMs: 15 * 60 * 1000,
    perIp: positiveIntFromEnv('LOGIN_LIMIT_PER_IP', 20),
    perEmail: positiveIntFromEnv('LOGIN_LIMIT_PER_EMAIL', 5),
  },
};
