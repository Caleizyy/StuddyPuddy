import type { Types } from 'mongoose';
import { config } from '../config/index.js';
import { connectDatabase, disconnectDatabase } from '../config/database.js';
import { UserModel } from '../models/user.js';
import { TaskModel } from '../models/task.js';
import { AvailabilityModel } from '../models/availability.js';
import bcrypt from 'bcryptjs';
import { assertSeedAllowed } from './guard.js';

// A deadline at the end of the day, `days` days from today
function dueIn(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(23, 59, 0, 0);
  return date;
}

// Two hours of study time on each of the seven weekdays
function twoHoursEveryDay(userId: Types.ObjectId) {
  return Array.from({ length: 7 }, (_, weekday) => ({ userId, weekday, hoursAvailable: 2 }));
}

// Scenario 1, normal case: three tasks with different deadlines
function normalCaseTasks(userId: Types.ObjectId) {
  return [
    {
      userId,
      title: 'Programavimo laboratorinis',
      category: 'lab' as const,
      deadline: dueIn(2),
      moduleCount: 1,
      estimatedHours: 3,
    },
    {
      userId,
      title: 'Matematikos egzaminas',
      category: 'exam' as const,
      deadline: dueIn(5),
      moduleCount: 6,
      estimatedHours: 6,
    },
    {
      userId,
      title: 'Istorijos namų darbas',
      category: 'homework' as const,
      deadline: dueIn(7),
      moduleCount: 1,
      estimatedHours: 2,
    },
  ];
}

async function seed() {
  assertSeedAllowed(config);
  if (!config.seedPassword) {
    throw new Error('Set SEED_PASSWORD in backend/.env to seed the test users');
  }
  const passwordHash = await bcrypt.hash(config.seedPassword, config.bcryptRounds);

  await connectDatabase();
  await Promise.all([UserModel.init(), TaskModel.init(), AvailabilityModel.init()]);
  await Promise.all([
    UserModel.deleteMany({}),
    TaskModel.deleteMany({}),
    AvailabilityModel.deleteMany({}),
  ]);

  const [normalUser, conflictUser, compareUser] = await UserModel.create([
    { email: 'normal@example.com', name: 'Normal case', passwordHash: passwordHash },
    { email: 'conflict@example.com', name: 'Conflict case', passwordHash: passwordHash },
    // Same tasks and hours as the normal user, to compare after one of them changes a setting
    { email: 'compare@example.com', name: 'Same tasks as normal', passwordHash: passwordHash },
  ]);
  // The only admin. The role can only be set here or by hand in the database, never through the app.
  await UserModel.create({
    email: 'admin@example.com',
    name: 'Admin',
    passwordHash: passwordHash,
    role: 'admin',
  });

  await TaskModel.create([...normalCaseTasks(normalUser._id), ...normalCaseTasks(compareUser._id)]);

  // Scenario 2, boundary case: same deadline, 1 h and 8 h, only 4 h available until then
  const sharedDeadline = dueIn(2);
  await TaskModel.create([
    {
      userId: conflictUser._id,
      title: 'Trumpa užduotis',
      category: 'homework',
      deadline: sharedDeadline,
      moduleCount: 1,
      estimatedHours: 1,
    },
    {
      userId: conflictUser._id,
      title: 'Ilga užduotis',
      category: 'homework',
      deadline: sharedDeadline,
      moduleCount: 1,
      estimatedHours: 8,
    },
  ]);

  await AvailabilityModel.create([
    ...twoHoursEveryDay(normalUser._id),
    ...twoHoursEveryDay(conflictUser._id),
    ...twoHoursEveryDay(compareUser._id),
  ]);

  console.log('Seeded 4 users (one of them an admin), 8 tasks and 21 availability entries');
}

try {
  await seed();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await disconnectDatabase();
}
