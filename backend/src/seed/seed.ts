import type { Types } from 'mongoose';
import { config } from '../config/index.js';
import { connectDatabase, disconnectDatabase } from '../config/database.js';
import { UserModel } from '../models/user.js';
import { TaskModel } from '../models/task.js';
import { AvailabilityModel } from '../models/availability.js';
import bcrypt from 'bcryptjs';
// ...inside seed(), before creating the users:
const passwordHash = await bcrypt.hash('password123', 10);

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

async function seed() {
  if (config.env === 'production') throw new Error('Refusing to seed in production');

  await connectDatabase();
  await Promise.all([UserModel.init(), TaskModel.init(), AvailabilityModel.init()]);
  await Promise.all([
    UserModel.deleteMany({}),
    TaskModel.deleteMany({}),
    AvailabilityModel.deleteMany({}),
  ]);

  const [normalUser, conflictUser] = await UserModel.create([
    { email: 'normal@example.com', name: 'Normal case', passwordHash: passwordHash },
    { email: 'conflict@example.com', name: 'Conflict case', passwordHash: passwordHash },
  ]);

  // Scenario 1, normal case: three tasks with different deadlines
  await TaskModel.create([
    {
      userId: normalUser._id,
      title: 'Programavimo laboratorinis',
      category: 'lab',
      deadline: dueIn(2),
      moduleCount: 1,
      estimatedHours: 3,
    },
    {
      userId: normalUser._id,
      title: 'Matematikos egzaminas',
      category: 'exam',
      deadline: dueIn(5),
      moduleCount: 6,
      estimatedHours: 6,
    },
    {
      userId: normalUser._id,
      title: 'Istorijos namų darbas',
      category: 'homework',
      deadline: dueIn(7),
      moduleCount: 1,
      estimatedHours: 2,
    },
  ]);

  // Scenario 2, boundary case: same deadline, 1 h and 8 h, only 4 h available until then
  const sharedDeadline = dueIn(1);
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
  ]);

  console.log('Seeded 2 users, 5 tasks and 14 availability entries');
}

try {
  await seed();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await disconnectDatabase();
}
