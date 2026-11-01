import { UserModel } from '../models/user.js';

export class DuplicateEmailError extends Error {}

type NewUser = { name: string; email: string; passwordHash: string };

export async function createUser(data: NewUser) {
  try {
    return await UserModel.create(data);
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 11000) {
      throw new DuplicateEmailError('Email already registered');
    }
    throw error;
  }
}
