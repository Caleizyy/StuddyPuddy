import bcrypt from 'bcryptjs';
import { config } from '../config/index.js';
import { createUser, DuplicateEmailError } from '../repositories/user.repository.js';
import type { RegisterInput } from '../schemas/auth.schema.js';
import { AppError } from '../utils/AppError.js';

export async function registerUser(input: RegisterInput) {
  const passwordHash = await bcrypt.hash(input.password, config.bcryptRounds);

  try {
    const user = await createUser({ name: input.name, email: input.email, passwordHash });
    return { id: user.id, name: user.name, email: user.email, createdAt: user.createdAt };
  } catch (error) {
    if (error instanceof DuplicateEmailError) {
      const message = 'This email is already registered';
      throw new AppError(409, 'EMAIL_TAKEN', message, [{ field: 'email', message }]);
    }
    throw error;
  }
}
