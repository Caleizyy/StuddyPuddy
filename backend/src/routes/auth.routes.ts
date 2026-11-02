import { Router } from 'express';
import { login, logout, me, register } from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { validate } from '../middleware/validate.js';
import { loginSchema, registerSchema } from '../schemas/auth.schema.js';
import { createLimiter } from '../middleware/rateLimit.js';
import { config } from '../config/index.js';

const { windowMs, perIp, perEmail } = config.loginRateLimit;
const loginLimiters = [
  createLimiter({ windowMs, max: perIp }),
  createLimiter({ windowMs, max: perEmail, keyBy: 'email' }),
];
const router = Router();
router.post('/auth/register', validate(registerSchema), register);
router.post('/auth/login', ...loginLimiters, validate(loginSchema), login);
router.get('/auth/me', requireAuth, me);
router.post('/auth/logout', requireAuth, logout);

export default router;
