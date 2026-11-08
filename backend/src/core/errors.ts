export class PlanningInputError extends Error {
  readonly field: string;
  readonly taskId?: string; // set when the problem is in one specific task

  constructor(field: string, message: string, taskId?: string) {
    super(message);
    this.name = 'PlanningInputError';
    this.field = field;
    this.taskId = taskId;
  }
}
