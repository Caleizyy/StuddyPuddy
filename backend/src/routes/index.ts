import { Router } from 'express';
import healthRoutes from './health.routes.js';
import { validate } from '../middleware/validate.js';
import { createTaskSchema } from '../schemas/task.schema.js';
import authRoutes from './auth.routes.js';

const router = Router();
router.use(healthRoutes);
router.post('/_demo', validate(createTaskSchema), (req, res) => res.json(req.body));
router.use(authRoutes);
export default router;
