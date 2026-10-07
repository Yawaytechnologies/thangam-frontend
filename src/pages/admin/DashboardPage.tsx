import React from 'react';
import {
  BadgeCheck,
  CalendarCheck2,
  CalendarClock,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  Network,
  UserRoundPlus,
  X,
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

function statusLabel(status: string) {
  return status === 'ACTIVE' ? 'Active' : status.toLowerCase();
}

function formatDate(value?: string) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function detailValue(value: unknown) {
  if (typeof value === 'string' && value.trim()) return value;
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return '-';
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

const PerformerCard: React.FC<{
  member: PerformerMember;
  index: number;
  teamMemberCount: number;
  activeTeamCount: number;
  pendingTeamCount: number;
  isExpanded: boolean;
  onToggle: () => void;
  onOpenMember: (member: PerformerMember) => void;
  childrenByParent: Map<string, PerformerMember[]>;
}> = ({
  member,
  index,
  teamMemberCount,
  activeTeamCount,
  pendingTeamCount,
  isExpanded,
  onToggle,
  onOpenMember,
  childrenByParent,
}) => {
  const role = normalizeRole(member.role);

  return (
    <article className="min-w-0">
      <button
        type="button"
        onClick={() => onOpenMember(member)}
        className={`w-full rounded-lg border bg-white p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-gold/50 ${
          isExpanded ? 'border-gold ring-1 ring-gold/30' : 'border-gray-200'
        }`}
        aria-label={`View details for ${member.fullName}`}
      >
        <div className="flex items-start gap-3">
          <Avatar name={member.fullName} />
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-gray-900">{member.fullName}</p>
                <p className="mt-0.5 truncate text-xs font-semibold text-gray-500">ID: {member.memberId}</p>
              </div>
              <span className="rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-bold uppercase text-emerald-700">
                {role ? roleLabels[role] : String(member.role || '-')}
              </span>
            </div>
            <p className="mt-2 truncate text-xs font-semibold text-gray-500">{member.branch?.name ?? 'Branch network'}</p>
            <p className="mt-1 text-[10px] font-bold text-gray-400">Rank #{index + 1} - {statusLabel(member.status)}</p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 divide-x divide-gray-200 rounded-lg bg-gray-50 py-1 text-center">
          <div className="px-2 py-1.5">
            <p className="text-[8px] font-bold uppercase text-gray-400">Team</p>
            <p className="mt-0.5 text-sm font-black text-gray-900">{teamMemberCount}</p>
          </div>
          <div className="px-2 py-1.5">
            <p className="text-[8px] font-bold uppercase text-gray-400">Active</p>
            <p className="mt-0.5 text-sm font-black text-gray-900">{activeTeamCount}</p>
          </div>
          <div className="px-2 py-1.5">
            <p className="text-[8px] font-bold uppercase text-gray-400">Pending</p>
            <p className="mt-0.5 text-sm font-black text-amber-700">{pendingTeamCount}</p>
          </div>
        </div>
      </button>

      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isExpanded}
        className="mt-2 flex w-full items-center justify-center gap-1 rounded-md py-1.5 text-[11px] font-bold text-gray-500 transition hover:bg-gray-50 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-gold/40"
      >
        {isExpanded ? 'Hide Team' : 'View Team'}
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
      </button>

      {isExpanded && (
        <DownlineTree root={member} childrenByParent={childrenByParent} onOpenMember={onOpenMember} />
      )}
    </article>
  );
};

const DownlineTree: React.FC<{
  root: PerformerMember;
  childrenByParent: Map<string, PerformerMember[]>;
  onOpenMember: (member: PerformerMember) => void;
}> = ({ root, childrenByParent, onOpenMember }) => {
  const [expandedParents, setExpandedParents] = React.useState<Record<string, boolean>>({});
  const directChildren = getDirectChildren(root, childrenByParent);

  const renderChildren = (parent: PerformerMember, depth = 0, visited = new Set<string>()): React.ReactNode => {
    if (visited.has(parent.id)) return null;
    const nextVisited = new Set(visited).add(parent.id);
    const children = getDirectChildren(parent, childrenByParent).filter((child) => !nextVisited.has(child.id));
    const expanded = Boolean(expandedParents[parent.id]);
    const visibleChildren = expanded ? children : children.slice(0, 2);
    const remainingCount = children.length - visibleChildren.length;

    if (children.length === 0) return null;

    return (
      <div className={depth === 0 ? 'ml-5 space-y-2 border-l border-gray-200 pb-1 pl-5 pt-4' : 'ml-4 mt-2 space-y-2 border-l border-gray-200 pl-4'}>
        {visibleChildren.map((member) => {
          const role = normalizeRole(member.role);

          return (
            <div key={member.id}>
              <button
                type="button"
                onClick={() => onOpenMember(member)}
                className="relative flex w-full items-center justify-between gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-left shadow-sm transition hover:border-gold/60 hover:bg-amber-50/50 focus:outline-none focus:ring-2 focus:ring-gold/40"
              >
                <span className="absolute -left-5 top-1/2 h-px w-5 bg-gray-200" />
                <span className="truncate text-xs font-bold text-gray-900">{member.fullName}</span>
                <span className="shrink-0 text-[9px] font-bold text-gray-500">
                  {role ? roleLabels[role] : String(member.role || '-')}
                </span>
              </button>
              {renderChildren(member, depth + 1, nextVisited)}
            </div>
          );
        })}
        {!expanded && remainingCount > 0 && (
          <button
            type="button"
            onClick={() => setExpandedParents((current) => ({ ...current, [parent.id]: true }))}
            className="relative w-full rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-left text-[10px] font-bold text-amber-800 shadow-sm hover:bg-amber-100"
          >
            <span className="absolute -left-5 top-1/2 h-px w-5 bg-gray-200" />
            +{remainingCount} {remainingCount === 1 ? 'Other' : 'Others'}
          </button>
        )}
        {expanded && children.length > 2 && (
          <button
            type="button"
            onClick={() => setExpandedParents((current) => ({ ...current, [parent.id]: false }))}
            className="w-full text-center text-[10px] font-bold text-gray-500 hover:text-gray-800"
          >
            Show less
          </button>
        )}
      </div>
    );
  };

  if (directChildren.length === 0) {
    return (
      <p className="mt-2 rounded-lg border border-dashed border-gray-200 bg-white px-3 py-3 text-center text-xs font-semibold text-gray-400">
        No downline members
      </p>
    );
  }

  return <div>{renderChildren(root)}</div>;
};

const DetailRow: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="grid grid-cols-[92px_minmax(0,1fr)] gap-3 border-b border-slate-100 py-3 last:border-b-0 sm:grid-cols-[120px_minmax(0,1fr)]">
    <p className="text-[10px] font-black uppercase tracking-[0.08em] text-slate-400">{label}</p>
    <p className="min-w-0 break-words text-[12px] font-bold leading-5 text-slate-900 [overflow-wrap:anywhere] sm:text-sm">{value}</p>
  </div>
);

