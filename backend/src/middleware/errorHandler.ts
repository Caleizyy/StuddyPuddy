import type { ErrorRequestHandler, RequestHandler } from 'express';
import { AppError } from '../utils/AppError.js';
import { config } from '../config/index.js';

export const notFound: RequestHandler = (req, res, next) => {
  next(new AppError(404, 'NOT_FOUND', `Route ${req.method} ${req.originalUrl} not found`));
};

// Express recognises error handlers by their four parameters, so `next` must stay.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  const status = err.status ?? 500;
  const isServerError = status >= 500;
  if (isServerError) console.error(err);

  res.status(status).json({
    error: {
      code: err.code ?? 'INTERNAL_ERROR',
      message: isServerError && config.env === 'production' ? 'Internal server error' : err.message,
      ...(err.details && { details: err.details }),
    },
  });
};
