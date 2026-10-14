import { BoardDirectorCard, MemberDetailsModal, type HierarchyNode } from '../super-admin/MembersPage';
import React from 'react';
import {
  BadgeCheck,
  CalendarCheck2,
  CalendarClock,
  ChevronRight,
  CircleAlert,
  Network,
  UserRoundPlus,
} from 'lucide-react';
import { useAdminMemberActivity, useAdminStats } from '../../hooks/useDashboard';
import { useMembers, useTeam } from '../../hooks/useMembers';
import { useNavigate } from 'react-router-dom';
import type { Member, Role } from '../../types';

interface StatCardProps {
  title: string;
  value: string | number;
  accentClass: string;
  icon: React.ReactNode;
  iconClass: string;
}

interface PerformerGroup {
  title: string;
  roles: Role[];
  colorClass: string;
}

interface PerformerMember {
  id: string;
  memberId: string;
  codeNumber?: string;
  fullName: string;
  name?: string;
  phone?: string;
  alternatePhone?: string;
  email?: string;
  role: Role | string;
  reportsToId?: string;
  reportsTo?: Partial<PerformerMember> | string;
  branchId?: string;
  status: string;
  createdAt: string;
  branch?: Member['branch'];
  city?: string;
  district?: string;
  state?: string;
  pincode?: string;
  address?: string;
  introName?: string;
  dateOfBirth?: string;
  bloodGroup?: string;
  qualification?: string;
  experience?: string;
  nomineeName?: string;
  nomineeRelation?: string;
  nomineePhone?: string;
  panNumber?: string;
  aadhaarNumber?: string;
  propertyReferralCount?: number;
  directTeamCount?: number;
}

