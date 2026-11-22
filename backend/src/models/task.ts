import { Schema, model, type InferSchemaType } from 'mongoose';

export const TASK_STATUSES = ['todo', 'in_progress', 'done'] as const;
export const TASK_CATEGORIES = ['homework', 'exam', 'quiz', 'lab'] as const;

// One topic of a bigger task. It has its own _id so a single step can be ticked off.
const stepSchema = new Schema({
  title: { type: String, required: true, trim: true, maxlength: 80 },
  hours: { type: Number, required: true, min: 0.25, max: 200 },
  done: { type: Boolean, default: false },
});

const taskSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    category: { type: String, required: true, enum: TASK_CATEGORIES },
    deadline: { type: Date, required: true },
    moduleCount: {
      type: Number,
      required: true,
      min: 1,
      validate: { validator: Number.isInteger, message: 'moduleCount must be a whole number' },
    },
    estimatedHours: { type: Number, required: true, min: 0.25, max: 200 },
    status: { type: String, enum: TASK_STATUSES, default: 'todo' },
    steps: { type: [stepSchema], default: [] },
  },
  { timestamps: true },
);

export type Task = InferSchemaType<typeof taskSchema>;
taskSchema.index({ userId: 1, deadline: 1 });
export const TaskModel = model('Task', taskSchema);
