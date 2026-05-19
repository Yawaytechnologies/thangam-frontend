import api from '../lib/axios';

export interface TopPerformer {
  id: string;
  memberId: string;
  memberName: string;
  role: string;
  branchName?: string;
  metric: string;
  value: number;
  rank: number;
  isFrozen: boolean;
  createdAt: string;
}

export interface CreateTopPerformerData {
  memberId: string;
  metric: string;
  value: number;
  rank?: number;
}

export type UpdateTopPerformerData = Partial<CreateTopPerformerData>;

export interface ReorderTopPerformersData {
  orderedIds: string[];
}

export const topPerformersApi = {
  getAll: (): Promise<TopPerformer[]> =>
    api.get('/top-performers').then((r) => r.data.data),

  create: (data: CreateTopPerformerData): Promise<TopPerformer> =>
    api.post('/top-performers', data).then((r) => r.data.data),

  update: (id: string, data: UpdateTopPerformerData): Promise<TopPerformer> =>
    api.put(`/top-performers/${id}`, data).then((r) => r.data.data),

  remove: (id: string): Promise<void> =>
    api.delete(`/top-performers/${id}`).then(() => undefined),

  reorder: (data: ReorderTopPerformersData): Promise<TopPerformer[]> =>
    api.patch('/top-performers/reorder', data).then((r) => r.data.data),

  toggleFreeze: (id: string): Promise<TopPerformer> =>
    api.patch(`/top-performers/${id}/freeze`).then((r) => r.data.data),
};
