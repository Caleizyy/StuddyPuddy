import { Router } from 'express';
import {
  create,
  getOne,
  list,
  patchStep,
  putSteps,
  remove,
  split,
  update,
} from '../controllers/task.controller.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { validate, validateQuery } from '../middleware/validate.js';
import { taskQuerySchema } from '../schemas/taskQuery.schema.js';
import {
  createTaskSchema,
  replaceStepsSchema,
  stepDoneSchema,
  updateTaskSchema,
} from '../schemas/task.schema.js';

const router = Router();

router.use('/tasks', requireAuth);

router.get('/tasks', validateQuery(taskQuerySchema), list);
router.post('/tasks', validate(createTaskSchema), create);
router.get('/tasks/:id', getOne);
router.patch('/tasks/:id', validate(updateTaskSchema), update);
router.delete('/tasks/:id', remove);

router.post('/tasks/:id/steps/split', split);
router.put('/tasks/:id/steps', validate(replaceStepsSchema), putSteps);
router.patch('/tasks/:id/steps/:stepId', validate(stepDoneSchema), patchStep);

export default router;
