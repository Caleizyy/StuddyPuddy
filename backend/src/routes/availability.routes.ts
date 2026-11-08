import { Router } from 'express';
import { read, replace } from '../controllers/availability.controller.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { validate } from '../middleware/validate.js';
import { setAvailabilitySchema } from '../schemas/availability.schema.js';

const router = Router();

router.use('/availability', requireAuth);

router.get('/availability', read);
router.put('/availability', validate(setAvailabilitySchema), replace);

export default router;
