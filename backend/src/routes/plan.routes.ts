import { Router } from 'express';
import { show } from '../controllers/plan.controller.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = Router();

router.use('/plan', requireAuth);
router.get('/plan', show);

export default router;
