import bcrypt from 'bcryptjs';
import { config } from '../config/index.js';
import {
  listAvailabilityForUser,
  deleteAvailabilityForUser,
} from '../repositories/availability.repository.js';
import { deleteAllTasksForUser, listTasksForUser } from '../repositories/task.repository.js';
import {
  deleteUser,
  findUserById,
  findUserByIdWithHash,
  raiseTokenVersion,
  replacePasswordHash,
  setPreferences,
} from '../repositories/user.repository.js';
import type {
  ChangePasswordInput,
  DeleteAccountInput,
  UpdatePreferencesInput,
} from '../schemas/account.schema.js';
import { AppError } from '../utils/AppError.js';
import { toPreferences } from '../utils/preferences.js';
import { signToken } from '../utils/token.js';

async function requireUser(userId: string) {
  const user = await findUserById(userId);
  if (!user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  return user;
}

export async function getPreferences(userId: string) {
  return toPreferences((await requireUser(userId)).preferences);
}

export async function updatePreferences(userId: string, input: UpdatePreferencesInput) {
  await setPreferences(userId, input);
  return getPreferences(userId);
}

// 400, not 401: a wrong password here must not look like an expired session to the browser
async function checkPassword(userId: string, password: string) {
  const user = await findUserByIdWithHash(userId);
  if (!user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  if (!(await bcrypt.compare(password, user.passwordHash))) {
    const message = 'That password is not correct';
    throw new AppError(400, 'INVALID_PASSWORD', message, [{ field: 'password', message }]);
  }
  return user;
}

export async function changePassword(userId: string, input: ChangePasswordInput) {
  const user = await checkPassword(userId, input.currentPassword);
  if (input.currentPassword === input.newPassword) {
    const message = 'Choose a password you have not used just now';
    throw new AppError(400, 'VALIDATION_ERROR', message, [{ field: 'newPassword', message }]);
  }
  if (input.newPassword.toLowerCase() === user.email) {
    const message = 'The password cannot be your email';
    throw new AppError(400, 'VALIDATION_ERROR', message, [{ field: 'newPassword', message }]);
  }

  const passwordHash = await bcrypt.hash(input.newPassword, config.bcryptRounds);
  const version = await replacePasswordHash(userId, passwordHash);
  if (version === null) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  // Every older token stops working; this one keeps the current browser signed in
  return { token: await signToken(userId, version) };
}

export async function signOutEverywhere(userId: string) {
  const version = await raiseTokenVersion(userId);
  if (version === null) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  return { token: await signToken(userId, version) };
}

// Everything the app holds about this person, readable without our software. No password hash.
export async function exportData(userId: string) {
  const [user, tasks, availability] = await Promise.all([
    requireUser(userId),
    listTasksForUser(userId),
    listAvailabilityForUser(userId),
  ]);
  return {
    exportedAt: new Date().toISOString(),
    account: {
      name: user.name,
      username: user.username ?? null,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      maxHoursPerDay: user.maxHoursPerDay ?? null,
      preferences: toPreferences(user.preferences),
    },
    tasks: tasks.map((task) => ({
      title: task.title,
      category: task.category,
      deadline: task.deadline,
      moduleCount: task.moduleCount,
      estimatedHours: task.estimatedHours,
      status: task.status,
    })),
    availability: availability
      .map((row) => ({ weekday: row.weekday, hoursAvailable: row.hoursAvailable }))
      .sort((a, b) => a.weekday - b.weekday),
  };
}

export async function deleteAccount(userId: string, input: DeleteAccountInput) {
  await checkPassword(userId, input.password);
  // Data first, account last: if this stops half way the person can still sign in and retry
  await deleteAllTasksForUser(userId);
  await deleteAvailabilityForUser(userId);
  await deleteUser(userId);
}
