import { Router } from 'express';
import healthRoutes from './health.routes.js';
import authRoutes from './auth.routes.js';
import taskRoutes from './task.routes.js';
import availabilityRoutes from './availability.routes.js';
import planRoutes from './plan.routes.js';

const router = Router();
router.use(healthRoutes);
router.use(authRoutes);
router.use(taskRoutes);
router.use(availabilityRoutes);
router.use(planRoutes);
export default router;
