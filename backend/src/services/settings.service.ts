import type { PlanSettings } from '../core/types.js';
import { findUserById, setMaxHoursPerDay } from '../repositories/user.repository.js';
import { AppError } from '../utils/AppError.js';
import type { UpdateSettingsInput } from '../schemas/settings.schema.js';

// The settings of one user, in the shape the planning core expects
export async function getSettings(userId: string): Promise<PlanSettings> {
  const user = await findUserById(userId);
  if (!user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  return { maxHoursPerDay: user.maxHoursPerDay ?? null };
}

export async function updateSettings(userId: string, input: UpdateSettingsInput) {
  await setMaxHoursPerDay(userId, input.maxHoursPerDay);
  return getSettings(userId);
}
