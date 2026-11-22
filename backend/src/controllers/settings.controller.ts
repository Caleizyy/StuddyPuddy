import type { Request, Response } from 'express';
import { getSettings, updateSettings } from '../services/settings.service.js';

export async function read(req: Request, res: Response) {
  res.json({ settings: await getSettings(req.userId!) });
}

export async function replace(req: Request, res: Response) {
  res.json({ settings: await updateSettings(req.userId!, req.body) });
}
