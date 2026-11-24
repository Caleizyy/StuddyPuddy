import { api } from './client';
import type { Preferences } from '@/lib/preferences';

export const savePreferences = (changes: Partial<Preferences>) =>
  api.patch<{ preferences: Preferences }>('/preferences', changes);

export const changePassword = (data: { currentPassword: string; newPassword: string }) =>
  api.post<{ token: string }>('/account/password', data);

export const signOutEverywhere = () =>
  api.post<{ token: string }>('/account/sign-out-everywhere', {});

export const exportMyData = () => api.get<unknown>('/account/export');

export const deleteMyAccount = (password: string) =>
  api.post<void>('/account/delete', { password });
