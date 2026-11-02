import { ipKeyGenerator, rateLimit } from 'express-rate-limit';
import { AppError } from '../utils/AppError.js';

type LimiterOptions = { windowMs: number; max: number; keyBy?: 'ip' | 'ip-and-email' };

const emailOf = (body: unknown): string => {
  const email = (body as { email?: unknown } | undefined)?.email;
  return typeof email === 'string' ? email.trim().toLowerCase() : '';
};

export function createLimiter({ windowMs, max, keyBy = 'ip' }: LimiterOptions) {
  return rateLimit({
    windowMs,
    limit: max,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    skipSuccessfulRequests: true, // only failed attempts count towards the limit
    ...(keyBy === 'ip-and-email' && {
      keyGenerator: (req) => `${ipKeyGenerator(req.ip ?? '')}|${emailOf(req.body)}`,
    }),
    handler: (req, res, next) => {
      next(
        new AppError(429, 'TOO_MANY_REQUESTS', 'Too many login attempts. Please try again later.'),
      );
    },
  });
}
