import type { Request, Response } from 'express';
import {
  changeAvatar,
  getProfile,
  removeAvatar,
  updateProfile,
} from '../services/profile.service.js';

export async function show(req: Request, res: Response) {
  res.json({ profile: await getProfile(req.userId!) });
}

export async function update(req: Request, res: Response) {
  res.json({ profile: await updateProfile(req.userId!, req.body) });
}

export async function putAvatar(req: Request, res: Response) {
  res.json({ profile: await changeAvatar(req.userId!, req.body) });
}

export async function deleteAvatar(req: Request, res: Response) {
  res.json({ profile: await removeAvatar(req.userId!) });
}
