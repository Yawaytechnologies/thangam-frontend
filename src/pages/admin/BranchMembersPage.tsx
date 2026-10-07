import React, { useMemo, useState } from 'react';
import {
  Building2,
  ChevronDown,
  MapPin,
  Search,
  UserCheck,
} from 'lucide-react';
import { useMembers, useTeam, useTeamMember } from '../../hooks/useMembers';
import { useAuthStore } from '../../stores/auth.store';
import { resolveFileUrl } from '../../lib/file-url';
import { Modal } from '../../components/ui/Modal';
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
  source: Member;
  rank: number;
}

const hierarchyRoles: Role[] = [
  'EXECUTIVE_DIRECTOR',
  'DEPUTY_DIRECTOR',
  'SENIOR_MANAGER',
  'BUSINESS_MANAGER',
  'AGENT',
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

function detailValue(value: unknown) {
  if (typeof value === 'string' && value.trim()) return value;
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return '-';
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

function getDirectChildren(member: Pick<Member, 'id' | 'memberId'>, childrenByParent: Map<string, Member[]>) {
  const childMap = new Map<string, Member>();

  for (const parentKey of memberLookupKeys(member as Member)) {
    for (const child of childrenByParent.get(parentKey) ?? []) {
      childMap.set(child.id, child);
    }
  }

  return Array.from(childMap.values()).sort((a, b) => memberName(a).localeCompare(memberName(b)));
}

function getDownlineMembers(member: Pick<Member, 'id' | 'memberId'>, childrenByParent: Map<string, Member[]>) {
  return collectDescendants(member, childrenByParent).map(({ member: child }) => child);
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

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-md border border-dashed border-amber-200 bg-white/70 px-4 py-5 text-sm font-semibold text-gray-500">
      {children}
    </div>
  );
}

function DownlineTree({
  root,
  childrenByParent,
  onViewMember,
}: {
  root: Member;
  childrenByParent: Map<string, Member[]>;
  onViewMember: (member: Member) => void;
}) {
  const [expandedParents, setExpandedParents] = useState<Record<string, boolean>>({});
  const directChildren = getDirectChildren(root, childrenByParent);

  const renderChildren = (parent: Member, depth = 0, visited = new Set<string>()): React.ReactNode => {
    if (visited.has(parent.id)) return null;

    const nextVisited = new Set(visited).add(parent.id);
    const children = getDirectChildren(parent, childrenByParent).filter((child) => !nextVisited.has(child.id));
    const expanded = Boolean(expandedParents[parent.id]);
    const visibleChildren = expanded ? children : children.slice(0, 2);
    const remainingCount = children.length - visibleChildren.length;

    if (children.length === 0) return null;

    return (
      <div className={depth === 0 ? 'ml-2 min-w-0 space-y-3 border-l border-gray-200 pb-1 pl-4 pt-4 sm:ml-4 sm:pl-5' : 'mt-3 min-w-0 space-y-3'}>
        {visibleChildren.map((member) => {
          const role = normalizeRole(member.role);
          const roleLabel = role ? roleLabels[role] : String(member.role || '-');

          return (
            <div key={member.id} className="min-w-0">
              <div className="relative grid min-h-[56px] w-full min-w-0 grid-cols-[minmax(0,1fr)_minmax(6.5rem,max-content)] items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 text-left shadow-sm">
                {depth === 0 && <span className="absolute -left-4 top-1/2 h-px w-4 bg-gray-200 sm:-left-5 sm:w-5" />}
                <button
                  type="button"
                  onClick={() => onViewMember(member)}
                  className="min-w-0 truncate text-left text-base font-bold text-gray-900 hover:text-gold focus:outline-none focus:ring-2 focus:ring-gold/40"
                  title={memberName(member)}
                >
                  {memberName(member)}
                </button>
                <span
                  className="min-w-0 max-w-[8.75rem] truncate text-right text-[12px] font-bold text-gray-500 sm:max-w-[10rem]"
                  title={roleLabel}
                >
                  {roleLabel}
                </span>
              </div>
              {renderChildren(member, depth + 1, nextVisited)}
            </div>
          );
        })}

        {!expanded && remainingCount > 0 && (
          <button
            type="button"
            onClick={() => setExpandedParents((current) => ({ ...current, [parent.id]: true }))}
            className="relative w-full rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-left text-xs font-bold text-amber-800 shadow-sm hover:bg-amber-100"
          >
            <span className="absolute -left-4 top-1/2 h-px w-4 bg-gray-200 sm:-left-5 sm:w-5" />
            +{remainingCount} {remainingCount === 1 ? 'Other' : 'Others'}
          </button>
        )}

        {expanded && children.length > 2 && (
          <button
            type="button"
            onClick={() => setExpandedParents((current) => ({ ...current, [parent.id]: false }))}
            className="w-full text-center text-xs font-bold text-gray-500 hover:text-gray-800"
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
}

function DirectorCard({
  director,
  selected,
  onSelect,
  onViewMember,
  childrenByParent,
}: {
  director: DirectorRecord;
  selected: boolean;
  onSelect: () => void;
  onViewMember: (member: Member) => void;
  childrenByParent: Map<string, Member[]>;
}) {
  const downlineMembers = getDownlineMembers(director.source, childrenByParent);
  const activeCount = downlineMembers.filter((member) => normalizeStatus(member.status) === 'ACTIVE').length;
  const pendingCount = downlineMembers.filter((member) => normalizeStatus(member.status) === 'PENDING').length;

  return (
    <article className="min-w-0">
      <div
        role="button"
        tabIndex={0}
        onClick={onSelect}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onSelect();
          }
        }}
        className={`relative w-full cursor-pointer rounded-lg border bg-white p-4 text-left shadow-sm transition hover:border-gold/70 sm:p-5 ${
          selected ? 'border-gold ring-1 ring-gold/50' : 'border-gray-200'
        }`}
      >
        <div className="flex items-start gap-4">
          <Avatar name={director.name} photoUrl={director.photoUrl} selected={selected} />
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onViewMember(director.source);
                  }}
                  className="block max-w-full truncate text-left text-base font-bold text-gray-900 hover:text-gold focus:outline-none focus:ring-2 focus:ring-gold/40"
                >
                  {director.name}
                </button>
                <p className="mt-1 truncate text-sm font-semibold text-gray-500">ID: {director.memberId}</p>
                <p className="mt-2 truncate text-sm font-semibold text-gray-500">{director.region}</p>
                <p className="mt-2 text-xs font-bold text-gray-400">Rank #{director.rank} - {director.status === 'ACTIVE' ? 'Active' : director.status}</p>
              </div>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold uppercase text-emerald-700">
                Director
              </span>
            </div>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-3 divide-x divide-gray-200 rounded-lg bg-gray-50 py-1 text-center">
          <div className="px-2 py-2">
            <p className="text-[10px] font-bold uppercase text-gray-400">Team</p>
            <p className="mt-1 text-lg font-black text-gray-900">{director.taggedCount}</p>
          </div>
          <div className="px-2 py-2">
            <p className="text-[10px] font-bold uppercase text-gray-400">Active</p>
            <p className="mt-1 text-lg font-black text-gray-900">{activeCount}</p>
          </div>
          <div className="px-2 py-2">
            <p className="text-[10px] font-bold uppercase text-gray-400">Pending</p>
            <p className="mt-1 text-lg font-black text-amber-700">{pendingCount}</p>
          </div>
        </div>
      </div>

      {selected && <DownlineTree root={director.source} childrenByParent={childrenByParent} onViewMember={onViewMember} />}
    </article>
  );
}

