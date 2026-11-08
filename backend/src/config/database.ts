import mongoose from 'mongoose';
import { config } from './index.js';

export async function connectDatabase(): Promise<void> {
  try {
    await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 5000 });
    console.log('MongoDB connected');
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Could not connect to MongoDB. Check MONGODB_URI in backend/.env and that the database is reachable. Reason: ${reason}`,
      { cause: error },
    );
  }
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
}
