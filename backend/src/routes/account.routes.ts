import { Router } from 'express';
import {
  getExport,
  patchPreferences,
  postDelete,
  postPassword,
  postSignOutEverywhere,
  showPreferences,
} from '../controllers/account.controller.js';
import { createLimiter } from '../middleware/rateLimit.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { validate } from '../middleware/validate.js';
import {
  changePasswordSchema,
  deleteAccountSchema,
  updatePreferencesSchema,
} from '../schemas/account.schema.js';

const router = Router();

router.use(['/preferences', '/account'], requireAuth);

// Both ask for the current password, so a stolen session cannot be used to guess it quickly.
// Only wrong passwords count towards the limit.
const passwordGuess = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many wrong passwords. Please try again later.',
});

router.get('/preferences', showPreferences);
router.patch('/preferences', validate(updatePreferencesSchema), patchPreferences);

router.post('/account/password', passwordGuess, validate(changePasswordSchema), postPassword);
router.post('/account/sign-out-everywhere', postSignOutEverywhere);
router.get('/account/export', getExport);
router.post('/account/delete', passwordGuess, validate(deleteAccountSchema), postDelete);

export default router;
