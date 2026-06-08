import React, { useState } from 'react';
import {
  CalendarDays,
  Mail,
  Phone,
} from 'lucide-react';
import { useAdminProfile } from '../../hooks/useAdmins';
import { resolveFileUrl } from '../../lib/file-url';
import { useAuthStore } from '../../stores/auth.store';

const EMPTY_VALUE = '-';

type AdminWithPhoto = {
  photo?: string;
  photoUrl?: string;
  profilePhoto?: string;
  profileImage?: string;
  avatar?: string;
  avatarUrl?: string;
  imageUrl?: string;
};

function getTextField(source: unknown) {
  return typeof source === 'string' && source.trim() ? source.trim() : '';
}

function formatDate(value?: string) {
  if (!value) return EMPTY_VALUE;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return EMPTY_VALUE;
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
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

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-stone-100 bg-stone-50/60 px-4 py-3">
      <p className="text-[11px] font-extrabold uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-1 break-words text-sm font-bold text-gray-900">{value || EMPTY_VALUE}</p>
    </div>
  );
}

const AdminProfilePage: React.FC = () => {
  const [imageFailed, setImageFailed] = useState(false);
  const { user } = useAuthStore();
  const {
    data: profileAdmin,
    isLoading: isProfileLoading,
    isError: isProfileError,
  } = useAdminProfile();

  const admin = profileAdmin || user?.admin;
  const adminPhotoSource = admin as AdminWithPhoto | undefined;
  const branch = admin?.branch;
  const photoUrl = imageFailed ? '' : getProfilePhotoUrl(adminPhotoSource);

  const profile = {
    name: admin?.fullName || EMPTY_VALUE,
    role: user?.role || EMPTY_VALUE,
    id: admin?.adminId || admin?.id || user?.id || EMPTY_VALUE,
    status: admin?.status || user?.status || EMPTY_VALUE,
    branch: branch?.name || EMPTY_VALUE,
    joined: formatDate(admin?.createdAt),
    email: admin?.email || user?.email || EMPTY_VALUE,
    phone: admin?.phone || user?.phone || EMPTY_VALUE,
    lastLogin: formatDate(user?.lastLoginAt),
  };

  const initials = profile.name === EMPTY_VALUE ? EMPTY_VALUE : profile.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');

  return (
    <div className="space-y-5 p-4 sm:p-6">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-2xl font-extrabold text-gray-900">My Profile</h1>
        <p className="mt-1 text-sm text-gray-700">View operational account information.</p>
      </div>

      <div className="mx-auto max-w-5xl">
        <section className="overflow-hidden rounded-md border border-stone-100 border-t-4 border-t-gold bg-white shadow-sm">
          <div className="p-5 sm:p-6">
            {isProfileLoading ? (
              <p className="text-sm font-semibold text-gray-600">Loading profile details...</p>
            ) : isProfileError ? (
              <p className="text-sm font-semibold text-red-600">Unable to load profile details.</p>
            ) : (
              <>
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                  <div className="flex h-24 w-24 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl border-4 border-amber-100 bg-gradient-to-br from-teal-800 to-teal-500 shadow-sm">
                    {photoUrl ? (
                      <img
                        src={photoUrl}
                        alt={`${profile.name} profile`}
                        className="h-full w-full object-cover"
                        onError={() => setImageFailed(true)}
                      />
                    ) : (
                      <span className="text-3xl font-extrabold text-white">{initials}</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <h2 className="break-words text-xl font-extrabold text-gray-900">{profile.name}</h2>
                        <p className="mt-1 text-xs font-semibold text-gray-500">ID: {profile.id}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wide text-teal-700">
                          {profile.role}
                        </span>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-extrabold uppercase text-teal-700">
                          <span className="h-1.5 w-1.5 rounded-full bg-teal-600" />
                          {profile.status}
                        </span>
                      </div>
                    </div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div className="flex items-start gap-3">
                        <Mail className="mt-1 h-4 w-4 flex-shrink-0 text-gold" />
                        <div className="min-w-0">
                          <p className="text-[11px] font-extrabold uppercase tracking-wide text-gray-500">Email Address</p>
                          <p className="mt-1 break-all text-sm font-bold text-gray-900">{profile.email}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Phone className="mt-1 h-4 w-4 flex-shrink-0 text-gold" />
                        <div className="min-w-0">
                          <p className="text-[11px] font-extrabold uppercase tracking-wide text-gray-500">Phone Number</p>
                          <p className="mt-1 text-sm font-bold text-gray-900">{profile.phone}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="my-5 border-t border-stone-100" />

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <DetailItem label="Assigned Branch" value={profile.branch} />
                  <DetailItem label="Joined Date" value={profile.joined} />
                  <DetailItem label="Role" value={profile.role} />
                  <DetailItem label="Status" value={profile.status} />
                  <DetailItem label="Admin ID" value={profile.id} />
                  <DetailItem label="Last Login" value={profile.lastLogin} />
                </div>
              </>
            )}
          </div>
        </section>
      </div>

      <div className="flex items-center justify-center gap-2 pt-2 text-[10px] font-bold uppercase tracking-wide text-gray-400">
        <CalendarDays className="h-3.5 w-3.5" />
        SRI THANGAM HOUSING ENTERPRISE AUDIT READY
      </div>
    </div>
  );
};

export default AdminProfilePage;
