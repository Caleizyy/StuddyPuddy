import { isObjectIdOrHexString, type HydratedDocument } from 'mongoose';
import { TaskModel, type Task } from '../models/task.js';

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
