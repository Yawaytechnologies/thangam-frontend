import React, { useState } from 'react';
import {
  useNotifications,
  useNotification,
  useMarkRead,
  useMarkAllRead,
  useSendMessage,
} from '../../hooks/useNotifications';
import { useBranches } from '../../hooks/useBranches';
import { Modal } from '../../components/ui/Modal';
import { StatusBadge } from '../../components/ui/StatusBadge';
import toast from 'react-hot-toast';
import type { NotificationType, NotificationStatus, NotificationRecipient } from '../../types';

// ─── Constants ────────────────────────────────────────────────────────────────

const TYPE_OPTIONS: NotificationType[] = [
  'ADMIN_ACTIVITY',
  'MEMBER_ACTIVITY',
  'BRANCH_ACTIVITY',
  'PROPERTY_ACTIVITY',
  'BOOKING_ACTIVITY',
  'BILLING_ACTIVITY',
  'SYSTEM_ACTIVITY',
  'TEAM_ACTIVITY',
];

const TYPE_LABELS: Record<NotificationType, string> = {
  ADMIN_ACTIVITY: 'Admin Activity',
  MEMBER_ACTIVITY: 'Member Activity',
  BRANCH_ACTIVITY: 'Branch Activity',
  PROPERTY_ACTIVITY: 'Property Activity',
  BOOKING_ACTIVITY: 'Property Booking',
  BILLING_ACTIVITY: 'Settlement',
  SYSTEM_ACTIVITY: 'Security',
  TEAM_ACTIVITY: 'Workflow',
};

const inputClass =
  'border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold bg-white';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hour${h > 1 ? 's' : ''} ago`;
  if (h < 48)
    return `Yesterday, ${new Date(iso).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function fullDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase();
}

// ─── Type Icons ───────────────────────────────────────────────────────────────

