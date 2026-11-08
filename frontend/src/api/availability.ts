import { api } from './client';

export type WeeklyHours = number[];

export const getAvailability = () => api.get<{ hoursByWeekday: WeeklyHours }>('/availability');

export const saveAvailability = (hoursByWeekday: WeeklyHours) =>
  api.put<{ hoursByWeekday: WeeklyHours }>('/availability', { hoursByWeekday });
