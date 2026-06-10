import React, { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  AlertTriangle,
  Bell,
  Building2,
  CalendarDays,
  CheckCheck,
  Clock3,
  Filter,
  Home,
  Mail,
  Search,
  UserPlus,
  X,
} from 'lucide-react';
import { useMarkRead, useNotification, useNotifications } from '../../hooks/useNotifications';
import type { Notification, NotificationRecipient, NotificationStatus, NotificationType } from '../../types';

type NotificationItem = NotificationRecipient | Notification;

const typeOptions: NotificationType[] = [
  'ADMIN_ACTIVITY',
  'MEMBER_ACTIVITY',
  'BRANCH_ACTIVITY',
  'PROPERTY_ACTIVITY',
  'BOOKING_ACTIVITY',
  'BILLING_ACTIVITY',
  'SYSTEM_ACTIVITY',
  'TEAM_ACTIVITY',
];

const typeLabels: Record<NotificationType, string> = {
  ADMIN_ACTIVITY: 'Admin Activity',
  MEMBER_ACTIVITY: 'Member Activity',
  BRANCH_ACTIVITY: 'Branch Activity',
  PROPERTY_ACTIVITY: 'Property Activity',
  BOOKING_ACTIVITY: 'Booking Activity',
  BILLING_ACTIVITY: 'Billing Activity',
  SYSTEM_ACTIVITY: 'System Activity',
  TEAM_ACTIVITY: 'Team Activity',
};

const badgeLabels: Record<NotificationType, string> = {
  ADMIN_ACTIVITY: 'ADMIN',
  MEMBER_ACTIVITY: 'MEMBER',
  BRANCH_ACTIVITY: 'BRANCH',
  PROPERTY_ACTIVITY: 'PROPERTY',
  BOOKING_ACTIVITY: 'BOOKING',
  BILLING_ACTIVITY: 'BILLING',
  SYSTEM_ACTIVITY: 'SYSTEM',
  TEAM_ACTIVITY: 'TEAM',
};

const typeStyles: Record<NotificationType, { accent: string; box: string; badge: string; icon: React.ReactNode }> = {
  ADMIN_ACTIVITY: {
    accent: 'border-l-teal-500',
    box: 'bg-teal-100 text-teal-700',
    badge: 'bg-teal-100 text-teal-700',
    icon: <Bell className="h-4 w-4" />,
  },
  MEMBER_ACTIVITY: {
    accent: 'border-l-emerald-300',
    box: 'bg-emerald-50 text-teal-700',
    badge: 'bg-emerald-100 text-teal-700',
    icon: <UserPlus className="h-4 w-4" />,
  },
  BRANCH_ACTIVITY: {
    accent: 'border-l-amber-300',
    box: 'bg-amber-50 text-gold',
    badge: 'bg-amber-100 text-gold',
    icon: <Building2 className="h-4 w-4" />,
  },
  PROPERTY_ACTIVITY: {
    accent: 'border-l-red-500',
    box: 'bg-red-100 text-red-700',
    badge: 'bg-red-100 text-red-700',
    icon: <AlertTriangle className="h-4 w-4" />,
  },
  BOOKING_ACTIVITY: {
    accent: 'border-l-gold',
    box: 'bg-teal-100 text-teal-700',
    badge: 'bg-teal-100 text-teal-700',
    icon: <Building2 className="h-4 w-4" />,
  },
  BILLING_ACTIVITY: {
    accent: 'border-l-amber-300',
    box: 'bg-stone-100 text-gold',
    badge: 'bg-amber-100 text-gold',
    icon: <Home className="h-4 w-4" />,
  },
  SYSTEM_ACTIVITY: {
    accent: 'border-l-blue-300',
    box: 'bg-blue-50 text-blue-700',
    badge: 'bg-blue-100 text-blue-700',
    icon: <Bell className="h-4 w-4" />,
  },
  TEAM_ACTIVITY: {
    accent: 'border-l-emerald-300',
    box: 'bg-emerald-50 text-teal-700',
    badge: 'bg-emerald-100 text-teal-700',
    icon: <UserPlus className="h-4 w-4" />,
  },
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object';
}

