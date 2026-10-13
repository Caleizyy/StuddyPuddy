import { createApp } from './app.js';
import { config } from './config/index.js';
import { connectDatabase } from './config/database.js';

try {
  await connectDatabase();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}

createApp().listen(config.port, () => console.log(`API listening on port ${config.port}`));
