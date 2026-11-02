import { Router } from 'express';
import { register, me } from '../controllers/auth.controller.js';
import { validate } from '../middleware/validate.js';
import { registerSchema } from '../schemas/auth.schema.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { logout } from '../controllers/auth.controller.js';

const router = Router();
router.post('/auth/register', validate(registerSchema), register);
router.get('/auth/me', requireAuth, me);
router.post('/auth/logout', requireAuth, logout);
export default router;
