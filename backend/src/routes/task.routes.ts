import { Router } from 'express';
import {
  addTime,
  create,
  deleteTime,
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
  logTimeSchema,
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
router.post('/tasks/:id/time', validate(logTimeSchema), addTime);
router.delete('/tasks/:id/time/:entryId', deleteTime);
router.patch('/tasks/:id/steps/:stepId', validate(stepDoneSchema), patchStep);

export default router;
