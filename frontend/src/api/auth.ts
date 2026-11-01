import { api } from './client';

export type RegisterRequest = { name: string; email: string; password: string };
export type RegisteredUser = { id: string; name: string; email: string; createdAt: string };

export const registerUser = (data: RegisterRequest) =>
  api.post<{ user: RegisteredUser }>('/auth/register', data);
