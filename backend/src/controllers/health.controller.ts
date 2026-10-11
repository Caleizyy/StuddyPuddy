import type { Request, Response } from 'express';
import { getStatus } from '../services/health.service.js';

export function getHealth(req: Request, res: Response) {
  res.json(getStatus());
}
