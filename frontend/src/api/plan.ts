import { api } from './client';

export type PriorityBand = 'high' | 'medium' | 'low';

export type PlanItem = {
  taskId: string;
  title: string;
  deadline: string;
  priorityScore: number;
  band: PriorityBand;
  atRisk: boolean;
  overdue: boolean;
  remainingDays: number;
  availableHours: number;
  scheduledHours: number;
  unscheduledHours: number;
};

export type ScheduleEntry = { date: string; taskId: string; title: string; hours: number };

export type PlanWarning = {
  taskId: string;
  title: string;
  unscheduledHours: number;
  message: string;
};

export type Plan = {
  generatedAt: string;
  items: PlanItem[]; // unfinished tasks, highest priority first
  schedule: ScheduleEntry[]; // study hours per day, ordered by date
  warnings: PlanWarning[];
  feasible: boolean;
};

export const getPlan = () => api.get<{ plan: Plan }>('/plan');
