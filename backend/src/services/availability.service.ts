import {
  listAvailabilityForUser,
  saveAvailabilityForUser,
} from '../repositories/availability.repository.js';

export async function getHoursByWeekday(userId: string): Promise<number[]> {
  const hoursByWeekday = [0, 0, 0, 0, 0, 0, 0];
  const entries = await listAvailabilityForUser(userId);
  for (const entry of entries) {
    hoursByWeekday[entry.weekday] = entry.hoursAvailable;
  }
  return hoursByWeekday;
}

export async function setHoursByWeekday(userId: string, hoursByWeekday: number[]) {
  await saveAvailabilityForUser(userId, hoursByWeekday);
  return getHoursByWeekday(userId);
}
