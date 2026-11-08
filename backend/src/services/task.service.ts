import {
  createTaskForUser,
  deleteTaskForUser,
  findTaskForUser,
  listTasksForUser,
  updateTaskForUser,
  type TaskRecord,
} from '../repositories/task.repository.js';
import type { CreateTaskInput, UpdateTaskInput } from '../schemas/task.schema.js';
import { AppError } from '../utils/AppError.js';
import { MAX_OPEN_TASKS } from '../core/validation.js';
import { countOpenTasksForUser } from '../repositories/task.repository.js';

function toTaskDto(task: TaskRecord) {
  return {
    id: task.id,
    title: task.title,
    category: task.category,
    deadline: task.deadline,
    moduleCount: task.moduleCount,
    estimatedHours: task.estimatedHours,
    status: task.status,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  };
}

function taskLimitReached() {
  return new AppError(
    409,
    'TASK_LIMIT_REACHED',
    `You can have at most ${MAX_OPEN_TASKS} unfinished tasks. Finish or delete some first.`,
  );
}

function taskNotFound() {
  return new AppError(404, 'TASK_NOT_FOUND', 'Task not found');
}

export async function listTasks(userId: string) {
  const tasks = await listTasksForUser(userId);
  return tasks.map(toTaskDto);
}

export async function getTask(userId: string, taskId: string) {
  const task = await findTaskForUser(userId, taskId);
  if (!task) throw taskNotFound();
  return toTaskDto(task);
}

export async function createTask(userId: string, input: CreateTaskInput) {
  if (input.status !== 'done' && (await countOpenTasksForUser(userId)) >= MAX_OPEN_TASKS) {
    throw taskLimitReached();
  }
  const task = await createTaskForUser(userId, input);
  return toTaskDto(task);
}

export async function updateTask(userId: string, taskId: string, input: UpdateTaskInput) {
  // Reopening a finished task adds to the unfinished count, so the limit applies
  if (input.status !== undefined && input.status !== 'done') {
    const current = await findTaskForUser(userId, taskId);
    if (current?.status === 'done' && (await countOpenTasksForUser(userId)) >= MAX_OPEN_TASKS) {
      throw taskLimitReached();
    }
  }

  const task = await updateTaskForUser(userId, taskId, input);
  if (!task) throw taskNotFound();
  return toTaskDto(task);
}

export async function deleteTask(userId: string, taskId: string) {
  const task = await deleteTaskForUser(userId, taskId);
  if (!task) throw taskNotFound();
}
