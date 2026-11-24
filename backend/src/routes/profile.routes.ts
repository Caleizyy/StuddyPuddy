import express, { Router } from 'express';
import { deleteAvatar, putAvatar, show, update } from '../controllers/profile.controller.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { validate } from '../middleware/validate.js';
import { updateProfileSchema } from '../schemas/profile.schema.js';
import { MAX_AVATAR_BYTES } from '../services/profile.service.js';

const router = Router();
router.use('/profile', requireAuth);

router.get('/profile', show);
router.patch('/profile', validate(updateProfileSchema), update);

// The picture is sent as the raw file (not JSON). Only the three safe image types are read.
router.put(
  '/profile/avatar',
  express.raw({ type: ['image/jpeg', 'image/png', 'image/webp'], limit: MAX_AVATAR_BYTES }),
  putAvatar,
);
router.delete('/profile/avatar', deleteAvatar);

export default router;
