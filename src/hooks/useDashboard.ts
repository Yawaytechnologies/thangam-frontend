import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../api/dashboard.api';

export function useSuperAdminStats() {
  return useQuery({
    queryKey: ['dashboard', 'super-admin', 'stats'],
    queryFn: () => dashboardApi.getSuperAdminStats(),
  });
}

export function useAdminStats() {
  return useQuery({
    queryKey: ['dashboard', 'admin', 'stats'],
    queryFn: () => dashboardApi.getAdminStats(),
  });
}

export function useAdminMemberActivity() {
  return useQuery({
    queryKey: ['dashboard', 'admin', 'member-activity'],
    queryFn: () => dashboardApi.getAdminMemberActivity(),
  });
}

export function useAdminBookingActivity() {
  return useQuery({
    queryKey: ['dashboard', 'admin', 'booking-activity'],
    queryFn: () => dashboardApi.getAdminBookingActivity(),
  });
}

export function useAdminBillingActivity() {
  return useQuery({
    queryKey: ['dashboard', 'admin', 'billing-activity'],
    queryFn: () => dashboardApi.getAdminBillingActivity(),
  });
}
