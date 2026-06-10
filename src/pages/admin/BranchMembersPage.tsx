import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  Building2,
  ChevronDown,
  ChevronsUpDown,
  GitBranch,
  MapPin,
  Search,
  UserCheck,
  Users,
} from 'lucide-react';
import { useMembers, useTeam } from '../../hooks/useMembers';
import { useAuthStore } from '../../stores/auth.store';
import { resolveFileUrl } from '../../lib/file-url';
import type { Branch, Member, PaginatedResponse, Role, UserStatus } from '../../types';

interface PersonRecord {
  id: string;
  memberId: string;
  name: string;
  role: Role;
  phone: string;
  branch: string;
  status: UserStatus;
  taggedCount: number;
  photoUrl: string;
  depth: number;
}

interface DirectorRecord extends PersonRecord {
  region: string;
}

const hierarchyRoles: Role[] = [
  'EXECUTIVE_DIRECTOR',
  'DEPUTY_DIRECTOR',
  'SENIOR_MANAGER',
  'BUSINESS_MANAGER',
  'AGENT',
];

const fullHierarchyRoles: Role[] = ['DIRECTOR', ...hierarchyRoles];

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

const statusOptions: { value: UserStatus; label: string }[] = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'INACTIVE', label: 'Inactive' },
];

const roleAliases: Record<string, Role> = {
  DIRECTOR: 'DIRECTOR',
  EXECUTIVE_DIRECTOR: 'EXECUTIVE_DIRECTOR',
  DEPUTY_DIRECTOR: 'DEPUTY_DIRECTOR',
  SENIOR_MANAGER: 'SENIOR_MANAGER',
  BUSINESS_MANAGER: 'BUSINESS_MANAGER',
  AGENT: 'AGENT',
  Director: 'DIRECTOR',
  'Executive Director': 'EXECUTIVE_DIRECTOR',
  'Deputy Director': 'DEPUTY_DIRECTOR',
  'Senior Manager': 'SENIOR_MANAGER',
  'Business Manager': 'BUSINESS_MANAGER',
  Agent: 'AGENT',
};

function initials(name: string) {
  return (
    name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('') || 'M'
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object';
}

function membersFromResponse(response: PaginatedResponse<Member> | Member[] | unknown): Member[] {
  if (Array.isArray(response)) return response as Member[];
  if (!isRecord(response)) return [];

  const arrayKeys = ['data', 'items', 'members', 'teamMembers', 'results', 'records', 'rows'];
  for (const key of arrayKeys) {
    if (Array.isArray(response[key])) return response[key] as Member[];
  }

  for (const key of arrayKeys) {
    const nested = response[key];
    if (isRecord(nested)) {
      const nestedMembers = membersFromResponse(nested);
      if (nestedMembers.length) return nestedMembers;
    }
  }

  return [];
}

function getStringField(source: unknown, keys: string[]) {
  if (!isRecord(source)) return '';

  for (const key of keys) {
    const value = source[key];
    if (typeof value === 'string' && value.trim()) return value;
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  }

  return '';
}

function memberName(member: Member) {
  return getStringField(member, ['fullName', 'name']) || '-';
}

function memberIdentifier(member: Member) {
  return getStringField(member, ['memberId', 'member_id', 'codeNumber', 'code_number']) || member.id;
}

function memberPhone(member: Member) {
  return getStringField(member, ['phone', 'mobile', 'mobile1', 'cellNumber']) || '-';
}

function normalizeLookupKey(value: unknown) {
  const text = typeof value === 'number' && Number.isFinite(value) ? String(value) : typeof value === 'string' ? value : '';
  return text.trim().toLowerCase();
}

function normalizeRole(value: unknown): Role | null {
  const raw = typeof value === 'string' ? value.trim() : '';
  if (!raw) return null;
  if (roleAliases[raw]) return roleAliases[raw];

  const normalized = raw
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/[\s-]+/g, '_')
    .toUpperCase();

  return roleAliases[normalized] ?? null;
}

function normalizeStatus(value: unknown): UserStatus {
  const normalized = String(value || 'ACTIVE').trim().toUpperCase();
  if (normalized === 'PENDING' || normalized === 'INACTIVE') return normalized;
  return 'ACTIVE';
}

function memberPhotoUrl(member: Member) {
  return resolveFileUrl(
    getStringField(member, [
      'photo',
      'photoUrl',
      'photo_url',
      'profilePhoto',
      'profile_photo',
      'profileImage',
      'profileImageUrl',
      'imageUrl',
      'image_url',
      'avatarUrl',
      'avatar',
    ]),
  );
}

