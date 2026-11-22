import { Schema, model, type InferSchemaType } from 'mongoose';

// 'user' is everyone who registers. 'admin' is set by hand in the database or by the seed, never by the app.
export const USER_ROLES = ['user', 'admin'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const THEMES = ['system', 'light', 'dark'] as const;
export const WEEK_STARTS = ['monday', 'sunday'] as const;
export const DEFAULT_PAGES = ['dashboard', 'tasks', 'plan'] as const;

// A small picture the user chose. Kept out of normal queries (select: false) because the user is
// loaded on every request and the picture is only needed on the profile and on sign-in.
const avatarSchema = new Schema(
  { data: { type: Buffer, required: true }, contentType: { type: String, required: true } },
  { _id: false },
);

const userSchema = new Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    tokenVersion: { type: Number, default: 0 },
    role: { type: String, enum: USER_ROLES, default: 'user' },
    // A public handle chosen by the user: lowercase letters, digits and underscores. Optional.
    username: { type: String, lowercase: true, trim: true },
    avatar: { type: avatarSchema, select: false },
    // How the app looks and where it opens. Applied by the browser; the server only stores it.
    preferences: {
      theme: { type: String, enum: THEMES, default: 'system' },
      weekStart: { type: String, enum: WEEK_STARTS, default: 'monday' },
      defaultPage: { type: String, enum: DEFAULT_PAGES, default: 'dashboard' },
      compact: { type: Boolean, default: false },
    },
    // This client's own setting: never plan more than this many hours on one day. null means no limit.
    maxHoursPerDay: { type: Number, min: 0.25, max: 24, default: null },
  },
  { timestamps: true },
);

export type User = InferSchemaType<typeof userSchema>;
userSchema.index({ email: 1 }, { unique: true });
// Usernames are unique, but most accounts have none yet, so only real values are indexed
userSchema.index(
  { username: 1 },
  { unique: true, partialFilterExpression: { username: { $type: 'string' } } },
);
export const UserModel = model('User', userSchema);
