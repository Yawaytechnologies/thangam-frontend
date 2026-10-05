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
  membersToday?: number;
  joinedThisWeek?: number;
  joinedThisMonth?: number;
  totalDirectors?: number;
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
  propertyReferralCount?: number;
  directTeamCount?: number;
}

export interface AdminBookingActivity {
  id: string;
  bookingId: string;
  applicantName: string;
  projectName: string;
  plotNumber: string;
  edDdSmBmName?: string | null;
  referenceCode?: string | null;
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

export interface UserDashboardStats {
  totalNetwork: number;
  activeMembers: number;
  availableProperties: number;
  unreadNotifications: number;
}

export interface UserDashboardAlert {
  type: string;
  title: string;
  description: string;
  relatedId: string;
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

  getUserDashboard: (): Promise<UserDashboardStats> =>
    api.get('/user/dashboard').then((r) => r.data.data),

  getUserAlerts: (): Promise<UserDashboardAlert[]> =>
    api.get('/user/dashboard/alerts').then((r) => r.data.data),
};
