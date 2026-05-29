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
  Send,
  UserPlus,
  X,
} from 'lucide-react';
import { useMarkRead, useNotifications } from '../../hooks/useNotifications';
import type { NotificationRecipient, NotificationStatus, NotificationType } from '../../types';

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

const fallbackNotifications: NotificationRecipient[] = [
  {
    id: 'fallback-notification-recipient-1',
    notificationId: 'fallback-notification-1',
    userId: 'admin',
    status: 'UNREAD',
    notification: {
      id: 'fallback-notification-1',
      title: 'New Booking Confirmed',
      message:
        'Customer Rajesh Kumar has successfully confirmed plot #BK-2024-0892 in Emerald Heights phase II.',
      type: 'BOOKING_ACTIVITY',
      priority: 'NORMAL',
      createdAt: '2023-10-12T10:30:00.000Z',
      bookingId: '#BK-2024-0892',
      propertyId: 'Emerald Heights',
    },
  },
  {
    id: 'fallback-notification-recipient-2',
    notificationId: 'fallback-notification-2',
    userId: 'admin',
    status: 'READ',
    notification: {
      id: 'fallback-notification-2',
      title: 'Billing Cycle Completed',
      message: 'Maintenance billing for September 2024 has been processed for Silver Oaks branch agents.',
      type: 'BILLING_ACTIVITY',
      priority: 'LOW',
      createdAt: '2023-10-11T16:15:00.000Z',
      billingId: '#INV-88210',
    },
  },
  {
    id: 'fallback-notification-recipient-3',
    notificationId: 'fallback-notification-3',
    userId: 'admin',
    status: 'UNREAD',
    notification: {
      id: 'fallback-notification-3',
      title: 'Property Access Expiring',
      message: 'Security access credentials for Hilltop Residency - Block A are set to expire in 48 hours.',
      type: 'PROPERTY_ACTIVITY',
      priority: 'HIGH',
      createdAt: '2023-10-12T09:00:00.000Z',
      propertyId: 'Hilltop Residency',
    },
  },
  {
    id: 'fallback-notification-recipient-4',
    notificationId: 'fallback-notification-4',
    userId: 'admin',
    status: 'UNREAD',
    notification: {
      id: 'fallback-notification-4',
      title: 'New Member Application',
      message:
        'A new agent registration request has been received from Sarah Thompson for the West Coast region.',
      type: 'MEMBER_ACTIVITY',
      priority: 'NORMAL',
      createdAt: '2023-10-10T11:20:00.000Z',
    },
  },
];

function formatListDate(value?: string) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-IN', { month: 'short', day: '2-digit' }) +
    ', ' +
    date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function formatDetailDate(value?: string) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-IN', { month: 'short', day: '2-digit', year: 'numeric' }) +
    ', ' +
    date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function toDateInput(value?: string) {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().split('T')[0];
}

