import api from '../lib/axios';
import type { Branch, BranchStatus } from '../types';

export interface BranchParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: BranchStatus;
}

export interface CreateBranchData {
  name: string;
  branchCode: string;
  branchType?: string;
  phone?: string;
  email?: string;
  city?: string;
  state?: string;
}

export type UpdateBranchData = Partial<CreateBranchData>;

export const branchesApi = {
  getAll: (params?: BranchParams): Promise<Branch[]> =>
    api.get('/branches', { params }).then((r) => r.data.data),

  getOne: (id: string): Promise<Branch> =>
    api.get(`/branches/${id}`).then((r) => r.data.data),

  create: (data: CreateBranchData): Promise<Branch> =>
    api.post('/branches', data).then((r) => r.data.data),

  update: (id: string, data: UpdateBranchData): Promise<Branch> =>
    api.put(`/branches/${id}`, data).then((r) => r.data.data),

  updateStatus: (id: string, status: BranchStatus): Promise<Branch> =>
    api.patch(`/branches/${id}/status`, { status }).then((r) => r.data.data),
};
