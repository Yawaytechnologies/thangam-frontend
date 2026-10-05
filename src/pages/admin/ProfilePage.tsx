import React, { useEffect, useState } from 'react';
import {
  Activity,
  Bell,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  IdCard,
  Mail,
  MapPin,
  Phone,
  ReceiptText,
  ShieldCheck,
  UserPlus,
} from 'lucide-react';
import { useAdminProfile } from '../../hooks/useAdmins';
import { useLatestNotifications } from '../../hooks/useNotifications';
import { useAdminBillingActivity, useAdminBookingActivity, useAdminMemberActivity } from '../../hooks/useDashboard';
import { resolveFileUrl } from '../../lib/file-url';
import { useAuthStore } from '../../stores/auth.store';
import type { NotificationRecipient } from '../../types';
import type { AdminBillingActivity, AdminBookingActivity, AdminMemberActivity } from '../../api/dashboard.api';

const EMPTY_VALUE = '-';

type AdminWithPhoto = {
  id?: string;
  adminId?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  status?: string;
  createdAt?: string;
  photo?: string;
  photoUrl?: string;
  profilePhoto?: string;
  profileImage?: string;
  avatar?: string;
  avatarUrl?: string;
  imageUrl?: string;
  branch?: { name?: string };
};

type ProfileActivity = {
  id: string;
  kind: 'member' | 'booking' | 'billing' | 'notification';
  title: string;
  message: string;
  createdAt: string;
  notificationType?: string;
};

function getTextField(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : '';
}

