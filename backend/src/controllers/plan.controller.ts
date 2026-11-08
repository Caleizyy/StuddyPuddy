import type { Request, Response } from 'express';
import { getPlanForUser } from '../services/plan.service.js';

export async function show(req: Request, res: Response) {
  res.json({ plan: await getPlanForUser(req.userId!, new Date()) });
}
