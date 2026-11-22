import { countAllOpenTasks, countAllDoneTasks } from '../repositories/task.repository.js';
import { countAllUsers } from '../repositories/user.repository.js';

// Only numbers. The admin never gets names, emails, tasks or plans.
export async function getUsageSummary() {
  const [accounts, openTasks, doneTasks] = await Promise.all([
    countAllUsers(),
    countAllOpenTasks(),
    countAllDoneTasks(),
  ]);
  return { accounts, tasks: { open: openTasks, done: doneTasks } };
}
