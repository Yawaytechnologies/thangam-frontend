import api from '../lib/axios';

export interface DbTopPerformerMember {
  id: string;
  memberId: string;
  fullName: string;
  role: string;
  status: string;
  branch?: { id: string; name: string } | null;
}

export interface DbTopPerformer {
  id: string;
  memberId: string;
  role: string;
  rank: number;
  displayOrder: number;
  taggedCount: number;
  propertiesCount: number;
  isActive: boolean;
  createdAt: string;
  member: DbTopPerformerMember;
}

export interface TopPerformersResponse {
  froze: boolean;
  performers: { role: string; items: DbTopPerformer[] }[];
}

export interface CreateTopPerformerData {
  memberId: string;
  role: string;
  rank: number;
  displayOrder: number;
  taggedCount?: number;
  propertiesCount?: number;
}

export type UpdateTopPerformerData = Partial<CreateTopPerformerData>;

export interface ReorderTopPerformerItem {
  id: string;
  rank: number;
  displayOrder: number;
}

export interface ReorderTopPerformersData {
  items: ReorderTopPerformerItem[];
}

export const topPerformersApi = {
  getAll: (): Promise<TopPerformersResponse> =>
    api.get('/super-admin/dashboard/top-performers').then((r) => r.data.data),

  create: (data: CreateTopPerformerData): Promise<DbTopPerformer> =>
    api.post('/top-performers', data).then((r) => r.data.data),

  update: (id: string, data: UpdateTopPerformerData): Promise<DbTopPerformer> =>
    api.put(`/top-performers/${id}`, data).then((r) => r.data.data),

  remove: (id: string): Promise<void> =>
    api.delete(`/top-performers/${id}`).then(() => undefined),

  reorder: (data: ReorderTopPerformersData): Promise<void> =>
    api.patch('/top-performers/reorder', data).then(() => undefined),

  toggleFreeze: (frozen: boolean): Promise<{ frozen: boolean }> =>
    api.patch('/settings/top-performers/freeze', { frozen }).then((r) => r.data.data),
};
