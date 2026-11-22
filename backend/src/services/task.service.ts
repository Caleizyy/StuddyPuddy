import {
  createTaskForUser,
  deleteTaskForUser,
  findTaskForUser,
  searchTasksForUser,
  setStepDoneForUser,
  setStepsForUser,
  addTimeEntryForUser,
  removeTimeEntryForUser,
  countTasksForUser,
  updateTaskForUser,
  type TaskRecord,
} from '../repositories/task.repository.js';
import type { TaskQuery } from '../schemas/taskQuery.schema.js';
import { splitIntoSteps } from '../core/steps.js';
import { MAX_TIME_ENTRIES } from '../models/task.js';
import type {
  CreateTaskInput,
  LogTimeInput,
  ReplaceStepsInput,
  StepDoneInput,
  UpdateTaskInput,
} from '../schemas/task.schema.js';
import { AppError } from '../utils/AppError.js';
import { MAX_OPEN_TASKS } from '../core/validation.js';
import { countOpenTasksForUser } from '../repositories/task.repository.js';

// Quarter hours add up exactly in floating point, so this sum is exact
export function loggedHoursOf(task: { timeEntries?: { hours: number }[] | null }): number {
  return (task.timeEntries ?? []).reduce((sum, entry) => sum + entry.hours, 0);
}

function toTaskDto(task: TaskRecord) {
  return {
    id: task.id,
    title: task.title,
    category: task.category,
    deadline: task.deadline,
    moduleCount: task.moduleCount,
    estimatedHours: task.estimatedHours,
    status: task.status,
    steps: (task.steps ?? []).map((step) => ({
      id: String(step._id),
      title: step.title,
      hours: step.hours,
      done: step.done ?? false,
    })),
    loggedHours: loggedHoursOf(task),
    timeEntries: [...(task.timeEntries ?? [])]
      .map((entry) => ({
        id: String(entry._id),
        date: entry.date,
        hours: entry.hours,
        note: entry.note ?? null,
      }))
      .sort((a, b) => b.date.localeCompare(a.date)),
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

// total is every task the user has, so the page can say "3 of 12" when a filter is on
export async function listTasks(userId: string, query: Partial<TaskQuery> = {}) {
  const [tasks, total] = await Promise.all([
    searchTasksForUser(userId, query),
    countTasksForUser(userId),
  ]);
  return { tasks: tasks.map(toTaskDto), total };
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

// Makes one step per module with the estimate shared between them. Only for a task without steps,
// so a person's own topics are never overwritten by accident.
export async function splitTask(userId: string, taskId: string) {
  const task = await findTaskForUser(userId, taskId);
  if (!task) throw taskNotFound();
  if ((task.steps ?? []).length > 0) {
    throw new AppError(409, 'STEPS_EXIST', 'This task already has topics');
  }
  const drafts = splitIntoSteps(task.estimatedHours, task.moduleCount);
  const updated = await setStepsForUser(
    userId,
    taskId,
    drafts.map((draft) => ({ ...draft, done: false })),
  );
  if (!updated) throw taskNotFound();
  return toTaskDto(updated);
}

export async function replaceSteps(userId: string, taskId: string, input: ReplaceStepsInput) {
  const task = await setStepsForUser(userId, taskId, input.steps);
  if (!task) throw taskNotFound();
  return toTaskDto(task);
}

export async function markStep(
  userId: string,
  taskId: string,
  stepId: string,
  input: StepDoneInput,
) {
  const task = await setStepDoneForUser(userId, taskId, stepId, input.done);
  if (!task) throw new AppError(404, 'STEP_NOT_FOUND', 'Topic not found');
  return toTaskDto(task);
}

function timeLogFull() {
  return new AppError(
    409,
    'TIME_LOG_FULL',
    `A task can have at most ${MAX_TIME_ENTRIES} time entries`,
  );
}

export async function logTime(userId: string, taskId: string, input: LogTimeInput) {
  const current = await findTaskForUser(userId, taskId);
  if (!current) throw taskNotFound();
  if ((current.timeEntries ?? []).length >= MAX_TIME_ENTRIES) {
    throw timeLogFull();
  }
  const task = await addTimeEntryForUser(userId, taskId, {
    date: input.date ?? new Date().toISOString().slice(0, 10),
    hours: input.hours,
    ...(input.note && { note: input.note }),
  });
  // The task was just found, so no match means two requests filled the last place at once
  if (!task) throw timeLogFull();
  return toTaskDto(task);
}

export async function removeTime(userId: string, taskId: string, entryId: string) {
  const task = await removeTimeEntryForUser(userId, taskId, entryId);
  if (!task) throw new AppError(404, 'TIME_ENTRY_NOT_FOUND', 'Time entry not found');
  return toTaskDto(task);
}
