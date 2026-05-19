import React, { useState } from 'react';
import { useNotifications, useMarkRead, useMarkAllRead } from '../../hooks/useNotifications';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Pagination } from '../../components/ui/Pagination';
import type { NotificationType } from '../../types';

const TYPE_OPTIONS: NotificationType[] = [
  'ADMIN_ACTIVITY', 'MEMBER_ACTIVITY', 'BRANCH_ACTIVITY', 'PROPERTY_ACTIVITY',
  'BOOKING_ACTIVITY', 'BILLING_ACTIVITY', 'SYSTEM_ACTIVITY', 'TEAM_ACTIVITY',
];

const PRIORITY_COLORS: Record<string, string> = {
  HIGH: 'bg-red-100 text-red-700',
  MEDIUM: 'bg-yellow-100 text-yellow-700',
  LOW: 'bg-green-100 text-green-700',
};

const AdminNotificationsPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [type, setType] = useState<NotificationType | ''>('');

  const { data, isLoading } = useNotifications({
    page,
    limit: 20,
    type: type || undefined,
  });

  const markRead = useMarkRead();
  const markAllRead = useMarkAllRead();

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-sm text-gray-500 mt-0.5">Branch activity and system alerts</p>
        </div>
        <button
          onClick={() => markAllRead.mutate()}
          disabled={markAllRead.isPending}
          className="px-4 py-2 text-sm font-medium text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 disabled:opacity-50"
        >
          {markAllRead.isPending ? 'Marking...' : 'Mark All Read'}
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-4 border-b border-gray-200 flex flex-wrap gap-3">
          <select
            value={type}
            onChange={(e) => { setType(e.target.value as NotificationType | ''); setPage(1); }}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Types</option>
            {TYPE_OPTIONS.map((t) => (
              <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
            ))}
          </select>
        </div>

        <div className="divide-y divide-gray-100">
          {isLoading ? (
            <div className="px-4 py-10 text-center text-gray-400">Loading notifications...</div>
          ) : !data?.data?.length ? (
            <div className="px-4 py-10 text-center text-gray-400">No notifications</div>
          ) : (
            data.data.map((nr) => {
              const n = nr.notification;
              const isUnread = nr.status === 'UNREAD';
              return (
                <div
                  key={nr.id}
                  className={`px-4 py-4 flex items-start gap-4 transition-colors ${isUnread ? 'bg-blue-50/40' : 'hover:bg-gray-50'}`}
                >
                  <div className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${isUnread ? 'bg-blue-500' : 'bg-gray-300'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-sm font-semibold text-gray-900">{n?.title ?? 'Notification'}</span>
                      {n?.type && <StatusBadge status={n.type} />}
                      {n?.priority && (
                        <span className={`text-xs px-2 py-0.5 rounded font-medium ${PRIORITY_COLORS[n.priority] ?? 'bg-gray-100 text-gray-600'}`}>
                          {n.priority}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{n?.message ?? ''}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {n?.createdAt ? new Date(n.createdAt).toLocaleString('en-IN') : '—'}
                    </p>
                  </div>
                  {isUnread && (
                    <button
                      onClick={() => markRead.mutate(nr.id)}
                      disabled={markRead.isPending}
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium flex-shrink-0 disabled:opacity-50"
                    >
                      Mark read
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>

        {data && <Pagination page={page} total={data.total} limit={data.limit} onPageChange={setPage} />}
      </div>
    </div>
  );
};

export default AdminNotificationsPage;
