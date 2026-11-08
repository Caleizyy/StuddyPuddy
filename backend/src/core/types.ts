export type TaskStatus = 'todo' | 'in_progress' | 'done';
export type PriorityBand = 'high' | 'medium' | 'low';

export type PlanTask = {
  id: string;
  title: string;
  deadline: Date;
  estimatedHours: number;
  createdAt: Date;
  status: TaskStatus;
};

export type TaskAssessment = {
  remainingDays: number;
  availableHours: number;
  score: number;
  band: PriorityBand;
  atRisk: boolean;
  overdue: boolean;
};

export type Ranked = { task: PlanTask; assessment: TaskAssessment };

export type PlanItem = {
  taskId: string;
  title: string;
  deadline: Date;
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
  items: PlanItem[]; // unfinished tasks, highest priority first
  schedule: ScheduleEntry[]; // study hours per day
  warnings: PlanWarning[];
  feasible: boolean;
};
