import type { Request, Response } from 'express';
import {
  changePassword,
  deleteAccount,
  exportData,
  getPreferences,
  signOutEverywhere,
  updatePreferences,
} from '../services/account.service.js';

export async function showPreferences(req: Request, res: Response) {
  res.json({ preferences: await getPreferences(req.userId!) });
}

export async function patchPreferences(req: Request, res: Response) {
  res.json({ preferences: await updatePreferences(req.userId!, req.body) });
}

export async function postPassword(req: Request, res: Response) {
  res.json(await changePassword(req.userId!, req.body));
}

export async function postSignOutEverywhere(req: Request, res: Response) {
  res.json(await signOutEverywhere(req.userId!));
}

export async function getExport(req: Request, res: Response) {
  const data = await exportData(req.userId!);
  res.setHeader('Content-Disposition', 'attachment; filename="studdypuddy-data.json"');
  res.json(data);
}

export async function postDelete(req: Request, res: Response) {
  await deleteAccount(req.userId!, req.body);
  res.status(204).end();
}
