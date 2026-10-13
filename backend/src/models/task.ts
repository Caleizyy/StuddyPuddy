import { Schema, model, type InferSchemaType } from 'mongoose';

export const TASK_STATUSES = ['todo', 'in_progress', 'done'] as const;

const taskSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    category: { type: String, required: true, trim: true },
    deadline: { type: Date, required: true },
    moduleCount: {
      type: Number,
      required: true,
      min: 1,
      validate: { validator: Number.isInteger, message: 'moduleCount must be a whole number' },
    },
    estimatedHours: { type: Number, required: true, min: 0.25 },
    status: { type: String, enum: TASK_STATUSES, default: 'todo' },
  },
  { timestamps: true },
);

export type Task = InferSchemaType<typeof taskSchema>;
taskSchema.index({ userId: 1, deadline: 1 });
export const TaskModel = model('Task', taskSchema);
