import { api } from './client';

// Counts only. The admin never sees anyone's tasks, hours or names.
export type Usage = { accounts: number; tasks: { open: number; done: number } };

export const getUsage = () => api.get<{ usage: Usage }>('/admin/usage');
