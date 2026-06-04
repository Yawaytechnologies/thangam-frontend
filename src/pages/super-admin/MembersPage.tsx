import React, { useCallback, useMemo, useState } from 'react';
import type { UpdateMemberData } from '../../api/members.api';
import { useBranches } from '../../hooks/useBranches';
import { useMembers, useUpdateMember, useUploadMemberPhoto } from '../../hooks/useMembers';

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
  branchId?: string | number | null;
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

  gender?: string | null;
  dateOfBirth?: string | null;
  bloodGroup?: string | null;
  qualification?: string | null;
  experience?: string | null;

  bankName?: string | null;
  accountHolder?: string | null;
  accountNumber?: string | null;
  ifscCode?: string | null;
  bankBranch?: string | null;

  nomineeName?: string | null;
  nomineeRelation?: string | null;
  nomineePhone?: string | null;

  panNumber?: string | null;
  aadhaarNumber?: string | null;
  voterIdNumber?: string | null;
  drivingLicense?: string | null;

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

type Filters = {
  global: string;
  memberId: string;
  phone: string;
  role: MemberRole | 'ALL';
};

type MemberEditForm = {
  fullName: string;
  role: MemberRole;
  status: string;
  memberId: string;
  codeNumber: string;
  phone: string;
  alternatePhone: string;
  email: string;
  branchId: string;
  branchName: string;
  reportsToId: string;
  address: string;
  city: string;
  district: string;
  state: string;
  pincode: string;
  gender: string;
  dateOfBirth: string;
  bloodGroup: string;
  qualification: string;
  experience: string;
  bankName: string;
  accountHolder: string;
  accountNumber: string;
  ifscCode: string;
  bankBranch: string;
  nomineeName: string;
  nomineeRelation: string;
  nomineePhone: string;
  panNumber: string;
  aadhaarNumber: string;
  voterIdNumber: string;
  drivingLicense: string;
  profileImage: string;
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

const FOUNDER: HierarchyNode = {
  id: 'founder-root',
  fullName: 'Dr. Rajesh Thangam',
  role: 'FOUNDER',
  status: 'ACTIVE',
  branchName: 'Chennai Main Branch',
  email: 'founder@srithangam.com',
  phone: '—',
  memberId: 'STH-001',
  isFounder: true,
};

const emptyFilters: Filters = {
  global: '',
  memberId: '',
  phone: '',
  role: 'ALL',
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

  if (cleanRole === 'FOUNDER') return 'FOUNDER';
  if (cleanRole === 'DIRECTOR') return 'DIRECTOR';
  if (cleanRole === 'DEPUTY_DIRECTOR') return 'DEPUTY_DIRECTOR';
  if (cleanRole === 'EXECUTIVE_DIRECTOR') return 'EXECUTIVE_DIRECTOR';
  if (cleanRole === 'SENIOR_MANAGER') return 'SENIOR_MANAGER';
  if (cleanRole === 'BUSINESS_MANAGER') return 'BUSINESS_MANAGER';
  if (cleanRole === 'AGENT') return 'AGENT';

  return 'AGENT';
}

function normalizeDateInput(value?: string | null) {
  if (!value) return '';

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return '';

  return date.toISOString().slice(0, 10);
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

function createEditForm(member: HierarchyNode): MemberEditForm {
  return {
    fullName: member.fullName ?? '',
    role: member.role,
    status: String(member.status ?? 'ACTIVE'),
    memberId: String(member.memberId ?? ''),
    codeNumber: String(member.codeNumber ?? ''),
    phone: String(member.phone ?? ''),
    alternatePhone: String(member.alternatePhone ?? ''),
    email: String(member.email ?? ''),
    branchId: String(member.branch?.id ?? member.branchId ?? ''),
    branchName: getBranchName(member) === 'Unassigned Branch' ? '' : getBranchName(member),
    reportsToId: getReportsToId(member),
    address: String(member.address ?? ''),
    city: String(member.city ?? ''),
    district: String(member.district ?? ''),
    state: String(member.state ?? ''),
    pincode: String(member.pincode ?? ''),
    gender: String(member.gender ?? ''),
    dateOfBirth: normalizeDateInput(member.dateOfBirth),
    bloodGroup: String(member.bloodGroup ?? ''),
    qualification: String(member.qualification ?? ''),
    experience: String(member.experience ?? ''),
    bankName: String(member.bankName ?? ''),
    accountHolder: String(member.accountHolder ?? ''),
    accountNumber: String(member.accountNumber ?? ''),
    ifscCode: String(member.ifscCode ?? ''),
    bankBranch: String(member.bankBranch ?? ''),
    nomineeName: String(member.nomineeName ?? ''),
    nomineeRelation: String(member.nomineeRelation ?? ''),
    nomineePhone: String(member.nomineePhone ?? ''),
    panNumber: String(member.panNumber ?? ''),
    aadhaarNumber: String(member.aadhaarNumber ?? ''),
    voterIdNumber: String(member.voterIdNumber ?? ''),
    drivingLicense: String(member.drivingLicense ?? ''),
    profileImage: getAvatarUrl(member),
  };
}

function formToMemberPatch(form: MemberEditForm): Partial<MemberRecord> {
  return {
    fullName: form.fullName || undefined,
    gender: form.gender || undefined,
    dateOfBirth: form.dateOfBirth || undefined,
    bloodGroup: form.bloodGroup || undefined,
    qualification: form.qualification || undefined,
    experience: form.experience || undefined,
    phone: form.phone || undefined,
    alternatePhone: form.alternatePhone || undefined,
    email: form.email || undefined,
    address: form.address || undefined,
    city: form.city || undefined,
    district: form.district || undefined,
    state: form.state || undefined,
    pincode: form.pincode || undefined,
    panNumber: form.panNumber || undefined,
    aadhaarNumber: form.aadhaarNumber || undefined,
    voterIdNumber: form.voterIdNumber || undefined,
    drivingLicense: form.drivingLicense || undefined,
    role: form.role,
    codeNumber: form.codeNumber || undefined,
    reportsToId: form.reportsToId || undefined,
    nomineeName: form.nomineeName || undefined,
    nomineeRelation: form.nomineeRelation || undefined,
    nomineePhone: form.nomineePhone || undefined,
    bankName: form.bankName || undefined,
    accountHolder: form.accountHolder || undefined,
    accountNumber: form.accountNumber || undefined,
    ifscCode: form.ifscCode || undefined,
    bankBranch: form.bankBranch || undefined,
    branchId: form.branchId || undefined,
    status: form.status || 'ACTIVE',
  };
}

function IconSearch({ className = 'h-3.5 w-3.5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 21l-4.35-4.35m1.1-5.4a6.5 6.5 0 11-13 0 6.5 6.5 0 0113 0z"
      />
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
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5 5 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  );
}

function IconUser({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.9}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.75 7.5a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 20.25a7.5 7.5 0 0115 0"
      />
    </svg>
  );
}

function IconEdit({ className = 'h-3.5 w-3.5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.5 7.125L16.875 4.5M18 14v5.25A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
      />
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
      ? 'h-[66px] w-[66px] text-lg'
      : size === 'sm'
        ? 'h-9 w-9 text-[11px]'
        : 'h-11 w-11 text-xs';

  return (
    <div
      className={`flex ${sizeClass} shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-100 font-black text-slate-700 shadow-sm`}
    >
      {avatarUrl ? (
        <img src={avatarUrl} alt={toText(member.fullName || member.name)} className="h-full w-full object-cover" />
      ) : (
        getInitials(member.fullName || member.name)
      )}
    </div>
  );
}

function FilterInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[10px] font-black text-slate-700">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-[12px] font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#c9a227] focus:ring-4 focus:ring-[#c9a227]/10"
      />
    </label>
  );
}

