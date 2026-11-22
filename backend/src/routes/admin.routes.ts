import { Router } from 'express';
import { usage } from '../controllers/admin.controller.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireRole } from '../middleware/requireRole.js';

const router = Router();

// Logged in first, then the role check. A normal user gets 403 here.
router.use('/admin', requireAuth, requireRole('admin'));
router.get('/admin/usage', usage);

export default router;
