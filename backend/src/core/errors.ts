// Core's own error type: it must not import AppError (that belongs to the HTTP layer)
export class PlanningInputError extends Error {
  readonly field: string;

  constructor(field: string, message: string) {
    super(message);
    this.name = 'PlanningInputError';
    this.field = field;
  }
}
