import { PlanningInputError } from '../core/errors.js';
import { buildPlan } from '../core/plan.js';
import type { PlanTask } from '../core/types.js';
import { listTasksForUser } from '../repositories/task.repository.js';
import { AppError } from '../utils/AppError.js';
import { getHoursByWeekday } from './availability.service.js';

export async function getPlanForUser(userId: string, now: Date) {
  const [tasks, hoursByWeekday] = await Promise.all([
    listTasksForUser(userId),
    getHoursByWeekday(userId),
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
    const plan = buildPlan({ tasks: planTasks, hoursByWeekday, now });
    return { generatedAt: now, ...plan };
  } catch (error) {
    // The core says which field is wrong. We turn that into a normal API error.
    if (error instanceof PlanningInputError) {
      throw new AppError(422, 'PLANNING_INPUT_INVALID', error.message, [
        { field: error.field, message: error.message },
      ]);
    }
    throw error;
  }
}