function NotificationIcon({ type, isUnread }: { type: NotificationType; isUnread: boolean }) {
  const baseClass = `w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 relative ${
    isUnread ? 'bg-gold/10' : 'bg-gray-100'
  }`;

  const iconColor = isUnread ? 'text-gold' : 'text-gray-500';

  let path: string;
  switch (type) {
    case 'BOOKING_ACTIVITY':
      path =
        'M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z';
      break;
    case 'BILLING_ACTIVITY':
      path =
        'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z';
      break;
    case 'SYSTEM_ACTIVITY':
      path =
        'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z';
      break;
    case 'PROPERTY_ACTIVITY':
      path =
        'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z';
      break;
    case 'MEMBER_ACTIVITY':
      path =
        'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z';
      break;
    case 'BRANCH_ACTIVITY':
      path =
        'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4';
      break;
    case 'ADMIN_ACTIVITY':
      path =
        'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z';
      break;
    default:
      path =
        'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9';
  }

  return (
    <div className={baseClass}>
      <svg className={`w-5 h-5 ${iconColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={path} />
      </svg>
      {isUnread && (
        <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-yellow-400 rounded-full border-2 border-white" />
      )}
    </div>
  );
}

// ─── NotificationDetailModal ──────────────────────────────────────────────────

interface DetailModalProps {
  open: boolean;
  onClose: () => void;
  recipient: NotificationRecipient;
  onMarkRead: () => void;
  isPending: boolean;
}

function NotificationDetailModal({ open, onClose, recipient, onMarkRead, isPending }: DetailModalProps) {
  const n = recipient.notification;
  const { data: full } = useNotification(n?.id ?? '');
  const detail = full ?? n;
  const isUnread = recipient.status === 'UNREAD';

  if (!n) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={n.title}
      size="lg"
    >
      <div className="space-y-5">
        {/* Bell icon header */}
        <div className="flex flex-col items-center gap-2 pb-2">
          <div className="w-14 h-14 rounded-full bg-gold/10 flex items-center justify-center">
            <svg className="w-7 h-7 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gold/10 text-gold uppercase tracking-wide">
            {TYPE_LABELS[n.type]}
          </span>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-600 text-center leading-relaxed">{n.message}</p>

        {/* Event specs */}
        <div className="bg-gray-50 rounded-xl p-4 space-y-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Event Details</p>
          {[
            ['Module', TYPE_LABELS[n.type]],
            ['Branch', n.branchId ? `Branch ${n.branchId.slice(0, 8)}…` : '—'],
            ['Timestamp', detail?.createdAt ? fullDateTime(detail.createdAt) : '—'],
          ].map(([label, value]) => (
            <div key={label} className="flex items-center justify-between">
              <span className="text-xs text-gray-400">{label}</span>
              <span className="text-xs font-medium text-gray-800">{value}</span>
            </div>
          ))}
        </div>

        {/* Personnel */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gold/10 flex items-center justify-center text-gold text-xs font-bold">
            SA
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">System</p>
            <p className="text-xs text-gray-400">Super Admin</p>
          </div>
        </div>

        {/* Asset info (if property) */}
        {n.propertyId && (
          <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
            <div className="w-12 h-12 rounded-lg bg-gray-200 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-gray-800">Property #{n.propertyId.slice(0, 8)}</p>
              <p className="text-xs text-gray-400">View property details</p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 text-sm"
          >
            Close
          </button>
          {isUnread && (
            <button
              type="button"
              onClick={onMarkRead}
              disabled={isPending}
              className="bg-gold text-navy font-semibold px-4 py-2 rounded-lg hover:opacity-90 disabled:opacity-50 text-sm"
            >
              {isPending ? 'Resolving...' : 'Mark as Read & Resolve'}
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}

// ─── NotificationOverviewModal ────────────────────────────────────────────────

interface OverviewModalProps {
  open: boolean;
  onClose: () => void;
  recipient: NotificationRecipient;
  onMarkRead: () => void;
  isPending: boolean;
}

function NotificationOverviewModal({ open, onClose, recipient, onMarkRead, isPending }: OverviewModalProps) {
  const n = recipient.notification;
  const isUnread = recipient.status === 'UNREAD';
  const [notesOpen, setNotesOpen] = useState(false);

  if (!n) return null;

  const priorityClass =
    n.priority === 'HIGH'
      ? 'bg-red-100 text-red-700'
      : n.priority === 'MEDIUM'
      ? 'bg-yellow-100 text-yellow-700'
      : 'bg-green-100 text-green-700';

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={n.title}
      subtitle={fullDateTime(n.createdAt)}
      size="2xl"
    >
      <div className="space-y-5">
        {/* Badges row */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gold/10 text-gold uppercase tracking-wide">
            {TYPE_LABELS[n.type]}
          </span>
          {n.priority && (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${priorityClass}`}>
              {n.priority}
            </span>
          )}
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
              isUnread ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
            }`}
          >
            {isUnread ? 'Unread' : 'Read'}
          </span>
        </div>

        {/* Two columns */}
        <div className="grid grid-cols-2 gap-4">
          {/* Related Activity */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Related Activity</p>
            {[
              ['Module', TYPE_LABELS[n.type]],
              ['Activity', n.type.replace(/_/g, ' ')],
              ['Status', isUnread ? 'Unread' : 'Read'],
              ['Performed By', 'System'],
              ['Branch', n.branchId ? `Branch ${n.branchId.slice(0, 8)}…` : '—'],
            ].map(([label, value]) => (
              <div key={label}>
                <p className="text-xs text-gray-400">{label}</p>
                <p className="text-sm font-medium text-gray-800">{value}</p>
              </div>
            ))}
          </div>

          {/* Record Details */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Record Details</p>
            {n.bookingId && (
              <div>
                <p className="text-xs text-gray-400">Booking ID</p>
                <p className="text-sm font-mono font-semibold text-gold">#{n.bookingId.slice(0, 12)}</p>
              </div>
            )}
            {n.billingId && (
              <div>
                <p className="text-xs text-gray-400">Billing ID</p>
                <p className="text-sm font-mono font-semibold text-gold">#{n.billingId.slice(0, 12)}</p>
              </div>
            )}
            {n.propertyId && (
              <div>
                <p className="text-xs text-gray-400">Property</p>
                <p className="text-sm font-medium text-gray-800">#{n.propertyId.slice(0, 8)}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-gray-400">Status</p>
              <StatusBadge status={isUnread ? 'UNREAD' : 'READ'} />
            </div>
          </div>
        </div>

        {/* Personnel Involved */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Personnel Involved</p>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gold/10 text-gold text-xs font-bold flex items-center justify-center">
              SA
            </div>
            <span className="text-sm text-gray-700">System / Super Admin</span>
          </div>
        </div>

        {/* Operational Notes collapsible */}
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <button
            type="button"
            onClick={() => setNotesOpen((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <span>Operational Notes</span>
            <svg
              className={`w-4 h-4 text-gray-400 transition-transform ${notesOpen ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {notesOpen && (
            <div className="px-4 pb-3 text-sm text-gray-500 border-t border-gray-100">
              No additional notes available.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 text-sm"
          >
            Close
          </button>
          {isUnread && (
            <button
              type="button"
              onClick={onMarkRead}
              disabled={isPending}
              className="bg-gold text-navy font-semibold px-4 py-2 rounded-lg hover:opacity-90 disabled:opacity-50 text-sm"
            >
              {isPending ? 'Resolving...' : 'Mark as Read & Resolve'}
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}

// ─── SendMessageModal ─────────────────────────────────────────────────────────

interface SendMessageModalProps {
  open: boolean;
  onClose: () => void;
  recipient: NotificationRecipient;
}

function SendMessageModal({ open, onClose, recipient }: SendMessageModalProps) {
  const n = recipient.notification;
  const sendMessage = useSendMessage();
  const [msgType, setMsgType] = useState<import('../../types').MessageType>('GENERAL_MESSAGE');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!n) return;
    sendMessage.mutate(
      {
        notificationId: n.id,
        recipientName: 'System Admin',
        recipientRole: 'SUPER_ADMIN',
        messageType: msgType,
        subject,
        body,
        branchId: n.branchId,
        relatedModule: TYPE_LABELS[n.type],
        relatedEntityId: n.bookingId ?? n.billingId ?? n.propertyId,
      },
      {
        onSuccess: () => {
          toast.success('Message sent successfully.');
          onClose();
          setSubject('');
          setBody('');
        },
      },
    );
  }

  if (!n) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Send Message"
      subtitle="Compose and send a message related to this notification."
      size="lg"
    >
      <form onSubmit={handleSend} className="space-y-4">
        {/* Recipient card */}
        <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
          <div className="w-10 h-10 rounded-full bg-gold/10 text-gold text-sm font-bold flex items-center justify-center flex-shrink-0">
            {getInitials('System Admin')}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900">System Admin</p>
            <p className="text-xs text-gray-500">Super Admin · Main Branch</p>
          </div>
        </div>

        {/* Context line */}
        <div className="flex items-center gap-2 text-xs text-gray-500 flex-wrap">
          <span className="font-medium text-gold">{TYPE_LABELS[n.type]}</span>
          {n.propertyId && (
            <>
              <span>·</span>
              <span>Property #{n.propertyId.slice(0, 8)}</span>
            </>
          )}
          {n.bookingId && (
            <>
              <span>·</span>
              <span className="font-mono text-gold">#{n.bookingId.slice(0, 12)}</span>
            </>
          )}
        </div>

        {/* Message Type */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Message Type</label>
          <select
            value={msgType}
            onChange={(e) => setMsgType(e.target.value as import('../../types').MessageType)}
            className={`w-full ${inputClass}`}
          >
            <option value="GENERAL_MESSAGE">General Message</option>
            <option value="BOOKING_FOLLOW_UP">Booking Follow Up</option>
            <option value="BILLING_FOLLOW_UP">Billing Follow Up</option>
            <option value="SETTLEMENT_REMINDER">Settlement Reminder</option>
            <option value="PROPERTY_WORKFLOW_UPDATE">Property Workflow Update</option>
            <option value="DOCUMENT_SUBMISSION_REMINDER">Document Submission Reminder</option>
          </select>
        </div>

        {/* Subject */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Subject</label>
          <input
            type="text"
            required
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className={`w-full ${inputClass}`}
            placeholder="Enter message subject..."
          />
        </div>

        {/* Message body */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Message</label>
          <textarea
            required
            rows={4}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className={`w-full ${inputClass} resize-none`}
            placeholder="Write your message here..."
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 text-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={sendMessage.isPending}
            className="bg-gold text-navy font-semibold px-4 py-2 rounded-lg hover:opacity-90 disabled:opacity-50 text-sm flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
            {sendMessage.isPending ? 'Sending...' : 'Send Message'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ─── NotificationsPage ────────────────────────────────────────────────────────

const SuperAdminNotificationsPage: React.FC = () => {
  const [limit, setLimit] = useState(20);
  const [typeFilter, setTypeFilter] = useState<NotificationType | ''>('');
  const [branchFilter, setBranchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<NotificationStatus | ''>('');
  const [dateFilter, setDateFilter] = useState('');

  const [appliedType, setAppliedType] = useState<NotificationType | ''>('');
  const [appliedStatus, setAppliedStatus] = useState<NotificationStatus | ''>('');

  const [detailRecipient, setDetailRecipient] = useState<NotificationRecipient | null>(null);
  const [overviewRecipient, setOverviewRecipient] = useState<NotificationRecipient | null>(null);
  const [sendMsgRecipient, setSendMsgRecipient] = useState<NotificationRecipient | null>(null);

  const { data, isLoading } = useNotifications({
    limit,
    type: appliedType || undefined,
    status: appliedStatus || undefined,
  });

  const branchesQuery = useBranches({ limit: 100 });
  const branches = branchesQuery.data?.data ?? [];

  const markRead = useMarkRead();
  const markAllRead = useMarkAllRead();

  const allRecipients = data?.data ?? [];
  const total = data?.total ?? 0;

  const filtered = branchFilter
    ? allRecipients.filter((nr) => nr.notification?.branchId === branchFilter)
    : allRecipients;

  function handleApplyFilters() {
    setAppliedType(typeFilter);
    setAppliedStatus(statusFilter);
  }

  function handleMarkRead(nr: NotificationRecipient) {
    markRead.mutate(nr.id, {
      onSuccess: () => {
        setDetailRecipient(null);
        setOverviewRecipient(null);
      },
    });
  }

  return (
    <div className="p-6 pb-24">
      {/* ── Page Header ── */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notification Management</h1>
          <p className="text-sm text-gray-500 mt-1">
            Stay updated with all system activities and member interactions.
          </p>
        </div>
        <button
          type="button"
          onClick={() => markAllRead.mutate()}
          disabled={markAllRead.isPending}
          className="border border-gold text-gold px-4 py-2 rounded-lg hover:bg-gold/5 text-sm font-medium flex-shrink-0 disabled:opacity-50"
        >
          {markAllRead.isPending ? 'Marking...' : 'Mark All as Read'}
        </button>
      </div>

      {/* ── Filter Row ── */}
      <div className="bg-white rounded-xl border border-gray-200 px-4 py-3 mb-5 flex items-center gap-3 flex-wrap">
        {/* Activity Type */}
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as NotificationType | '')}
          className={inputClass}
        >
          <option value="">All Activity Types</option>
          {TYPE_OPTIONS.map((t) => (
            <option key={t} value={t}>
              {TYPE_LABELS[t]}
            </option>
          ))}
        </select>

        {/* Branch */}
        <select
          value={branchFilter}
          onChange={(e) => setBranchFilter(e.target.value)}
          className={inputClass}
        >
          <option value="">All Branches</option>
          {branches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>

        {/* Status */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as NotificationStatus | '')}
          className={inputClass}
        >
          <option value="">All Status</option>
          <option value="UNREAD">Unread</option>
          <option value="READ">Read</option>
        </select>

        {/* Date */}
        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className={inputClass}
        />

        {/* Apply */}
        <button
          type="button"
          onClick={handleApplyFilters}
          className="bg-gold text-navy font-semibold px-4 py-2 rounded-lg hover:opacity-90 text-sm flex-shrink-0"
        >
          Apply Filters
        </button>
      </div>

      {/* ── Notification List ── */}
      {isLoading ? (
        <div className="text-center py-16 text-gray-400">Loading notifications...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">No notifications found</div>
      ) : (
        filtered.map((nr) => {
          const n = nr.notification;
          if (!n) return null;
          const isUnread = nr.status === 'UNREAD';

          return (
            <div
              key={nr.id}
              className={`bg-white rounded-xl border border-gray-200 mb-3 overflow-hidden transition-colors ${
                isUnread ? 'border-l-4 border-l-gold bg-gold/5' : 'border-l-4 border-l-transparent'
              }`}
            >
              <div className="px-4 py-4 flex items-start gap-3">
                <NotificationIcon type={n.type} isUnread={isUnread} />

                <div className="flex-1 min-w-0">
                  {/* Title row */}
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-sm font-semibold text-gray-900">{n.title}</span>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide ${
                        isUnread ? 'bg-gold text-navy' : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {TYPE_LABELS[n.type]}
                    </span>
                    <span className="text-xs text-gray-400 ml-auto">
                      {relativeTime(n.createdAt)}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">{n.message}</p>

                  {/* Meta row */}
                  <div className="flex items-center gap-4 text-xs text-gray-400 mb-3">
                    {n.branchId && (
                      <span className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Branch
                      </span>
                    )}
                    {(n.bookingId || n.billingId) && (
                      <span className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        {n.bookingId ? `Booking #${n.bookingId.slice(0, 8)}` : `Billing #${n.billingId!.slice(0, 8)}`}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setOverviewRecipient(null);
                        setSendMsgRecipient(null);
                        setDetailRecipient(nr);
                      }}
                      className="border border-gold text-gold px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-gold/5 transition-colors"
                    >
                      View Details
                    </button>
                    {isUnread && (
                      <button
                        type="button"
                        onClick={() => markRead.mutate(nr.id)}
                        disabled={markRead.isPending}
                        className="text-xs text-gray-500 hover:text-gray-700 font-medium disabled:opacity-50"
                      >
                        Mark as Read
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })
      )}

      {/* ── Footer ── */}
      {!isLoading && filtered.length > 0 && (
        <div className="flex flex-col items-center gap-3 mt-6">
          {filtered.length < total && (
            <button
              type="button"
              onClick={() => setLimit((l) => l + 20)}
              className="border border-gray-300 text-gray-600 px-5 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors"
            >
              Load Older Notifications
            </button>
          )}
          <p className="text-xs text-gray-400">
            Showing {filtered.length} of {total} global notifications
          </p>
        </div>
      )}

      {/* ── Floating broadcast button ── */}
      <button
        type="button"
        onClick={() => {
          if (filtered.length > 0) setSendMsgRecipient(filtered[0]);
        }}
        className="fixed bottom-6 right-6 z-40 w-12 h-12 bg-gold text-navy rounded-full shadow-lg hover:opacity-90 flex items-center justify-center transition-opacity"
        aria-label="Send broadcast message"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
        </svg>
      </button>

      {/* ── Modals ── */}
      {detailRecipient && (
        <NotificationDetailModal
          open
          onClose={() => setDetailRecipient(null)}
          recipient={detailRecipient}
          onMarkRead={() => handleMarkRead(detailRecipient)}
          isPending={markRead.isPending}
        />
      )}

      {overviewRecipient && (
        <NotificationOverviewModal
          open
          onClose={() => setOverviewRecipient(null)}
          recipient={overviewRecipient}
          onMarkRead={() => handleMarkRead(overviewRecipient)}
          isPending={markRead.isPending}
        />
      )}

      {sendMsgRecipient && (
        <SendMessageModal
          open
          onClose={() => setSendMsgRecipient(null)}
          recipient={sendMsgRecipient}
        />
      )}
    </div>
  );
};

export default SuperAdminNotificationsPage;