function FounderCard({
  founder,
  teamSize,
  directReports,
  onOpen,
}: {
  founder: HierarchyNode;
  teamSize: number;
  directReports: number;
  onOpen: () => void;
}) {
  return (
    <div className="relative mx-auto w-full max-w-[310px]">
      <div className="absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#705400] px-4 py-1 text-center text-[8px] font-black uppercase leading-3 tracking-[0.05em] text-white shadow-sm">
        Chairman & Managing
        <br />
        Director
      </div>

      <article
        onClick={onOpen}
        className="cursor-pointer rounded-[18px] border-2 border-[#c9a227] bg-white px-5 pb-5 pt-8 text-center shadow-[0_18px_45px_rgba(15,20,25,0.12)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_55px_rgba(15,20,25,0.16)]"
      >
        <div className="mx-auto flex justify-center">
          <Avatar member={founder} size="lg" />
        </div>

        <h2 className="mt-4 text-[19px] font-black leading-tight text-slate-950">{founder.fullName}</h2>
        <p className="mt-1 text-[11px] font-extrabold text-slate-500">Founder & CMD</p>

        <div className="mt-3 flex flex-wrap justify-center gap-2">
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[9px] font-black uppercase text-emerald-700">
            Active
          </span>
          <span className="rounded-full bg-[#fbf8ef] px-2.5 py-1 text-[9px] font-black text-[#8a6a08]">
            Chennai Main Branch
          </span>
        </div>

        <div className="mt-4 grid grid-cols-2 divide-x divide-slate-100 rounded-xl border border-slate-100 bg-slate-50">
          <div className="px-3 py-3">
            <p className="text-[9px] font-bold text-slate-400">Direct Team</p>
            <p className="mt-0.5 text-[14px] font-black text-slate-950">{formatNumber(directReports)}</p>
          </div>

          <div className="px-3 py-3">
            <p className="text-[9px] font-bold text-slate-400">Network</p>
            <p className="mt-0.5 text-[14px] font-black text-slate-950">{formatNumber(teamSize)}</p>
          </div>
        </div>
      </article>
    </div>
  );
}

function MemberCard({
  member,
  teamSize,
  directReports,
  hasNextLevel,
  onOpen,
  onViewTeam,
  onEdit,
}: {
  member: HierarchyNode;
  teamSize: number;
  directReports: number;
  hasNextLevel: boolean;
  onOpen: () => void;
  onViewTeam: () => void;
  onEdit: () => void;
}) {
  return (
    <article
      onClick={onOpen}
      className="group cursor-pointer rounded-[14px] border border-slate-200 bg-white p-3 shadow-[0_8px_20px_rgba(15,20,25,0.045)] transition hover:-translate-y-0.5 hover:border-[#c9a227]/70 hover:shadow-[0_14px_30px_rgba(15,20,25,0.08)]"
    >
      <div className="flex items-start gap-3">
        <Avatar member={member} size="sm" />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="truncate text-[13px] font-black leading-tight text-slate-950">{member.fullName}</h3>

            <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[8px] font-black uppercase text-emerald-700">
              {ROLE_LABELS[member.role]}
            </span>
          </div>

          <p className="mt-1 truncate text-[10px] font-bold text-slate-500">ID: {toText(member.memberId || member.id)}</p>

          <p className="mt-1 flex items-center gap-1 truncate text-[10px] font-semibold text-slate-500">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
            {getBranchName(member)}
          </p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 overflow-hidden rounded-lg border border-slate-100 bg-slate-50">
        <div className="px-2 py-2 text-center">
          <p className="text-[8px] font-black uppercase text-slate-400">Team</p>
          <p className="mt-0.5 text-[11px] font-black text-slate-950">{formatNumber(teamSize)}</p>
        </div>

        <div className="border-x border-slate-100 px-2 py-2 text-center">
          <p className="text-[8px] font-black uppercase text-slate-400">Reports</p>
          <p className="mt-0.5 text-[11px] font-black text-slate-950">{formatNumber(directReports)}</p>
        </div>

        <div className="px-2 py-2 text-center">
          <p className="text-[8px] font-black uppercase text-slate-400">Status</p>
          <div className="mt-1 flex justify-center">
            <StatusDot status={member.status} />
          </div>
        </div>
      </div>

      <div className={`mt-3 grid gap-2 ${hasNextLevel ? 'grid-cols-2' : 'grid-cols-1'}`}>
        {hasNextLevel && (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onViewTeam();
            }}
            className="flex h-8 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-[10px] font-black text-slate-700 transition group-hover:border-[#c9a227] group-hover:bg-[#fbf8ef] group-hover:text-[#8a6a08]"
          >
            View Team
            <IconChevronRight className="h-3 w-3" />
          </button>
        )}

        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onEdit();
          }}
          className="flex h-8 items-center justify-center gap-1.5 rounded-lg bg-[#0f1419] px-3 text-[10px] font-black text-white transition hover:bg-slate-700"
        >
          <IconEdit className="h-3 w-3" />
          Edit
        </button>
      </div>
    </article>
  );
}