const DetailRow: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
    <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">{label}</p>
    <p className="mt-1 break-words text-sm font-semibold text-gray-900">{value}</p>
  </div>
);

function MemberDetailsModal({
  member,
  childrenByParent,
  onClose,
}: {
  member: Member;
  childrenByParent: Map<string, Member[]>;
  onClose: () => void;
}) {
  const role = normalizeRole(member.role);
  const reportsToName = isRecord(member.reportsTo)
    ? detailValue(member.reportsTo.fullName || member.reportsTo.name || member.reportsTo.memberId)
    : '-';
  const address = [member.address, member.city, member.district, member.state, member.pincode].filter(Boolean).join(', ');

  return (
    <Modal open onClose={onClose} title="Member Details" subtitle={memberIdentifier(member)} size="3xl">
      <div className="space-y-5 pt-4">
        <div className="flex items-center gap-4 rounded-lg border border-amber-100 bg-amber-50/60 p-4">
          <Avatar name={memberName(member)} photoUrl={memberPhotoUrl(member)} />
          <div className="min-w-0">
            <h3 className="truncate text-lg font-bold text-gray-900">{memberName(member)}</h3>
            <p className="mt-1 text-sm font-semibold text-gray-600">{role ? roleLabels[role] : detailValue(member.role)}</p>
            <p className="mt-1 text-xs font-bold text-teal-700">{normalizeStatus(member.status)}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <DetailRow label="Member ID" value={detailValue(memberIdentifier(member))} />
          <DetailRow label="Code Number" value={detailValue(member.codeNumber)} />
          <DetailRow label="Phone" value={detailValue(memberPhone(member))} />
          <DetailRow label="Alternate Phone" value={detailValue(member.alternatePhone)} />
          <DetailRow label="Email" value={detailValue(member.email)} />
          <DetailRow label="Role" value={role ? roleLabels[role] : detailValue(member.role)} />
          <DetailRow label="Branch" value={detailValue(member.branch?.name)} />
          <DetailRow label="Reports To" value={reportsToName} />
          <DetailRow label="Direct Reports" value={getDirectChildren(member, childrenByParent).length} />
          <DetailRow label="Team Members" value={getDownlineMembers(member, childrenByParent).length} />
          <DetailRow label="Joined Date" value={formatDate(member.createdAt)} />
          <DetailRow label="Date of Birth" value={formatDate(member.dateOfBirth)} />
          <DetailRow label="Qualification" value={detailValue(member.qualification)} />
          <DetailRow label="Experience" value={detailValue(member.experience)} />
          <DetailRow label="Intro Name" value={detailValue(member.introName)} />
          <DetailRow label="Nominee Name" value={detailValue(member.nomineeName)} />
          <DetailRow label="Nominee Relation" value={detailValue(member.nomineeRelation)} />
          <DetailRow label="Nominee Phone" value={detailValue(member.nomineePhone)} />
          <DetailRow label="PAN Number" value={detailValue(member.panNumber)} />
          <DetailRow label="Aadhaar Number" value={detailValue(member.aadhaarNumber)} />
          <DetailRow label="Address" value={address || '-'} />
        </div>
      </div>
    </Modal>
  );
}

