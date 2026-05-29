import React from 'react';
import {
  Bell,
  CalendarDays,
  FileText,
  Mail,
  Phone,
  ShieldCheck,
  UserPlus,
} from 'lucide-react';
import { useAuthStore } from '../../stores/auth.store';

const fallbackProfile = {
  name: 'Arjun Varma',
  role: 'SENIOR BRANCH ADMIN',
  id: 'ST-ADM-244',
  status: 'ACTIVE',
  branch: 'Chennai Central',
  joined: '15 Jan 2018',
  email: 'arjun.varma@sthousings.com',
  phone: '+91 98765 43210',
};

const activities = [
  {
    title: 'Booking created',
    description: 'Emerald Heights #14A - Automated reservation logging system',
    time: 'Oct 12, 10:30 AM',
    icon: <ShieldCheck className="h-4 w-4" />,
    tone: 'bg-teal-50 text-teal-700',
  },
  {
    title: 'Billing added',
    description: 'BL-2024-0892 - Systematic invoice generation for Q4 processing',
    time: 'Oct 12, 11:15 AM',
    icon: <FileText className="h-4 w-4" />,
    tone: 'bg-amber-50 text-gold',
  },
  {
    title: 'Notification marked as read',
    description: 'Property Access Update - Security protocol verification completed',
    time: 'Oct 11, 09:00 AM',
    icon: <Bell className="h-4 w-4" />,
    tone: 'bg-stone-100 text-gold',
  },
  {
    title: 'Member added',
    description: 'Rajesh Kumar - New executive member registered under Chennai Central',
    time: 'Oct 10, 02:45 PM',
    icon: <UserPlus className="h-4 w-4" />,
    tone: 'bg-emerald-50 text-teal-700',
  },
];

function formatDate(value?: string) {
  if (!value) return fallbackProfile.joined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallbackProfile.joined;
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

const AdminProfilePage: React.FC = () => {
  const { user } = useAuthStore();
  const admin = user?.admin;
  const branch = admin?.branch;

  const profile = {
    name: admin?.fullName || fallbackProfile.name,
    role: fallbackProfile.role,
    id: admin?.adminId || fallbackProfile.id,
    status: admin?.status || user?.status || fallbackProfile.status,
    branch: branch?.name || fallbackProfile.branch,
    joined: admin?.createdAt ? formatDate(admin.createdAt) : fallbackProfile.joined,
    email: admin?.email || user?.email || fallbackProfile.email,
    phone: admin?.phone || user?.phone || fallbackProfile.phone,
  };

  const initials = profile.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');

  return (
    <div className="space-y-7 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900">My Profile</h1>
        <p className="mt-1 text-sm text-gray-700">View operational account information and activity.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[0.82fr_1.18fr]">
        <section className="overflow-hidden rounded-md border border-stone-100 border-t-4 border-t-gold bg-white shadow-sm">
          <div className="px-6 py-7">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-lg border-4 border-amber-100 bg-gradient-to-br from-teal-800 to-teal-500 shadow-sm">
                <span className="text-3xl font-extrabold text-white">{initials || 'AV'}</span>
              </div>
              <h2 className="mt-4 text-lg font-extrabold text-gray-900">{profile.name}</h2>
              <span className="mt-2 rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wide text-teal-700">
                {profile.role}
              </span>
              <p className="mt-2 text-xs font-semibold text-gray-500">ID: {profile.id}</p>
            </div>

            <div className="my-7 border-t border-stone-100" />

            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm font-semibold text-gray-600">Status</span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-extrabold uppercase text-teal-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-teal-600" />
                  {profile.status}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm font-semibold text-gray-600">Assigned Branch</span>
                <span className="text-sm font-bold text-gray-900">{profile.branch}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm font-semibold text-gray-600">Joined</span>
                <span className="text-sm font-bold text-gray-900">{profile.joined}</span>
              </div>
            </div>

            <div className="my-7 border-t border-stone-100" />

            <div className="space-y-5">
              <div className="flex items-start gap-3">
                <Mail className="mt-1 h-4 w-4 flex-shrink-0 text-gold" />
                <div>
                  <p className="text-[11px] font-extrabold uppercase tracking-wide text-gray-500">Email Address</p>
                  <p className="mt-1 break-all text-sm font-bold text-gray-900">{profile.email}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="mt-1 h-4 w-4 flex-shrink-0 text-gold" />
                <div>
                  <p className="text-[11px] font-extrabold uppercase tracking-wide text-gray-500">Phone Number</p>
                  <p className="mt-1 text-sm font-bold text-gray-900">{profile.phone}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-md border border-stone-100 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-extrabold text-gray-900">Recent Operational Activity</h2>
          <div className="mt-6 space-y-5">
            {activities.map((activity) => (
              <div key={activity.title} className="flex gap-4">
                <span className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-md ${activity.tone}`}>
                  {activity.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                    <h3 className="text-sm font-extrabold text-gray-900">{activity.title}</h3>
                    <span className="text-xs font-semibold text-gray-500">{activity.time}</span>
                  </div>
                  <p className="mt-1 text-sm leading-5 text-gray-700">{activity.description}</p>
                </div>
              </div>
            ))}
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
