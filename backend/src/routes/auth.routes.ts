import { Router } from 'express';
import { login, logout, me, register } from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { validate } from '../middleware/validate.js';
import { loginSchema, registerSchema } from '../schemas/auth.schema.js';
import { createLimiter } from '../middleware/rateLimit.js';
import { config } from '../config/index.js';

const { windowMs, perIp, perEmail } = config.loginRateLimit;
const loginIpLimiter = createLimiter({ windowMs, max: perIp });
const loginEmailLimiter = createLimiter({ windowMs, max: perEmail, keyBy: 'ip-and-email' });

const registerLimiter = createLimiter({
  windowMs: config.registerRateLimit.windowMs,
  max: config.registerRateLimit.perIp,
  countSuccesses: true,
  message: 'Too many accounts created from this address. Please try again later.',
});

const router = Router();
router.post('/auth/register', registerLimiter, validate(registerSchema), register);
router.post('/auth/login', loginIpLimiter, validate(loginSchema), loginEmailLimiter, login);
router.get('/auth/me', requireAuth, me);
router.post('/auth/logout', requireAuth, logout);

export default router;
