import api from '../lib/axios';
import type { Member, Role, UserStatus, PaginatedResponse } from '../types';

export interface MemberParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: UserStatus;
  role?: Role;
  branchId?: string;
}

export interface CreateMemberData {
  fullName: string;
  phone: string;
  email?: string;
  role: Role;
  branchId: string;
  reportsToId?: string;
  codeNumber?: string;
  password: string;
}

export type UpdateMemberData = Partial<Omit<CreateMemberData, 'password'>>;

export const membersApi = {
  getAll: (params?: MemberParams): Promise<PaginatedResponse<Member>> =>
    api.get('/members', { params }).then((r) => r.data.data),

  getOne: (id: string): Promise<Member> =>
    api.get(`/members/${id}`).then((r) => r.data.data),

  getTeam: (): Promise<Member[]> =>
    api.get('/members/team').then((r) => r.data.data),

  getTeamMember: (id: string): Promise<Member> =>
    api.get(`/members/team/${id}`).then((r) => r.data.data),

  create: (data: CreateMemberData): Promise<Member> =>
    api.post('/members', data).then((r) => r.data.data),

  update: (id: string, data: UpdateMemberData): Promise<Member> =>
    api.put(`/members/${id}`, data).then((r) => r.data.data),

  updateStatus: (id: string, status: UserStatus): Promise<Member> =>
    api.patch(`/members/${id}/status`, { status }).then((r) => r.data.data),

  uploadPhoto: (id: string, file: File): Promise<Member> => {
    const form = new FormData();
    form.append('photo', file);
    return api.post(`/members/${id}/photo`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data.data);
  },
};