const BranchMembersPage: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState<Role | ''>('');
  const [status, setStatus] = useState<UserStatus | ''>('');
  const [selectedDirectorId, setSelectedDirectorId] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const selectedMemberQuery = useTeamMember(selectedMemberId);
  const { data: teamMembersData, isLoading: isTeamLoading } = useTeam({ limit: 1000 });
  const { data: allMembersData, isLoading: isMembersLoading } = useMembers({ limit: 1000 });
  const teamMembers = useMemo(() => membersFromResponse(teamMembersData), [teamMembersData]);
  const allMembers = useMemo(() => membersFromResponse(allMembersData), [allMembersData]);
  const members = useMemo(() => (teamMembers.length ? teamMembers : allMembers), [allMembers, teamMembers]);
  const isLoading = isTeamLoading || (!teamMembers.length && isMembersLoading);
  const branch = user?.admin?.branch ?? members.find((member) => member.branch)?.branch;
  const childrenByParent = useMemo(() => buildChildrenByParent(members), [members]);
  const directors = useMemo<DirectorRecord[]>(() => {
    return members
      .filter((member) => normalizeRole(member.role) === 'DIRECTOR')
      .map((member) => ({
        ...memberToPerson(member, childrenByParent, branch, 0),
        region: branchNameFor(member, branch),
        source: member,
        rank: 0,
      }))
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((director, index) => ({ ...director, rank: index + 1 }));
  }, [branch, childrenByParent, members]);

  const filteredDirectors = useMemo(() => {
    return directors.filter((director) => {
      const source = members.find((member) => member.id === director.id);
      return source ? memberMatchesFilters(source, search, role, status) : false;
    });
  }, [directors, members, role, search, status]);

  const selectedDirector = directors.find((director) => director.id === selectedDirectorId) ?? directors[0];
  const selectedMemberFallback = members.find((member) => member.id === selectedMemberId);
  const selectedMember = selectedMemberQuery.data ?? selectedMemberFallback;

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
                onViewMember={(member) => setSelectedMemberId(member.id)}
                childrenByParent={childrenByParent}
              />
            ))}
          </div>
        ) : members.length ? (
          <EmptyState>No director members found. Showing all branch members by role.</EmptyState>
        ) : (
          <EmptyState>No director members found.</EmptyState>
        )}
      </section>

      {selectedMember && (
        <MemberDetailsModal
          member={selectedMember}
          childrenByParent={childrenByParent}
          onClose={() => setSelectedMemberId('')}
        />
      )}
    </div>
  );
};

export default BranchMembersPage;
