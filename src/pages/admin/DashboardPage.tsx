import React from 'react';
import { AlertCircle, CalendarDays, CalendarRange, UserCheck, UserPlus, Users } from 'lucide-react';
import { useMembers } from '../../hooks/useMembers';
import type { Member, Role } from '../../types';

interface StatCardProps {
  title: string;
  value: string | number;
  accentClass: string;
  icon: React.ReactNode;
}

interface PerformerGroup {
  title: string;
  roles: Role[];
  colorClass: string;
}

const performerGroups: PerformerGroup[] = [
  {
    title: 'Directors and Executive Directors',
    roles: ['DIRECTOR', 'EXECUTIVE_DIRECTOR'],
    colorClass: 'text-amber-700',
  },
  {
    title: 'Deputy Directors',
    roles: ['DEPUTY_DIRECTOR'],
    colorClass: 'text-blue-700',
  },
  {
    title: 'Senior Managers',
    roles: ['SENIOR_MANAGER'],
    colorClass: 'text-orange-700',
  },
];

const roleLabels: Record<Role, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
  DIRECTOR: 'Director',
  EXECUTIVE_DIRECTOR: 'Executive Director',
  DEPUTY_DIRECTOR: 'Deputy Director',
  SENIOR_MANAGER: 'Senior Manager',
  BUSINESS_MANAGER: 'Business Manager',
  AGENT: 'Agent',
};

const StatCard: React.FC<StatCardProps> = ({ title, value, accentClass, icon }) => (
  <div className={`rounded-lg border border-gray-200 bg-white p-4 shadow-sm ${accentClass}`}>
    <div className="flex items-start justify-between gap-3">
      <p className="text-xs font-bold uppercase tracking-wide text-gray-700">{title}</p>
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-gold">
        {icon}
      </div>
    </div>
    <p className="mt-3 text-2xl font-bold text-gray-900">{value}</p>
  </div>
);

const Avatar: React.FC<{ name: string }> = ({ name }) => (
  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-gray-800 to-gray-500 text-sm font-bold text-white shadow-sm">
    {name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('') || 'M'}
  </div>
);

