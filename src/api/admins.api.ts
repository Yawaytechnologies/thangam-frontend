import api from '../lib/axios';
import type { Admin, UserStatus, PaginatedResponse } from '../types';

export interface AdminParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: UserStatus;
  branchId?: string;
}

export interface CreateAdminData {
  fullName: string;
  phone: string;
  email?: string;
  branchId: string;
  password: string;
  status?: UserStatus;
}

export type UpdateAdminData = Partial<Omit<CreateAdminData, 'password'>>;

export const adminsApi = {
  getAll: (params?: AdminParams): Promise<PaginatedResponse<Admin>> =>
    api.get('/admins', { params }).then((r) => r.data.data),

  getOne: (id: string): Promise<Admin> =>
    api.get(`/admins/${id}`).then((r) => r.data.data),

  getProfile: (): Promise<Admin> =>
    api.get('/admin/profile').then((r) => r.data.data),

  create: (data: CreateAdminData): Promise<Admin> =>
    api.post('/admins', data).then((r) => r.data.data),

  update: (id: string, data: UpdateAdminData): Promise<Admin> =>
    api.put(`/admins/${id}`, data).then((r) => r.data.data),

  updateStatus: (id: string, status: UserStatus): Promise<Admin> =>
    api.patch(`/admins/${id}/status`, { status }).then((r) => r.data.data),

  delete: (id: string): Promise<void> =>
    api.delete(`/admins/${id}`).then(() => undefined),

  uploadPhoto: (id: string, file: File): Promise<Admin> => {
    const form = new FormData();
    form.append('photo', file);
    return api.post(`/admins/${id}/photo`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data.data);
  },
};
