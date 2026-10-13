import { Schema, model, type InferSchemaType } from 'mongoose';

const userSchema = new Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
  },
  { timestamps: true },
);

export type User = InferSchemaType<typeof userSchema>;
userSchema.index({ email: 1 }, { unique: true });
export const UserModel = model('User', userSchema);
