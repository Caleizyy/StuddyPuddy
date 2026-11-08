import type { Request, Response } from 'express';
import { registerUser, loginUser, getCurrentUser, logoutUser } from '../services/auth.service.js';

export async function register(req: Request, res: Response) {
  const user = await registerUser(req.body);
  res.status(201).json({ user });
}

export async function login(req: Request, res: Response) {
  const result = await loginUser(req.body);
  res.json(result);
}

export async function me(req: Request, res: Response) {
  res.json({ user: await getCurrentUser(req.userId!) });
}

export async function logout(req: Request, res: Response) {
  await logoutUser(req.userId!);
  res.status(204).end();
}
