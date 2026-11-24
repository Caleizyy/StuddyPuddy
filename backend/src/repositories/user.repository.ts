import { UserModel } from '../models/user.js';

export class DuplicateEmailError extends Error {}
export class DuplicateUsernameError extends Error {}

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
  return UserModel.findOne({ email }).select('+passwordHash +avatar');
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

// The user with the picture, for the profile and for "who am I". Other lookups skip the picture.
export function findUserWithAvatar(id: string) {
  return UserModel.findById(id).select('+avatar');
}

export async function updateProfileFields(
  id: string,
  fields: { name?: string; username?: string | null },
) {
  const set: { name?: string; username?: string } = {};
  if (fields.name !== undefined) set.name = fields.name;
  if (typeof fields.username === 'string') set.username = fields.username;
  const update = {
    ...(Object.keys(set).length > 0 && { $set: set }),
    ...(fields.username === null && { $unset: { username: '' } }),
  };
  try {
    await UserModel.updateOne({ _id: id }, update, { runValidators: true });
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 11000) {
      throw new DuplicateUsernameError('Username already taken');
    }
    throw error;
  }
}

export async function setAvatar(id: string, data: Buffer, contentType: string) {
  await UserModel.updateOne({ _id: id }, { $set: { avatar: { data, contentType } } });
}

export async function clearAvatar(id: string) {
  await UserModel.updateOne({ _id: id }, { $unset: { avatar: '' } });
}

type PreferenceChanges = Partial<{
  theme: string;
  weekStart: string;
  defaultPage: string;
  compact: boolean;
}>;

export async function setPreferences(id: string, changes: PreferenceChanges) {
  const set = Object.fromEntries(
    Object.entries(changes).map(([key, value]) => [`preferences.${key}`, value]),
  );
  await UserModel.updateOne({ _id: id }, { $set: set });
}

export function findUserByIdWithHash(id: string) {
  return UserModel.findById(id).select('+passwordHash');
}

// Saves a new password and signs out every other session by raising the token version.
// Returns the new version so the caller can issue a fresh token for the current session.
export async function replacePasswordHash(id: string, passwordHash: string) {
  const user = await UserModel.findOneAndUpdate(
    { _id: id },
    { $set: { passwordHash }, $inc: { tokenVersion: 1 } },
    { returnDocument: 'after' },
  );
  return user?.tokenVersion ?? null;
}

export async function raiseTokenVersion(id: string) {
  const user = await UserModel.findOneAndUpdate(
    { _id: id },
    { $inc: { tokenVersion: 1 } },
    { returnDocument: 'after' },
  );
  return user?.tokenVersion ?? null;
}

export async function deleteUser(id: string) {
  await UserModel.deleteOne({ _id: id });
}
