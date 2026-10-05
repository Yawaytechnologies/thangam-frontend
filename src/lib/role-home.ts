import type { Role } from '../types';

const roleHomePaths: Record<Role, string> = {
  SUPER_ADMIN: '/super-admin/dashboard',
  ADMIN: '/admin/dashboard',
  DIRECTOR: '/director/dashboard',
  EXECUTIVE_DIRECTOR: '/executive-director/dashboard',
  DEPUTY_DIRECTOR: '/deputy-director/dashboard',
  SENIOR_MANAGER: '/senior-manager/dashboard',
  BUSINESS_MANAGER: '/business-manager/dashboard',
  AGENT: '/agent/dashboard',
};

export function getRoleHome(role: Role): string {
  return roleHomePaths[role];
}