const performerGroups: PerformerGroup[] = [
  {
    title: 'Directors',
    roles: ['DIRECTOR'],
    colorClass: 'text-amber-700',
  },
  {
    title: 'Executive Directors',
    roles: ['EXECUTIVE_DIRECTOR'],
    colorClass: 'text-teal-700',
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
  {
    title: 'Business Managers',
    roles: ['BUSINESS_MANAGER'],
    colorClass: 'text-teal-700',
  },
  {
    title: 'Agents',
    roles: ['AGENT'],
    colorClass: 'text-gray-700',
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

function normalizeRole(value: unknown): Role | null {
  const normalized = String(value ?? '')
    .trim()
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/[\s-]+/g, '_')
    .toUpperCase();

  if (normalized in roleLabels) return normalized as Role;
  return null;
}

function membersFromResponse(response: unknown): PerformerMember[] {
  if (Array.isArray(response)) return response as PerformerMember[];
  if (!response || typeof response !== 'object') return [];

  const record = response as Record<string, unknown>;
  if (Array.isArray(record.data)) return record.data as PerformerMember[];
  if (Array.isArray(record.members)) return record.members as PerformerMember[];
  if (Array.isArray(record.teamMembers)) return record.teamMembers as PerformerMember[];

  return [];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function normalizeLookupKey(value: unknown) {
  return String(value ?? '').trim().toLowerCase();
}

function getStringField(source: unknown, fields: string[]) {
  if (!isRecord(source)) return '';

  for (const field of fields) {
    const value = source[field];
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  }

  return '';
}

function memberLookupKeys(member: Partial<PerformerMember>) {
  return [
    member.id,
    member.memberId,
    getStringField(member, ['member_id']),
    member.codeNumber,
    getStringField(member, ['code_number']),
    member.fullName,
    member.name,
  ]
    .map(normalizeLookupKey)
    .filter(Boolean);
}

function parentKeysFor(member: PerformerMember) {
  const explicitParent = getStringField(member, [
    'reportsToId',
    'reports_to_id',
    'reportingMemberId',
    'reporting_member_id',
    'reportingToId',
    'reporting_to_id',
    'parentId',
    'parent_id',
    'managerId',
    'manager_id',
    'referredBy',
    'referredById',
    'referred_by',
    'referred_by_id',
    'introducedById',
    'introduced_by_id',
    'introMemberId',
    'intro_member_id',
    'reportsToName',
    'reports_to_name',
    'reportingToName',
    'reporting_to_name',
    'parentName',
    'parent_name',
    'managerName',
    'manager_name',
  ]);

  const nestedParentKeys = [
    'reportsTo',
    'reports_to',
    'reportingMember',
    'reporting_member',
    'reportingTo',
    'reporting_to',
    'parent',
    'referredByMember',
    'referred_by_member',
    'introducedBy',
    'introduced_by',
    'introMember',
    'intro_member',
    'manager',
  ];
  const parentKeys = explicitParent ? [explicitParent] : [];

  for (const key of nestedParentKeys) {
    const value = (member as PerformerMember & Record<string, unknown>)[key];
    if (typeof value === 'string' && value.trim()) parentKeys.push(value);
    if (typeof value === 'number' && Number.isFinite(value)) parentKeys.push(String(value));
    if (isRecord(value)) parentKeys.push(...memberLookupKeys(value as Partial<PerformerMember>));
  }

  return parentKeys.map(normalizeLookupKey).filter(Boolean);
}

function uniqueMembers(members: PerformerMember[]) {
  return members.filter((member, index, list) => list.findIndex((candidate) => candidate.id === member.id) === index);
}

function mergeMembers(primary: PerformerMember[], secondary: PerformerMember[]) {
  const membersById = new Map<string, PerformerMember>();

  for (const member of [...secondary, ...primary]) {
    const existing = membersById.get(member.id);
    membersById.set(member.id, existing ? { ...existing, ...member } : member);
  }

  return Array.from(membersById.values());
}

function countHierarchyMembers(member: PerformerMember, childrenByParent: Map<string, PerformerMember[]>) {
  const visited = new Set<string>();

  const visit = (current: PerformerMember) => {
    for (const key of memberLookupKeys(current)) {
      const children = uniqueMembers(childrenByParent.get(key) ?? []);
      for (const child of children) {
        if (visited.has(child.id)) continue;
        visited.add(child.id);
        visit(child);
      }
    }
  };

  visit(member);
  return visited.size;
}

function getDirectChildren(member: PerformerMember, childrenByParent: Map<string, PerformerMember[]>) {
  return uniqueMembers(memberLookupKeys(member).flatMap((key) => childrenByParent.get(key) ?? [])).sort(sortPerformers);
}

function getDownlineMembers(
  member: PerformerMember,
  childrenByParent: Map<string, PerformerMember[]>,
  visited = new Set<string>(),
): PerformerMember[] {
  if (visited.has(member.id)) return [];
  visited.add(member.id);

  return getDirectChildren(member, childrenByParent).flatMap((child) => [
    child,
    ...getDownlineMembers(child, childrenByParent, visited),
  ]);
}

const StatCard: React.FC<StatCardProps> = ({ title, value, accentClass, icon, iconClass }) => (
  <div className={`rounded-lg border border-gray-200 bg-white p-4 shadow-sm ${accentClass}`}>
    <div className="flex items-start justify-between gap-3">
      <p className="text-xs font-bold uppercase tracking-wide text-gray-700">{title}</p>
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md border bg-white shadow-sm ${iconClass}`}>
        {icon}
      </div>
    </div>
    <p className="mt-3 text-2xl font-bold text-gray-900">{value}</p>
  </div>
);

function asHierarchyMember(member: PerformerMember): HierarchyNode {
  const role = normalizeRole(member.role);
  const reportsTo = typeof member.reportsTo === 'object' ? member.reportsTo : undefined;
  return {
    ...member,
    role: role && role !== 'ADMIN' && role !== 'SUPER_ADMIN' ? role : 'AGENT',
    reportsTo: reportsTo ? { id: reportsTo.id, fullName: reportsTo.fullName, name: reportsTo.name } : undefined,
  };
}

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

const parseCreatedAt = (member: PerformerMember) => {
  const date = new Date(member.createdAt);
  return Number.isNaN(date.getTime()) ? null : date;
};

const sortPerformers = (a: PerformerMember, b: PerformerMember) => {
  if (a.status !== b.status) return a.status === 'ACTIVE' ? -1 : 1;
  return a.fullName.localeCompare(b.fullName);
};

const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [detailMember, setDetailMember] = React.useState<PerformerMember | null>(null);
  const { data: dashboardStats, isLoading: isStatsLoading } = useAdminStats();
  const { data: membersResponse, isLoading: isTeamLoading } = useTeam({ limit: 1000 });
  const { data: allMembersResponse, isLoading: isAllMembersLoading } = useMembers({ limit: 1000 });
  const { data: memberActivity, isLoading: isActivityLoading } = useAdminMemberActivity();
  const activityMembers = membersFromResponse(memberActivity);
  const referralCountsByMemberId = new Map(activityMembers.map((member) => [member.id, member.propertyReferralCount ?? 0]));
  const directTeamCountsByMemberId = new Map(activityMembers.map((member) => [member.id, member.directTeamCount ?? 0]));
  const allMembers = membersFromResponse(allMembersResponse);
  const teamResponseMembers = membersFromResponse(membersResponse).map((member) => ({
    ...member,
    propertyReferralCount: referralCountsByMemberId.get(member.id) ?? member.propertyReferralCount ?? 0,
    directTeamCount: directTeamCountsByMemberId.get(member.id) ?? member.directTeamCount,
  }));
  const members = mergeMembers(teamResponseMembers.length ? teamResponseMembers : activityMembers, allMembers).filter(
    (member) => normalizeRole(member.role) !== 'SUPER_ADMIN',
  );
  const childrenByParent = members.reduce<Map<string, PerformerMember[]>>((map, member) => {
    parentKeysFor(member).forEach((key) => map.set(key, [...(map.get(key) ?? []), member]));
    return map;
  }, new Map());
  const hierarchyTeamCounts = new Map(
    members.map((member) => [member.id, countHierarchyMembers(member, childrenByParent)]),
  );
  const isLoading = isStatsLoading || isTeamLoading || isAllMembersLoading || isActivityLoading;
  const today = new Date();
  const weekStart = getWeekStart(today);

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
  const statsTotalMembers = Number(dashboardStats?.totalMembers);
  const teamMembers = Number.isFinite(statsTotalMembers) ? statsTotalMembers : members.length;
  const groupedPerformers = performerGroups.map((group) => ({
    ...group,
    performers: members
      .filter((member) => {
        const role = normalizeRole(member.role);
        return role ? group.roles.includes(role) : false;
      })
      .sort(sortPerformers),
  }));
  const hasAnyPerformers = groupedPerformers.some((group) => group.performers.length > 0);

  const stats: StatCardProps[] = [
    {
      title: 'Members Today',
      value: isLoading ? '-' : joinedToday,
      accentClass: 'border-t-2 border-t-gold',
      iconClass: 'border-amber-100 text-gold',
      icon: <UserRoundPlus className="h-5 w-5" strokeWidth={1.9} />,
    },
    {
      title: 'Joined This Week',
      value: isLoading ? '-' : joinedThisWeek,
      accentClass: 'border-t-2 border-t-teal-700',
      iconClass: 'border-teal-100 text-teal-700',
      icon: <CalendarCheck2 className="h-5 w-5" strokeWidth={1.9} />,
    },
    {
      title: 'Joined This Month',
      value: isLoading ? '-' : joinedThisMonth,
      accentClass: 'border-t-2 border-t-gold',
      iconClass: 'border-amber-100 text-gold',
      icon: <CalendarClock className="h-5 w-5" strokeWidth={1.9} />,
    },
    {
      title: 'Team Members',
      value: isLoading ? '-' : teamMembers.toLocaleString('en-IN'),
      accentClass: 'border-t-2 border-t-teal-700',
      iconClass: 'border-teal-100 text-teal-700',
      icon: <Network className="h-5 w-5" strokeWidth={1.9} />,
    },
    {
      title: 'Active Members',
      value: isLoading ? '-' : activeMembers.toLocaleString('en-IN'),
      accentClass: 'border-t-2 border-t-gold',
      iconClass: 'border-amber-100 text-gold',
      icon: <BadgeCheck className="h-5 w-5" strokeWidth={1.9} />,
    },
    {
      title: 'Pending Actions',
      value: isLoading ? '-' : pendingActions.toLocaleString('en-IN'),
      accentClass: 'border-t-2 border-t-red-600',
      iconClass: 'border-red-100 text-red-600',
      icon: <CircleAlert className="h-5 w-5" strokeWidth={1.9} />,
    },
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
          <p className="mt-1 text-sm text-gray-600">Role-wise top members under this admin network.</p>
        </div>

        {!isLoading && !hasAnyPerformers && teamMembers > 0 && (
          <div className="mb-6 rounded-lg border border-amber-100 bg-amber-50/70 p-4 text-sm font-semibold text-gray-700">
            Team members exist, but none match the configured top performer role groups.
          </div>
        )}

        <div className="space-y-7">
          {performerGroups.map((group) => {
            const performers = members
              .filter((member) => {
                const role = normalizeRole(member.role);
                return role ? group.roles.includes(role) : false;
              })
              .sort(sortPerformers);

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
                  <button type="button" onClick={() => navigate('/admin/branch-members')} className="flex items-center gap-1 text-xs font-bold text-blue-700 hover:text-blue-900">
                    View All
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>

                {isLoading ? (
                  <div className="rounded-lg border border-gray-100 bg-gray-50 p-5 text-sm text-gray-500">
                    Loading performers...
                  </div>
                ) : performers.length ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                      {performers.map((member) => {
                        const downlineMembers = getDownlineMembers(member, childrenByParent);
                        const activeTeamCount = downlineMembers.filter((child) => child.status === 'ACTIVE').length;
                        const pendingTeamCount = downlineMembers.filter((child) => child.status === 'PENDING').length;

                        return (
                          <BoardDirectorCard
                            key={member.id}
                            director={asHierarchyMember(member)}
                            teamSize={hierarchyTeamCounts.get(member.id) || member.directTeamCount || 0}
                            activeCount={activeTeamCount}
                            pendingCount={pendingTeamCount}
                            downlineMembers={downlineMembers.map((child) => ({ ...asHierarchyMember(child), reportsToId: members.find((parent) => getDirectChildren(parent, childrenByParent).some((item) => item.id === child.id))?.id || child.reportsToId }))}
                            onOpen={() => setDetailMember(member)}
                            onOpenMember={(selected) => setDetailMember(members.find((item) => item.id === selected.id) ?? member)}
                          />
                        );
                      })}
                    </div>
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

      {detailMember && (
        <MemberDetailsModal
          open
          member={asHierarchyMember(detailMember)}
          teamSize={countHierarchyMembers(detailMember, childrenByParent)}
          directReports={getDirectChildren(detailMember, childrenByParent).length}
          members={members.map((item) => ({ ...asHierarchyMember(item), reportsToId: members.find((parent) => getDirectChildren(parent, childrenByParent).some((child) => child.id === item.id))?.id || item.reportsToId }))}
          onSelectMember={(selected) => setDetailMember(members.find((item) => item.id === selected.id) ?? detailMember)}
          onClose={() => setDetailMember(null)}
        />
      )}
    </div>
  );
};

export default AdminDashboardPage;
