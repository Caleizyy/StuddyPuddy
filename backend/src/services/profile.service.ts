import {
  clearAvatar,
  DuplicateUsernameError,
  findUserWithAvatar,
  setAvatar,
  updateProfileFields,
} from '../repositories/user.repository.js';
import { countDoneTasksForUser, countOpenTasksForUser } from '../repositories/task.repository.js';
import type { UpdateProfileInput } from '../schemas/profile.schema.js';
import { AppError } from '../utils/AppError.js';
import { detectImageType, toDataUrl } from '../utils/image.js';

export const MAX_AVATAR_BYTES = 100 * 1024;

export async function getProfile(userId: string) {
  const [user, open, done] = await Promise.all([
    findUserWithAvatar(userId),
    countOpenTasksForUser(userId),
    countDoneTasksForUser(userId),
  ]);
  if (!user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');

  return {
    id: user.id,
    name: user.name,
    username: user.username ?? null,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
    avatar: toDataUrl(user.avatar),
    stats: { openTasks: open, doneTasks: done },
  };
}

export async function updateProfile(userId: string, input: UpdateProfileInput) {
  try {
    await updateProfileFields(userId, input);
  } catch (error) {
    if (error instanceof DuplicateUsernameError) {
      const message = 'This username is already taken';
      throw new AppError(409, 'USERNAME_TAKEN', message, [{ field: 'username', message }]);
    }
    throw error;
  }
  return getProfile(userId);
}

export async function changeAvatar(userId: string, bytes: unknown) {
  if (!Buffer.isBuffer(bytes) || bytes.length === 0) {
    throw new AppError(400, 'INVALID_IMAGE', 'Send the picture as a JPEG, PNG or WebP file');
  }
  if (bytes.length > MAX_AVATAR_BYTES) {
    throw new AppError(413, 'PAYLOAD_TOO_LARGE', 'The picture must be at most 100 kB');
  }
  // The real type comes from the bytes, not from what the sender claims
  const contentType = detectImageType(bytes);
  if (!contentType) {
    throw new AppError(400, 'INVALID_IMAGE', 'Send the picture as a JPEG, PNG or WebP file');
  }
  await setAvatar(userId, bytes, contentType);
  return getProfile(userId);
}

export async function removeAvatar(userId: string) {
  await clearAvatar(userId);
  return getProfile(userId);
}
