import express from 'express';
import type { Express } from 'express';
import cors from 'cors';
import { config } from './config/index.js';
import routes from './routes/index.js';
import { notFound } from './middleware/errorHandler.js';
import { errorHandler } from './middleware/errorHandler.js';

export function createApp(): Express {
  const app = express();
  app.use(cors({ origin: config.corsOrigin }));
  app.use(express.json());
  app.use('/api', routes);
  app.use(notFound);
  app.use(errorHandler);
  return app;
}
