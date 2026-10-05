import api from '../lib/axios';
import type { PaginatedResponse, Role, UserStatus } from '../types';

export interface DirectorBranchSummary {
  id: string;
  branchCode: string;
  name: string;
}

export interface DirectorReportingMember {
  id: string;
  memberId: string;
  fullName: string;
  role: Role;
}

export interface DirectorTeamMember {
  id: string;
  memberId: string;
  fullName: string;
  phone: string;
  email?: string | null;
  role: Role;
  status: UserStatus;
  reportsToId?: string | null;
  createdAt: string;
  branch: DirectorBranchSummary;
  reportsTo?: DirectorReportingMember | null;
  profilePhoto?: string | null;
  downlineCount: number;
}

export interface DirectorProfile extends DirectorTeamMember {
  lastLoginAt?: string | null;
}

export interface DirectorDashboard {
  profile: DirectorProfile;
  summary: {
    totalMembers: number;
    activeMembers: number;
    pendingMembers: number;
    inactiveMembers: number;
    joinedThisMonth: number;
  };
  roleCounts: {
    executiveDirectors: number;
    deputyDirectors: number;
    seniorManagers: number;
    businessManagers: number;
    agents: number;
  };
  directReports: DirectorTeamMember[];
  recentMembers: DirectorTeamMember[];
}

export interface DirectorTeamParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: Exclude<Role, 'SUPER_ADMIN' | 'ADMIN' | 'DIRECTOR'>;
  status?: UserStatus;
}

export interface DirectorTeamMemberDetails extends DirectorTeamMember {
  directReportCount: number;
  roleWiseDownlineCount: Partial<Record<Role, number>>;
}

export const directorApi = {
  getDashboard: (): Promise<DirectorDashboard> =>
    api.get('/director/dashboard').then((response) => response.data.data),

  getTeam: (params?: DirectorTeamParams): Promise<PaginatedResponse<DirectorTeamMember>> =>
    api.get('/director/team', { params }).then((response) => response.data.data),

  getTeamMember: (memberId: string): Promise<DirectorTeamMemberDetails> =>
    api.get(`/director/team/${memberId}`).then((response) => response.data.data),
};
