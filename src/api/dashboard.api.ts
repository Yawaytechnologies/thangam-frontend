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
  newMembersThisMonth: number;
  activeBookings: number;
  pendingBilling: number;
  completedSettlements: number;
}

export interface AdminMemberActivity {
  id: string;
  memberId: string;
  fullName: string;
  role: string;
  createdAt: string;
  status: string;
}

export interface AdminBookingActivity {
  id: string;
  bookingId: string;
  applicantName: string;
  projectName: string;
  plotNumber: string;
  status: string;
  bookingDate: string;
}

export interface AdminBillingActivity {
  id: string;
  billingId: string;
  buyerName: string;
  amountInNumbers: number;
  totalBalance: number;
  status: string;
}

export const dashboardApi = {
  getSuperAdminStats: (): Promise<SuperAdminStats> =>
    api.get('/super-admin/dashboard/stats').then((r) => r.data.data),

  getAdminStats: (): Promise<AdminStats> =>
    api.get('/admin/dashboard/stats').then((r) => r.data.data),

  getAdminMemberActivity: (): Promise<AdminMemberActivity[]> =>
    api.get('/admin/dashboard/member-activity').then((r) => r.data.data),

  getAdminBookingActivity: (): Promise<AdminBookingActivity[]> =>
    api.get('/admin/dashboard/booking-activity').then((r) => r.data.data),

  getAdminBillingActivity: (): Promise<AdminBillingActivity[]> =>
    api.get('/admin/dashboard/billing-activity').then((r) => r.data.data),
};
