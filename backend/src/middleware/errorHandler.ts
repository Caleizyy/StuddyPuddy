import type { ErrorRequestHandler, RequestHandler } from 'express';
import { AppError } from '../utils/AppError.js';
import { config } from '../config/index.js';

export const notFound: RequestHandler = (req, res, next) => {
  next(new AppError(404, 'NOT_FOUND', `Route ${req.method} ${req.originalUrl} not found`));
};

// Express recognises error handlers by their four parameters, so `next` must stay.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  const known = err instanceof AppError;
  const status = err.status ?? 500;
  const isServerError = status >= 500;
  if (isServerError) console.error(err);

  // Your own errors keep their code. Other 4xx errors (for example bad JSON) are the client's fault.
  const code = known ? err.code : isServerError ? 'INTERNAL_ERROR' : 'BAD_REQUEST';

  res.status(status).json({
    error: {
      code,
      message:
        isServerError && (!known || config.env === 'production')
          ? 'Internal server error'
          : err.message,
      ...(known && err.details ? { details: err.details } : {}),
    },
  });
};
