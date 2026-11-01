import { Router } from 'express';
import { register } from '../controllers/auth.controller.js';
import { validate } from '../middleware/validate.js';
import { registerSchema } from '../schemas/auth.schema.js';

const router = Router();
router.post('/auth/register', validate(registerSchema), register);
export default router;
