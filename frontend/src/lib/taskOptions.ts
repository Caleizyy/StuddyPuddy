export const TASK_CATEGORIES = ['homework', 'exam', 'quiz', 'lab'] as const;
export const TASK_STATUSES = ['todo', 'in_progress', 'done'] as const;

export type TaskCategory = (typeof TASK_CATEGORIES)[number];
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const CATEGORY_LABELS: Record<TaskCategory, string> = {
  homework: 'Homework',
  exam: 'Exam',
  quiz: 'Quiz',
  lab: 'Lab',
};

export const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'Not completed',
  in_progress: 'In progress',
  done: 'Completed',
};

// The coloured bar on the side of a task, one colour per kind of task
export const CATEGORY_STRIPE: Record<TaskCategory, string> = {
  homework: 'bg-cat-homework',
  exam: 'bg-cat-exam',
  quiz: 'bg-cat-quiz',
  lab: 'bg-cat-lab',
};
