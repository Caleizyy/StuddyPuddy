import { api } from './client';
import type { UserRole } from './auth';

export type Profile = {
  id: string;
  name: string;
  username: string | null;
  email: string;
  role: UserRole;
  createdAt: string;
  avatar: string | null;
  stats: { openTasks: number; doneTasks: number };
};

export type ProfileChanges = { name?: string; username?: string | null };

export const getProfile = () => api.get<{ profile: Profile }>('/profile');

export const updateProfile = (changes: ProfileChanges) =>
  api.patch<{ profile: Profile }>('/profile', changes);

export const uploadAvatar = (image: Blob) =>
  api.putFile<{ profile: Profile }>('/profile/avatar', image);

export const removeAvatar = () => api.delete<{ profile: Profile }>('/profile/avatar');