function BranchDirectorSection({
  branchName,
  members,
  getCardStats,
  onOpen,
  onViewTeam,
  onEdit,
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
  onEdit: (member: HierarchyNode) => void;
}) {
  const totalTeam = members.reduce((sum, member) => sum + getCardStats(member).teamSize, 0);

  return (
    <section className="rounded-[18px] border border-slate-200 bg-white p-4 shadow-[0_10px_25px_rgba(15,20,25,0.035)]">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#705400] text-[10px] font-black text-white">
              ★
            </span>
            <h3 className="text-[13px] font-black uppercase tracking-[0.12em] text-slate-700">{branchName}</h3>
          </div>

          <p className="mt-1 text-[11px] font-semibold text-slate-500">
            {members.length} Director{members.length > 1 ? 's' : ''} · Network {formatNumber(totalTeam)}
          </p>
        </div>

        <span className="w-fit rounded-full bg-[#fbf8ef] px-3 py-1 text-[9px] font-black uppercase tracking-[0.08em] text-[#8a6a08]">
          Directors
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {members.map((member) => {
          const stats = getCardStats(member);

          return (
            <MemberCard
              key={`${member.role}-${member.id}`}
              member={member}
              teamSize={stats.teamSize}
              directReports={stats.directReports}
              hasNextLevel={stats.hasNextLevel}
              onOpen={() => onOpen(member)}
              onViewTeam={() => onViewTeam(member)}
              onEdit={() => onEdit(member)}
            />
          );
        })}
      </div>
    </section>
  );
}

function DrawerDetailRow({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div className="grid grid-cols-[95px_1fr] gap-3 border-b border-slate-100 py-2.5 last:border-b-0">
      <p className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">{label}</p>
      <p className="min-w-0 break-words text-[12px] font-bold leading-5 text-slate-900 [overflow-wrap:anywhere]">
        {toText(value)}
      </p>
    </div>
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

  const fullAddress = [member.address, member.city, member.district, member.state, member.pincode].filter(Boolean).join(', ');

  return (
    <div className="fixed inset-0 z-[80]">
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/45 backdrop-blur-[2px]"
        aria-label="Close drawer overlay"
      />

      <aside className="absolute right-0 top-0 flex h-full w-full max-w-[395px] flex-col overflow-hidden bg-white shadow-[0_24px_80px_rgba(15,20,25,0.32)]">
        <div className="relative overflow-hidden bg-gradient-to-br from-[#0f1419] via-[#151d2c] to-[#1a2332] px-5 pb-6 pt-5">
          <div className="absolute -right-20 -top-20 h-48 w-48 rounded-full bg-[#c9a227]/25 blur-3xl" />

          <div className="relative flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <Avatar member={member} size="lg" />

              <div className="min-w-0">
                <h2 className="break-words text-[18px] font-black leading-tight text-white">{member.fullName}</h2>
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
            <DrawerDetailRow label="Phone" value={member.phone} />
            <DrawerDetailRow label="Email" value={member.email} />
            <DrawerDetailRow label="Member ID" value={member.memberId || member.id} />
            <DrawerDetailRow label="Code" value={member.codeNumber} />
            <DrawerDetailRow label="Branch" value={getBranchName(member)} />
            <DrawerDetailRow label="Joined" value={getJoinedDate(member)} />
            <DrawerDetailRow label="Team" value={formatNumber(teamSize)} />
            <DrawerDetailRow label="Reports" value={formatNumber(directReports)} />
            <DrawerDetailRow label="Address" value={fullAddress || '—'} />
          </div>
        </div>

        <div className="border-t border-slate-200 bg-slate-50 p-4">
          <button
            type="button"
            onClick={onViewTeam}
            disabled={!hasNextLevel}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#c9a227] px-4 text-[12px] font-black text-white shadow-sm transition hover:brightness-95 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            <IconUsers className="h-3.5 w-3.5" />
            {hasNextLevel ? 'View Team' : 'No Downline'}
          </button>
        </div>
      </aside>
    </div>
  );
}

function EditField({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
}) {
  return (
    <label className="block min-w-0">
      <span className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.1em] text-slate-500">
        {label}
      </span>
      <input
        type={type}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-[12px] font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#c9a227] focus:ring-4 focus:ring-[#c9a227]/10 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
      />
    </label>
  );
}

function EditSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[18px] border border-slate-200 bg-white p-4">
      <h3 className="mb-4 text-[12px] font-black uppercase tracking-[0.14em] text-slate-700">{title}</h3>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
    </section>
  );
}

function SaveSpinner() {
  return <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />;
}

function EditMemberModal({
  member,
  branches,
  onClose,
  onSave,
  isSaving,
}: {
  member: HierarchyNode;
  branches: BranchRecord[];
  onClose: () => void;
  onSave: (memberId: string, form: MemberEditForm) => void;
  isSaving: boolean;
}) {
  const uploadPhoto = useUploadMemberPhoto();
  const [form, setForm] = useState<MemberEditForm>(() => createEditForm(member));
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const fileInputId = `profile-image-upload-${member.id}`;

  const updateField = <K extends keyof MemberEditForm>(key: K, value: MemberEditForm[K]) => {
    setForm((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  const handleProfileImageUpload = (file?: File) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      window.alert('Please upload only an image file.');
      return;
    }

    setSelectedPhoto(file);

    const reader = new FileReader();

    reader.onload = () => {
      updateField('profileImage', String(reader.result || ''));
    };

    reader.readAsDataURL(file);
  };

  const handleSaveClick = async () => {
    if (selectedPhoto) {
      try {
        await uploadPhoto.mutateAsync({ id: member.id, file: selectedPhoto });
      } catch (error) {
        console.error('Profile image upload failed', error);
        window.alert('Profile image upload failed. Please try again.');
        return;
      }
    }

    onSave(member.id, form);
  };

  const selectedBranchName =
    branches.find((branch) => toId(branch.id) === form.branchId)?.name || form.branchName;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-3 sm:p-4">
      <button
        type="button"
        onClick={() => {
          if (!isSaving) onClose();
        }}
        disabled={isSaving}
        className="absolute inset-0 bg-slate-950/50 backdrop-blur-[2px] disabled:cursor-wait"
        aria-label="Close edit modal overlay"
      />

      <div className="relative flex max-h-[calc(100dvh-24px)] w-full max-w-6xl flex-col overflow-hidden rounded-[22px] bg-slate-50 shadow-[0_24px_80px_rgba(15,20,25,0.34)]">
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 bg-white px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <h2 className="truncate text-[19px] font-black text-slate-950">Edit Member Details</h2>
            <p className="mt-1 text-[12px] font-semibold text-slate-500">
              {member.fullName} · {ROLE_LABELS[member.role]}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <IconClose />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
          <section className="rounded-[18px] border border-slate-200 bg-white p-4">
            <h3 className="mb-4 text-[12px] font-black uppercase tracking-[0.14em] text-slate-700">
              Profile Image
            </h3>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 text-lg font-black text-slate-700 shadow-sm">
                {form.profileImage ? (
                  <img src={form.profileImage} alt={form.fullName} className="h-full w-full object-cover" />
                ) : (
                  getInitials(form.fullName)
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap gap-2">
                  <label
                    htmlFor={fileInputId}
                    className={`inline-flex h-10 items-center justify-center rounded-xl px-4 text-[12px] font-black text-white transition ${
                      isSaving ? 'cursor-not-allowed bg-slate-400' : 'cursor-pointer bg-[#0f1419] hover:bg-slate-700'
                    }`}
                  >
                    Upload Image
                  </label>

                  <input
                    id={fileInputId}
                    type="file"
                    accept="image/*"
                    disabled={isSaving}
                    className="hidden"
                    onChange={(event) => handleProfileImageUpload(event.target.files?.[0])}
                  />

                  {form.profileImage && (
                    <button
                      type="button"
                      disabled={isSaving}
                      onClick={() => {
                        setSelectedPhoto(null);
                        updateField('profileImage', '');
                      }}
                      className="h-10 rounded-xl border border-red-200 bg-red-50 px-4 text-[12px] font-black text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Remove Image
                    </button>
                  )}
                </div>

                <p className="mt-2 text-[11px] font-semibold text-slate-500">
                  Upload from device or paste image URL below.
                </p>
              </div>
            </div>
          </section>

          <EditSection title="Basic Details">
            <EditField disabled={isSaving} label="Full Name" value={form.fullName} onChange={(value) => updateField('fullName', value)} />

            <label className="block min-w-0">
              <span className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.1em] text-slate-500">
                Role
              </span>
              <select
                value={form.role}
                disabled={isSaving}
                onChange={(event) => updateField('role', event.target.value as MemberRole)}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-[12px] font-semibold text-slate-900 outline-none transition focus:border-[#c9a227] focus:ring-4 focus:ring-[#c9a227]/10 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
              >
                <option value="DIRECTOR">Director</option>
                <option value="DEPUTY_DIRECTOR">Deputy Director</option>
                <option value="EXECUTIVE_DIRECTOR">Executive Director</option>
                <option value="SENIOR_MANAGER">Senior Manager</option>
                <option value="BUSINESS_MANAGER">Business Manager</option>
                <option value="AGENT">Agent</option>
              </select>
            </label>

            <label className="block min-w-0">
              <span className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.1em] text-slate-500">
                Status
              </span>
              <select
                value={form.status}
                disabled={isSaving}
                onChange={(event) => updateField('status', event.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-[12px] font-semibold text-slate-900 outline-none transition focus:border-[#c9a227] focus:ring-4 focus:ring-[#c9a227]/10 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="PENDING">Pending</option>
              </select>
            </label>

            <EditField disabled={isSaving} label="Member ID" value={form.memberId} onChange={(value) => updateField('memberId', value)} />
            <EditField disabled={isSaving} label="Code Number" value={form.codeNumber} onChange={(value) => updateField('codeNumber', value)} />
            <EditField disabled={isSaving} label="Profile Image URL" value={form.profileImage} onChange={(value) => updateField('profileImage', value)} />
          </EditSection>

          <EditSection title="Contact & Branch">
            <EditField disabled={isSaving} label="Phone" value={form.phone} onChange={(value) => updateField('phone', value)} />
            <EditField disabled={isSaving} label="Alternate Phone" value={form.alternatePhone} onChange={(value) => updateField('alternatePhone', value)} />
            <EditField disabled={isSaving} label="Email" value={form.email} onChange={(value) => updateField('email', value)} />

            <label className="block min-w-0">
              <span className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.1em] text-slate-500">
                Branch
              </span>
              <select
                value={form.branchId}
                disabled={isSaving}
                onChange={(event) => {
                  const branchId = event.target.value;
                  const branchName = branches.find((branch) => toId(branch.id) === branchId)?.name || '';
                  updateField('branchId', branchId);
                  updateField('branchName', branchName);
                }}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-[12px] font-semibold text-slate-900 outline-none transition focus:border-[#c9a227] focus:ring-4 focus:ring-[#c9a227]/10 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
              >
                <option value="">{selectedBranchName || 'Select Branch'}</option>
                {branches.map((branch) => (
                  <option key={toId(branch.id)} value={toId(branch.id)}>
                    {branch.name || branch.branchName || 'Unnamed Branch'}
                  </option>
                ))}
              </select>
            </label>

            <EditField disabled={isSaving} label="Reporting To ID" value={form.reportsToId} onChange={(value) => updateField('reportsToId', value)} />
          </EditSection>

          <EditSection title="Address">
            <EditField disabled={isSaving} label="Address" value={form.address} onChange={(value) => updateField('address', value)} />
            <EditField disabled={isSaving} label="City" value={form.city} onChange={(value) => updateField('city', value)} />
            <EditField disabled={isSaving} label="District" value={form.district} onChange={(value) => updateField('district', value)} />
            <EditField disabled={isSaving} label="State" value={form.state} onChange={(value) => updateField('state', value)} />
            <EditField disabled={isSaving} label="Pincode" value={form.pincode} onChange={(value) => updateField('pincode', value)} />
          </EditSection>

          <EditSection title="Personal Details">
            <EditField disabled={isSaving} label="Gender" value={form.gender} onChange={(value) => updateField('gender', value)} />
            <EditField disabled={isSaving} label="Date of Birth" type="date" value={form.dateOfBirth} onChange={(value) => updateField('dateOfBirth', value)} />
            <EditField disabled={isSaving} label="Blood Group" value={form.bloodGroup} onChange={(value) => updateField('bloodGroup', value)} />
            <EditField disabled={isSaving} label="Qualification" value={form.qualification} onChange={(value) => updateField('qualification', value)} />
            <EditField disabled={isSaving} label="Experience" value={form.experience} onChange={(value) => updateField('experience', value)} />
          </EditSection>

          <EditSection title="Bank Details">
            <EditField disabled={isSaving} label="Bank Name" value={form.bankName} onChange={(value) => updateField('bankName', value)} />
            <EditField disabled={isSaving} label="Account Holder" value={form.accountHolder} onChange={(value) => updateField('accountHolder', value)} />
            <EditField disabled={isSaving} label="Account Number" value={form.accountNumber} onChange={(value) => updateField('accountNumber', value)} />
            <EditField disabled={isSaving} label="IFSC Code" value={form.ifscCode} onChange={(value) => updateField('ifscCode', value)} />
            <EditField disabled={isSaving} label="Bank Branch" value={form.bankBranch} onChange={(value) => updateField('bankBranch', value)} />
          </EditSection>

          <EditSection title="Nominee Details">
            <EditField disabled={isSaving} label="Nominee Name" value={form.nomineeName} onChange={(value) => updateField('nomineeName', value)} />
            <EditField disabled={isSaving} label="Nominee Relation" value={form.nomineeRelation} onChange={(value) => updateField('nomineeRelation', value)} />
            <EditField disabled={isSaving} label="Nominee Phone" value={form.nomineePhone} onChange={(value) => updateField('nomineePhone', value)} />
          </EditSection>

          <EditSection title="Document Details">
            <EditField disabled={isSaving} label="PAN Number" value={form.panNumber} onChange={(value) => updateField('panNumber', value)} />
            <EditField disabled={isSaving} label="Aadhaar Number" value={form.aadhaarNumber} onChange={(value) => updateField('aadhaarNumber', value)} />
            <EditField disabled={isSaving} label="Voter ID Number" value={form.voterIdNumber} onChange={(value) => updateField('voterIdNumber', value)} />
            <EditField disabled={isSaving} label="Driving License" value={form.drivingLicense} onChange={(value) => updateField('drivingLicense', value)} />
          </EditSection>
        </div>

        <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-slate-200 bg-white px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="h-10 rounded-xl border border-slate-200 bg-white px-5 text-[12px] font-black text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={isSaving || uploadPhoto.isPending}
            onClick={() => {
              if (!isSaving && !uploadPhoto.isPending) {
                void handleSaveClick();
              }
            }}
            className="flex h-10 min-w-[132px] items-center justify-center gap-2 rounded-xl bg-[#c9a227] px-5 text-[12px] font-black text-white shadow-sm transition hover:brightness-95 disabled:cursor-wait disabled:opacity-80"
          >
            {isSaving || uploadPhoto.isPending ? (
              <>
                <SaveSpinner />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

const MembersPage: React.FC = () => {
  const { data: membersData, isLoading } = useMembers({ limit: 10000 });
  const { data: branchesResponse } = useBranches({ limit: 100 });
  const updateMember = useUpdateMember();

  const isSavingMember = Boolean(
    ((updateMember as { isPending?: boolean; isLoading?: boolean }).isPending ??
      (updateMember as { isPending?: boolean; isLoading?: boolean }).isLoading) ||
      false,
  );

  const [draftFilters, setDraftFilters] = useState<Filters>(emptyFilters);
  const [activeFilters, setActiveFilters] = useState<Filters>(emptyFilters);
  const [path, setPath] = useState<HierarchyNode[]>([]);
  const [selectedMember, setSelectedMember] = useState<HierarchyNode | null>(null);
  const [editingMember, setEditingMember] = useState<HierarchyNode | null>(null);
  const [memberOverrides, setMemberOverrides] = useState<Record<string, Partial<MemberRecord>>>({});

  const branches = useMemo(() => {
    const response = branchesResponse as BranchRecord[] | { data?: BranchRecord[] } | undefined;

    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.data)) return response.data;

    return [];
  }, [branchesResponse]);

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
      .map((member) => {
        const id = toId(member.id);
        const override = memberOverrides[id] ?? {};
        const merged = {
          ...member,
          ...override,
        };

        return {
          ...merged,
          id,
          fullName: toText(merged.fullName || merged.name, 'Unnamed Member'),
          role: normalizeRole(merged.role),
          status: merged.status || 'ACTIVE',
        };
      });
  }, [rawMembers, memberOverrides]);

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

  const hasReportMapping = useMemo(() => {
    return members.some((member) => Boolean(getReportsToId(member)));
  }, [members]);

  const currentParent = path[path.length - 1] ?? null;
  const isFilterActive = Boolean(
    activeFilters.global.trim() ||
      activeFilters.memberId.trim() ||
      activeFilters.phone.trim() ||
      activeFilters.role !== 'ALL',
  );

  const getNextRole = useCallback((member: HierarchyNode) => {
    if (member.role === 'FOUNDER') return 'DIRECTOR';

    const currentIndex = ROLE_FLOW.indexOf(member.role);
    return currentIndex >= 0 ? ROLE_FLOW[currentIndex + 1] : undefined;
  }, []);

  const getChildren = useCallback((parent: HierarchyNode, nextRole?: MemberRole) => {
    if (!nextRole) return [];

    const roleMembers = members.filter((member) => member.role === nextRole);

    if (parent.role === 'FOUNDER') return roleMembers;

    const exactChildren = roleMembers.filter((member) => getReportsToId(member) === parent.id);

    if (exactChildren.length > 0) return exactChildren;

    return hasReportMapping ? [] : roleMembers;
  }, [hasReportMapping, members]);

  function getDirectReports(member: HierarchyNode) {
    if (member.role === 'FOUNDER') return roleCounts.DIRECTOR;

    const directValue = getDirectNumeric(member, ['directReports', 'directReportsCount']);

    if (typeof directValue === 'number') return directValue;

    const nextRole = getNextRole(member);
    return getChildren(member, nextRole).length;
  }

  function getTeamSize(member: HierarchyNode): number {
    if (member.role === 'FOUNDER') return totalMembers;

    const directValue = getDirectNumeric(member, [
      'teamSize',
      'totalTeam',
      'teamCount',
      'taggedCount',
      'taggedMembers',
    ]);

    if (typeof directValue === 'number') return directValue;

    const nextRole = getNextRole(member);
    const children = getChildren(member, nextRole);

    if (children.length === 0) return 0;

    return children.reduce((total, child) => total + 1 + getTeamSize(child), 0);
  }

  function getCardStats(member: HierarchyNode) {
    const directReports = getDirectReports(member);
    const teamSize = getTeamSize(member);
    const hasNextLevel = Boolean(getNextRole(member)) && directReports > 0;

    return {
      teamSize,
      directReports,
      hasNextLevel,
    };
  }

  const memberMatchesFilters = useCallback(
    (member: HierarchyNode) => {
    const globalQuery = activeFilters.global.trim().toLowerCase();
    const memberIdQuery = activeFilters.memberId.trim().toLowerCase();
    const phoneQuery = activeFilters.phone.trim().toLowerCase();

    if (activeFilters.role !== 'ALL' && member.role !== activeFilters.role) return false;

    if (
      memberIdQuery &&
      !String(member.memberId || member.id || '').toLowerCase().includes(memberIdQuery)
    ) {
      return false;
    }

    if (
      phoneQuery &&
      !String(member.phone || member.alternatePhone || '').toLowerCase().includes(phoneQuery)
    ) {
      return false;
    }

    if (!globalQuery) return true;

    const searchable = [
      member.fullName,
      ROLE_LABELS[member.role],
      getBranchName(member),
      member.phone,
      member.alternatePhone,
      member.email,
      member.memberId,
      member.codeNumber,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

      return searchable.includes(globalQuery);
    },
    [activeFilters.global, activeFilters.memberId, activeFilters.phone, activeFilters.role],
  );

  const filteredMembers = useMemo(() => {
    return [FOUNDER, ...members].filter((member) => memberMatchesFilters(member));
  }, [members, memberMatchesFilters]);

  const directorMembers = useMemo(() => {
    return members.filter((member) => member.role === 'DIRECTOR');
  }, [members]);

  const directorBranchGroups = useMemo(() => {
    return groupByBranch(directorMembers);
  }, [directorMembers]);

  const drillDownItems = useMemo(() => {
    if (!currentParent) return [];

    const nextRole = getNextRole(currentParent);
    return getChildren(currentParent, nextRole);
  }, [currentParent, getChildren, getNextRole]);

  const pageTitle = useMemo(() => {
    if (isFilterActive) return `Search Results (${filteredMembers.length})`;

    if (!currentParent) return 'Organization Structure';

    const nextRole = getNextRole(currentParent);

    if (!nextRole) return `${currentParent.fullName}'s Profile`;

    if (currentParent.role === 'FOUNDER') {
      return `Directors (${directorMembers.length})`;
    }

    return `${ROLE_LABELS[nextRole]}s reporting to ${currentParent.fullName}`;
  }, [currentParent, directorMembers.length, filteredMembers.length, getNextRole, isFilterActive]);

  function handleTopSearch(value: string) {
    setDraftFilters((previous) => ({
      ...previous,
      global: value,
    }));

    setActiveFilters((previous) => ({
      ...previous,
      global: value,
    }));

    setPath([]);
    setSelectedMember(null);
  }

  function handleSearch() {
    setSelectedMember(null);
    setPath([]);
    setActiveFilters(draftFilters);
  }

  function handleReset() {
    setDraftFilters(emptyFilters);
    setActiveFilters(emptyFilters);
    setPath([]);
    setSelectedMember(null);
  }

  function handleViewTeam(member: HierarchyNode) {
    const nextRole = getNextRole(member);

    if (!nextRole) {
      setSelectedMember(member);
      return;
    }

    setSelectedMember(null);
    setActiveFilters(emptyFilters);
    setDraftFilters(emptyFilters);

    if (member.role === 'FOUNDER') {
      setPath([FOUNDER]);
      return;
    }

    setPath((previousPath) => {
      const basePath = previousPath.length === 0 ? [FOUNDER] : previousPath;
      const existingIndex = basePath.findIndex((item) => item.id === member.id);

      if (existingIndex >= 0) return basePath.slice(0, existingIndex + 1);

      return [...basePath, member];
    });
  }

  function handleBreadcrumbRoot() {
    setSelectedMember(null);
    setActiveFilters(emptyFilters);
    setDraftFilters(emptyFilters);
    setPath([]);
  }

  function handleBreadcrumbItem(index: number) {
    setSelectedMember(null);
    setPath(path.slice(0, index + 1));
  }

  function handleSaveMember(memberId: string, form: MemberEditForm) {
    const patch = formToMemberPatch(form) as unknown as UpdateMemberData;

    updateMember.mutate(
      { id: memberId, data: patch },
      {
        onSuccess: () => {
          setMemberOverrides((previous) => ({
            ...previous,
            [memberId]: {
              ...(previous[memberId] ?? {}),
              ...(patch as Partial<MemberRecord>),
            },
          }));

          setSelectedMember((previous) => {
            if (!previous || previous.id !== memberId) return previous;

            return {
              ...previous,
              ...(patch as Partial<MemberRecord>),
              id: previous.id,
              fullName: form.fullName,
              role: form.role,
              status: form.status,
            };
          });

          setEditingMember(null);
        },
      },
    );
  }

  const selectedStats = selectedMember
    ? getCardStats(selectedMember)
    : {
        teamSize: 0,
        directReports: 0,
        hasNextLevel: false,
      };

  return (
    <div className="min-h-full bg-[#f7f8fb] px-4 py-4 sm:px-5 lg:px-6">
      <div className="mx-auto w-full max-w-[1280px] space-y-5">
        <header className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-[24px] font-black leading-tight text-slate-950">
              Members
              <br />
              Management
            </h1>
          </div>

          <div className="flex w-full max-w-[430px] items-center gap-3">
            <div className="relative flex-1">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                <IconSearch />
              </span>

              <input
                value={draftFilters.global}
                onChange={(event) => handleTopSearch(event.target.value)}
                placeholder="Search across hierarchy..."
                className="h-10 w-full rounded-full border border-slate-200 bg-white pl-9 pr-4 text-[12px] font-semibold text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-[#c9a227] focus:ring-4 focus:ring-[#c9a227]/10"
              />
            </div>

            <button
              type="button"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm"
            >
              <IconUser />
            </button>
          </div>
        </header>

        <section className="rounded-[16px] border border-slate-200 bg-white p-4 shadow-[0_10px_28px_rgba(15,20,25,0.06)]">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_1fr_1fr_auto_auto] md:items-end">
            <FilterInput
              label="Member ID"
              value={draftFilters.memberId}
              onChange={(value) =>
                setDraftFilters((previous) => ({
                  ...previous,
                  memberId: value,
                }))
              }
              placeholder="e.g. STH-001"
            />

            <FilterInput
              label="Phone Number"
              value={draftFilters.phone}
              onChange={(value) =>
                setDraftFilters((previous) => ({
                  ...previous,
                  phone: value,
                }))
              }
              placeholder="+91 0000000000"
            />

            <label className="block">
              <span className="mb-1.5 block text-[10px] font-black text-slate-700">Role</span>
              <select
                value={draftFilters.role}
                onChange={(event) =>
                  setDraftFilters((previous) => ({
                    ...previous,
                    role: event.target.value as Filters['role'],
                  }))
                }
                className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-[12px] font-semibold text-slate-900 outline-none transition focus:border-[#c9a227] focus:ring-4 focus:ring-[#c9a227]/10"
              >
                <option value="ALL">All Roles</option>
                <option value="DIRECTOR">Director</option>
                <option value="DEPUTY_DIRECTOR">Deputy Director</option>
                <option value="EXECUTIVE_DIRECTOR">Executive Director</option>
                <option value="SENIOR_MANAGER">Senior Manager</option>
                <option value="BUSINESS_MANAGER">Business Manager</option>
                <option value="AGENT">Agent</option>
              </select>
            </label>

            <button
              type="button"
              onClick={handleSearch}
              className="h-9 rounded-lg bg-[#c9a227] px-6 text-[11px] font-black text-white shadow-sm transition hover:brightness-95"
            >
              Search
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="h-9 rounded-lg bg-slate-100 px-6 text-[11px] font-black text-slate-700 transition hover:bg-slate-200"
            >
              Reset
            </button>
          </div>
        </section>

        <section className="rounded-[20px] border border-slate-200 bg-white p-4 shadow-[0_10px_28px_rgba(15,20,25,0.04)] sm:p-5">
          <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleBreadcrumbRoot}
                  className="rounded-full bg-[#0f1419] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.08em] text-white"
                >
                  Founder
                </button>

                {path.map((item, index) => (
                  <React.Fragment key={item.id}>
                    <IconChevronRight className="h-3.5 w-3.5 text-slate-300" />
                    <button
                      type="button"
                      onClick={() => handleBreadcrumbItem(index)}
                      className="rounded-full bg-slate-100 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.08em] text-slate-700 hover:bg-[#fbf8ef] hover:text-[#8a6a08]"
                    >
                      {item.role === 'FOUNDER' ? 'Directors' : item.fullName}
                    </button>
                  </React.Fragment>
                ))}
              </div>

              <h2 className="text-[18px] font-black text-slate-950 sm:text-[20px]">{pageTitle}</h2>

              <p className="mt-1 text-[11px] font-semibold text-slate-500">
                Founder above, directors branch-wise below. Card click opens details. Edit button opens all member fields.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-[0.07em]">
              <span className="rounded-full bg-slate-950 px-3 py-1.5 text-white">
                Total {formatNumber(totalMembers)}
              </span>
              <span className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-700">
                Directors {formatNumber(roleCounts.DIRECTOR)}
              </span>
              <span className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-700">
                Managers {formatNumber(roleCounts.SENIOR_MANAGER + roleCounts.BUSINESS_MANAGER)}
              </span>
              <span className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-700">
                Agents {formatNumber(roleCounts.AGENT)}
              </span>
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-5">
              <div className="mx-auto h-[255px] max-w-[310px] animate-pulse rounded-[18px] bg-slate-100" />
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="h-[145px] animate-pulse rounded-[14px] bg-slate-100" />
                ))}
              </div>
            </div>
          ) : isFilterActive ? (
            filteredMembers.length === 0 ? (
              <div className="rounded-[18px] border border-dashed border-slate-300 bg-slate-50 px-5 py-14 text-center">
                <p className="text-[13px] font-black text-slate-700">No members found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {filteredMembers.map((member) => {
                  const stats = getCardStats(member);

                  if (member.role === 'FOUNDER') {
                    return (
                      <FounderCard
                        key={member.id}
                        founder={member}
                        teamSize={stats.teamSize}
                        directReports={stats.directReports}
                        onOpen={() => setSelectedMember(member)}
                      />
                    );
                  }

                  return (
                    <MemberCard
                      key={`${member.role}-${member.id}`}
                      member={member}
                      teamSize={stats.teamSize}
                      directReports={stats.directReports}
                      hasNextLevel={stats.hasNextLevel}
                      onOpen={() => setSelectedMember(member)}
                      onViewTeam={() => handleViewTeam(member)}
                      onEdit={() => setEditingMember(member)}
                    />
                  );
                })}
              </div>
            )
          ) : !currentParent ? (
            <div className="space-y-8">
              <FounderCard
                founder={FOUNDER}
                teamSize={getCardStats(FOUNDER).teamSize}
                directReports={getCardStats(FOUNDER).directReports}
                onOpen={() => setSelectedMember(FOUNDER)}
              />

              <div className="mx-auto h-10 w-px bg-slate-200" />

              <div className="rounded-[20px] border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
                <div className="mb-4 flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#705400] text-[10px] font-black text-white">
                    ★
                  </span>
                  <h3 className="text-[12px] font-black uppercase tracking-[0.14em] text-slate-700">
                    Directors
                  </h3>
                </div>

                {directorBranchGroups.length === 0 ? (
                  <div className="rounded-[16px] border border-dashed border-slate-300 bg-white px-5 py-10 text-center">
                    <p className="text-[13px] font-black text-slate-700">No directors found</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {directorBranchGroups.map((group) => (
                      <BranchDirectorSection
                        key={group.branchName}
                        branchName={group.branchName}
                        members={group.members}
                        getCardStats={getCardStats}
                        onOpen={setSelectedMember}
                        onViewTeam={handleViewTeam}
                        onEdit={setEditingMember}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : currentParent.role === 'FOUNDER' ? (
            <div className="space-y-4">
              {directorBranchGroups.map((group) => (
                <BranchDirectorSection
                  key={group.branchName}
                  branchName={group.branchName}
                  members={group.members}
                  getCardStats={getCardStats}
                  onOpen={setSelectedMember}
                  onViewTeam={handleViewTeam}
                  onEdit={setEditingMember}
                />
              ))}
            </div>
          ) : drillDownItems.length === 0 ? (
            <div className="rounded-[18px] border border-dashed border-slate-300 bg-slate-50 px-5 py-14 text-center">
              <p className="text-[13px] font-black text-slate-700">No downline members found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {drillDownItems.map((member) => {
                const stats = getCardStats(member);

                return (
                  <MemberCard
                    key={`${member.role}-${member.id}`}
                    member={member}
                    teamSize={stats.teamSize}
                    directReports={stats.directReports}
                    hasNextLevel={stats.hasNextLevel}
                    onOpen={() => setSelectedMember(member)}
                    onViewTeam={() => handleViewTeam(member)}
                    onEdit={() => setEditingMember(member)}
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

      {editingMember && (
        <EditMemberModal
          key={editingMember.id}
          member={editingMember}
          branches={branches}
          onClose={() => setEditingMember(null)}
          onSave={handleSaveMember}
          isSaving={isSavingMember}
        />
      )}
    </div>
  );
};

export default MembersPage;