function stringField(source: unknown, keys: string[]) {
  if (!isRecord(source)) return '';
  for (const key of keys) {
    const value = source[key];
    if (typeof value === 'string' && value.trim()) return value;
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  }
  return '';
}

function booleanField(source: unknown, keys: string[]) {
  if (!isRecord(source)) return undefined;
  for (const key of keys) {
    const value = source[key];
    if (typeof value === 'boolean') return value;
  }
  return undefined;
}

function notificationFor(item: NotificationItem): Notification {
  if ('notification' in item && item.notification) return item.notification;
  return item as Notification;
}

function notificationIdFor(item: NotificationItem) {
  const notification = notificationFor(item);
  return notification.id || stringField(item, ['notificationId']) || item.id;
}

function itemKey(item: NotificationItem) {
  return stringField(item, ['id']) || notificationIdFor(item);
}

function statusFor(item: NotificationItem): NotificationStatus {
  const notification = notificationFor(item);
  const rawStatus = stringField(item, ['status']) || stringField(notification, ['status']);
  if (rawStatus === 'READ' || rawStatus === 'RESOLVED' || rawStatus === 'IMPORTANT') return rawStatus;

  const explicitRead = booleanField(notification, ['isRead', 'read']) ?? booleanField(item, ['isRead', 'read']);
  if (explicitRead || stringField(item, ['readAt']) || stringField(notification, ['readAt'])) return 'READ';
  return 'UNREAD';
}

function isRead(item: NotificationItem, readIds: Set<string>) {
  return readIds.has(notificationIdFor(item)) || statusFor(item) === 'READ' || statusFor(item) === 'RESOLVED';
}

function metadataPairs(notification: Notification) {
  if (!isRecord(notification.metadata)) return [];

  return Object.entries(notification.metadata)
    .filter(([, value]) => value !== null && value !== undefined && value !== '')
    .map(([key, value]) => [key, typeof value === 'object' ? JSON.stringify(value) : String(value)] as const);
}

function referenceText(notification: Notification) {
  const metadata = isRecord(notification.metadata) ? notification.metadata : {};
  return [
    notification.bookingId,
    notification.billingId,
    notification.propertyId,
    notification.relatedEntityId,
    notification.relatedEntityType,
    stringField(metadata, ['bookingId', 'billingId', 'propertyId', 'referenceId', 'reference', 'entityId']),
  ]
    .filter(Boolean)
    .join(' ');
}

function formatListDate(value?: string) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return `${date.toLocaleDateString('en-IN', { month: 'short', day: '2-digit' })}, ${date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })}`;
}

function formatDetailDate(value?: string) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return `${date.toLocaleDateString('en-IN', { month: 'short', day: '2-digit', year: 'numeric' })}, ${date.toLocaleTimeString(
    'en-IN',
    { hour: '2-digit', minute: '2-digit', hour12: true },
  )}`;
}

function toDateInput(value?: string) {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().split('T')[0];
}

function toIsoDateRange(value: string) {
  if (!value) return {};
  return {
    startDate: new Date(`${value}T00:00:00.000`).toISOString(),
    endDate: new Date(`${value}T23:59:59.999`).toISOString(),
  };
}

function moduleLabel(type?: NotificationType) {
  if (type === 'BILLING_ACTIVITY') return 'Billing';
  if (type === 'BOOKING_ACTIVITY') return 'Bookings';
  if (type === 'PROPERTY_ACTIVITY') return 'Properties';
  if (type === 'MEMBER_ACTIVITY' || type === 'TEAM_ACTIVITY') return 'Members';
  if (type === 'BRANCH_ACTIVITY') return 'Branch';
  if (type === 'ADMIN_ACTIVITY') return 'Admin';
  return 'System';
}

function safeType(type?: string): NotificationType {
  return typeOptions.includes(type as NotificationType) ? (type as NotificationType) : 'SYSTEM_ACTIVITY';
}