function memberLookupKeys(member: Pick<Member, 'id'> & Partial<Member> & { name?: string }) {
  return [
    member.id,
    member.memberId,
    getStringField(member, ['member_id']),
    member.fullName,
    member.name,
    getStringField(member, ['codeNumber', 'code_number']),
  ]
    .map(normalizeLookupKey)
    .filter(Boolean);
}

function parentKeysFor(member: Member) {
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
    const value = (member as Member & Record<string, unknown>)[key];
    if (typeof value === 'string' && value.trim()) parentKeys.push(value);
    if (typeof value === 'number' && Number.isFinite(value)) parentKeys.push(String(value));
    if (isRecord(value)) {
      for (const nestedKey of ['id', 'memberId', 'member_id', 'codeNumber', 'code_number', 'fullName', 'name']) {
        const nestedId = getStringField(value, [nestedKey]);
        if (nestedId) parentKeys.push(nestedId);
      }
    }
  }

  return Array.from(new Set(parentKeys.map(normalizeLookupKey).filter(Boolean)));
}

function parentIdFor(member: Member) {
  return parentKeysFor(member)[0] ?? '';
}

function branchNameFor(member: Member, fallbackBranch?: Branch) {
  return member.branch?.name ?? fallbackBranch?.name ?? '-';
}

function branchLocation(branch?: Branch) {
  if (!branch) return '-';
  return [branch.address, branch.city, branch.district, branch.state, branch.pincode].filter(Boolean).join(', ') || '-';
}

function buildChildrenByParent(members: Member[]) {
  return members.reduce<Map<string, Member[]>>((map, member) => {
    const parentKeys = parentKeysFor(member);
    for (const parentKey of parentKeys) {
      const children = map.get(parentKey) ?? [];
      children.push(member);
      map.set(parentKey, children);
    }
    return map;
  }, new Map<string, Member[]>());
}

function collectDescendants(
  member: Pick<Member, 'id' | 'memberId'>,
  childrenByParent: Map<string, Member[]>,
  depth = 1,
  visited = new Set<string>(),
): Array<{ member: Member; depth: number }> {
  if (visited.has(member.id)) return [];
  visited.add(member.id);

  const childMap = new Map<string, Member>();
  for (const parentKey of memberLookupKeys(member as Member)) {
    for (const child of childrenByParent.get(parentKey) ?? []) {
      childMap.set(child.id, child);
    }
  }

  return Array.from(childMap.values()).flatMap((child) => [
    { member: child, depth },
    ...collectDescendants(child, childrenByParent, depth + 1, visited),
  ]);
}

function memberMatchesFilters(member: Member, search: string, role: Role | '', status: UserStatus | '') {
  const normalizedSearch = search.trim().toLowerCase();
  const normalizedRole = normalizeRole(member.role);
  const normalizedStatus = normalizeStatus(member.status);
  const haystack = [member.memberId, memberName(member), memberPhone(member)]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return (
    (!normalizedSearch || haystack.includes(normalizedSearch)) &&
    (!role || normalizedRole === role) &&
    (!status || normalizedStatus === status)
  );
}

function memberToPerson(
  member: Member,
  childrenByParent: Map<string, Member[]>,
  fallbackBranch: Branch | undefined,
  depth: number,
): PersonRecord {
  const normalizedRole = normalizeRole(member.role) ?? 'AGENT';

  return {
    id: member.id,
    memberId: memberIdentifier(member),
    name: memberName(member),
    role: normalizedRole,
    phone: memberPhone(member),
    branch: branchNameFor(member, fallbackBranch),
    status: normalizeStatus(member.status),
    taggedCount: collectDescendants(member, childrenByParent).length,
    photoUrl: memberPhotoUrl(member),
    depth,
  };
}

function StatusBadge({ status }: { status: UserStatus }) {
  const styles: Record<UserStatus, string> = {
    ACTIVE: 'bg-teal-50 text-teal-700',
    PENDING: 'bg-amber-50 text-amber-700',
    INACTIVE: 'bg-gray-100 text-gray-600',
  };

  return (
    <span className={`inline-flex items-center rounded-sm px-2 py-0.5 text-[10px] font-bold uppercase ${styles[status]}`}>
      {status}
    </span>
  );
}

