import type { Request, Response } from 'express';
import {
  createTask,
  deleteTask,
  getTask,
  listTasks,
  markStep,
  replaceSteps,
  splitTask,
  updateTask,
} from '../services/task.service.js';

// The :id from the URL. The types allow a list of strings, so we take the first one
function taskIdFrom(req: Request): string {
  const id = req.params.id;
  return Array.isArray(id) ? id[0] : id;
}

export async function list(req: Request, res: Response) {
  res.json(await listTasks(req.userId!, res.locals.query));
}

export async function getOne(req: Request, res: Response) {
  res.json({ task: await getTask(req.userId!, taskIdFrom(req)) });
}

export async function create(req: Request, res: Response) {
  res.status(201).json({ task: await createTask(req.userId!, req.body) });
}

export async function update(req: Request, res: Response) {
  res.json({ task: await updateTask(req.userId!, taskIdFrom(req), req.body) });
}

export async function remove(req: Request, res: Response) {
  await deleteTask(req.userId!, taskIdFrom(req));
  res.status(204).end();
}

export async function split(req: Request, res: Response) {
  res.status(201).json({ task: await splitTask(req.userId!, taskIdFrom(req)) });
}

export async function putSteps(req: Request, res: Response) {
  res.json({ task: await replaceSteps(req.userId!, taskIdFrom(req), req.body) });
}

export async function patchStep(req: Request, res: Response) {
  const stepId = Array.isArray(req.params.stepId) ? req.params.stepId[0] : req.params.stepId;
  res.json({ task: await markStep(req.userId!, taskIdFrom(req), stepId, req.body) });
}
