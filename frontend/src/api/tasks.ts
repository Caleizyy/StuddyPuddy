import { api } from './client';
import { queryString, type TaskApiQuery } from '@/lib/taskFilters';
import type { TaskCategory, TaskStatus } from '@/lib/taskOptions';

export type TaskStep = { id: string; title: string; hours: number; done: boolean };
// A topic as it is sent when saving: new ones have no id yet
export type StepDraft = { id?: string; title: string; hours: number; done: boolean };

export type Task = {
  id: string;
  title: string;
  category: TaskCategory;
  deadline: string; // ISO date text, for example 2026-12-01T12:00:00.000Z
  moduleCount: number;
  estimatedHours: number;
  status: TaskStatus;
  steps: TaskStep[];
  createdAt: string;
  updatedAt: string;
};

export type NewTask = Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'steps'>;

export type TaskChanges = Partial<NewTask>;

export const updateTask = (id: string, changes: TaskChanges) =>
  api.patch<{ task: Task }>(`/tasks/${id}`, changes);

export const deleteTask = (id: string) => api.delete<void>(`/tasks/${id}`);

// total is every task the person has, so the page can show "3 of 12" while a filter is on
export const listTasks = (query: TaskApiQuery = {}) =>
  api.get<{ tasks: Task[]; total: number }>(`/tasks${queryString(query)}`);

export const createTask = (data: NewTask) => api.post<{ task: Task }>('/tasks', data);

export const splitTask = (id: string) => api.post<{ task: Task }>(`/tasks/${id}/steps/split`, {});

export const saveSteps = (id: string, steps: StepDraft[]) =>
  api.put<{ task: Task }>(`/tasks/${id}/steps`, { steps });

export const setStepDone = (taskId: string, stepId: string, done: boolean) =>
  api.patch<{ task: Task }>(`/tasks/${taskId}/steps/${stepId}`, { done });
