import { api } from './client';

// maxHoursPerDay is the personal daily study limit; null means no limit
export type Settings = { maxHoursPerDay: number | null };

export const getSettings = () => api.get<{ settings: Settings }>('/settings');

export const saveSettings = (settings: Settings) =>
  api.put<{ settings: Settings }>('/settings', settings);
