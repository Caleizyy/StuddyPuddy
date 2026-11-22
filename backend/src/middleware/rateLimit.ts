import type { Request } from 'express';
import { ipKeyGenerator, rateLimit } from 'express-rate-limit';
import { AppError } from '../utils/AppError.js';

type LimiterOptions = {
  windowMs: number;
  max: number;
  keyBy?: 'ip' | 'ip-and-email';
  // By default only failed requests count (login attempts). Set true to count every request.
  countSuccesses?: boolean;
  message?: string;
  skip?: (req: Request) => boolean;
};

const emailOf = (body: unknown): string => {
  const email = (body as { email?: unknown } | undefined)?.email;
  return typeof email === 'string' ? email.trim().toLowerCase() : '';
};

const LOGIN_MESSAGE = 'Too many login attempts. Please try again later.';

export function createLimiter({
  windowMs,
  max,
  keyBy = 'ip',
  countSuccesses = false,
  message = LOGIN_MESSAGE,
  skip,
}: LimiterOptions) {
  return rateLimit({
    windowMs,
    limit: max,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    skipSuccessfulRequests: !countSuccesses,
    ...(skip && { skip }),
    ...(keyBy === 'ip-and-email' && {
      keyGenerator: (req) => `${ipKeyGenerator(req.ip ?? '')}|${emailOf(req.body)}`,
    }),
    handler: (req, res, next) => {
      next(new AppError(429, 'TOO_MANY_REQUESTS', message));
    },
  });
}
