import React, { useState } from 'react';
import {
  useMembers,
  useUpdateMemberStatus,
  useUpdateMember,
  useUploadMemberPhoto,
} from '../../hooks/useMembers';
import { useBranches } from '../../hooks/useBranches';
import { Modal } from '../../components/ui/Modal';
import type { Member, Role, UserStatus } from '../../types';
import type { UpdateMemberData } from '../../api/members.api';

const ROLES: Role[] = [
  'DIRECTOR',
  'EXECUTIVE_DIRECTOR',
  'DEPUTY_DIRECTOR',
  'SENIOR_MANAGER',
  'BUSINESS_MANAGER',
  'AGENT',
];

const ROLE_ORDER: Record<string, number> = {
  DIRECTOR: 1,
  EXECUTIVE_DIRECTOR: 2,
  DEPUTY_DIRECTOR: 3,
  SENIOR_MANAGER: 4,
  BUSINESS_MANAGER: 5,
  AGENT: 6,
};

const ROLE_BADGE_LABELS: Record<string, string> = {
  DIRECTOR: 'Director',
  EXECUTIVE_DIRECTOR: 'Executive Director',
  DEPUTY_DIRECTOR: 'Deputy Director',
  SENIOR_MANAGER: 'Senior Manager',
  BUSINESS_MANAGER: 'Business Manager',
  AGENT: 'Agent',
};

type MemberExtraFields = {
  photo?: unknown;
  photoUrl?: unknown;
  profilePhoto?: unknown;
  profilePhotoUrl?: unknown;
  profileImage?: unknown;
  avatarUrl?: unknown;
  createdAt?: unknown;
  created_at?: unknown;
  branchName?: unknown;
  reportsToName?: unknown;
};

type MemberTreeNode = {
  member: Member;
  children: MemberTreeNode[];
};

function getMemberExtraFields(member: Member): MemberExtraFields {
  return member as unknown as MemberExtraFields;
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getStringValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined;
}

function getRecordValue(source: unknown, key: string): unknown {
  if (isObjectRecord(source)) {
    return source[key];
  }

  return undefined;
}

function getRawMemberValue(member: Member, key: string): unknown {
  return (member as unknown as Record<string, unknown>)[key];
}

function getText(member: Member, key: string): string {
  const value = getRawMemberValue(member, key);

  if (typeof value === 'string' && value.trim()) return value;
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);

  return '—';
}

function getMemberId(member: Member): string {
  const id = getRawMemberValue(member, 'id');

  if (typeof id === 'string' && id.trim()) return id;
  if (typeof id === 'number' && Number.isFinite(id)) return String(id);

  return '';
}

function getReportsToId(member: Member): string {
  const directReportsToId =
    getStringValue(getRawMemberValue(member, 'reportsToId')) ||
    getStringValue(getRawMemberValue(member, 'reports_to_id'));

  if (directReportsToId) return directReportsToId;

  const reportsTo = getRawMemberValue(member, 'reportsTo');

  if (isObjectRecord(reportsTo)) {
    const parentId =
      getStringValue(reportsTo.id) ||
      getStringValue(reportsTo.memberId) ||
      getStringValue(reportsTo.userId);

    return parentId || '';
  }

  return '';
}

function getMemberPhoto(member: Member): string {
  const extra = getMemberExtraFields(member);

  return (
    getStringValue(extra.photo) ||
    getStringValue(extra.photoUrl) ||
    getStringValue(extra.profilePhoto) ||
    getStringValue(extra.profilePhotoUrl) ||
    getStringValue(extra.profileImage) ||
    getStringValue(extra.avatarUrl) ||
    ''
  );
}