function NotificationDetailsModal({
  item,
  detail,
  detailLoading,
  read,
  marking,
  onClose,
  onMarkRead,
}: {
  item: NotificationItem;
  detail?: Notification;
  detailLoading: boolean;
  read: boolean;
  marking: boolean;
  onClose: () => void;
  onMarkRead: () => void;
}) {
  const notification = detail ?? notificationFor(item);
  const type = safeType(notification.type);
  const styles = typeStyles[type];
  const references = referenceText(notification);
  const metadata = metadataPairs(notification);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-[2px]">
      <div className="flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-md border-t-4 border-gold bg-amber-50 shadow-2xl">
        <div className="relative border-b border-amber-100 bg-white px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 rounded-sm border border-stone-200 p-2 text-gray-600 hover:bg-stone-100"
            aria-label="Close notification details"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="flex items-start gap-3 pr-12">
            <span className={`mt-1 inline-flex h-8 w-8 items-center justify-center rounded-sm ${styles.box}`}>{styles.icon}</span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-extrabold text-gray-900">{notification.title || 'Notification'}</h2>
                <span
                  className={`rounded-sm px-2 py-1 text-[10px] font-extrabold uppercase ${
                    read ? 'bg-stone-100 text-gray-600' : 'bg-teal-100 text-teal-700'
                  }`}
                >
                  {read ? 'READ' : 'UNREAD'}
                </span>
              </div>
              <p className="mt-1 text-xs font-semibold text-gray-500">{formatDetailDate(notification.createdAt)}</p>
            </div>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
          {detailLoading ? (
            <div className="rounded-sm border border-stone-200 bg-white px-4 py-4 text-sm font-semibold text-gray-500">
              Loading notification details...
            </div>
          ) : (
            <>
              <div className="border-l-4 border-teal-700 bg-amber-50 px-4 py-4 text-sm font-semibold leading-6 text-gray-800">
                {notification.message || 'No message provided.'}
              </div>

              <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <p className="text-[11px] font-extrabold uppercase tracking-wide text-gray-500">Type</p>
                  <p className="mt-1 flex items-center gap-2 text-sm font-bold text-gray-900">
                    <Building2 className="h-4 w-4 text-gray-600" />
                    {typeLabels[type]}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-extrabold uppercase tracking-wide text-gray-500">Related Module</p>
                  <p className="mt-1 flex items-center gap-2 text-sm font-bold text-gray-900">
                    <Home className="h-4 w-4 text-gray-600" />
                    {moduleLabel(type)}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-extrabold uppercase tracking-wide text-gray-500">Triggered</p>
                  <p className="mt-1 flex items-center gap-2 text-sm font-bold text-gray-900">
                    <Clock3 className="h-4 w-4 text-gray-600" />
                    {formatDetailDate(notification.createdAt)}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-extrabold uppercase tracking-wide text-gray-500">Reference</p>
                  <p className="mt-1 text-sm font-bold text-gray-900">{references || '-'}</p>
                </div>
              </div>

              {metadata.length > 0 && (
                <section className="mt-5 overflow-hidden rounded-sm border border-stone-200 bg-white">
                  <div className="bg-stone-100 px-4 py-3">
                    <h3 className="text-xs font-extrabold uppercase tracking-wide text-gray-700">Metadata</h3>
                  </div>
                  <div className="grid grid-cols-1 gap-4 px-4 py-4 sm:grid-cols-2">
                    {metadata.map(([key, value]) => (
                      <div key={key}>
                        <p className="text-[10px] font-extrabold uppercase tracking-wide text-gray-500">{key}</p>
                        <p className="mt-1 break-words text-sm font-bold text-gray-900">{value}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>

        <div className="flex flex-col gap-3 border-t border-amber-100 bg-white px-6 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-sm border border-stone-300 bg-white px-6 py-3 text-sm font-semibold text-gray-700 hover:bg-stone-50"
          >
            Close
          </button>
          {!read && (
            <button
              type="button"
              onClick={onMarkRead}
              disabled={marking}
              className="inline-flex items-center justify-center gap-2 rounded-sm bg-teal-700 px-6 py-3 text-sm font-bold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <CheckCheck className="h-4 w-4" />
              {marking ? 'Marking...' : 'Mark as Read'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

const AdminNotificationsPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [draftSearch, setDraftSearch] = useState('');
  const [draftType, setDraftType] = useState<NotificationType | ''>('');
  const [draftStatus, setDraftStatus] = useState<NotificationStatus | ''>('');
  const [draftDate, setDraftDate] = useState('');
  const [filters, setFilters] = useState({
    search: '',
    type: '' as NotificationType | '',
    status: '' as NotificationStatus | '',
    date: '',
  });
  const [selected, setSelected] = useState<NotificationItem | null>(null);
  const [localReadIds, setLocalReadIds] = useState<Set<string>>(new Set());
  const dateRange = toIsoDateRange(filters.date);

  const { data, isLoading } = useNotifications({
    page,
    limit: 20,
    search: filters.search || undefined,
    type: filters.type || undefined,
    status: filters.status || undefined,
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
  });
  const selectedNotificationId = selected ? notificationIdFor(selected) : '';
  const { data: selectedDetail, isLoading: isDetailLoading } = useNotification(selectedNotificationId, !!selectedNotificationId);
  const markRead = useMarkRead();

  const filteredNotifications = useMemo(() => {
    const notifications = (data?.data ?? []) as NotificationItem[];

    return notifications.filter((item) => {
      const notification = notificationFor(item);
      const type = safeType(notification.type);
      const query = filters.search.trim().toLowerCase();
      const haystack = [
        notification.title,
        notification.message,
        type,
        moduleLabel(type),
        referenceText(notification),
        ...metadataPairs(notification).flatMap(([key, value]) => [key, value]),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      if (query && !haystack.includes(query)) return false;
      if (filters.type && type !== filters.type) return false;
      if (filters.status && statusFor(item) !== filters.status) return false;
      if (filters.date && toDateInput(notification.createdAt) !== filters.date) return false;
      return true;
    });
  }, [data?.data, filters]);

  const applyFilters = () => {
    setFilters({
      search: draftSearch,
      type: draftType,
      status: draftStatus,
      date: draftDate,
    });
    setPage(1);
  };

  const markNotificationRead = (item: NotificationItem) => {
    const notificationId = notificationIdFor(item);
    setLocalReadIds((current) => new Set(current).add(notificationId));
    markRead.mutate(notificationId, {
      onSuccess: () => toast.success('Notification marked as read'),
      onError: () => {
        setLocalReadIds((current) => {
          const next = new Set(current);
          next.delete(notificationId);
          return next;
        });
      },
    });
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
        <p className="mt-1 text-sm text-gray-700">View branch-related booking, billing, property, and member activity alerts.</p>
      </div>

      <section className="rounded-md border border-stone-100 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_0.85fr_0.75fr_0.75fr_auto] lg:items-end">
          <label>
            <span className="mb-1.5 block text-xs font-semibold text-gray-700">Search Notifications</span>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <input
                value={draftSearch}
                onChange={(event) => setDraftSearch(event.target.value)}
                placeholder="Keywords..."
                className="h-11 w-full rounded-sm border border-stone-200 bg-amber-50/50 pl-10 pr-3 text-sm font-semibold outline-none focus:border-gold focus:bg-white"
              />
            </div>
          </label>

          <label>
            <span className="mb-1.5 block text-xs font-semibold text-gray-700">Notification Type</span>
            <select
              value={draftType}
              onChange={(event) => setDraftType(event.target.value as NotificationType | '')}
              className="h-11 w-full rounded-sm border border-stone-200 bg-amber-50/50 px-3 text-sm font-semibold outline-none focus:border-gold"
            >
              <option value="">All Activities</option>
              {typeOptions.map((type) => (
                <option key={type} value={type}>
                  {typeLabels[type]}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="mb-1.5 block text-xs font-semibold text-gray-700">Status</span>
            <select
              value={draftStatus}
              onChange={(event) => setDraftStatus(event.target.value as NotificationStatus | '')}
              className="h-11 w-full rounded-sm border border-stone-200 bg-amber-50/50 px-3 text-sm font-semibold outline-none focus:border-gold"
            >
              <option value="">All</option>
              <option value="UNREAD">Unread</option>
              <option value="READ">Read</option>
            </select>
          </label>

          <label>
            <span className="mb-1.5 block text-xs font-semibold text-gray-700">Date Filter</span>
            <div className="relative">
              <input
                type="date"
                value={draftDate}
                onChange={(event) => setDraftDate(event.target.value)}
                className="h-11 w-full rounded-sm border border-stone-200 bg-amber-50/50 px-3 pr-10 text-sm font-semibold outline-none focus:border-gold"
              />
              <CalendarDays className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            </div>
          </label>

          <button
            type="button"
            onClick={applyFilters}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-sm bg-gold px-6 text-sm font-bold text-white hover:bg-gold-light hover:text-navy"
          >
            <Filter className="h-4 w-4" />
            Apply Filter
          </button>
        </div>
      </section>

      <section className="space-y-4">
        {isLoading ? (
          <div className="rounded-md border border-stone-100 bg-white px-5 py-10 text-center text-gray-500 shadow-sm">
            Loading notifications...
          </div>
        ) : filteredNotifications.length ? (
          filteredNotifications.map((item) => {
            const notification = notificationFor(item);
            const type = safeType(notification.type);
            const styles = typeStyles[type];
            const read = isRead(item, localReadIds);
            const references = referenceText(notification);

            return (
              <article
                key={itemKey(item)}
                className={`rounded-md border border-stone-100 border-l-4 bg-white px-4 py-4 shadow-sm transition hover:shadow-md ${styles.accent}`}
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-center">
                  <div className="flex min-w-0 flex-1 items-start gap-4">
                    <span className={`relative mt-1 inline-flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-md ${styles.box}`}>
                      {!read && <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-gold" />}
                      {styles.icon}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-sm font-extrabold text-gray-900">{notification.title || 'Notification'}</h2>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase ${styles.badge}`}>
                          {badgeLabels[type]}
                        </span>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase ${read ? 'bg-stone-100 text-gray-600' : 'bg-teal-100 text-teal-700'}`}>
                          {read ? 'Read' : 'Unread'}
                        </span>
                      </div>
                      <p className="mt-1 text-sm leading-6 text-gray-700">{notification.message || ''}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs font-semibold text-gray-600">
                        <span className="inline-flex items-center gap-1.5">
                          <CalendarDays className="h-3.5 w-3.5" />
                          {formatListDate(notification.createdAt)}
                        </span>
                        {references && (
                          <span className="inline-flex items-center gap-1.5 text-teal-700">
                            <Building2 className="h-3.5 w-3.5" />
                            {references}
                          </span>
                        )}
                        {notification.priority === 'HIGH' && <span className="font-extrabold text-red-700">High Urgency</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 md:flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => setSelected(item)}
                      className="rounded-sm border border-stone-200 bg-white px-5 py-3 text-sm font-semibold text-gray-900 hover:border-gold hover:bg-amber-50"
                    >
                      View Details
                    </button>
                    {!read && (
                      <button
                        type="button"
                        onClick={() => markNotificationRead(item)}
                        disabled={markRead.isPending}
                        className="rounded-sm border border-stone-200 bg-white px-5 py-3 text-sm font-semibold text-teal-700 hover:border-teal-700 hover:bg-teal-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Mark as read
                      </button>
                    )}
                    <span
                      className={`inline-flex h-9 w-9 items-center justify-center rounded-md ${
                        read ? 'bg-emerald-50 text-teal-700' : 'bg-white text-gold'
                      }`}
                    >
                      {read ? <CheckCheck className="h-4 w-4" /> : <Mail className="h-4 w-4" />}
                    </span>
                  </div>
                </div>
              </article>
            );
          })
        ) : (
          <div className="rounded-md border border-stone-100 bg-white px-5 py-10 text-center text-gray-500 shadow-sm">
            No notifications found.
          </div>
        )}
      </section>

      {data && data.total > data.limit && (
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={page <= 1}
            className="rounded-sm border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm font-semibold text-gray-600">Page {page}</span>
          <button
            type="button"
            onClick={() => setPage((current) => current + 1)}
            disabled={page * data.limit >= data.total}
            className="rounded-sm border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      {selected && (
        <NotificationDetailsModal
          item={selected}
          detail={selectedDetail}
          detailLoading={isDetailLoading}
          read={isRead(selected, localReadIds)}
          marking={markRead.isPending}
          onClose={() => setSelected(null)}
          onMarkRead={() => markNotificationRead(selected)}
        />
      )}
    </div>
  );
};

export default AdminNotificationsPage;
