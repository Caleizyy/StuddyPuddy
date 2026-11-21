import type { RequestHandler } from 'express';
import type { UserRole } from '../models/user.js';
import { AppError } from '../utils/AppError.js';

// Use after requireAuth. The role was read from the database for this request.
export const requireRole =
  (role: UserRole): RequestHandler =>
  (req, res, next) => {
    if (req.userRole !== role) {
      throw new AppError(403, 'FORBIDDEN', 'You do not have permission to do this');
    }
    next();
  };
