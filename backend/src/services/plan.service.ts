import { PlanningInputError } from '../core/errors.js';
import { buildPlan } from '../core/plan.js';
import type { PlanTask } from '../core/types.js';
import { listTasksForUser } from '../repositories/task.repository.js';
import { AppError } from '../utils/AppError.js';
import { getHoursByWeekday } from './availability.service.js';
import { getSettings } from './settings.service.js';

export async function getPlanForUser(userId: string, now: Date) {
  const [tasks, hoursByWeekday, settings] = await Promise.all([
    listTasksForUser(userId),
    getHoursByWeekday(userId),
    getSettings(userId),
  ]);

  // The core works with plain objects, not database records
  const planTasks: PlanTask[] = tasks.map((task) => ({
    id: task.id,
    title: task.title,
    deadline: task.deadline,
    estimatedHours: task.estimatedHours,
    createdAt: task.createdAt,
    status: task.status ?? 'todo',
  }));

  try {
    const plan = buildPlan({ tasks: planTasks, hoursByWeekday, now, settings });
    // Each item also says which topic to work on next, taken from the task's own steps
    const stepsByTask = new Map(tasks.map((task) => [task.id, task.steps ?? []]));
    const items = plan.items.map((item) => {
      const steps = stepsByTask.get(item.taskId) ?? [];
      return {
        ...item,
        nextStep: steps.find((step) => !step.done)?.title ?? null,
        stepsDone: steps.filter((step) => step.done).length,
        stepsTotal: steps.length,
      };
    });
    return { generatedAt: now, settings, ...plan, items };
  } catch (error) {
    // The core says which field is wrong. We turn that into a normal API error.
    if (error instanceof PlanningInputError) {
      throw new AppError(422, 'PLANNING_INPUT_INVALID', error.message, [
        { field: error.field, message: error.message, taskId: error.taskId },
      ]);
    }
    throw error;
  }
}
