import type { Request, Response } from 'express';
import { registerUser } from '../services/auth.service.js';

export async function register(req: Request, res: Response) {
  const user = await registerUser(req.body);
  res.status(201).json({ user });
}
