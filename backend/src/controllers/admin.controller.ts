import type { Request, Response } from 'express';
import { getUsageSummary } from '../services/admin.service.js';

export async function usage(req: Request, res: Response) {
  res.json({ usage: await getUsageSummary() });
}
