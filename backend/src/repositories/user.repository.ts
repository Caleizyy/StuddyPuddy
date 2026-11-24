import { UserModel } from '../models/user.js';

export class DuplicateEmailError extends Error {}

type NewUser = { name: string; email: string; passwordHash: string };

async function insertUser(data: NewUser, role?: 'admin') {
  try {
    return await UserModel.create(role ? { ...data, role } : data);
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 11000) {
      throw new DuplicateEmailError('Email already registered');
    }
    throw error;
  }
}

export const createUser = (data: NewUser) => insertUser(data);

// Only used by the create-admin command; the app itself has no way to make an admin
export const createAdminUser = (data: NewUser) => insertUser(data, 'admin');

export function findUserByEmailWithHash(email: string) {
  return UserModel.findOne({ email }).select('+passwordHash');
}

export function findUserById(id: string) {
  return UserModel.findById(id);
}

export async function setMaxHoursPerDay(id: string, maxHoursPerDay: number | null) {
  await UserModel.updateOne({ _id: id }, { $set: { maxHoursPerDay } });
}

// Counts every account. Used only by the admin usage summary, which returns numbers and nothing else.
export function countAllUsers() {
  return UserModel.countDocuments();
}

export async function bumpTokenVersion(id: string) {
  await UserModel.updateOne({ _id: id }, { $inc: { tokenVersion: 1 } });
}
