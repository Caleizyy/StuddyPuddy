import type { RequestHandler } from 'express';
import type { ZodType } from 'zod';
import { AppError } from '../utils/AppError.js';

export const validate =
  (schema: ZodType): RequestHandler =>
  (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const details = result.error.issues.map((i) => ({
        field: i.path.join('.'),
        message: i.message,
      }));
      return next(new AppError(400, 'VALIDATION_ERROR', 'Request validation failed', details));
    }
    req.body = result.data;
    next();
  };

// Same as validate, for the query string (?status=done). Express 5 makes req.query read-only,
// so the checked values are put on res.locals.query instead.
export const validateQuery =
  (schema: ZodType): RequestHandler =>
  (req, res, next) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      const details = result.error.issues.map((i) => ({
        field: i.path.join('.'),
        message: i.message,
      }));
      return next(new AppError(400, 'VALIDATION_ERROR', 'Invalid filter', details));
    }
    res.locals.query = result.data;
    next();
  };
