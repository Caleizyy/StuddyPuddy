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

export const config = {
  env: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 3000),
  mongoUri: required('MONGODB_URI'),
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  bcryptRounds,
  // secrets (e.g. a token secret) join this object when authentication is built
};