function createdTime(value?: string) {
  if (!value) return '10:45 AM';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '10:45 AM';
  return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function relatedText(recipient: NotificationRecipient) {
  const n = recipient.notification;
  if (!n) return 'Emerald Heights';
  if (n.propertyId) return n.propertyId;
  if (n.billingId) return n.billingId;
  if (n.bookingId) return n.bookingId;
  if (n.type === 'MEMBER_ACTIVITY') return '2 days ago';
  return 'Sri Thangam Network';
}

function workflowStage(type?: NotificationType) {
  if (type === 'BILLING_ACTIVITY') return 'Billing Cycle';
  if (type === 'PROPERTY_ACTIVITY') return 'Access Review';
  if (type === 'MEMBER_ACTIVITY') return 'Application Review';
  return 'Final Settlement';
}

function moduleLabel(type?: NotificationType) {
  if (type === 'BILLING_ACTIVITY') return 'Billing';
  if (type === 'PROPERTY_ACTIVITY') return 'Properties';
  if (type === 'MEMBER_ACTIVITY') return 'Members';
  return 'Properties / Bookings';
}

function detailTitle(recipient: NotificationRecipient) {
  const n = recipient.notification;
  if (!n) return 'Booking Confirmed - Emerald Heights #14A';
  if (n.type === 'BOOKING_ACTIVITY') return 'Booking Confirmed - Emerald Heights #14A';
  return n.title;
}

function detailMessage(recipient: NotificationRecipient) {
  const n = recipient.notification;
  if (n?.type === 'BOOKING_ACTIVITY') {
    return "The final payment for booking #BK-2024-0892 has been verified by the accounts team. The property status is now updated to 'Booked'.";
  }
  return n?.message ?? 'The selected notification has been updated by the branch operations team.';
}

function isRead(recipient: NotificationRecipient, readIds: Set<string>) {
  return readIds.has(recipient.id) || recipient.status === 'READ' || recipient.status === 'RESOLVED';
}

function NotificationDetailsModal({
  recipient,
  read,
  onClose,
  onMarkRead,
}: {
  recipient: NotificationRecipient;
  read: boolean;
  onClose: () => void;
  onMarkRead: () => void;
}) {
  const n = recipient.notification;
  const type = n?.type ?? 'BOOKING_ACTIVITY';
  const styles = typeStyles[type];

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
            <span className={`mt-1 inline-flex h-8 w-8 items-center justify-center rounded-sm ${styles.box}`}>
              {styles.icon}
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-extrabold text-gray-900">{detailTitle(recipient)}</h2>
                <span className={`rounded-sm px-2 py-1 text-[10px] font-extrabold uppercase ${read ? 'bg-stone-100 text-gray-600' : 'bg-teal-100 text-teal-700'}`}>
                  {read ? 'READ' : 'UNREAD'}
                </span>
              </div>
              <p className="mt-1 text-xs font-semibold text-gray-500">{formatDetailDate(n?.createdAt)}</p>
            </div>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
          <div className="border-l-4 border-teal-700 bg-amber-50 px-4 py-4 text-sm font-semibold leading-6 text-gray-800">
            {detailMessage(recipient)}
          </div>

          <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="space-y-4">
              <div>
                <p className="text-[11px] font-extrabold uppercase tracking-wide text-gray-500">Type</p>
                <p className="mt-1 flex items-center gap-2 text-sm font-bold text-gray-900">
                  <Building2 className="h-4 w-4 text-gray-600" />
                  {typeLabels[type]}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-extrabold uppercase tracking-wide text-gray-500">Workflow Stage</p>
                <p className="mt-1 flex items-center gap-2 text-sm font-bold text-gray-900">
                  <CheckCheck className="h-4 w-4 text-gray-600" />
                  {workflowStage(type)}
                </p>
              </div>
            </div>

            <div className="space-y-4">
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
                  {createdTime(n?.createdAt)}
                </p>
              </div>
            </div>
          </div>

          <section className="mt-5 overflow-hidden rounded-sm border border-stone-200 bg-white">
            <div className="bg-stone-100 px-4 py-3">
              <h3 className="text-xs font-extrabold uppercase tracking-wide text-gray-700">Related Details</h3>
            </div>
            <div className="grid grid-cols-1 gap-4 px-4 py-4 sm:grid-cols-3">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-wide text-gray-500">Plot / Unit</p>
                <p className="mt-1 text-sm font-extrabold text-teal-700">#14A</p>
              </div>
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-wide text-gray-500">Square Feet</p>
                <p className="mt-1 text-sm font-extrabold text-gray-900">1,200</p>
              </div>
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-wide text-gray-500">Total Amount</p>
                <p className="mt-1 text-sm font-extrabold text-gold">₹ 1,50,000</p>
              </div>
            </div>
            <div className="mx-4 mb-4 flex items-center gap-3 border-t border-stone-100 pt-4">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-sm bg-stone-100 text-gold">
                <UserPlus className="h-4 w-4" />
              </span>
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-wide text-gray-500">Applicant</p>
                <p className="text-sm font-bold text-gray-900">Rajesh Kumar Venkat</p>
              </div>
            </div>
          </section>
        </div>

        <div className="flex flex-col gap-3 border-t border-amber-100 bg-white px-6 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-sm border border-stone-300 bg-white px-6 py-3 text-sm font-semibold text-gray-700 hover:bg-stone-50"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => toast.success('Message prepared for director')}
            className="inline-flex items-center justify-center gap-2 rounded-sm border border-teal-700 bg-white px-6 py-3 text-sm font-bold text-teal-700 hover:bg-teal-50"
          >
            <Send className="h-4 w-4" />
            Send Message to Director
          </button>
          <button
            type="button"
            onClick={onMarkRead}
            className="inline-flex items-center justify-center gap-2 rounded-sm bg-teal-700 px-6 py-3 text-sm font-bold text-white hover:bg-teal-800"
          >
            <CheckCheck className="h-4 w-4" />
            Mark as Read
          </button>
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
  const [selected, setSelected] = useState<NotificationRecipient | null>(null);
  const [localReadIds, setLocalReadIds] = useState<Set<string>>(new Set());

  const { data, isLoading } = useNotifications({
    page,
    limit: 20,
    type: filters.type || undefined,
    status: filters.status || undefined,
    startDate: filters.date || undefined,
    endDate: filters.date || undefined,
  });
  const markRead = useMarkRead();

  const apiNotifications = data?.data ?? [];
  const baseNotifications = apiNotifications.length ? apiNotifications : fallbackNotifications;

  const filteredNotifications = useMemo(() => {
    return baseNotifications.filter((recipient) => {
      const n = recipient.notification;
      const query = filters.search.trim().toLowerCase();
      const status = isRead(recipient, localReadIds) ? 'READ' : recipient.status;
      const haystack = `${n?.title ?? ''} ${n?.message ?? ''} ${n?.type ?? ''} ${moduleLabel(n?.type)}`.toLowerCase();
      if (query && !haystack.includes(query)) return false;
      if (filters.type && n?.type !== filters.type) return false;
      if (filters.status && status !== filters.status) return false;
      if (filters.date && toDateInput(n?.createdAt) !== filters.date) return false;
      return true;
    });
  }, [baseNotifications, filters, localReadIds]);

  const applyFilters = () => {
    setFilters({
      search: draftSearch,
      type: draftType,
      status: draftStatus,
      date: draftDate,
    });
    setPage(1);
  };

  const markRecipientRead = (recipient: NotificationRecipient) => {
    setLocalReadIds((current) => new Set(current).add(recipient.id));
    if (!recipient.id.startsWith('fallback-')) {
      markRead.mutate(recipient.id, {
        onError: () => {
          setLocalReadIds((current) => new Set(current).add(recipient.id));
        },
      });
    }
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
        <p className="mt-1 text-sm text-gray-700">
          View branch-related booking, billing, property, and member activity alerts.
        </p>
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
                placeholder="dd-mm-yyyy"
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
          filteredNotifications.map((recipient) => {
            const n = recipient.notification;
            const type = n?.type ?? 'BOOKING_ACTIVITY';
            const styles = typeStyles[type];
            const read = isRead(recipient, localReadIds);
            return (
              <article
                key={recipient.id}
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
                        <h2 className="text-sm font-extrabold text-gray-900">{n?.title ?? 'Notification'}</h2>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase ${styles.badge}`}>
                          {badgeLabels[type]}
                        </span>
                      </div>
                      <p className="mt-1 text-sm leading-6 text-gray-700">{n?.message ?? ''}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs font-semibold text-gray-600">
                        <span className="inline-flex items-center gap-1.5">
                          <CalendarDays className="h-3.5 w-3.5" />
                          {formatListDate(n?.createdAt)}
                        </span>
                        <span className="inline-flex items-center gap-1.5 text-teal-700">
                          <Building2 className="h-3.5 w-3.5" />
                          {relatedText(recipient)}
                        </span>
                        {n?.priority === 'HIGH' && <span className="font-extrabold text-red-700">High Urgency</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 md:flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => setSelected(recipient)}
                      className="rounded-sm border border-stone-200 bg-white px-5 py-3 text-sm font-semibold text-gray-900 hover:border-gold hover:bg-amber-50"
                    >
                      View Details
                    </button>
                    <span className={`inline-flex h-9 w-9 items-center justify-center rounded-md ${read ? 'bg-emerald-50 text-teal-700' : 'bg-white text-gold'}`}>
                      {read ? <CheckCheck className="h-4 w-4" /> : <Mail className="h-4 w-4" />}
                    </span>
                  </div>
                </div>
              </article>
            );
          })
        ) : (
          <div className="rounded-md border border-stone-100 bg-white px-5 py-10 text-center text-gray-500 shadow-sm">
            No notifications found
          </div>
        )}
      </section>

      {selected && (
        <NotificationDetailsModal
          recipient={selected}
          read={isRead(selected, localReadIds)}
          onClose={() => setSelected(null)}
          onMarkRead={() => markRecipientRead(selected)}
        />
      )}
    </div>
  );
};

export default AdminNotificationsPage;
