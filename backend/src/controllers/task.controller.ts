import type { Request, Response } from 'express';
import {
  createTask,
  deleteTask,
  getTask,
  listTasks,
  updateTask,
} from '../services/task.service.js';

// The :id from the URL. The types allow a list of strings, so we take the first one
function taskIdFrom(req: Request): string {
  const id = req.params.id;
  return Array.isArray(id) ? id[0] : id;
}

export async function list(req: Request, res: Response) {
  res.json({ tasks: await listTasks(req.userId!) });
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
