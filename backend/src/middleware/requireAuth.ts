import type { RequestHandler } from 'express';
import { findUserById } from '../repositories/user.repository.js';
import { AppError } from '../utils/AppError.js';
import { verifyToken } from '../utils/token.js';

export const requireAuth: RequestHandler = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  }

  let claims;
  try {
    claims = await verifyToken(header.slice('Bearer '.length));
  } catch {
    throw new AppError(401, 'UNAUTHORIZED', 'Invalid or expired token');
  }

  const user = await findUserById(claims.userId);
  if (!user || user.tokenVersion !== claims.tokenVersion) {
    throw new AppError(401, 'UNAUTHORIZED', 'Invalid or expired token');
  }

  req.userId = user.id;
  next();
};
