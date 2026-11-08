import express from 'express';
import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AppError } from '../utils/AppError.js';
import { errorHandler } from './errorHandler.js';

function appThatThrows(error: unknown) {
  const app = express();
  app.get('/boom', () => {
    throw error;
  });
  app.use(errorHandler);
  return app;
}

describe('error handler', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('hides the details of an unexpected error', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const response = await request(appThatThrows(new Error('secret database detail'))).get('/boom');

    expect(response.status).toBe(500);
    expect(response.body.error.code).toBe('INTERNAL_ERROR');
    expect(response.body.error.message).toBe('Internal server error');
    expect(JSON.stringify(response.body)).not.toContain('secret database detail');
  });

  it('keeps the status and message of one of our own client errors', async () => {
    const response = await request(
      appThatThrows(new AppError(404, 'TASK_NOT_FOUND', 'Task not found')),
    ).get('/boom');

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('TASK_NOT_FOUND');
    expect(response.body.error.message).toBe('Task not found');
  });

  it('masks the message of our own 5xx errors in production', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.stubEnv('NODE_ENV', 'production');
    vi.resetModules();
    const { errorHandler: productionHandler } = await import('./errorHandler.js');
    const { AppError: ProductionAppError } = await import('../utils/AppError.js');

    const app = express();
    app.get('/boom', () => {
      throw new ProductionAppError(503, 'SERVICE_DOWN', 'internal detail');
    });
    app.use(productionHandler);

    const response = await request(app).get('/boom');
    expect(response.status).toBe(503);
    expect(response.body.error.message).toBe('Internal server error');
  });
});
