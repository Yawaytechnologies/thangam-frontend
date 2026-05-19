import api from '../lib/axios';

export interface SuperAdminStats {
  totalBranches: number;
  activeBranches: number;
  totalAdmins: number;
  activeAdmins: number;
  totalMembers: number;
  activeMembers: number;
  totalProperties: number;
  availableProperties: number;
  totalBookings: number;
  totalBillings: number;
  totalRevenue: number;
}

export interface AdminStats {
  totalMembers: number;
  activeMembers: number;
  totalProperties: number;
  availableProperties: number;
  totalBookings: number;
  activeBookings: number;
  totalBillings: number;
  totalRevenue: number;
  pendingRevenue: number;
}

export interface ActivityEntry {
  id: string;
  label: string;
  value: number | string;
  date: string;
  [key: string]: unknown;
}

export const dashboardApi = {
  getSuperAdminStats: (): Promise<SuperAdminStats> =>
    api.get('/dashboard/super-admin/stats').then((r) => r.data.data),

  getAdminStats: (): Promise<AdminStats> =>
    api.get('/dashboard/admin/stats').then((r) => r.data.data),

  getAdminMemberActivity: (): Promise<ActivityEntry[]> =>
    api.get('/dashboard/admin/member-activity').then((r) => r.data.data),

  getAdminBookingActivity: (): Promise<ActivityEntry[]> =>
    api.get('/dashboard/admin/booking-activity').then((r) => r.data.data),

  getAdminBillingActivity: (): Promise<ActivityEntry[]> =>
    api.get('/dashboard/admin/billing-activity').then((r) => r.data.data),
};