const MemberDetailsDrawer: React.FC<{
  member: PerformerMember;
  childrenByParent: Map<string, PerformerMember[]>;
  onClose: () => void;
}> = ({ member, childrenByParent, onClose }) => {
  const role = normalizeRole(member.role);
  const reportsToName = isRecord(member.reportsTo)
    ? detailValue(member.reportsTo.fullName || member.reportsTo.name || member.reportsTo.memberId)
    : detailValue(member.reportsTo);
  const directReports = getDirectChildren(member, childrenByParent).length;
  const teamSize = countHierarchyMembers(member, childrenByParent);
  const address = [member.address, member.city, member.district, member.state, member.pincode].filter(Boolean).join(', ');

  React.useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[80]" role="dialog" aria-modal="true" aria-label={`${member.fullName} details`}>
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/45 backdrop-blur-[2px]"
        aria-label="Close member details"
      />

      <aside className="absolute right-0 top-0 flex h-full w-full max-w-[420px] flex-col overflow-hidden bg-white shadow-[0_24px_80px_rgba(15,20,25,0.32)]">
        <header className="relative overflow-hidden bg-gradient-to-br from-[#0f1419] via-[#151d2c] to-[#242821] px-5 pb-5 pt-5">
          <div className="absolute -right-20 -top-20 h-48 w-48 rounded-full bg-[#c9a227]/20 blur-3xl" />
          <div className="relative flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-black text-slate-700">
                {member.fullName.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'M'}
              </div>
              <div className="min-w-0">
                <h2 className="break-words text-lg font-black leading-tight text-white">{member.fullName}</h2>
                <p className="mt-1 text-[10px] font-black uppercase tracking-[0.12em] text-[#e8c547]">
                  {role ? roleLabels[role] : detailValue(member.role)}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition hover:bg-white/20"
              aria-label="Close member details"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="relative mt-4 grid grid-cols-2 gap-2.5">
            <div className="rounded-xl border border-white/10 bg-white/10 p-3">
              <p className="text-[9px] font-black uppercase tracking-[0.12em] text-white/45">Team Size</p>
              <p className="mt-1 text-lg font-black text-white">{teamSize}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/10 p-3">
              <p className="text-[9px] font-black uppercase tracking-[0.12em] text-white/45">Reports</p>
              <p className="mt-1 text-lg font-black text-white">{directReports}</p>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-1">
          <div className="rounded-2xl border border-slate-200 bg-white px-4">
            <DetailRow label="Phone" value={detailValue(member.phone)} />
            <DetailRow label="Email" value={detailValue(member.email)} />
            <DetailRow label="Member ID" value={detailValue(member.memberId)} />
            <DetailRow label="Code" value={detailValue(member.codeNumber)} />
            <DetailRow label="Branch" value={detailValue(member.branch?.name)} />
            <DetailRow label="Joined" value={formatDate(member.createdAt)} />
            <DetailRow label="Team" value={teamSize} />
            <DetailRow label="Reports" value={directReports} />
            <DetailRow label="Intro Name" value={detailValue(member.introName)} />
            <DetailRow label="Alternate Phone" value={detailValue(member.alternatePhone)} />
            <DetailRow label="Role" value={role ? roleLabels[role] : detailValue(member.role)} />
            <DetailRow label="Reports To" value={reportsToName} />
            <DetailRow label="Date of Birth" value={formatDate(member.dateOfBirth)} />
            <DetailRow label="Blood Group" value={detailValue(member.bloodGroup)} />
            <DetailRow label="Qualification" value={detailValue(member.qualification)} />
            <DetailRow label="Experience" value={detailValue(member.experience)} />
            <DetailRow label="Nominee Name" value={detailValue(member.nomineeName)} />
            <DetailRow label="Nominee Relation" value={detailValue(member.nomineeRelation)} />
            <DetailRow label="Nominee Phone" value={detailValue(member.nomineePhone)} />
            <DetailRow label="PAN Number" value={detailValue(member.panNumber)} />
            <DetailRow label="Aadhaar Number" value={detailValue(member.aadhaarNumber)} />
            <DetailRow label="Address" value={address || '-'} />
          </div>
        </div>
      </aside>
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
  const [expandedMemberId, setExpandedMemberId] = React.useState<string | null>(null);
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
                      {performers.map((member, index) => {
                        const downlineMembers = getDownlineMembers(member, childrenByParent);
                        const activeTeamCount = downlineMembers.filter((child) => child.status === 'ACTIVE').length;
                        const pendingTeamCount = downlineMembers.filter((child) => child.status === 'PENDING').length;

                        return (
                          <PerformerCard
                            key={member.id}
                            member={member}
                            index={index}
                            teamMemberCount={hierarchyTeamCounts.get(member.id) || member.directTeamCount || 0}
                            activeTeamCount={activeTeamCount}
                            pendingTeamCount={pendingTeamCount}
                            isExpanded={expandedMemberId === member.id}
                            onToggle={() => setExpandedMemberId((current) => (current === member.id ? null : member.id))}
                            onOpenMember={setDetailMember}
                            childrenByParent={childrenByParent}
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
        <MemberDetailsDrawer
          member={detailMember}
          childrenByParent={childrenByParent}
          onClose={() => setDetailMember(null)}
        />
      )}
    </div>
  );
};

export default AdminDashboardPage;
