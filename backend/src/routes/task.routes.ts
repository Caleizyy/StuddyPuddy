import { Router } from 'express';
import { create, getOne, list, remove, update } from '../controllers/task.controller.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { validate } from '../middleware/validate.js';
import { createTaskSchema, updateTaskSchema } from '../schemas/task.schema.js';

const router = Router();

router.use('/tasks', requireAuth);

router.get('/tasks', list);
router.post('/tasks', validate(createTaskSchema), create);
router.get('/tasks/:id', getOne);
router.patch('/tasks/:id', validate(updateTaskSchema), update);
router.delete('/tasks/:id', remove);

export default router;
