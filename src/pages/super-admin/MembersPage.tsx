import React, { useMemo, useState } from 'react';
import { useMembers } from '../../hooks/useMembers';

type MemberRole =
  | 'FOUNDER'
  | 'DIRECTOR'
  | 'DEPUTY_DIRECTOR'
  | 'EXECUTIVE_DIRECTOR'
  | 'SENIOR_MANAGER'
  | 'BUSINESS_MANAGER'
  | 'AGENT';

type MemberStatus = 'ACTIVE' | 'INACTIVE' | 'PENDING' | string;

type BranchRecord = {
  id?: string | number | null;
  name?: string | null;
  branchName?: string | null;
};

type ReportsToRecord = {
  id?: string | number | null;
  fullName?: string | null;
  name?: string | null;
};

type MemberRecord = {
  id?: string | number | null;
  fullName?: string | null;
  name?: string | null;
  role?: string | null;
  status?: MemberStatus | null;

  memberId?: string | null;
  codeNumber?: string | null;
  phone?: string | null;
  alternatePhone?: string | null;
  email?: string | null;

  branch?: BranchRecord | null;
  branchName?: string | null;

  reportsTo?: ReportsToRecord | null;
  reportsToId?: string | number | null;
  reportingToId?: string | number | null;
  parentId?: string | number | null;
  managerId?: string | number | null;

  city?: string | null;
  district?: string | null;
  state?: string | null;
  address?: string | null;
  pincode?: string | number | null;

  createdAt?: string | null;
  created_at?: string | null;
  joinedDate?: string | null;

  photo?: string | null;
  avatarUrl?: string | null;
  profileImage?: string | null;
  profileImageUrl?: string | null;
  photoUrl?: string | null;
  imageUrl?: string | null;
  image?: string | null;

  teamSize?: number | null;
  totalTeam?: number | null;
  teamCount?: number | null;
  taggedCount?: number | null;
  taggedMembers?: number | null;
  directReports?: number | null;
  directReportsCount?: number | null;
};

type MembersApiResponse = {
  data?: MemberRecord[];
  members?: MemberRecord[];
  total?: number;
  totalMembers?: number;
  count?: number;
  meta?: {
    total?: number;
  };
};

type HierarchyNode = MemberRecord & {
  id: string;
  fullName: string;
  role: MemberRole;
  status: MemberStatus;
  isFounder?: boolean;
};

const ROLE_FLOW: MemberRole[] = [
  'DIRECTOR',
  'DEPUTY_DIRECTOR',
  'EXECUTIVE_DIRECTOR',
  'SENIOR_MANAGER',
  'BUSINESS_MANAGER',
  'AGENT',
];

const ROLE_LABELS: Record<MemberRole, string> = {
  FOUNDER: 'Founder',
  DIRECTOR: 'Director',
  DEPUTY_DIRECTOR: 'Deputy Director',
  EXECUTIVE_DIRECTOR: 'Executive Director',
  SENIOR_MANAGER: 'Senior Manager',
  BUSINESS_MANAGER: 'Business Manager',
  AGENT: 'Agent',
};

const ROLE_PAGE_TITLES: Record<MemberRole, string> = {
  FOUNDER: 'Founder',
  DIRECTOR: 'Directors',
  DEPUTY_DIRECTOR: 'Deputy Directors',
  EXECUTIVE_DIRECTOR: 'Executive Directors',
  SENIOR_MANAGER: 'Senior Managers',
  BUSINESS_MANAGER: 'Business Managers',
  AGENT: 'Agents',
};

const FOUNDER: HierarchyNode = {
  id: 'founder-root',
  fullName: 'Dr. Rajesh Thangam',
  role: 'FOUNDER',
  status: 'ACTIVE',
  branchName: 'Chennai HQ',
  email: 'founder@srithangam.com',
  phone: '—',
  memberId: 'FOUNDER-001',
  isFounder: true,
};

function toText(value: unknown, fallback = '—') {
  if (value === 0) return '0';
  if (!value) return fallback;
  return String(value);
}

function toId(value: unknown) {
  if (value === 0) return '0';
  if (!value) return '';
  return String(value);
}

