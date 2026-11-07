import { api } from './client';
import type { TaskCategory, TaskStatus } from '@/lib/taskOptions';

export type Task = {
  id: string;
  title: string;
  category: TaskCategory;
  deadline: string; // ISO date text, for example 2026-12-01T12:00:00.000Z
  moduleCount: number;
  estimatedHours: number;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
};

export type NewTask = Omit<Task, 'id' | 'createdAt' | 'updatedAt'>;

export const listTasks = () => api.get<{ tasks: Task[] }>('/tasks');

export const createTask = (data: NewTask) => api.post<{ task: Task }>('/tasks', data);