function formatDate(dateStr?: string) {
  if (!dateStr) return '—';

  const date = new Date(dateStr);

  if (Number.isNaN(date.getTime())) return '—';

  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatDateTime(dateStr?: string) {
  if (!dateStr) return '—';

  const date = new Date(dateStr);

  if (Number.isNaN(date.getTime())) return '—';

  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function CloseIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
      <path
        d="M18 6L6 18M6 6l12 12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
      <path
        d="M21 21l-4.2-4.2M10.5 18a7.5 7.5 0 110-15 7.5 7.5 0 010 15z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ResetIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
      <path
        d="M4 4v6h6M20 20v-6h-6M5 15a7 7 0 0012 3M19 9A7 7 0 007 6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
      <path
        d="M8 3v4M16 3v4M4 9h16M6 5h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V7a2 2 0 012-2z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BuildingIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
      <path
        d="M4 21h16M6 21V5a1 1 0 011-1h10a1 1 0 011 1v16M9 8h1M14 8h1M9 12h1M14 12h1M9 16h1M14 16h1"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
      <path
        d="M5 4h3l2 5-2 1.5A12 12 0 0013.5 16l1.5-2 5 2v3a2 2 0 01-2 2A15 15 0 013 6a2 2 0 012-2z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BranchIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 4v5M6 14v6M18 14v6M6 14h12M12 9H6v5M12 9h6v5M9 4h6v5H9V4z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 3l7 4v5c0 5-3 8-7 9-4-1-7-4-7-9V7l7-4zM9.5 12l1.8 1.8L15 10"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FileIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
      <path
        d="M7 3h7l4 4v14H7V3zM14 3v5h4M9 13h6M9 17h6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 8v5l3 2M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4 12.5-12.5z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BanIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
      <path
        d="M8 8l8 8M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SectionHeading({
  icon,
  title,
}: {
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <div className="mb-4 flex items-center gap-2 border-b border-[#f1f1f1] pb-2.5">
      <span className="text-[#a88213]">{icon}</span>
      <p className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-[#716a5a]">
        {title}
      </p>
    </div>
  );
}

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-[#eeeeee] bg-white px-4 py-3">
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-[#8c8c8c]">
        {label}
      </p>

      <div className="break-words text-sm font-bold text-[#2f2f2f]">
        {value || '—'}
      </div>
    </div>
  );
}

function DetailSection({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <SectionHeading icon={icon} title={title} />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {children}
      </div>
    </div>
  );
}

function RecentActivityItem({
  title,
  description,
  time,
}: {
  title: string;
  description: string;
  time: string;
}) {
  return (
    <div className="flex gap-3 rounded-xl border border-[#eeeeee] bg-white px-4 py-3">
      <div className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-[#b08a13]" />

      <div className="min-w-0 flex-1">
        <p className="text-sm font-extrabold text-[#2f2f2f]">{title}</p>

        <p className="mt-1 text-xs font-medium text-[#777]">
          {description}
        </p>

        <p className="mt-1 text-[11px] font-semibold text-[#9f7e18]">
          {time}
        </p>
      </div>
    </div>
  );
}

function MemberAvatar({ name, photo }: { name: string; photo?: string }) {
  const [hasError, setHasError] = useState(false);

  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('');

  const imageSource = photo && !hasError ? photo : '';

  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-gold/20 bg-gold/15 text-sm font-semibold text-navy">
      {imageSource ? (
        <img
          src={imageSource}
          alt={name}
          onError={() => setHasError(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        initials || 'M'
      )}
    </div>
  );
}

function sortTreeNodes(a: MemberTreeNode, b: MemberTreeNode) {
  const roleA = ROLE_ORDER[a.member.role] ?? 999;
  const roleB = ROLE_ORDER[b.member.role] ?? 999;

  if (roleA !== roleB) return roleA - roleB;

  return a.member.fullName.localeCompare(b.member.fullName);
}

function buildMemberTree(members: Member[]): MemberTreeNode[] {
  const nodeMap = new Map<string, MemberTreeNode>();
  const roots: MemberTreeNode[] = [];

  members.forEach((member) => {
    const id = getMemberId(member);

    if (!id) return;

    nodeMap.set(id, {
      member,
      children: [],
    });
  });

  members.forEach((member) => {
    const id = getMemberId(member);
    const parentId = getReportsToId(member);

    if (!id) return;

    const node = nodeMap.get(id);

    if (!node) return;

    if (parentId && parentId !== id && nodeMap.has(parentId)) {
      nodeMap.get(parentId)?.children.push(node);
    } else {
      roots.push(node);
    }
  });

  function sortNodes(nodes: MemberTreeNode[]) {
    nodes.sort(sortTreeNodes);

    nodes.forEach((node) => {
      sortNodes(node.children);
    });
  }

  sortNodes(roots);

  return roots;
}

function FounderCard() {
  return (
    <div className="relative mx-auto w-full max-w-[280px] rounded-2xl border-2 border-[#d2a925] bg-white px-5 pb-5 pt-8 text-center shadow-[0_18px_40px_rgba(0,0,0,0.08)]">
      <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#7a5b00] px-4 py-2 text-[9px] font-extrabold uppercase leading-tight text-white shadow">
        Chairman & Managing
        <br />
        Director
      </div>

      <div className="mx-auto flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border-2 border-[#d2a925] bg-[#f8f1d2] text-xl font-extrabold text-[#7a5b00]">
        ST
      </div>

      <h2 className="mt-4 text-lg font-extrabold text-gray-900">
        Dr. Rajesh Thangam
      </h2>

      <p className="mt-1 text-xs font-semibold text-gray-500">
        Founder & CMD
      </p>

      <div className="mt-3 flex items-center justify-center gap-2">
        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
          Active
        </span>

        <span className="rounded-full bg-[#fff6d8] px-2 py-0.5 text-[10px] font-bold text-[#9a7500]">
          Main Branch
        </span>
      </div>
    </div>
  );
}

function HierarchyMemberCard({
  member,
  onClick,
}: {
  member: Member;
  onClick: (member: Member) => void;
}) {
  const photo = getMemberPhoto(member);

  return (
    <button
      type="button"
      onClick={() => onClick(member)}
      className="group w-full max-w-[340px] rounded-xl border border-gray-200 bg-white p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#d2a925] hover:shadow-md"
    >
      <div className="flex items-center gap-3">
        <MemberAvatar name={member.fullName} photo={photo} />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="line-clamp-2 text-sm font-extrabold leading-5 text-gray-900">
              {member.fullName}
            </h3>

            <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[8px] font-extrabold uppercase text-emerald-700">
              {ROLE_BADGE_LABELS[member.role] || member.role.replace(/_/g, ' ')}
            </span>
          </div>

          <p className="mt-1 break-all font-mono text-[11px] font-semibold text-[#a88213]">
            {member.memberId}
          </p>

          <p className="mt-1 line-clamp-1 text-[11px] font-medium text-gray-500">
            {member.branch?.name ?? 'No branch assigned'}
          </p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 overflow-hidden rounded-lg border border-gray-100 bg-gray-50 text-center">
        <div className="border-r border-gray-100 px-2 py-2">
          <p className="text-[9px] font-semibold uppercase text-gray-400">
            Phone
          </p>

          <p className="mt-0.5 truncate text-[11px] font-bold text-gray-700">
            {member.phone || '—'}
          </p>
        </div>

        <div className="border-r border-gray-100 px-2 py-2">
          <p className="text-[9px] font-semibold uppercase text-gray-400">
            Status
          </p>

          <p className="mt-0.5 truncate text-[11px] font-bold text-gray-700">
            {member.status}
          </p>
        </div>

        <div className="px-2 py-2">
          <p className="text-[9px] font-semibold uppercase text-gray-400">
            Code
          </p>

          <p className="mt-0.5 truncate text-[11px] font-bold text-gray-700">
            {member.codeNumber || '—'}
          </p>
        </div>
      </div>
    </button>
  );
}

function TreeNodeView({
  node,
  onMemberClick,
  visitedIds = new Set<string>(),
}: {
  node: MemberTreeNode;
  onMemberClick: (member: Member) => void;
  visitedIds?: Set<string>;
}) {
  const currentId = getMemberId(node.member);

  if (!currentId || visitedIds.has(currentId)) return null;

  const nextVisitedIds = new Set(visitedIds);
  nextVisitedIds.add(currentId);

  const children = node.children.filter((child) => {
    const childId = getMemberId(child.member);
    return childId && !nextVisitedIds.has(childId);
  });

  return (
    <div className="w-full">
      <div className="flex justify-center">
        <HierarchyMemberCard member={node.member} onClick={onMemberClick} />
      </div>

      {children.length > 0 && (
        <div className="mt-5">
          <div className="mx-auto h-8 w-px bg-[#d2a925]" />

          <div className="rounded-2xl border border-[#eadca9] bg-[#fffdf6] p-4">
            <div className="mb-4 flex items-center justify-center">
              <span className="rounded-full bg-[#d2a925] px-3 py-1 text-[10px] font-extrabold uppercase tracking-wide text-white">
                Reporting Under {node.member.fullName}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 2xl:grid-cols-3">
              {children.map((child) => (
                <div key={getMemberId(child.member)}>
                  <TreeNodeView
                    node={child}
                    onMemberClick={onMemberClick}
                    visitedIds={nextVisitedIds}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function RealNestedHierarchyTree({
  members,
  onMemberClick,
}: {
  members: Member[];
  onMemberClick: (member: Member) => void;
}) {
  const tree = buildMemberTree(members);

  if (tree.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white px-4 py-12 text-center">
        <p className="text-sm font-bold text-gray-700">No hierarchy found.</p>

        <p className="mt-1 text-xs text-gray-500">
          Check whether backend is sending reportsToId correctly.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-hidden">
      <div className="px-2 py-4 sm:px-4">
        <FounderCard />

        <div className="mx-auto h-10 w-px bg-[#d2a925]" />

        <div className="space-y-8">
          {tree.map((rootNode) => (
            <div
              key={getMemberId(rootNode.member)}
              className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
            >
              <TreeNodeView
                node={rootNode}
                onMemberClick={onMemberClick}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MemberOverviewModal({
  member,
  open,
  onClose,
  onEdit,
  onToggleStatus,
}: {
  member: Member | null;
  open: boolean;
  onClose: () => void;
  onEdit: (member: Member) => void;
  onToggleStatus: (member: Member) => void;
}) {
  if (!open || !member) return null;

  const imageSource = getMemberPhoto(member);

  const createdAt =
    getStringValue(getRawMemberValue(member, 'createdAt')) ||
    getStringValue(getRawMemberValue(member, 'created_at'));

  const updatedAt = getStringValue(getRawMemberValue(member, 'updatedAt'));

  const userRecord = getRecordValue(member, 'user');
  const lastLoginAt = getStringValue(getRecordValue(userRecord, 'lastLoginAt'));

  const joinedDate = formatDate(createdAt);
  const dob = formatDate(getStringValue(getRawMemberValue(member, 'dateOfBirth')));

  const branchName =
    member.branch?.name ||
    getStringValue(getRawMemberValue(member, 'branchName')) ||
    '—';

  const branchCode =
    getStringValue(getRecordValue(member.branch, 'branchCode')) || '—';

  const branchType =
    getStringValue(getRecordValue(member.branch, 'branchType')) || '—';

  const branchPhone =
    getStringValue(getRecordValue(member.branch, 'phone')) || '—';

  const branchAddress = [
    getStringValue(getRecordValue(member.branch, 'address')),
    getStringValue(getRecordValue(member.branch, 'city')),
    getStringValue(getRecordValue(member.branch, 'district')),
    getStringValue(getRecordValue(member.branch, 'state')),
    getStringValue(getRecordValue(member.branch, 'pincode')),
  ]
    .filter(Boolean)
    .join(', ');

  const isActive = member.status === 'ACTIVE';

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/45 px-2 py-3 backdrop-blur-[3px] sm:px-4">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative flex max-h-[calc(100vh-24px)] w-full max-w-[1050px] flex-col overflow-hidden rounded-[14px] border border-[#ededed] bg-white shadow-[0_24px_70px_rgba(0,0,0,0.28)] sm:rounded-[18px]">
        <div className="relative shrink-0 px-4 pb-4 pt-5 sm:px-[34px] sm:pb-5 sm:pt-[22px]">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full border border-[#b8cdfb] bg-white text-[#777] shadow-[0_0_0_2px_rgba(96,165,250,0.12)] transition hover:bg-[#f8fbff] sm:right-[30px] sm:top-[18px]"
            aria-label="Close"
          >
            <CloseIcon />
          </button>

          <h2 className="pr-10 text-[18px] font-extrabold leading-none text-[#2d2d2d] sm:text-[22px]">
            Member Overview
          </h2>

          <p className="mt-2 pr-8 text-[12px] font-medium text-[#747474] sm:text-[13px]">
            View complete member profile, contact, nominee, identity, branch, and activity details.
          </p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-5 sm:px-[34px] sm:pb-6">
          <div className="mb-6 flex flex-col gap-4 rounded-xl border border-[#f0f0f2] bg-[#f7f7f9] px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <div className="relative shrink-0">
                {imageSource ? (
                  <img
                    src={imageSource}
                    alt={member.fullName}
                    className="h-[70px] w-[70px] rounded-xl border border-[#cfcfcf] object-cover"
                  />
                ) : (
                  <div className="flex h-[70px] w-[70px] items-center justify-center rounded-xl border border-[#cfcfcf] bg-[#dedede] text-xl font-bold text-[#555]">
                    {member.fullName?.charAt(0)?.toUpperCase() || 'M'}
                  </div>
                )}

                <span
                  className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-white ${
                    isActive ? 'bg-[#2f7d68]' : 'bg-[#d8463b]'
                  }`}
                />
              </div>

              <div className="min-w-0">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <h3 className="break-words text-[20px] font-extrabold leading-tight text-[#2d2d2d] sm:text-[24px]">
                    {member.fullName}
                  </h3>

                  <span className="w-fit rounded-md border border-[#cddfd9] bg-[#dcebe5] px-2 py-0.5 text-[10px] font-extrabold text-[#477463]">
                    {member.role.replace(/_/g, ' ')}
                  </span>
                </div>

                <p className="mt-2 break-all text-[13px] font-extrabold text-[#b08a13]">
                  {member.memberId}
                </p>

                <p className="mt-1 text-xs font-semibold text-[#666]">
                  Code No: {member.codeNumber || '—'}
                </p>
              </div>
            </div>

            <div className="space-y-2 text-left text-xs font-bold text-[#555] sm:text-right">
              <p className="flex items-center gap-1.5 sm:justify-end">
                <CalendarIcon />
                Joined Date: {joinedDate}
              </p>

              <p className="flex items-center gap-1.5 sm:justify-end">
                <BuildingIcon />
                {branchName}
              </p>

              <p
                className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-extrabold ${
                  isActive
                    ? 'bg-[#e8f4ef] text-[#2f7d68]'
                    : 'bg-[#fff1f0] text-[#d8463b]'
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    isActive ? 'bg-[#2f7d68]' : 'bg-[#d8463b]'
                  }`}
                />
                {member.status}
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <DetailSection icon={<PhoneIcon />} title="Contact Information">
              <DetailItem label="Phone Number" value={member.phone || '—'} />
              <DetailItem label="Alternate Phone" value={getText(member, 'alternatePhone')} />
              <DetailItem label="Email Address" value={member.email || '—'} />
              <DetailItem label="Address" value={getText(member, 'address')} />
              <DetailItem label="City" value={getText(member, 'city')} />
              <DetailItem label="District" value={getText(member, 'district')} />
              <DetailItem label="State" value={getText(member, 'state')} />
              <DetailItem label="Pincode" value={getText(member, 'pincode')} />
            </DetailSection>

            <DetailSection icon={<FileIcon />} title="Personal Information">
              <DetailItem label="Full Name" value={member.fullName || '—'} />
              <DetailItem label="Gender" value={getText(member, 'gender')} />
              <DetailItem label="Date of Birth" value={dob} />
              <DetailItem label="Blood Group" value={getText(member, 'bloodGroup')} />
              <DetailItem label="Qualification" value={getText(member, 'qualification')} />
              <DetailItem label="Experience" value={getText(member, 'experience')} />
              <DetailItem label="Role" value={member.role.replace(/_/g, ' ')} />
              <DetailItem label="Status" value={member.status} />
            </DetailSection>

            <DetailSection icon={<ShieldIcon />} title="Identity Details">
              <DetailItem label="PAN Number" value={getText(member, 'panNumber')} />
              <DetailItem label="Aadhaar Number" value={getText(member, 'aadhaarNumber')} />
              <DetailItem label="Voter ID Number" value={getText(member, 'voterIdNumber')} />
              <DetailItem label="Driving License" value={getText(member, 'drivingLicense')} />
            </DetailSection>

            <DetailSection icon={<BranchIcon />} title="Branch Details">
              <DetailItem label="Branch Name" value={branchName} />
              <DetailItem label="Branch Code" value={branchCode} />
              <DetailItem label="Branch Type" value={branchType} />
              <DetailItem label="Branch Phone" value={branchPhone} />
              <DetailItem label="Branch Address" value={branchAddress || '—'} />
            </DetailSection>

            <DetailSection icon={<FileIcon />} title="Nominee Details">
              <DetailItem label="Nominee Name" value={getText(member, 'nomineeName')} />
              <DetailItem label="Nominee Relation" value={getText(member, 'nomineeRelation')} />
              <DetailItem label="Nominee Phone" value={getText(member, 'nomineePhone')} />
            </DetailSection>

            <DetailSection icon={<FileIcon />} title="Bank Details">
              <DetailItem label="Bank Name" value={getText(member, 'bankName')} />
              <DetailItem label="Account Holder" value={getText(member, 'accountHolder')} />
              <DetailItem label="Account Number" value={getText(member, 'accountNumber')} />
              <DetailItem label="IFSC Code" value={getText(member, 'ifscCode')} />
              <DetailItem label="Bank Branch" value={getText(member, 'bankBranch')} />
            </DetailSection>

            <DetailSection icon={<ClockIcon />} title="System Details">
              <DetailItem label="Member ID" value={member.memberId} />
              <DetailItem label="Code Number" value={member.codeNumber || '—'} />
              <DetailItem label="Reports To" value={member.reportsTo?.fullName || '—'} />
              <DetailItem label="Intro Name" value={getText(member, 'introName')} />
              <DetailItem label="Created At" value={formatDateTime(createdAt)} />
              <DetailItem label="Updated At" value={formatDateTime(updatedAt)} />
            </DetailSection>

            <div>
              <SectionHeading icon={<ClockIcon />} title="Recent Activity" />

              <div className="space-y-3">
                <RecentActivityItem
                  title="Member profile created"
                  description={`${member.fullName} was added as ${member.role.replace(/_/g, ' ')}.`}
                  time={formatDateTime(createdAt)}
                />

                <RecentActivityItem
                  title="Branch assigned"
                  description={`Assigned to ${branchName}.`}
                  time={formatDateTime(createdAt)}
                />

                <RecentActivityItem
                  title="Current account status"
                  description={`Member account is currently ${member.status}.`}
                  time={formatDateTime(updatedAt)}
                />

                <RecentActivityItem
                  title="Profile last updated"
                  description="Member profile details were updated."
                  time={formatDateTime(updatedAt)}
                />

                <RecentActivityItem
                  title="Last login"
                  description={
                    lastLoginAt
                      ? 'Member logged into the system.'
                      : 'Member has not logged in yet.'
                  }
                  time={lastLoginAt ? formatDateTime(lastLoginAt) : '—'}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-2 border-t border-[#ececf0] bg-[#f8f8fb] px-4 py-3 sm:flex-row sm:items-center sm:justify-end sm:gap-4 sm:px-[34px]">
          <button
            type="button"
            onClick={() => onEdit(member)}
            className="inline-flex h-[38px] w-full items-center justify-center gap-2 rounded-[9px] border border-[#d1bd75] bg-white px-4 text-[12px] font-extrabold text-[#a98313] shadow-sm transition hover:bg-[#fffaf0] sm:w-auto sm:min-w-[118px]"
          >
            <EditIcon />
            Edit Member
          </button>

          <button
            type="button"
            onClick={() => onToggleStatus(member)}
            className="inline-flex h-[38px] w-full items-center justify-center gap-2 rounded-[9px] border border-[#e49c97] bg-white px-4 text-[12px] font-extrabold text-[#d8463b] shadow-sm transition hover:bg-[#fff6f5] sm:w-auto sm:min-w-[150px]"
          >
            <BanIcon />
            {member.status === 'ACTIVE'
              ? 'Deactivate Member'
              : 'Activate Member'}
          </button>
        </div>
      </div>
    </div>
  );
}

type EditMemberModalProps = {
  member: Member | null;
  open: boolean;
  onClose: () => void;
};

function getMemberForm(member: Member): UpdateMemberData {
  return {
    fullName: member.fullName,
    phone: member.phone,
    email: member.email,
    role: member.role,
    branchId: member.branchId,
    codeNumber: member.codeNumber,
  };
}

function EditMemberModal({ member, open, onClose }: EditMemberModalProps) {
  if (!member) return null;

  return (
    <EditMemberModalContent
      key={member.id}
      member={member}
      open={open}
      onClose={onClose}
    />
  );
}

function EditMemberModalContent({
  member,
  open,
  onClose,
}: {
  member: Member;
  open: boolean;
  onClose: () => void;
}) {
  const updateMutation = useUpdateMember();
  const uploadMemberPhoto = useUploadMemberPhoto();
  const branchesQuery = useBranches();
  const branches = branchesQuery.data?.data ?? [];

  const [form, setForm] = useState<UpdateMemberData>(() =>
    getMemberForm(member)
  );

  const [memberPhotoFile, setMemberPhotoFile] = useState<File | null>(null);

  function handleClose() {
    setMemberPhotoFile(null);
    onClose();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    updateMutation.mutate(
      {
        id: member.id,
        data: form,
      },
      {
        onSuccess: (updatedMember) => {
          if (memberPhotoFile) {
            uploadMemberPhoto.mutate({
              id: updatedMember.id,
              file: memberPhotoFile,
            });
          }

          handleClose();
        },
      }
    );
  }

  return (
    <Modal open={open} onClose={handleClose} title="Edit Member" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">
              Full Name
            </label>

            <input
              type="text"
              value={form.fullName ?? ''}
              onChange={(e) =>
                setForm((formState) => ({
                  ...formState,
                  fullName: e.target.value,
                }))
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">
              Phone
            </label>

            <input
              type="tel"
              pattern="[6-9][0-9]{9}"
              maxLength={10}
              title="Enter a valid 10-digit Indian mobile number"
              placeholder="9876543210"
              value={form.phone ?? ''}
              onChange={(e) =>
                setForm((formState) => ({
                  ...formState,
                  phone: e.target.value.replace(/\D/g, '').slice(0, 10),
                }))
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">
              Email
            </label>

            <input
              type="email"
              value={form.email ?? ''}
              onChange={(e) =>
                setForm((formState) => ({
                  ...formState,
                  email: e.target.value,
                }))
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">
              Role
            </label>

            <select
              value={form.role ?? ''}
              onChange={(e) =>
                setForm((formState) => ({
                  ...formState,
                  role: e.target.value as Role,
                }))
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold"
            >
              {ROLES.map((roleItem) => (
                <option key={roleItem} value={roleItem}>
                  {roleItem.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">
              Branch
            </label>

            <select
              value={form.branchId ?? ''}
              onChange={(e) =>
                setForm((formState) => ({
                  ...formState,
                  branchId: e.target.value,
                }))
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold"
            >
              <option value="">Select branch</option>

              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">
              Code Number
            </label>

            <input
              type="text"
              value={form.codeNumber ?? ''}
              onChange={(e) =>
                setForm((formState) => ({
                  ...formState,
                  codeNumber: e.target.value,
                }))
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Profile Photo
          </label>

          <input
            type="file"
            accept="image/*"
            onChange={(e) => setMemberPhotoFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm text-gray-500 file:mr-4 file:rounded-lg file:border-0 file:bg-gold/10 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-navy hover:file:bg-gold/20"
          />
        </div>

        <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-navy hover:opacity-90 disabled:opacity-50"
          >
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function DeactivateConfirmModal({
  member,
  open,
  onClose,
}: {
  member: Member | null;
  open: boolean;
  onClose: () => void;
}) {
  const updateStatus = useUpdateMemberStatus();

  if (!member) return null;

  const isActive = member.status === 'ACTIVE';
  const newStatus: UserStatus = isActive ? 'INACTIVE' : 'ACTIVE';

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isActive ? 'Deactivate Member' : 'Activate Member'}
      size="sm"
    >
      <p className="mb-6 text-sm text-gray-600">
        {isActive
          ? `Are you sure you want to deactivate ${member.fullName}? They will lose access to the system.`
          : `Are you sure you want to activate ${member.fullName}?`}
      </p>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={() =>
            updateStatus.mutate(
              { id: member.id, status: newStatus },
              { onSuccess: () => onClose() }
            )
          }
          disabled={updateStatus.isPending}
          className={`rounded-lg px-4 py-2 text-sm text-white disabled:opacity-50 ${
            isActive
              ? 'bg-red-600 hover:bg-red-700'
              : 'bg-green-600 hover:bg-green-700'
          }`}
        >
          {updateStatus.isPending
            ? 'Updating...'
            : isActive
            ? 'Deactivate'
            : 'Activate'}
        </button>
      </div>
    </Modal>
  );
}

const MembersPage: React.FC = () => {
  const [memberIdSearch, setMemberIdSearch] = useState('');
  const [phoneSearch, setPhoneSearch] = useState('');
  const [role, setRole] = useState('');

  const [viewMember, setViewMember] = useState<Member | null>(null);
  const [editMember, setEditMember] = useState<Member | null>(null);
  const [deactivateMember, setDeactivateMember] = useState<Member | null>(null);

  const { data, isLoading } = useMembers({
    page: 1,
    limit: 500,
    role: (role as Role) || undefined,
  });

  const members = data?.data ?? [];

  const filteredMembers = members.filter((member) => {
    const memberIdMatch = memberIdSearch.trim()
      ? member.memberId
          ?.toLowerCase()
          .includes(memberIdSearch.trim().toLowerCase())
      : true;

    const phoneMatch = phoneSearch.trim()
      ? member.phone?.includes(phoneSearch.trim())
      : true;

    const roleMatch = role ? member.role === role : true;

    return memberIdMatch && phoneMatch && roleMatch;
  });

  function handleReset() {
    setMemberIdSearch('');
    setPhoneSearch('');
    setRole('');
  }

  return (
    <div className="space-y-5 p-3 sm:p-4 lg:p-6">
      <div>
        <h1 className="text-2xl font-extrabold leading-tight text-gray-900">
          Members
          <br className="hidden sm:block" />
          Management
        </h1>

        <p className="mt-1 text-sm font-medium text-gray-500">
          View real member hierarchy based on Reports To connection.
        </p>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_1fr_1fr_auto_auto]">
          <div>
            <label className="mb-1 block text-xs font-bold text-gray-700">
              Member ID
            </label>

            <input
              type="text"
              value={memberIdSearch}
              onChange={(e) => setMemberIdSearch(e.target.value)}
              placeholder="e.g. STH-MEM-0014"
              className="h-11 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-[#d2a925] focus:ring-2 focus:ring-[#d2a925]/20"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold text-gray-700">
              Phone Number
            </label>

            <input
              type="text"
              value={phoneSearch}
              onChange={(e) =>
                setPhoneSearch(e.target.value.replace(/\D/g, '').slice(0, 10))
              }
              placeholder="+91 00000 00000"
              className="h-11 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-[#d2a925] focus:ring-2 focus:ring-[#d2a925]/20"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold text-gray-700">
              Role
            </label>

            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="h-11 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-[#d2a925] focus:ring-2 focus:ring-[#d2a925]/20"
            >
              <option value="">All Roles</option>

              {ROLES.map((roleItem) => (
                <option key={roleItem} value={roleItem}>
                  {roleItem.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="button"
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#d2a925] px-6 text-sm font-extrabold text-white shadow-sm transition hover:bg-[#b88f16] md:w-auto"
            >
              <SearchIcon />
              Search
            </button>
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-6 text-sm font-extrabold text-gray-700 transition hover:bg-gray-100 md:w-auto"
            >
              <ResetIcon />
              Reset
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-[#fbfbfd] p-4 sm:p-6">
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-40 animate-pulse rounded-2xl border border-gray-200 bg-white"
              />
            ))}
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white px-4 py-12 text-center">
            <p className="text-sm font-bold text-gray-700">
              No members found.
            </p>

            <p className="mt-1 text-xs text-gray-500">
              Try changing the search filters.
            </p>
          </div>
        ) : (
          <RealNestedHierarchyTree
            members={filteredMembers}
            onMemberClick={setViewMember}
          />
        )}
      </div>

      <MemberOverviewModal
        member={viewMember}
        open={!!viewMember}
        onClose={() => setViewMember(null)}
        onEdit={(member) => {
          setViewMember(null);
          setEditMember(member);
        }}
        onToggleStatus={(member) => {
          setViewMember(null);
          setDeactivateMember(member);
        }}
      />

      <EditMemberModal
        member={editMember}
        open={!!editMember}
        onClose={() => setEditMember(null)}
      />

      <DeactivateConfirmModal
        member={deactivateMember}
        open={!!deactivateMember}
        onClose={() => setDeactivateMember(null)}
      />
    </div>
  );
};

export default MembersPage;