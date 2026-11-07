import { AvailabilityModel } from '../models/availability.js';

export async function listAvailabilityForUser(userId: string) {
  return AvailabilityModel.find({ userId });
}

export async function saveAvailabilityForUser(userId: string, hoursByWeekday: number[]) {
  await AvailabilityModel.bulkWrite(
    hoursByWeekday.map((hoursAvailable, weekday) => ({
      updateOne: {
        filter: { userId, weekday },
        update: { $set: { hoursAvailable } },
        upsert: true,
      },
    })),
  );
}
