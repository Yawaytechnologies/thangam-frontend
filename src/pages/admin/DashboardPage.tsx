import React from 'react';
import { Link } from 'react-router-dom';
import {
  useAdminStats,
  useAdminMemberActivity,
  useAdminBookingActivity,
  useAdminBillingActivity,
} from '../../hooks/useDashboard';
import { useLatestNotifications } from '../../hooks/useNotifications';
import { StatusBadge } from '../../components/ui/StatusBadge';
import type { AdminMemberActivity, AdminBookingActivity, AdminBillingActivity } from '../../api/dashboard.api';
import type { NotificationRecipient } from '../../types';

interface KpiCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}

const KpiCard: React.FC<KpiCardProps> = ({ label, value, icon, color }) => (
  <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
    <div className="flex items-center justify-between mb-3">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
        {icon}
      </div>
    </div>
    <p className="text-2xl font-bold text-gray-900">{value}</p>
  </div>
);

const SectionHeader: React.FC<{ title: string; linkTo?: string; linkLabel?: string }> = ({
  title,
  linkTo,
  linkLabel,
}) => (
  <div className="flex items-center justify-between mb-4">
    <h2 className="text-base font-semibold text-gray-900">{title}</h2>
    {linkTo && (
      <Link to={linkTo} className="text-sm text-blue-600 hover:text-blue-700 font-medium">
        {linkLabel ?? 'View all'}
      </Link>
    )}
  </div>
);

const TableWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
    <div className="overflow-x-auto">{children}</div>
  </div>
);

const AdminDashboardPage: React.FC = () => {
  const { data: stats, isLoading: statsLoading } = useAdminStats();
  const { data: memberActivity, isLoading: memberLoading } = useAdminMemberActivity();
  const { data: bookingActivity, isLoading: bookingLoading } = useAdminBookingActivity();
  const { data: billingActivity, isLoading: billingLoading } = useAdminBillingActivity();
  const { data: latestNotifications, isLoading: notifLoading } = useLatestNotifications();

  const kpis: KpiCardProps[] = [
    {
      label: 'Total Members',
      value: statsLoading ? '—' : stats?.totalMembers ?? 0,
      color: 'bg-blue-100',
      icon: (
        <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
    {
      label: 'New Members',
      value: statsLoading ? '—' : stats?.newMembersThisMonth ?? 0,
      color: 'bg-green-100',
      icon: (
        <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
        </svg>
      ),
    },
    {
      label: 'Active Bookings',
      value: statsLoading ? '—' : stats?.activeBookings ?? 0,
      color: 'bg-indigo-100',
      icon: (
        <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      label: 'Pending Billing',
      value: statsLoading ? '—' : stats?.pendingBilling ?? 0,
      color: 'bg-yellow-100',
      icon: (
        <svg className="w-5 h-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: 'Completed Settlements',
      value: statsLoading ? '—' : stats?.completedSettlements ?? 0,
      color: 'bg-purple-100',
      icon: (
        <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
        </svg>
      ),
    },
  ];

  const recentMembers: AdminMemberActivity[] = (memberActivity ?? []).slice(0, 5);
  const recentBookings: AdminBookingActivity[] = (bookingActivity ?? []).slice(0, 5);
  const recentBilling: AdminBillingActivity[] = (billingActivity ?? []).slice(0, 5);
  const recentNotifications: NotificationRecipient[] = (latestNotifications ?? []).slice(0, 5);

  return (
    <div className="p-6 space-y-8">
      {/* Page title */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">Branch overview and recent activity</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.label} {...kpi} />
        ))}
      </div>

      {/* Section A: Recent Members */}
      <div>
        <SectionHeader title="Recent Members" linkTo="/admin/members" />
        <TableWrapper>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Member ID</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Role</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Joined Date</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {memberLoading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-gray-400">
                    Loading...
                  </td>
                </tr>
              ) : !recentMembers.length ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-gray-400">
                    No recent member activity
                  </td>
                </tr>
              ) : (
                recentMembers.map((m) => (
                  <tr key={m.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{m.memberId}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{m.fullName}</td>
                    <td className="px-4 py-3 text-gray-600">{m.role}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(m.createdAt).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={m.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </TableWrapper>
      </div>

      {/* Section B: Recent Bookings */}
      <div>
        <SectionHeader title="Recent Bookings" linkTo="/admin/bookings" />
        <TableWrapper>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Booking ID</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Applicant</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Project / Plot</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {bookingLoading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-gray-400">
                    Loading...
                  </td>
                </tr>
              ) : !recentBookings.length ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-gray-400">
                    No recent bookings
                  </td>
                </tr>
              ) : (
                recentBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{b.bookingId}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{b.applicantName}</td>
                    <td className="px-4 py-3 text-gray-600">{b.projectName} / {b.plotNumber}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={b.status} />
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(b.bookingDate).toLocaleDateString('en-IN')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </TableWrapper>
      </div>

      {/* Section C: Recent Billing */}
      <div>
        <SectionHeader title="Recent Billing" linkTo="/admin/billing" />
        <TableWrapper>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Billing ID</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Buyer</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Amt Paid</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Balance</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {billingLoading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-gray-400">
                    Loading...
                  </td>
                </tr>
              ) : !recentBilling.length ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-gray-400">
                    No recent billing
                  </td>
                </tr>
              ) : (
                recentBilling.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{b.billingId}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{b.buyerName}</td>
                    <td className="px-4 py-3 text-gray-900 font-medium">
                      ₹{Number(b.amountInNumbers).toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3 text-red-600">
                      ₹{Number(b.totalBalance).toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={b.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </TableWrapper>
      </div>

      {/* Section D: Notifications Preview */}
      <div>
        <SectionHeader title="Recent Notifications" linkTo="/admin/notifications" />
        <div className="space-y-2">
          {notifLoading ? (
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-center text-gray-400 text-sm">
              Loading...
            </div>
          ) : !recentNotifications.length ? (
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-center text-gray-400 text-sm">
              No notifications
            </div>
          ) : (
            recentNotifications.map((nr) => (
              <div
                key={nr.id}
                className={`bg-white rounded-xl border p-4 flex items-start gap-3 ${
                  nr.status === 'UNREAD' ? 'border-blue-200 bg-blue-50/30' : 'border-gray-200'
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                    nr.status === 'UNREAD' ? 'bg-blue-500' : 'bg-gray-300'
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {nr.notification?.title ?? 'Notification'}
                    </p>
                    {nr.notification?.type && (
                      <StatusBadge status={nr.notification.type} />
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                    {nr.notification?.message ?? ''}
                  </p>
                </div>
                <p className="text-xs text-gray-400 flex-shrink-0 whitespace-nowrap">
                  {nr.notification?.createdAt
                    ? new Date(nr.notification.createdAt).toLocaleDateString('en-IN')
                    : '—'}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
