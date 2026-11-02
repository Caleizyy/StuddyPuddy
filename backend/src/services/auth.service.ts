import bcrypt from 'bcryptjs';
import { config } from '../config/index.js';
import {
  createUser,
  DuplicateEmailError,
  findUserByEmailWithHash,
  bumpTokenVersion,
  findUserById,
} from '../repositories/user.repository.js';
import type { RegisterInput, LoginInput } from '../schemas/auth.schema.js';
import { AppError } from '../utils/AppError.js';
import { signToken } from '../utils/token.js';

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

// Compared against when the email is unknown, so the response time doesn't reveal which emails exist
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', config.bcryptRounds);

export async function loginUser(input: LoginInput) {
  const user = await findUserByEmailWithHash(input.email);
  const passwordMatches = await bcrypt.compare(input.password, user?.passwordHash ?? DUMMY_HASH);

  if (!user || !passwordMatches) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Incorrect email or password');
  }

  const token = await signToken(user.id, user.tokenVersion);
  return { token, user: { id: user.id, name: user.name, email: user.email } };
}

export async function getCurrentUser(userId: string) {
  const user = await findUserById(userId);
  if (!user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  return { id: user.id, name: user.name, email: user.email };
}

export async function logoutUser(userId: string) {
  await bumpTokenVersion(userId);
}
