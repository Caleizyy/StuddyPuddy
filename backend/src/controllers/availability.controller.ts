import type { Request, Response } from 'express';
import { getHoursByWeekday, setHoursByWeekday } from '../services/availability.service.js';

export async function read(req: Request, res: Response) {
  res.json({ hoursByWeekday: await getHoursByWeekday(req.userId!) });
}

export async function replace(req: Request, res: Response) {
  res.json({ hoursByWeekday: await setHoursByWeekday(req.userId!, req.body.hoursByWeekday) });
}
