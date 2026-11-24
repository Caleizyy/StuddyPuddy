import express from 'express';
import type { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config/index.js';
import routes from './routes/index.js';
import { requireJsonBody, noStore } from './middleware/apiGuards.js';
import { createLimiter } from './middleware/rateLimit.js';
import { notFound } from './middleware/errorHandler.js';
import { errorHandler } from './middleware/errorHandler.js';

export function createApp(): Express {
  const app = express();
  if (config.trustProxyHops > 0) app.set('trust proxy', config.trustProxyHops);
  // Standard security headers (no X-Powered-By, no content sniffing, no framing, HSTS, ...)
  app.use(helmet());
  app.use(cors({ origin: config.corsOrigin }));
  // Bodies above 100 kB are refused with 413 before any of our code looks at them
  app.use(express.json({ limit: '100kb' }));
  // Only the health check is exempt: Docker and the host call it every few seconds
  app.use(
    '/api',
    createLimiter({
      windowMs: config.apiRateLimit.windowMs,
      max: config.apiRateLimit.perIp,
      countSuccesses: true,
      message: 'Too many requests. Please slow down and try again shortly.',
      skip: (req) => req.path === '/health',
    }),
    noStore,
    requireJsonBody,
  );
  app.use('/api', routes);
  app.use(notFound);
  app.use(errorHandler);
  return app;
}
