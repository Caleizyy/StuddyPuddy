import { Router } from 'express';
import { read, replace } from '../controllers/settings.controller.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { validate } from '../middleware/validate.js';
import { updateSettingsSchema } from '../schemas/settings.schema.js';

const router = Router();

router.use('/settings', requireAuth);

router.get('/settings', read);
router.put('/settings', validate(updateSettingsSchema), replace);

export default router;