function Avatar({ name, photoUrl, selected = false }: { name: string; photoUrl?: string; selected?: boolean }) {
  const [failed, setFailed] = useState(false);
  const imageUrl = failed ? '' : photoUrl;

  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={`${name} photo`}
        onError={() => setFailed(true)}
        className={`h-11 w-11 shrink-0 rounded-lg object-cover shadow-sm ${selected ? 'ring-2 ring-gold' : ''}`}
      />
    );
  }

  return (
    <div
      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white shadow-sm ${
        selected ? 'bg-teal-700 ring-2 ring-gold' : 'bg-gradient-to-br from-gray-800 to-gray-500'
      }`}
    >
      {initials(name)}
    </div>
  );
}

function RoleBadge({ role }: { role: Role }) {
  const color =
    role === 'SENIOR_MANAGER' || role === 'BUSINESS_MANAGER' || role === 'AGENT'
      ? 'bg-teal-50 text-teal-700'
      : role === 'DEPUTY_DIRECTOR'
        ? 'bg-blue-50 text-blue-700'
        : 'bg-amber-50 text-gold';

  return (
    <span className={`inline-flex rounded-sm px-2 py-0.5 text-[10px] font-bold uppercase ${color}`}>
      {roleLabels[role]}
    </span>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-md border border-dashed border-amber-200 bg-white/70 px-4 py-5 text-sm font-semibold text-gray-500">
      {children}
    </div>
  );
}

function DirectorCard({
  director,
  selected,
  onSelect,
}: {
  director: DirectorRecord;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`relative flex min-h-32 flex-col rounded-lg border bg-white p-4 text-left shadow-sm transition hover:border-gold/70 ${
        selected ? 'border-gold ring-1 ring-gold' : 'border-gray-200'
      }`}
    >
      {selected && (
        <span className="absolute -top-2 right-4 rounded-sm bg-gold px-2 py-0.5 text-[10px] font-bold text-navy">
          SELECTED
        </span>
      )}
      <div className="flex items-start gap-3">
        <Avatar name={director.name} photoUrl={director.photoUrl} selected={selected} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-gray-900">{director.name}</p>
              <p className="text-xs font-semibold text-gray-700">{roleLabels[director.role]}</p>
              <p className="mt-0.5 truncate text-xs text-gray-500">{director.region}</p>
            </div>
            <StatusBadge status={director.status} />
          </div>
        </div>
      </div>
      <div className="mt-4 border-t border-gray-100 pt-3">
        <div className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-1.5 text-xs font-semibold text-gray-700">
            <Users className="h-3.5 w-3.5 text-gold" />
            {director.taggedCount} Tagged Members
          </span>
          <ArrowRight className="h-5 w-5 text-gold" />
        </div>
      </div>
    </button>
  );
}

function PersonRow({ person }: { person: PersonRecord }) {
  return (
    <div style={{ marginLeft: `${Math.max(0, Math.min(person.depth - 1, 4)) * 1.25}rem` }}>
      <div className="grid grid-cols-1 items-center gap-4 rounded-md border border-gray-200 bg-white px-4 py-4 shadow-sm md:grid-cols-[1.6fr_1fr_1fr_0.7fr_0.7fr]">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar name={person.name} photoUrl={person.photoUrl} />
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-gray-900">{person.name}</p>
            <p className="mt-0.5 truncate font-mono text-[11px] font-semibold text-gray-500">{person.memberId}</p>
            <div className="mt-1">
              <RoleBadge role={person.role} />
            </div>
          </div>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase text-gray-500">Phone</p>
          <p className="mt-1 text-sm font-semibold text-gray-900">{person.phone}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase text-gray-500">Branch</p>
          <p className="mt-1 text-sm font-semibold text-gray-900">{person.branch}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase text-gray-500">Status</p>
          <p className="mt-1 flex items-center gap-1 text-sm font-semibold text-teal-700">
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            {person.status === 'ACTIVE' ? 'Active' : person.status}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase text-gray-500">Tagged</p>
          <p className="mt-1 text-sm font-semibold text-gray-900">{person.taggedCount} Members</p>
        </div>
      </div>
    </div>
  );
}

const BranchMembersPage: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState<Role | ''>('');
  const [status, setStatus] = useState<UserStatus | ''>('');
  const [selectedDirectorId, setSelectedDirectorId] = useState('');
  const { data: teamMembersData, isLoading: isTeamLoading } = useTeam({ limit: 1000 });
  const { data: allMembersData, isLoading: isMembersLoading } = useMembers({ limit: 1000 });
  const teamMembers = useMemo(() => membersFromResponse(teamMembersData), [teamMembersData]);
  const allMembers = useMemo(() => membersFromResponse(allMembersData), [allMembersData]);
  const members = useMemo(() => (teamMembers.length ? teamMembers : allMembers), [allMembers, teamMembers]);
  const isLoading = isTeamLoading || (!teamMembers.length && isMembersLoading);
  const branch = user?.admin?.branch ?? members.find((member) => member.branch)?.branch;
  const childrenByParent = useMemo(() => buildChildrenByParent(members), [members]);
  const hasReportingAssignments = useMemo(() => members.some((member) => !!parentIdFor(member)), [members]);

  const directors = useMemo<DirectorRecord[]>(() => {
    return members
      .filter((member) => normalizeRole(member.role) === 'DIRECTOR')
      .map((member) => ({
        ...memberToPerson(member, childrenByParent, branch, 0),
        region: branchNameFor(member, branch),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [branch, childrenByParent, members]);

  const filteredDirectors = useMemo(() => {
    return directors.filter((director) => {
      const source = members.find((member) => member.id === director.id);
      return source ? memberMatchesFilters(source, search, role, status) : false;
    });
  }, [directors, members, role, search, status]);

  const selectedDirector = directors.find((director) => director.id === selectedDirectorId) ?? directors[0];

  const linkedDirectorDownline = useMemo(() => {
    return selectedDirector ? collectDescendants(selectedDirector, childrenByParent) : [];
  }, [childrenByParent, selectedDirector]);

  const showFullBranchByRole = !selectedDirector;
  const displayedRoleOrder = showFullBranchByRole ? fullHierarchyRoles : hierarchyRoles;

  const displayedMembers = useMemo(() => {
    const sourceMembers = showFullBranchByRole
      ? members.map((member) => ({ member, depth: normalizeRole(member.role) === 'DIRECTOR' ? 0 : 1 }))
      : linkedDirectorDownline;

    return sourceMembers
      .filter(({ member }) => {
        const normalizedRole = normalizeRole(member.role);
        return normalizedRole ? displayedRoleOrder.includes(normalizedRole) : false;
      })
      .filter(({ member }) => memberMatchesFilters(member, search, role, status))
      .map(({ member, depth }) => memberToPerson(member, childrenByParent, branch, depth))
      .sort((a, b) => {
        const roleDiff = displayedRoleOrder.indexOf(a.role) - displayedRoleOrder.indexOf(b.role);
        return roleDiff || a.depth - b.depth || a.name.localeCompare(b.name);
      });
  }, [
    branch,
    childrenByParent,
    displayedRoleOrder,
    linkedDirectorDownline,
    members,
    role,
    search,
    showFullBranchByRole,
    status,
  ]);

  const downlineByRole = useMemo(() => {
    return displayedRoleOrder.map((item) => ({
      role: item,
      members: displayedMembers.filter((person) => person.role === item),
    }));
  }, [displayedMembers, displayedRoleOrder]);

  const hierarchyNotice = useMemo(() => {
    if (!members.length || isLoading) return '';
    if (!hasReportingAssignments) return 'Members exist, but reporting hierarchy is not assigned.';
    if (selectedDirector && linkedDirectorDownline.length === 0) {
      return 'No members are linked under this director.';
    }
    if (!selectedDirector) return 'No director members found. Showing all branch members by role.';
    return '';
  }, [hasReportingAssignments, isLoading, linkedDirectorDownline.length, members.length, selectedDirector]);

  const totalMembers = members.length;
  const activeMembers = members.filter((member) => normalizeStatus(member.status) === 'ACTIVE').length;
  const branchName = branch?.name ?? '-';
  const branchLead = user?.admin?.fullName || '-';
  const branchStatus: UserStatus = branch?.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE';

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Branch Members</h1>
          <p className="mt-1 text-sm text-gray-600">Manage and view branch-level member hierarchy</p>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,18rem)_10rem_10rem]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <input
              aria-label="Search member"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Member/Phone/ID"
              className="h-10 w-full rounded-lg border border-amber-100 bg-amber-50/70 pl-9 pr-3 text-sm outline-none focus:border-gold focus:bg-white"
            />
          </div>
          <label className="relative">
            <span className="sr-only">Role filter</span>
            <select
              value={role}
              onChange={(event) => setRole(event.target.value as Role | '')}
              className="h-10 w-full appearance-none rounded-lg border border-amber-100 bg-white px-3 pr-8 text-sm font-semibold text-gray-700 outline-none focus:border-gold"
            >
              <option value="">All Roles</option>
              {hierarchyRoles.map((item) => (
                <option key={item} value={item}>
                  {roleLabels[item]}
                </option>
              ))}
              <option value="DIRECTOR">Director</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          </label>
          <label className="relative">
            <span className="sr-only">Status filter</span>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value as UserStatus | '')}
              className="h-10 w-full appearance-none rounded-lg border border-amber-100 bg-white px-3 pr-8 text-sm font-semibold text-gray-700 outline-none focus:border-gold"
            >
              <option value="">All Status</option>
              {statusOptions.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
            <UserCheck className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          </label>
        </div>
      </div>

      <section className="rounded-lg border border-gray-200 border-t-2 border-t-gold bg-white p-5 shadow-sm">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[2fr_1fr_1fr_1fr_1fr] lg:items-center">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-gold">
              <Building2 className="h-7 w-7" />
            </div>
            <div>
              <h2 className="max-w-56 text-lg font-bold leading-tight text-gray-900">{branchName}</h2>
              <p className="mt-1 flex items-center gap-1 text-sm text-gray-600">
                <MapPin className="h-3.5 w-3.5" />
                {branchLocation(branch)}
              </p>
            </div>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">Branch Lead</p>
            <p className="mt-1 text-sm font-bold text-gray-900">{branchLead}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">Total Members</p>
            <p className="mt-1 text-sm font-bold text-gray-900">{isLoading ? '-' : totalMembers}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">Active Members</p>
            <p className="mt-1 text-sm font-bold text-gray-900">{isLoading ? '-' : activeMembers}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">Branch Status</p>
            <div className="mt-1">
              <StatusBadge status={branchStatus} />
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center gap-3">
          <h2 className="shrink-0 text-lg font-bold text-gray-900">Director Network</h2>
          <div className="h-px flex-1 bg-gray-200" />
        </div>
        {isLoading ? (
          <EmptyState>Loading branch members...</EmptyState>
        ) : filteredDirectors.length ? (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {filteredDirectors.map((director) => (
              <DirectorCard
                key={director.id}
                director={director}
                selected={selectedDirector?.id === director.id}
                onSelect={() => setSelectedDirectorId(director.id)}
              />
            ))}
          </div>
        ) : members.length ? (
          <EmptyState>No director members found. Showing all branch members by role.</EmptyState>
        ) : (
          <EmptyState>No director members found.</EmptyState>
        )}
      </section>

      <section>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{branchName} Team Network</h2>
            <p className="mt-1 text-xs text-gray-600">
              {selectedDirector
                ? `Hierarchy drill-down for Director: ${selectedDirector.name}`
                : 'No director members found. Showing all branch members by role.'}
            </p>
          </div>
          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 rounded-sm border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            <ChevronsUpDown className="h-3.5 w-3.5" />
            Collapse All
          </button>
        </div>

        <div className="rounded-lg bg-amber-50/70 p-4 sm:p-6">
          <div className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-gold">
            <GitBranch className="h-5 w-5" />
            {showFullBranchByRole ? 'Full Branch Hierarchy' : 'Linked Downline Hierarchy'}
          </div>

          {hierarchyNotice && (
            <div className="mb-5 rounded-md border border-amber-200 bg-white px-4 py-3 text-sm font-semibold text-amber-800">
              {hierarchyNotice}
            </div>
          )}

          {!selectedDirector && !members.length && !isLoading ? (
            <EmptyState>No branch members found.</EmptyState>
          ) : selectedDirector && linkedDirectorDownline.length === 0 ? (
            <EmptyState>No members are linked under this director.</EmptyState>
          ) : (
            <div className="space-y-6">
              {downlineByRole.map((group) => (
                <div key={group.role}>
                  <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-gold">
                    {roleLabels[group.role]}s ({group.members.length})
                  </h3>
                  {group.members.length ? (
                    <div className="relative space-y-4 pl-4 sm:pl-6">
                      <div className="absolute bottom-2 left-1 top-0 w-px bg-gold/40 sm:left-2" />
                      {group.members.map((person) => (
                        <div key={person.id} className="relative">
                          <div className="absolute left-[-0.75rem] top-8 h-px w-4 bg-gold/40 sm:left-[-1rem] sm:w-5" />
                          <PersonRow person={person} />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState>No members found for this role.</EmptyState>
                  )}
                </div>
              ))}

              {selectedDirector && linkedDirectorDownline.length > 0 && (
                <button
                  type="button"
                  className="inline-flex items-center gap-2 text-xs font-semibold text-gold"
                >
                  <span className="h-px w-8 bg-gold/50" />
                  {linkedDirectorDownline.length} linked downline members
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default BranchMembersPage;