function normalizeRole(role?: string | null): MemberRole {
  const cleanRole = String(role ?? '').toUpperCase();

  if (cleanRole === 'DIRECTOR') return 'DIRECTOR';
  if (cleanRole === 'DEPUTY_DIRECTOR') return 'DEPUTY_DIRECTOR';
  if (cleanRole === 'EXECUTIVE_DIRECTOR') return 'EXECUTIVE_DIRECTOR';
  if (cleanRole === 'SENIOR_MANAGER') return 'SENIOR_MANAGER';
  if (cleanRole === 'BUSINESS_MANAGER') return 'BUSINESS_MANAGER';
  if (cleanRole === 'AGENT') return 'AGENT';

  return 'AGENT';
}

function getInitials(name?: string | null) {
  return toText(name, 'NA')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

function getAvatarUrl(member: MemberRecord) {
  return (
    member.photo ||
    member.avatarUrl ||
    member.profileImage ||
    member.profileImageUrl ||
    member.photoUrl ||
    member.imageUrl ||
    member.image ||
    ''
  );
}

function getBranchName(member: MemberRecord) {
  return member.branch?.name || member.branch?.branchName || member.branchName || member.city || 'Unassigned Branch';
}

function getJoinedDate(member: MemberRecord) {
  const dateValue = member.joinedDate || member.createdAt || member.created_at;

  if (!dateValue) return '—';

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return '—';

  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function getReportsToId(member: MemberRecord) {
  return (
    toId(member.reportsTo?.id) ||
    toId(member.reportsToId) ||
    toId(member.reportingToId) ||
    toId(member.parentId) ||
    toId(member.managerId)
  );
}

function getDirectNumeric(member: MemberRecord, keys: Array<keyof MemberRecord>) {
  for (const key of keys) {
    const value = member[key];

    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
  }

  return undefined;
}

function formatNumber(value: number) {
  return value.toLocaleString('en-IN');
}

function groupByBranch(members: HierarchyNode[]) {
  const groups = new Map<string, HierarchyNode[]>();

  members.forEach((member) => {
    const branchName = getBranchName(member);
    const existing = groups.get(branchName) ?? [];
    groups.set(branchName, [...existing, member]);
  });

  return Array.from(groups.entries())
    .map(([branchName, branchMembers]) => ({
      branchName,
      members: branchMembers,
    }))
    .sort((a, b) => a.branchName.localeCompare(b.branchName));
}

function IconSearch({ className = 'h-3.5 w-3.5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m1.1-5.4a6.5 6.5 0 11-13 0 6.5 6.5 0 0113 0z" />
    </svg>
  );
}

function IconClose({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function IconChevronRight({ className = 'h-3.5 w-3.5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}

function IconUsers({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.9}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5 5 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function IconUser({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.9}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 7.5a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 20.25a7.5 7.5 0 0115 0" />
    </svg>
  );
}

function IconEdit({ className = 'h-3.5 w-3.5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 7.125L16.875 4.5M18 14v5.25A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
    </svg>
  );
}

function StatusDot({ status }: { status?: MemberStatus | null }) {
  const isActive = String(status ?? '').toUpperCase() === 'ACTIVE';

  return (
    <span
      className={`h-2 w-2 rounded-full ring-[3px] ${
        isActive ? 'bg-emerald-500 ring-emerald-100' : 'bg-slate-400 ring-slate-100'
      }`}
    />
  );
}

function Avatar({ member, size = 'md' }: { member: MemberRecord; size?: 'sm' | 'md' | 'lg' }) {
  const avatarUrl = getAvatarUrl(member);

  const sizeClass =
    size === 'lg'
      ? 'h-16 w-16 text-lg'
      : size === 'sm'
        ? 'h-9 w-9 text-[11px]'
        : 'h-11 w-11 text-xs';

  return (
    <div
      className={`flex ${sizeClass} shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 font-black text-slate-700 shadow-sm`}
    >
      {avatarUrl ? (
        <img src={avatarUrl} alt={toText(member.fullName || member.name)} className="h-full w-full object-cover" />
      ) : (
        getInitials(member.fullName || member.name)
      )}
    </div>
  );
}

function StatPill({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
      <p className="text-[9px] font-black uppercase tracking-[0.12em] text-slate-400">{label}</p>
      <p className="mt-0.5 text-[15px] font-black text-slate-950">{value}</p>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div className="grid grid-cols-[100px_1fr] gap-3 border-b border-slate-100 py-2.5 last:border-b-0">
      <p className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">{label}</p>
      <p className="min-w-0 break-words text-[12px] font-bold leading-5 text-slate-900 [overflow-wrap:anywhere]">
        {toText(value)}
      </p>
    </div>
  );
}

function HierarchyCard({
  member,
  teamSize,
  directReports,
  hasNextLevel,
  onOpen,
  onViewTeam,
}: {
  member: HierarchyNode;
  teamSize: number;
  directReports: number;
  hasNextLevel: boolean;
  onOpen: () => void;
  onViewTeam: () => void;
}) {
  const isFounder = member.role === 'FOUNDER';

  return (
    <article
      onClick={onOpen}
      className="group flex min-h-[218px] cursor-pointer flex-col rounded-[18px] border border-slate-200 bg-white p-4 shadow-[0_10px_24px_rgba(15,20,25,0.045)] transition hover:-translate-y-0.5 hover:border-[#c9a227]/60 hover:shadow-[0_14px_34px_rgba(15,20,25,0.075)]"
    >
      <div className="flex items-start justify-between gap-3">
        <Avatar member={member} />
        <StatusDot status={member.status} />
      </div>

      <div className="mt-4 min-w-0">
        <h3 className="truncate text-[14px] font-black leading-tight text-slate-950">
          {member.fullName}
        </h3>

        <p className="mt-1 truncate text-[10px] font-extrabold uppercase tracking-[0.08em] text-[#9b7a09]">
          {isFounder ? 'Founder & CMD' : ROLE_LABELS[member.role]}
        </p>

        <p className="mt-1.5 truncate text-[12px] font-semibold text-slate-500">
          {getBranchName(member)}
        </p>
      </div>

      <div className="mt-4 space-y-2 rounded-xl bg-slate-50 p-3">
        <div className="flex items-center justify-between gap-3">
          <span className="text-[11px] font-bold text-slate-500">Team Size</span>
          <span className="text-[12px] font-black text-slate-950">{formatNumber(teamSize)}</span>
        </div>

        <div className="flex items-center justify-between gap-3">
          <span className="text-[11px] font-bold text-slate-500">Direct Reports</span>
          <span className="text-[12px] font-black text-slate-950">{formatNumber(directReports)}</span>
        </div>
      </div>

      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          if (hasNextLevel) onViewTeam();
          else onOpen();
        }}
        className="mt-auto flex h-9 items-center justify-center gap-1.5 rounded-xl border border-[#e5dcc0] bg-[#fbf8ef] px-3 text-[11px] font-black text-[#8a6a08] transition group-hover:border-[#c9a227] group-hover:bg-[#c9a227] group-hover:text-white"
      >
        {hasNextLevel ? 'View Team' : 'View Profile'}
        <IconChevronRight className="h-3 w-3" />
      </button>
    </article>
  );
}

function BranchGroup({
  branchName,
  members,
  getCardStats,
  onOpen,
  onViewTeam,
}: {
  branchName: string;
  members: HierarchyNode[];
  getCardStats: (member: HierarchyNode) => {
    teamSize: number;
    directReports: number;
    hasNextLevel: boolean;
  };
  onOpen: (member: HierarchyNode) => void;
  onViewTeam: (member: HierarchyNode) => void;
}) {
  const totalTeam = members.reduce((sum, member) => sum + getCardStats(member).teamSize, 0);

  return (
    <section className="rounded-[20px] border border-slate-200 bg-slate-50/70 p-4">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-[15px] font-black text-slate-950">{branchName}</h3>
          <p className="mt-0.5 text-[11px] font-semibold text-slate-500">
            {members.length} Director{members.length > 1 ? 's' : ''} · Team {formatNumber(totalTeam)}
          </p>
        </div>

        <span className="w-fit rounded-full bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.08em] text-[#8a6a08] shadow-sm">
          Director Branch
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {members.map((member) => {
          const stats = getCardStats(member);

          return (
            <HierarchyCard
              key={`${member.role}-${member.id}`}
              member={member}
              teamSize={stats.teamSize}
              directReports={stats.directReports}
              hasNextLevel={stats.hasNextLevel}
              onOpen={() => onOpen(member)}
              onViewTeam={() => onViewTeam(member)}
            />
          );
        })}
      </div>
    </section>
  );
}

function MemberDrawer({
  open,
  member,
  teamSize,
  directReports,
  hasNextLevel,
  onClose,
  onViewTeam,
}: {
  open: boolean;
  member: HierarchyNode | null;
  teamSize: number;
  directReports: number;
  hasNextLevel: boolean;
  onClose: () => void;
  onViewTeam: () => void;
}) {
  if (!open || !member) return null;

  const fullAddress = [
    member.address,
    member.city,
    member.district,
    member.state,
    member.pincode,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <div className="fixed inset-0 z-[80]">
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/45 backdrop-blur-[2px]"
        aria-label="Close drawer overlay"
      />

      <aside className="absolute right-0 top-0 flex h-full w-full max-w-[400px] flex-col overflow-hidden bg-white shadow-[0_24px_80px_rgba(15,20,25,0.32)]">
        <div className="relative overflow-hidden bg-gradient-to-br from-[#0f1419] via-[#151d2c] to-[#1a2332] px-5 pb-6 pt-5">
          <div className="absolute -right-20 -top-20 h-48 w-48 rounded-full bg-[#c9a227]/25 blur-3xl" />

          <div className="relative flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <Avatar member={member} size="lg" />

              <div className="min-w-0">
                <h2 className="break-words text-[19px] font-black leading-tight text-white">
                  {member.fullName}
                </h2>
                <p className="mt-1 text-[10px] font-black uppercase tracking-[0.12em] text-[#e8c547]">
                  {member.role === 'FOUNDER' ? 'Founder & CMD' : ROLE_LABELS[member.role]}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition hover:bg-white/20"
              aria-label="Close drawer"
            >
              <IconClose />
            </button>
          </div>

          <div className="relative mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-white/10 bg-white/10 p-3">
              <p className="text-[9px] font-black uppercase tracking-[0.12em] text-white/45">Team Size</p>
              <p className="mt-1 text-lg font-black text-white">{formatNumber(teamSize)}</p>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/10 p-3">
              <p className="text-[9px] font-black uppercase tracking-[0.12em] text-white/45">Reports</p>
              <p className="mt-1 text-lg font-black text-white">{formatNumber(directReports)}</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="rounded-2xl border border-slate-200 bg-white px-4">
            <DetailRow label="Phone" value={member.phone} />
            <DetailRow label="Email" value={member.email} />
            <DetailRow label="Member ID" value={member.memberId || member.id} />
            <DetailRow label="Branch" value={getBranchName(member)} />
            <DetailRow label="Joined Date" value={getJoinedDate(member)} />
            <DetailRow label="Team Size" value={formatNumber(teamSize)} />
            <DetailRow label="Reports" value={formatNumber(directReports)} />
            <DetailRow label="Address" value={fullAddress || '—'} />
          </div>
        </div>

        <div className="border-t border-slate-200 bg-slate-50 p-4">
          <div className="grid grid-cols-1 gap-2.5">
            <button
              type="button"
              onClick={onViewTeam}
              disabled={!hasNextLevel}
              className="flex h-10 items-center justify-center gap-2 rounded-xl bg-[#c9a227] px-4 text-[12px] font-black text-white shadow-sm transition hover:brightness-95 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              <IconUsers className="h-3.5 w-3.5" />
              {hasNextLevel ? 'View Team' : 'No Downline'}
            </button>

            <button
              type="button"
              className="flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-[12px] font-black text-slate-700 transition hover:bg-slate-100"
            >
              <IconEdit />
              Edit Member
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}

const SuperAdminDashboardPage: React.FC = () => {
  const { data: membersData, isLoading } = useMembers({ limit: 10000 });

  const [search, setSearch] = useState('');
  const [path, setPath] = useState<HierarchyNode[]>([]);
  const [selectedMember, setSelectedMember] = useState<HierarchyNode | null>(null);

  const rawMembers = useMemo(() => {
    const response = membersData as MembersApiResponse | MemberRecord[] | undefined;

    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.data)) return response.data;
    if (Array.isArray(response?.members)) return response.members;

    return [];
  }, [membersData]);

  const members = useMemo<HierarchyNode[]>(() => {
    return rawMembers
      .filter((member) => member && member.id !== null && member.id !== undefined)
      .map((member) => ({
        ...member,
        id: toId(member.id),
        fullName: toText(member.fullName || member.name, 'Unnamed Member'),
        role: normalizeRole(member.role),
        status: member.status || 'ACTIVE',
      }));
  }, [rawMembers]);

  const roleCounts = useMemo(() => {
    return ROLE_FLOW.reduce<Record<MemberRole, number>>(
      (acc, role) => {
        acc[role] = members.filter((member) => member.role === role).length;
        return acc;
      },
      {
        FOUNDER: 1,
        DIRECTOR: 0,
        DEPUTY_DIRECTOR: 0,
        EXECUTIVE_DIRECTOR: 0,
        SENIOR_MANAGER: 0,
        BUSINESS_MANAGER: 0,
        AGENT: 0,
      },
    );
  }, [members]);

  const totalMembers = useMemo(() => {
    const response = membersData as MembersApiResponse | undefined;

    return (
      response?.totalMembers ||
      response?.total ||
      response?.count ||
      response?.meta?.total ||
      members.length + 1
    );
  }, [members.length, membersData]);

  const currentRole = path.length === 0 ? 'FOUNDER' : ROLE_FLOW[path.length - 1];
  const currentParent = path[path.length - 1] ?? null;

  const hasReportMapping = useMemo(() => {
    return members.some((member) => Boolean(getReportsToId(member)));
  }, [members]);

  const directorMembers = useMemo(() => {
    return members.filter((member) => member.role === 'DIRECTOR');
  }, [members]);

  const directorGroups = useMemo(() => {
    return groupByBranch(directorMembers);
  }, [directorMembers]);

  const getChildren = (parent: HierarchyNode, nextRole?: MemberRole) => {
    if (!nextRole) return [];

    const roleMembers = members.filter((member) => member.role === nextRole);

    if (parent.role === 'FOUNDER') {
      return roleMembers;
    }

    const exactChildren = roleMembers.filter((member) => getReportsToId(member) === parent.id);

    if (exactChildren.length > 0) {
      return exactChildren;
    }

    return hasReportMapping ? [] : roleMembers;
  };

  const getNextRole = (member: HierarchyNode) => {
    if (member.role === 'FOUNDER') return 'DIRECTOR';

    const currentIndex = ROLE_FLOW.indexOf(member.role);
    return currentIndex >= 0 ? ROLE_FLOW[currentIndex + 1] : undefined;
  };

  const getDirectReports = (member: HierarchyNode) => {
    if (member.role === 'FOUNDER') return roleCounts.DIRECTOR;

    const directValue = getDirectNumeric(member, ['directReports', 'directReportsCount']);

    if (typeof directValue === 'number') {
      return directValue;
    }

    const nextRole = getNextRole(member);
    return getChildren(member, nextRole).length;
  };

  const getTeamSize = (member: HierarchyNode): number => {
    if (member.role === 'FOUNDER') return totalMembers;

    const directValue = getDirectNumeric(member, [
      'teamSize',
      'totalTeam',
      'teamCount',
      'taggedCount',
      'taggedMembers',
    ]);

    if (typeof directValue === 'number') {
      return directValue;
    }

    const nextRole = getNextRole(member);
    const children = getChildren(member, nextRole);

    if (children.length === 0) return 0;

    return children.reduce((total, child) => total + 1 + getTeamSize(child), 0);
  };

  const getCardStats = (member: HierarchyNode) => {
    const directReports = getDirectReports(member);
    const teamSize = getTeamSize(member);
    const hasNextLevel = Boolean(getNextRole(member)) && directReports > 0;

    return {
      teamSize,
      directReports,
      hasNextLevel,
    };
  };

  const currentItems = useMemo<HierarchyNode[]>(() => {
    if (currentRole === 'FOUNDER') return [FOUNDER];

    const roleMembers = members.filter((member) => member.role === currentRole);

    if (!currentParent) return roleMembers;

    if (currentParent.role === 'FOUNDER') return roleMembers;

    const exactChildren = roleMembers.filter((member) => getReportsToId(member) === currentParent.id);

    if (exactChildren.length > 0) return exactChildren;

    return hasReportMapping ? [] : roleMembers;
  }, [currentParent, currentRole, hasReportMapping, members]);

  const searchResults = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return [];

    const searchable = [FOUNDER, ...members];

    return searchable.filter((member) => {
      const haystack = [
        member.fullName,
        ROLE_LABELS[member.role],
        getBranchName(member),
        member.phone,
        member.email,
        member.memberId,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [members, search]);

  const visibleItems = search.trim() ? searchResults : currentItems;

  const pageTitle = useMemo(() => {
    if (search.trim()) return `Search Results (${visibleItems.length})`;

    if (currentRole === 'FOUNDER') return 'Level 1 — Founder';

    const title = ROLE_PAGE_TITLES[currentRole];

    if (!currentParent || currentParent.role === 'FOUNDER') {
      return `${title} (${visibleItems.length})`;
    }

    return `${title} reporting to ${currentParent.fullName}`;
  }, [currentParent, currentRole, search, visibleItems.length]);

  const canGoBack = path.length > 0;

  const showFounderOnly = !search.trim() && currentRole === 'FOUNDER';

  const showDirectorBranchGroups =
    !search.trim() &&
    currentRole === 'DIRECTOR' &&
    currentParent?.role === 'FOUNDER';

  function handleViewTeam(member: HierarchyNode) {
    const nextRole = getNextRole(member);

    if (!nextRole) {
      setSelectedMember(member);
      return;
    }

    setSelectedMember(null);
    setSearch('');

    setPath((previousPath) => {
      if (member.role === 'FOUNDER') return [FOUNDER];

      const basePath = previousPath.length === 0 ? [FOUNDER] : previousPath;
      const existingIndex = basePath.findIndex((item) => item.id === member.id);

      if (existingIndex >= 0) {
        return basePath.slice(0, existingIndex + 1);
      }

      return [...basePath, member];
    });
  }

  function handleBreadcrumbClick(index: number) {
    setSearch('');
    setSelectedMember(null);
    setPath(path.slice(0, index + 1));
  }

  function handleReset() {
    setSearch('');
    setSelectedMember(null);
    setPath([]);
  }

  const selectedStats = selectedMember
    ? getCardStats(selectedMember)
    : {
        teamSize: 0,
        directReports: 0,
        hasNextLevel: false,
      };

  return (
    <div className="min-h-full bg-[#f6f7fb] px-4 py-4 sm:px-5 lg:px-6">
      <div className="mx-auto w-full max-w-[1320px] space-y-5">
        <section className="overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-[0_12px_32px_rgba(15,20,25,0.045)]">
          <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h1 className="text-[22px] font-black leading-tight text-slate-950 sm:text-[25px]">
                  Members Hierarchy
                </h1>
                <p className="mt-1 text-[12px] font-semibold text-slate-500">
                  Manage organization structure and reporting hierarchy
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
                <StatPill label="Total Members" value={formatNumber(totalMembers)} />
                <StatPill label="Founder" value={1} />
              </div>
            </div>
          </div>

          <div className="border-b border-slate-100 px-5 py-3.5 sm:px-6">
            <div className="relative">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                <IconSearch />
              </span>

              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search member..."
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-4 text-[13px] font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#c9a227] focus:bg-white focus:ring-4 focus:ring-[#c9a227]/10"
              />
            </div>
          </div>

          <div className="px-5 py-3.5 sm:px-6">
            <div className="flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-[0.07em]">
              <span className="rounded-full bg-slate-950 px-3 py-1.5 text-white">
                Total: {formatNumber(totalMembers)}
              </span>

              <span className="rounded-full bg-[#fbf8ef] px-3 py-1.5 text-[#8a6a08]">
                Founder 1
              </span>

              <span className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-700">
                Director {formatNumber(roleCounts.DIRECTOR)}
              </span>

              <span className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-700">
                Deputy {formatNumber(roleCounts.DEPUTY_DIRECTOR)}
              </span>

              <span className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-700">
                Executive {formatNumber(roleCounts.EXECUTIVE_DIRECTOR)}
              </span>

              <span className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-700">
                Managers {formatNumber(roleCounts.SENIOR_MANAGER + roleCounts.BUSINESS_MANAGER)}
              </span>

              <span className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-700">
                Agents {formatNumber(roleCounts.AGENT)}
              </span>
            </div>
          </div>
        </section>

        <section className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-[0_12px_32px_rgba(15,20,25,0.04)] sm:p-6">
          <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <div className="mb-2.5 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleReset}
                  className="rounded-full bg-[#0f1419] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.08em] text-white transition hover:bg-slate-700"
                >
                  Founder
                </button>

                {path.slice(1).map((item, index) => (
                  <React.Fragment key={item.id}>
                    <IconChevronRight className="h-3.5 w-3.5 text-slate-300" />
                    <button
                      type="button"
                      onClick={() => handleBreadcrumbClick(index + 1)}
                      className="rounded-full bg-slate-100 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.08em] text-slate-700 transition hover:bg-[#fbf8ef] hover:text-[#8a6a08]"
                    >
                      {item.fullName}
                    </button>
                  </React.Fragment>
                ))}
              </div>

              <h2 className="text-[19px] font-black leading-tight text-slate-950 sm:text-[22px]">
                {pageTitle}
              </h2>

              <p className="mt-1 text-[12px] font-semibold text-slate-500">
                Click a card for details. Use View Team to drill into the next level.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {canGoBack && !search.trim() && (
                <button
                  type="button"
                  onClick={() => setPath((previousPath) => previousPath.slice(0, -1))}
                  className="h-9 rounded-xl border border-slate-200 bg-white px-3.5 text-[11px] font-black text-slate-700 transition hover:bg-slate-50"
                >
                  Back
                </button>
              )}

              {(search.trim() || canGoBack) && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="h-9 rounded-xl bg-slate-950 px-3.5 text-[11px] font-black text-white transition hover:bg-slate-700"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <div
                  key={index}
                  className="h-[218px] animate-pulse rounded-[18px] border border-slate-200 bg-slate-100"
                />
              ))}
            </div>
          ) : visibleItems.length === 0 ? (
            <div className="rounded-[18px] border border-dashed border-slate-300 bg-slate-50 px-5 py-14 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm">
                <IconUser />
              </div>
              <p className="mt-3 text-[14px] font-black text-slate-800">No members found</p>
              <p className="mt-1 text-[12px] font-semibold text-slate-500">
                Try another search or check the reporting mapping in member data.
              </p>
            </div>
          ) : showFounderOnly ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <HierarchyCard
                member={FOUNDER}
                teamSize={getCardStats(FOUNDER).teamSize}
                directReports={getCardStats(FOUNDER).directReports}
                hasNextLevel={getCardStats(FOUNDER).hasNextLevel}
                onOpen={() => setSelectedMember(FOUNDER)}
                onViewTeam={() => handleViewTeam(FOUNDER)}
              />
            </div>
          ) : showDirectorBranchGroups ? (
            <div className="space-y-4">
              {directorGroups.map((group) => (
                <BranchGroup
                  key={group.branchName}
                  branchName={group.branchName}
                  members={group.members}
                  getCardStats={getCardStats}
                  onOpen={setSelectedMember}
                  onViewTeam={handleViewTeam}
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {visibleItems.map((member) => {
                const stats = getCardStats(member);

                return (
                  <HierarchyCard
                    key={`${member.role}-${member.id}`}
                    member={member}
                    teamSize={stats.teamSize}
                    directReports={stats.directReports}
                    hasNextLevel={stats.hasNextLevel}
                    onOpen={() => setSelectedMember(member)}
                    onViewTeam={() => handleViewTeam(member)}
                  />
                );
              })}
            </div>
          )}
        </section>
      </div>

      <MemberDrawer
        open={Boolean(selectedMember)}
        member={selectedMember}
        teamSize={selectedStats.teamSize}
        directReports={selectedStats.directReports}
        hasNextLevel={selectedStats.hasNextLevel}
        onClose={() => setSelectedMember(null)}
        onViewTeam={() => {
          if (selectedMember) handleViewTeam(selectedMember);
        }}
      />
    </div>
  );
};

export default SuperAdminDashboardPage;