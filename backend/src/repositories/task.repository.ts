import { isObjectIdOrHexString, type HydratedDocument } from 'mongoose';
import type { QueryFilter } from 'mongoose';
import { TaskModel, type Task } from '../models/task.js';
import type { TaskQuery } from '../schemas/taskQuery.schema.js';

export type TaskRecord = HydratedDocument<Task>;
export type NewTaskFields = Pick<
  Task,
  'title' | 'category' | 'deadline' | 'moduleCount' | 'estimatedHours'
> &
  Partial<Pick<Task, 'status'>>;
export type TaskFields = Partial<NewTaskFields>;

export async function listTasksForUser(userId: string): Promise<TaskRecord[]> {
  return TaskModel.find({ userId }).sort({ deadline: 1 });
}

export async function findTaskForUser(userId: string, taskId: string): Promise<TaskRecord | null> {
  if (!isObjectIdOrHexString(taskId)) return null;
  return TaskModel.findOne({ _id: taskId, userId });
}

export async function createTaskForUser(
  userId: string,
  fields: NewTaskFields,
): Promise<TaskRecord> {
  return TaskModel.create({ ...fields, userId });
}

export async function updateTaskForUser(
  userId: string,
  taskId: string,
  fields: TaskFields,
): Promise<TaskRecord | null> {
  if (!isObjectIdOrHexString(taskId)) return null;
  return TaskModel.findOneAndUpdate({ _id: taskId, userId }, fields, {
    new: true,
    runValidators: true,
  });
}

export async function deleteTaskForUser(
  userId: string,
  taskId: string,
): Promise<TaskRecord | null> {
  if (!isObjectIdOrHexString(taskId)) return null;
  return TaskModel.findOneAndDelete({ _id: taskId, userId });
}

export async function countOpenTasksForUser(userId: string): Promise<number> {
  return TaskModel.countDocuments({ userId, status: { $ne: 'done' } });
}

export async function countDoneTasksForUser(userId: string): Promise<number> {
  return TaskModel.countDocuments({ userId, status: 'done' });
}

// The two functions below count tasks across all users. They return numbers only, never records,
// and exist for the admin usage summary. Every function that returns tasks stays scoped by user.
export async function countAllOpenTasks(): Promise<number> {
  return TaskModel.countDocuments({ status: { $ne: 'done' } });
}

export async function countAllDoneTasks(): Promise<number> {
  return TaskModel.countDocuments({ status: 'done' });
}

export async function deleteAllTasksForUser(userId: string): Promise<void> {
  await TaskModel.deleteMany({ userId });
}

const escapeRegex = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// The database filter for a task list. It always starts with the owner, so no combination of
// filters can ever reach another person's tasks.
export function buildTaskFilter(userId: string, query: Partial<TaskQuery>): QueryFilter<Task> {
  const filter: QueryFilter<Task> = { userId };
  if (query.status === 'open') filter.status = { $ne: 'done' };
  else if (query.status) filter.status = query.status;
  if (query.category) filter.category = query.category;
  if (query.q) filter.title = { $regex: escapeRegex(query.q), $options: 'i' };
  if (query.dueAfter || query.dueBefore) {
    filter.deadline = {
      ...(query.dueAfter && { $gte: new Date(query.dueAfter) }),
      ...(query.dueBefore && { $lt: new Date(query.dueBefore) }),
    };
  }
  return filter;
}

const SORTS: Record<NonNullable<TaskQuery['sort']>, Record<string, 1 | -1>> = {
  deadline: { deadline: 1 },
  '-deadline': { deadline: -1 },
  title: { title: 1 },
  '-hours': { estimatedHours: -1, deadline: 1 },
  newest: { createdAt: -1 },
};

const MAX_LISTED = 500;

export async function searchTasksForUser(
  userId: string,
  query: Partial<TaskQuery>,
): Promise<TaskRecord[]> {
  return TaskModel.find(buildTaskFilter(userId, query))
    .sort(SORTS[query.sort ?? 'deadline'])
    .limit(MAX_LISTED);
}

export async function countTasksForUser(userId: string): Promise<number> {
  return TaskModel.countDocuments({ userId });
}
