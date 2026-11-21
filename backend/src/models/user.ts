import { Schema, model, type InferSchemaType } from 'mongoose';

// 'user' is everyone who registers. 'admin' is set by hand in the database or by the seed, never by the app.
export const USER_ROLES = ['user', 'admin'] as const;
export type UserRole = (typeof USER_ROLES)[number];

const userSchema = new Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    tokenVersion: { type: Number, default: 0 },
    role: { type: String, enum: USER_ROLES, default: 'user' },
    // This client's own setting: never plan more than this many hours on one day. null means no limit.
    maxHoursPerDay: { type: Number, min: 0.25, max: 24, default: null },
  },
  { timestamps: true },
);

export type User = InferSchemaType<typeof userSchema>;
userSchema.index({ email: 1 }, { unique: true });
export const UserModel = model('User', userSchema);
