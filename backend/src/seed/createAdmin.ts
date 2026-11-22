// Makes one administrator account by hand. Nobody can become an admin through the app.
//
//   ADMIN_EMAIL=you@example.com ADMIN_PASSWORD=a-long-password npm run create-admin -w backend
//
// It only ever creates a new account; it refuses to touch one that already exists.
import bcrypt from 'bcryptjs';
import { config } from '../config/index.js';
import { connectDatabase, disconnectDatabase } from '../config/database.js';
import { createAdminUser, DuplicateEmailError } from '../repositories/user.repository.js';
import { parseAdminInput } from './adminInput.js';

try {
  const { email, password } = parseAdminInput(process.env);
  await connectDatabase();
  const passwordHash = await bcrypt.hash(password, config.bcryptRounds);
  await createAdminUser({ name: 'Administrator', email, passwordHash });
  console.log(`Created the administrator ${email}`);
  await disconnectDatabase();
} catch (error) {
  if (error instanceof DuplicateEmailError) {
    console.error('That email already has an account. Nothing was changed.');
  } else {
    console.error(error instanceof Error ? error.message : error);
  }
  process.exit(1);
}