function formatDate(value?: string) {
  if (!value) return EMPTY_VALUE;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return EMPTY_VALUE;
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatTime(value?: string) {
  if (!value) return EMPTY_VALUE;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return EMPTY_VALUE;
  return date.toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function getProfilePhotoUrl(source?: AdminWithPhoto | null) {
  if (!source) return '';
  return resolveFileUrl(
    getTextField(source.photo) ||
      getTextField(source.photoUrl) ||
      getTextField(source.profilePhoto) ||
      getTextField(source.profileImage) ||
      getTextField(source.avatar) ||
      getTextField(source.avatarUrl) ||
      getTextField(source.imageUrl),
  );
}

function getActivityItems(value: unknown): NotificationRecipient[] {
  if (Array.isArray(value)) return value as NotificationRecipient[];
  if (!value || typeof value !== 'object') return [];

  const record = value as Record<string, unknown>;
  for (const key of ['data', 'notifications', 'items']) {
    if (Array.isArray(record[key])) return record[key] as NotificationRecipient[];
  }

  return [];
}

function DetailTile({
  icon: Icon,
  label,
  value,
  className = '',
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={`min-h-[116px] rounded-md border border-stone-100 bg-white p-4 ${className}`}>
      <div className="flex items-center gap-2 text-xs font-semibold uppercase text-gray-500">
        <Icon className="h-4 w-4 text-[#a47d05]" />
        {label}
      </div>
      <p className="mt-2 max-w-full text-[15px] font-semibold leading-6 text-gray-900 [overflow-wrap:anywhere]">
        {value || EMPTY_VALUE}
      </p>
    </div>
  );
}

function ProfileActivityItem({ activity }: { activity: ProfileActivity }) {
  const config =
    activity.kind === 'notification'
      ? String(activity.notificationType || '').includes('BOOKING')
        ? { icon: ClipboardList, tone: 'bg-teal-50 text-teal-700' }
        : String(activity.notificationType || '').includes('BILLING')
          ? { icon: ReceiptText, tone: 'bg-amber-50 text-amber-700' }
          : String(activity.notificationType || '').includes('MEMBER')
            ? { icon: UserPlus, tone: 'bg-teal-50 text-teal-700' }
            : { icon: Bell, tone: 'bg-stone-100 text-stone-600' }
      : activity.kind === 'member'
        ? { icon: UserPlus, tone: 'bg-teal-50 text-teal-700' }
        : activity.kind === 'booking'
          ? { icon: ClipboardList, tone: 'bg-teal-50 text-teal-700' }
          : { icon: ReceiptText, tone: 'bg-amber-50 text-amber-700' };
  const Icon = config.icon;

  return (
    <article className="flex gap-3 border-b border-stone-100 py-4 last:border-b-0">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md ${config.tone}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
          <p className="text-sm font-semibold text-gray-900">{activity.title}</p>
          <time className="shrink-0 text-xs font-medium text-gray-500">{formatTime(activity.createdAt)}</time>
        </div>
        <p className="mt-1 text-sm leading-6 text-gray-600">{activity.message}</p>
      </div>
    </article>
  );
}

const AdminProfilePage: React.FC = () => {
  const [imageFailed, setImageFailed] = useState(false);
  const [currentTime, setCurrentTime] = useState(() => Date.now());
  const { user } = useAuthStore();
  const { data: profileAdmin, isLoading: isProfileLoading, isError: isProfileError } = useAdminProfile();
  const { data: latestNotifications } = useLatestNotifications();
  const { data: memberActivity, isLoading: isMemberActivityLoading } = useAdminMemberActivity();
  const { data: bookingActivity, isLoading: isBookingActivityLoading } = useAdminBookingActivity();
  const { data: billingActivity, isLoading: isBillingActivityLoading } = useAdminBillingActivity();
  const admin = (profileAdmin || user?.admin) as AdminWithPhoto | undefined;
  const photoUrl = imageFailed ? '' : getProfilePhotoUrl(admin);
  const name = admin?.fullName || user?.email || 'Admin';
  const status = admin?.status || user?.status || EMPTY_VALUE;
  const branch = admin?.branch?.name || EMPTY_VALUE;
  const email = admin?.email || user?.email || EMPTY_VALUE;
  const phone = admin?.phone || user?.phone || EMPTY_VALUE;
  const adminId = admin?.adminId || admin?.id || user?.id || EMPTY_VALUE;
  const initials =
    name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase() || 'A';

  useEffect(() => {
    const timer = window.setInterval(() => setCurrentTime(Date.now()), 60 * 1000);
    return () => window.clearInterval(timer);
  }, []);

  const activityCutoff = currentTime - 24 * 60 * 60 * 1000;
  const operationalActivities: ProfileActivity[] = [
    ...(memberActivity ?? []).map((item: AdminMemberActivity) => ({
      id: `member-${item.id}`,
      kind: 'member' as const,
      title: 'Member added',
      message: `${item.fullName} (${item.memberId}) - ${item.role.replace(/_/g, ' ')} member record created.`,
      createdAt: item.createdAt,
    })),
    ...(bookingActivity ?? []).map((item: AdminBookingActivity) => ({
      id: `booking-${item.id}`,
      kind: 'booking' as const,
      title: 'Booking created',
      message: `${item.bookingId} - ${item.applicantName} booked ${item.projectName}, ${item.plotNumber}.`,
      createdAt: item.bookingDate,
    })),
    ...(billingActivity ?? []).map((item: AdminBillingActivity) => ({
      id: `billing-${item.id}`,
      kind: 'billing' as const,
      title: 'Billing added',
      message: `${item.billingId} - ${item.buyerName} payment recorded for Rs. ${Number(item.amountInNumbers || 0).toLocaleString('en-IN')}.`,
      createdAt: '',
    })),
    ...getActivityItems(latestNotifications).map((recipient) => ({
      id: `notification-${recipient.id}`,
      kind: 'notification' as const,
      title: recipient.notification?.title || 'Operational update',
      message: recipient.notification?.message || 'A new activity was recorded.',
      createdAt: recipient.notification?.createdAt || '',
      notificationType: recipient.notification?.type,
    })),
  ]
    .filter((activity) => {
      const createdAt = new Date(activity.createdAt).getTime();
      return Number.isFinite(createdAt) && createdAt >= activityCutoff;
    })
    .sort((first, second) => {
      const firstTime = new Date(first.createdAt).getTime();
      const secondTime = new Date(second.createdAt).getTime();
      return (Number.isFinite(secondTime) ? secondTime : 0) - (Number.isFinite(firstTime) ? firstTime : 0);
    })
    .slice(0, 10);
  const isActivityLoading = isMemberActivityLoading || isBookingActivityLoading || isBillingActivityLoading;

  return (
    <div className="min-h-full bg-[#f7f4ee] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-[1180px]">
        <header className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9a7300]">Account Center</p>
          <h1 className="mt-1 text-3xl font-bold leading-tight text-gray-950">Admin Profile</h1>
          <p className="mt-2 text-sm text-gray-600">Manage your branch identity, contact details, and recent account activity.</p>
        </header>

        {isProfileLoading && !admin ? (
          <div className="rounded-md border border-stone-100 bg-white p-8 text-sm font-semibold text-gray-500 shadow-sm">Loading profile details...</div>
        ) : isProfileError && !admin ? (
          <div className="rounded-md border border-red-100 bg-red-50 p-8 text-sm font-semibold text-red-700">Unable to load profile details.</div>
        ) : (
          <div className="space-y-6">
            <section className="overflow-hidden rounded-md border border-stone-100 bg-white shadow-sm">
              <div className="border-t-4 border-[#b58b12] bg-gradient-to-r from-white via-[#fffaf0] to-white px-5 py-6 sm:px-7">
                <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-md border border-[#efe3c5] bg-[#0d4f4a] text-3xl font-bold text-white shadow-sm">
                      {photoUrl ? (
                        <img src={photoUrl} alt={`${name} profile`} className="h-full w-full object-cover" onError={() => setImageFailed(true)} />
                      ) : (
                        initials
                      )}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-2xl font-bold text-gray-950">{name}</h2>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold uppercase text-teal-700">
                          <ShieldCheck className="h-3.5 w-3.5" />
                          Senior Branch Admin
                        </span>
                      </div>
                      <p className="mt-2 flex items-center gap-2 text-sm font-medium text-gray-600">
                        <IdCard className="h-4 w-4 text-[#a47d05]" />
                        {adminId}
                      </p>
                      <p className="mt-1 flex items-center gap-2 text-sm font-medium text-gray-600">
                        <MapPin className="h-4 w-4 text-[#a47d05]" />
                        {branch}
                      </p>
                    </div>
                  </div>

                  <div className="inline-flex w-fit items-center gap-2 rounded-full bg-teal-50 px-4 py-2 text-sm font-semibold uppercase text-teal-700">
                    <span className="h-2 w-2 rounded-full bg-teal-600" />
                    {status}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 bg-[#fcfaf5] p-5 sm:grid-cols-2 lg:grid-cols-[0.9fr_1.35fr_0.9fr_1fr]">
                <DetailTile icon={CalendarDays} label="Joined" value={formatDate(admin?.createdAt)} />
                <DetailTile icon={Mail} label="Email Address" value={email} className="lg:min-w-[320px]" />
                <DetailTile icon={Phone} label="Phone Number" value={phone} />
                <DetailTile icon={MapPin} label="Assigned Branch" value={branch} />
              </div>
            </section>

            <section className="rounded-md border border-stone-100 bg-white px-5 py-5 shadow-sm sm:px-6">
              <div className="flex flex-col gap-2 border-b border-stone-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-md bg-amber-50 text-[#a47d05]">
                    <Activity className="h-4 w-4" />
                  </span>
                  <div>
                    <h2 className="text-base font-bold text-gray-950">Recent Operational Activity</h2>
                    <p className="text-sm text-gray-500">Latest branch updates from the last 24 hours.</p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-gray-500">{operationalActivities.length} updates</span>
              </div>

              {isActivityLoading ? (
                <p className="py-10 text-center text-sm font-medium text-gray-500">Loading recent activity...</p>
              ) : operationalActivities.length ? (
                <div>{operationalActivities.map((activity) => <ProfileActivityItem key={activity.id} activity={activity} />)}</div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-2 py-14 text-center">
                  <CheckCircle2 className="h-8 w-8 text-teal-600" />
                  <p className="text-base font-semibold text-gray-800">No recent operational activity</p>
                  <p className="text-sm text-gray-500">New bookings, billing, and member updates will appear here.</p>
                </div>
              )}
            </section>
          </div>
        )}

        <footer className="mt-8 flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
          <CalendarDays className="h-3.5 w-3.5" />
          Sri Thangam Housing Enterprise Audit Ready
        </footer>
      </div>
    </div>
  );
};

export default AdminProfilePage;
