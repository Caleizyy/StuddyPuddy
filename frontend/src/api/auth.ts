import { api } from './client';
import type { Preferences } from '@/lib/preferences';

export type RegisterRequest = { name: string; email: string; password: string };
export type RegisteredUser = { id: string; name: string; email: string; createdAt: string };
export type UserRole = 'user' | 'admin';
export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  username: string | null;
  avatar: string | null;
  preferences: Preferences;
};
export type LoginRequest = { email: string; password: string };

export const registerUser = (data: RegisterRequest) =>
  api.post<{ user: RegisteredUser }>('/auth/register', data);

export const loginUser = (data: LoginRequest) =>
  api.post<{ token: string; user: AuthUser }>('/auth/login', data);

export const getCurrentUser = () => api.get<{ user: AuthUser }>('/auth/me');

export const logoutUser = () => api.post<void>('/auth/logout', {});
