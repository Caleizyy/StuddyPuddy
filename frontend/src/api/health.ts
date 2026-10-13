import { api } from './client';

export type HealthStatus = { status: string; uptime: number };

export const getHealth = () => api.get<HealthStatus>('/health');