const PerformerCard: React.FC<{ member: Member; index: number }> = ({ member, index }) => {
  const teamPercentage = 0;
  const profileViews = 0;

  return (
    <div className="rounded-lg border border-amber-100 bg-amber-50/70 p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <Avatar name={member.fullName} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-gray-900">{member.fullName}</p>
              <p className="mt-0.5 truncate text-xs text-gray-500">{member.memberId}</p>
            </div>
            <span className="rounded-full bg-gold px-2 py-0.5 text-[10px] font-bold text-navy">
              #{index + 1}
            </span>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
            <span className="rounded bg-white px-2 py-0.5 font-semibold text-gray-700">
              {roleLabels[member.role]}
            </span>
            <span className="flex items-center gap-1 font-semibold text-teal-700">
              <span className="h-1.5 w-1.5 rounded-full bg-teal-600" />
              {member.status === 'ACTIVE' ? 'Active' : member.status.toLowerCase()}
            </span>
          </div>
          <p className="mt-2 truncate text-xs text-gray-500">{member.branch?.name ?? 'Branch network'}</p>
        </div>
      </div>

      <div className="mt-4 border-t border-amber-100 pt-3">
        <div className="mb-1 flex items-center justify-between text-[11px] font-bold uppercase text-gray-600">
          <span>Team Members</span>
          <span>{teamPercentage}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-white">
          <div className="h-full rounded-full bg-gold" style={{ width: `${teamPercentage}%` }} />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
          <div>
            <p className="font-bold uppercase text-gray-500">Profile Views</p>
            <p className="mt-1 text-base font-bold text-gray-900">{profileViews}</p>
          </div>
          <div>
            <p className="font-bold uppercase text-gray-500">Status</p>
            <p className="mt-1 text-base font-bold text-gray-900">{member.status}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const isSameDay = (date: Date, compare: Date) =>
  date.getFullYear() === compare.getFullYear() &&
  date.getMonth() === compare.getMonth() &&
  date.getDate() === compare.getDate();

const getWeekStart = (date: Date) => {
  const start = new Date(date);
  const day = start.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + diff);
  start.setHours(0, 0, 0, 0);
  return start;
};

const parseCreatedAt = (member: Member) => {
  const date = new Date(member.createdAt);
  return Number.isNaN(date.getTime()) ? null : date;
};

const sortPerformers = (a: Member, b: Member) => {
  if (a.status !== b.status) return a.status === 'ACTIVE' ? -1 : 1;
  return a.fullName.localeCompare(b.fullName);
};

const AdminDashboardPage: React.FC = () => {
  const { data: membersResponse, isLoading } = useMembers({ limit: 1000 });
  const members = membersResponse?.data ?? [];
  const today = new Date();
  const weekStart = getWeekStart(today);
  const totalMembers = membersResponse?.total ?? members.length;

  const joinedToday = members.filter((member) => {
    const joinedAt = parseCreatedAt(member);
    return joinedAt ? isSameDay(joinedAt, today) : false;
  }).length;

  const joinedThisWeek = members.filter((member) => {
    const joinedAt = parseCreatedAt(member);
    return joinedAt ? joinedAt >= weekStart && joinedAt <= today : false;
  }).length;

  const joinedThisMonth = members.filter((member) => {
    const joinedAt = parseCreatedAt(member);
    return joinedAt
      ? joinedAt.getFullYear() === today.getFullYear() && joinedAt.getMonth() === today.getMonth()
      : false;
  }).length;

  const activeMembers = members.filter((member) => member.status === 'ACTIVE').length;
  const pendingActions = members.filter((member) => member.status === 'PENDING' || member.status === 'INACTIVE').length;

  const stats: StatCardProps[] = [
    { title: 'Members Today', value: isLoading ? '-' : joinedToday, accentClass: 'border-t-2 border-t-gold', icon: <UserPlus className="h-4 w-4" /> },
    { title: 'Joined This Week', value: isLoading ? '-' : joinedThisWeek, accentClass: 'border-t-2 border-t-teal-700', icon: <CalendarDays className="h-4 w-4" /> },
    { title: 'Joined This Month', value: isLoading ? '-' : joinedThisMonth, accentClass: 'border-t-2 border-t-gold', icon: <CalendarRange className="h-4 w-4" /> },
    { title: 'Total Members', value: isLoading ? '-' : totalMembers.toLocaleString('en-IN'), accentClass: 'border-t-2 border-t-teal-700', icon: <Users className="h-4 w-4" /> },
    { title: 'Active Members', value: isLoading ? '-' : activeMembers.toLocaleString('en-IN'), accentClass: 'border-t-2 border-t-gold', icon: <UserCheck className="h-4 w-4" /> },
    { title: 'Pending Actions', value: isLoading ? '-' : pendingActions.toLocaleString('en-IN'), accentClass: 'border-t-2 border-t-red-600', icon: <AlertCircle className="h-4 w-4" /> },
  ];

  return (
    <div className="p-4 sm:p-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      <section className="mt-5 rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900">Hierarchy Top Performers</h1>
          <p className="mt-1 text-sm text-gray-600">
            Role-wise top active members under this admin network.
          </p>
        </div>

        <div className="space-y-7">
          {performerGroups.map((group) => {
            const performers = members
              .filter((member) => group.roles.includes(member.role))
              .sort(sortPerformers)
              .slice(0, 3);

            return (
              <div key={group.title}>
                <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-3">
                  <div className={`flex items-center gap-2 text-sm font-bold ${group.colorClass}`}>
                    <span className="flex h-5 w-5 items-center justify-center rounded-full border border-current text-[10px]">
                      +
                    </span>
                    <span>
                      {group.title} · {performers.length} Members
                    </span>
                  </div>
                </div>

                {isLoading ? (
                  <div className="rounded-lg border border-gray-100 bg-gray-50 p-5 text-sm text-gray-500">
                    Loading performers...
                  </div>
                ) : performers.length ? (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {performers.map((member, index) => (
                      <PerformerCard key={member.id} member={member} index={index} />
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg border border-gray-100 bg-gray-50 p-5 text-sm text-gray-500">
                    No members found for this role group.
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default AdminDashboardPage;
