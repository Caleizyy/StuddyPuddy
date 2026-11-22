import type { RequestHandler } from 'express';
import { AppError } from '../utils/AppError.js';

const METHODS_WITH_BODY = new Set(['POST', 'PUT', 'PATCH']);

// A request that carries a body must say it is JSON. This turns away form posts from other
// sites (which can only send form types without a browser permission check) and garbage.
export const requireJsonBody: RequestHandler = (req, res, next) => {
  const hasBody =
    Number(req.headers['content-length'] ?? 0) > 0 ||
    req.headers['transfer-encoding'] !== undefined;
  if (METHODS_WITH_BODY.has(req.method) && hasBody && !req.is('application/json')) {
    return next(
      new AppError(415, 'UNSUPPORTED_MEDIA_TYPE', 'Send the request body as application/json'),
    );
  }
  next();
};

// Answers hold private data (tasks, plans, profile). Browsers and proxies must not keep copies.
export const noStore: RequestHandler = (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  next();
};
