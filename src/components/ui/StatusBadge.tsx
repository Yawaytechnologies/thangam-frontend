import React from 'react';
import type {
  UserStatus,
  BranchStatus,
  BookingStatus,
  BillingStatus,
  WorkflowStatus,
  NotificationStatus,
  Role,
} from '../../types';

type BadgeVariant = 'green' | 'red' | 'yellow' | 'blue' | 'purple' | 'gray' | 'orange' | 'indigo';

type StatusValue =
  | UserStatus
  | BranchStatus
  | BookingStatus
  | BillingStatus
  | WorkflowStatus
  | NotificationStatus
  | Role
  | string;

const variantMap: Record<string, BadgeVariant> = {
  // UserStatus / BranchStatus
  ACTIVE: 'green',
  INACTIVE: 'red',
  PENDING: 'yellow',
  // BookingStatus
  BOOKING_INITIATED: 'blue',
  TOKEN_RECEIVED: 'indigo',
  ADVANCE_PAYMENT: 'purple',
  REGISTRATION_PENDING: 'yellow',
  FINAL_SETTLEMENT_PENDING: 'orange',
  COMPLETED: 'green',
  CANCELLED: 'red',
  // BillingStatus
  PARTIAL_PAYMENT: 'indigo',
  PAID: 'green',
  FINAL_SETTLEMENT: 'orange',
  // NotificationStatus
  UNREAD: 'blue',
  READ: 'gray',
  RESOLVED: 'green',
  IMPORTANT: 'red',
  // Roles
  SUPER_ADMIN: 'purple',
  ADMIN: 'indigo',
  DIRECTOR: 'blue',
  EXECUTIVE_DIRECTOR: 'blue',
  DEPUTY_DIRECTOR: 'blue',
  SENIOR_MANAGER: 'indigo',
  BUSINESS_MANAGER: 'indigo',
  AGENT: 'gray',
  // WorkflowStatus (available)
  AVAILABLE: 'green',
};

const labelMap: Record<string, string> = {
  BOOKING_INITIATED: 'Booking Initiated',
  TOKEN_RECEIVED: 'Token Received',
  ADVANCE_PAYMENT: 'Advance Payment',
  REGISTRATION_PENDING: 'Reg. Pending',
  FINAL_SETTLEMENT_PENDING: 'Settlement Pending',
  PARTIAL_PAYMENT: 'Partial Payment',
  FINAL_SETTLEMENT: 'Final Settlement',
  SUPER_ADMIN: 'Super Admin',
  EXECUTIVE_DIRECTOR: 'Executive Director',
  DEPUTY_DIRECTOR: 'Deputy Director',
  SENIOR_MANAGER: 'Senior Manager',
  BUSINESS_MANAGER: 'Business Manager',
};

const colorClasses: Record<BadgeVariant, string> = {
  green: 'bg-green-100 text-green-800',
  red: 'bg-red-100 text-red-800',
  yellow: 'bg-yellow-100 text-yellow-800',
  blue: 'bg-blue-100 text-blue-800',
  purple: 'bg-purple-100 text-purple-800',
  gray: 'bg-gray-100 text-gray-700',
  orange: 'bg-orange-100 text-orange-800',
  indigo: 'bg-indigo-100 text-indigo-800',
};

interface StatusBadgeProps {
  status: StatusValue;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  const variant = variantMap[status] ?? 'gray';
  const label = labelMap[status] ?? status.replace(/_/g, ' ');
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClasses[variant]} ${className}`}
    >
      {label}
    </span>
  );
};
