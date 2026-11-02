import { rateLimit } from 'express-rate-limit';
import { AppError } from '../utils/AppError.js';

type LimiterOptions = { windowMs: number; max: number; keyBy?: 'ip' | 'email' };

export function createLimiter({ windowMs, max, keyBy = 'ip' }: LimiterOptions) {
  return rateLimit({
    windowMs,
    limit: max,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    skipSuccessfulRequests: true, // only failed attempts count towards the limit
    ...(keyBy === 'email' && {
      keyGenerator: (req) =>
        String(req.body?.email ?? '')
          .trim()
          .toLowerCase(),
    }),
    handler: (req, res, next) => {
      next(
        new AppError(429, 'TOO_MANY_REQUESTS', 'Too many login attempts. Please try again later.'),
      );
    },
  });
}
