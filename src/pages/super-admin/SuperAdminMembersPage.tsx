import React, { useState } from 'react';
import { useMembers } from '../../hooks/useMembers';
import { useUpdateMember, useUpdateMemberStatus } from '../../hooks/useMembers';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Modal } from '../../components/ui/Modal';
import type { Role, UserStatus, Member } from '../../types';
import type { UpdateMemberData } from '../../api/members.api';

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────
const MEMBER_ROLES: Role[] = [
  'DIRECTOR',
  'EXECUTIVE_DIRECTOR',
  'DEPUTY_DIRECTOR',
  'SENIOR_MANAGER',
  'BUSINESS_MANAGER',
  'AGENT',
];

const ROLE_LABELS: Record<string, string> = {
  DIRECTOR: 'Director',
  EXECUTIVE_DIRECTOR: 'Executive Director',
  DEPUTY_DIRECTOR: 'Deputy Director',
  SENIOR_MANAGER: 'Senior Manager',
  BUSINESS_MANAGER: 'Business Manager',
  AGENT: 'Agent',
};

// ─────────────────────────────────────────────
// Utility helpers
// ─────────────────────────────────────────────
function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

// ─────────────────────────────────────────────
// Avatar circle
// ─────────────────────────────────────────────
const AvatarCircle: React.FC<{ name: string; size?: 'sm' | 'md' | 'lg' }> = ({
  name,
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-lg',
  };
  return (
    <div
      className={`${sizeClasses[size]} rounded-full bg-gold/20 text-gold font-bold flex items-center justify-center flex-shrink-0`}
    >
      {getInitials(name)}
    </div>
  );
};

// ─────────────────────────────────────────────
// Icon helpers (inline SVG, no extra deps)
// ─────────────────────────────────────────────
const PinIcon: React.FC = () => (
  <svg className="w-3 h-3 inline-block mr-0.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const PhoneIcon: React.FC = () => (
  <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
  </svg>
);

const MailIcon: React.FC = () => (
  <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const BranchIcon: React.FC = () => (
  <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);

const StatusIcon: React.FC = () => (
  <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const UsersIcon: React.FC = () => (
  <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

// ─────────────────────────────────────────────
// CMD / Founder card (top of hierarchy)
// ─────────────────────────────────────────────
interface CmdCardProps {
  member: Member;
  totalCount: number;
  onView: () => void;
}

const CmdCard: React.FC<CmdCardProps> = ({ member, totalCount, onView }) => (
  <div className="w-72 bg-white rounded-2xl border-2 border-gold shadow-lg p-5 flex flex-col items-center gap-3 mx-auto">
    <AvatarCircle name={member.fullName} size="lg" />
    <div className="text-center">
      <p className="font-bold text-gray-900 text-base">{member.fullName}</p>
      <span className="inline-block mt-1 px-3 py-0.5 rounded-full bg-gold/10 text-gold text-xs font-semibold uppercase tracking-wide">
        Chairman &amp; CMD
      </span>
    </div>
    <div className="flex items-center gap-2 flex-wrap justify-center">
      <StatusBadge status={member.status} />
      {member.branch && (
        <span className="text-xs text-gray-500 flex items-center gap-0.5">
          <PinIcon />
          {member.branch.name}
        </span>
      )}
    </div>
    <div className="flex gap-4 text-center w-full border-t border-gray-100 pt-3">
      <div className="flex-1">
        <p className="text-lg font-bold text-gold">—</p>
        <p className="text-xs text-gray-500">Direct</p>
      </div>
      <div className="flex-1 border-l border-gray-100">
        <p className="text-lg font-bold text-gray-800">{totalCount}</p>
        <p className="text-xs text-gray-500">Network</p>
      </div>
    </div>
    <button
      onClick={onView}
      className="text-gold text-xs font-semibold hover:underline"
    >
      View Profile →
    </button>
  </div>
);

// ─────────────────────────────────────────────
// Member card (role rows)
// ─────────────────────────────────────────────
interface MemberCardProps {
  member: Member;
  onView: () => void;
}

const MemberCard: React.FC<MemberCardProps> = ({ member, onView }) => (
  <div className="w-48 flex-shrink-0 bg-white rounded-xl border border-gray-200 p-3 shadow-sm flex flex-col gap-2">
    <div className="flex items-center gap-2">
      <AvatarCircle name={member.fullName} size="sm" />
      <div className="min-w-0">
        <p className="font-semibold text-sm text-gray-900 truncate">{member.fullName}</p>
        <StatusBadge status={member.role} className="mt-0.5" />
      </div>
    </div>
    <p className="text-xs text-gray-400 font-mono">{member.memberId}</p>
    {member.branch && (
      <p className="text-xs text-gray-500 truncate">
        <PinIcon />
        {member.branch.name}
      </p>
    )}
    <div className="flex justify-between text-xs text-gray-500 border-t border-gray-100 pt-2">
      <span>Direct —</span>
      <span>Net —</span>
    </div>
    <button
      onClick={onView}
      className="text-gold text-xs font-semibold hover:underline text-left"
    >
      View Profile
    </button>
  </div>
);

// ─────────────────────────────────────────────
// Section header
// ─────────────────────────────────────────────
const SectionHeader: React.FC<{ label: string; count: number }> = ({ label, count }) => (
  <div className="flex items-center gap-2 text-gold text-xs font-semibold uppercase tracking-wide mb-3">
    <UsersIcon />
    {label}
    <span className="ml-1 px-1.5 py-0.5 rounded-full bg-gold/10 text-gold text-xs">{count}</span>
  </div>
);

// ─────────────────────────────────────────────
// Info row for modal contact / status details
// ─────────────────────────────────────────────
const InfoRow: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({
  icon,
  label,
  value,
}) => (
  <div className="flex items-center gap-3 py-2">
    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
      {icon}
    </div>
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-sm font-medium text-gray-900">{value}</p>
    </div>
  </div>
);

// ─────────────────────────────────────────────
// MemberOverviewModal
// ─────────────────────────────────────────────
interface MemberOverviewModalProps {
  member: Member;
  onClose: () => void;
  onEdit: () => void;
  allMembers: Member[];
}

const MemberOverviewModal: React.FC<MemberOverviewModalProps> = ({
  member,
  onClose,
  onEdit,
  allMembers,
}) => {
  const updateStatus = useUpdateMemberStatus();

  const handleDeactivate = () => {
    const newStatus: UserStatus = member.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    updateStatus.mutate({ id: member.id, status: newStatus });
  };

  // Count downline per role (direct scan)
  const downlineByRole: Record<string, number> = {};
  MEMBER_ROLES.forEach((r) => {
    downlineByRole[r] = allMembers.filter((m) => m.role === r).length;
  });

  const reportsTo = member.reportsTo ?? allMembers.find((m) => m.id === member.reportsToId);

  return (
    <Modal
      open
      onClose={onClose}
      title="Member Overview"
      subtitle="View member profile, hierarchy details, and current status."
      size="xl"
    >
      {/* Header card */}
      <div className="bg-gray-50 rounded-xl p-4 flex items-start justify-between mb-5">
        <div className="flex items-center gap-3">
          <AvatarCircle name={member.fullName} size="lg" />
          <div>
            <p className="font-bold text-gray-900 text-base">{member.fullName}</p>
            <StatusBadge status={member.role} className="mt-1" />
            <p className="text-gold text-xs font-mono mt-1">{member.memberId}</p>
          </div>
        </div>
        <div className="text-right text-xs text-gray-500">
          <p>Joined {formatDate(member.createdAt)}</p>
          {member.branch && <p className="mt-0.5">{member.branch.name}</p>}
        </div>
      </div>

      {/* Two-column body */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Left: Contact Information */}
        <div>
          <div className="flex items-center gap-2 text-gold text-xs font-semibold uppercase tracking-wide mb-3">
            <PhoneIcon />
            Contact Information
          </div>
          <InfoRow icon={<PhoneIcon />} label="Phone Number" value={member.phone} />
          <InfoRow
            icon={<MailIcon />}
            label="Email Address"
            value={member.email ?? '—'}
          />
          <InfoRow
            icon={<BranchIcon />}
            label="Branch Assignment"
            value={member.branch?.name ?? '—'}
          />
          <InfoRow icon={<StatusIcon />} label="Current Status" value={member.status} />
        </div>

        {/* Right: Hierarchy Position */}
        <div>
          <div className="flex items-center gap-2 text-gold text-xs font-semibold uppercase tracking-wide mb-3">
            <UsersIcon />
            Hierarchy Position
          </div>
          <div className="py-2">
            <p className="text-xs text-gray-500 mb-0.5">Reports To</p>
            {reportsTo ? (
              <p className="text-sm font-medium text-gold">{reportsTo.fullName}</p>
            ) : (
              <p className="text-sm text-gray-400">—</p>
            )}
          </div>
          <div className="py-2">
            <p className="text-xs text-gray-500 mb-1">Downline Summary (12 sub-levels)</p>
            <div className="grid grid-cols-2 gap-2">
              {MEMBER_ROLES.map((r) => (
                <div key={r} className="flex justify-between text-xs bg-gray-50 rounded-lg px-2 py-1.5">
                  <span className="text-gray-600">{ROLE_LABELS[r]}</span>
                  <span className="font-semibold text-gray-800">{downlineByRole[r]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center gap-3 pt-4 border-t border-gray-100 mt-4">
        <button
          onClick={onEdit}
          className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 text-sm"
        >
          Edit Member
        </button>
        <button
          onClick={handleDeactivate}
          disabled={updateStatus.isPending}
          className="border border-red-300 text-red-600 px-4 py-2 rounded-lg hover:bg-red-50 text-sm disabled:opacity-60"
        >
          {member.status === 'ACTIVE' ? 'Deactivate Member' : 'Activate Member'}
        </button>
      </div>
    </Modal>
  );
};

// ─────────────────────────────────────────────
// EditMemberModal
// ─────────────────────────────────────────────
interface EditMemberModalProps {
  member: Member;
  onClose: () => void;
}

const EditMemberModal: React.FC<EditMemberModalProps> = ({ member, onClose }) => {
  const updateMember = useUpdateMember();

  const [form, setForm] = useState<UpdateMemberData>({
    fullName: member.fullName,
    phone: member.phone,
    email: member.email ?? '',
    role: member.role,
    branchId: member.branchId,
  });

  const set = (key: keyof UpdateMemberData, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = () => {
    updateMember.mutate(
      { id: member.id, data: form },
      { onSuccess: onClose }
    );
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="Edit Member"
      subtitle="Update member profile and organisational details."
      size="lg"
    >
      {/* Profile photo area */}
      <div className="bg-gray-50 rounded-xl p-4 flex items-center gap-4 mb-5">
        <div className="w-20 h-20 rounded-xl bg-gold/20 text-gold text-2xl font-bold flex items-center justify-center flex-shrink-0">
          {getInitials(member.fullName)}
        </div>
        <div>
          <p className="text-gold text-xs font-semibold uppercase tracking-wide mb-2">
            Profile Photo
          </p>
          <div className="flex gap-2 flex-wrap">
            <button
              type="button"
              className="bg-gold text-navy font-semibold px-4 py-2 rounded-lg hover:opacity-90 text-xs"
            >
              Replace Photo
            </button>
            <button
              type="button"
              className="border border-red-300 text-red-600 px-4 py-2 rounded-lg hover:bg-red-50 text-xs"
            >
              Remove
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-1">JPG, PNG or GIF · Max 2 MB</p>
        </div>
      </div>

      {/* Full Name */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-gray-600 mb-1">Full Name</label>
        <input
          type="text"
          value={form.fullName ?? ''}
          onChange={(e) => set('fullName', e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold bg-white"
        />
      </div>

      {/* Role | Branch */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Role</label>
          <select
            value={form.role ?? ''}
            onChange={(e) => set('role', e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold bg-white"
          >
            {MEMBER_ROLES.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Branch Assignment</label>
          <input
            type="text"
            value={form.branchId ?? ''}
            onChange={(e) => set('branchId', e.target.value)}
            placeholder="Branch ID"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold bg-white"
          />
        </div>
      </div>

      {/* Phone | Email */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Phone Number</label>
          <div className="flex">
            <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-200 bg-gray-50 text-gray-500 text-sm">
              +91
            </span>
            <input
              type="tel"
              value={form.phone ?? ''}
              onChange={(e) => set('phone', e.target.value)}
              className="flex-1 border border-gray-200 rounded-r-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold bg-white"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Email Address</label>
          <input
            type="email"
            value={form.email ?? ''}
            onChange={(e) => set('email', e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold bg-white"
          />
        </div>
      </div>

      {/* Info note */}
      <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 text-xs text-blue-700 mb-5">
        Updating the email address will trigger a re-verification link to the new address.
        The member&apos;s access will remain active during the transition.
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
        <button
          type="button"
          onClick={onClose}
          className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 text-sm"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={updateMember.isPending}
          className="bg-gold text-navy font-semibold px-4 py-2 rounded-lg hover:opacity-90 text-sm disabled:opacity-60"
        >
          {updateMember.isPending ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </Modal>
  );
};

// ─────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────
type ActiveModal =
  | { type: 'overview'; member: Member }
  | { type: 'edit'; member: Member }
  | null;

const SuperAdminMembersPage: React.FC = () => {
  // ── Filter state ──
  const [memberId, setMemberId] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<Role | ''>('');

  // Applied params (only update on Search click)
  const [appliedParams, setAppliedParams] = useState<{
    search?: string;
    role?: Role;
  }>({});

  // ── Data fetch (all members for hierarchy display) ──
  const { data, isLoading } = useMembers({
    limit: 500,
    search: appliedParams.search || undefined,
    role: appliedParams.role || undefined,
  });

  const members: Member[] = data?.data ?? [];

  // ── Modal state ──
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);

  // ── Handlers ──
  const handleSearch = () => {
    const searchTerm = [memberId, phone].filter(Boolean).join(' ').trim();
    setAppliedParams({
      search: searchTerm || undefined,
      role: role || undefined,
    });
  };

  const handleReset = () => {
    setMemberId('');
    setPhone('');
    setRole('');
    setAppliedParams({});
  };

  // Find CMD / director-level top member (highest role)
  const cmdMember =
    members.find((m) => m.role === 'DIRECTOR') ??
    members.find((m) => m.role === 'EXECUTIVE_DIRECTOR') ??
    members[0];

  // Group remaining members by role
  const byRole: Record<string, Member[]> = {};
  MEMBER_ROLES.forEach((r) => {
    byRole[r] = members.filter((m) => m.role === r && m.id !== cmdMember?.id);
  });

  return (
    <div className="p-6 space-y-6">
      {/* Page title */}
      <h1 className="text-2xl font-bold text-gray-900">Members Management</h1>

      {/* Filter card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <div className="flex flex-wrap items-end gap-3">
          {/* Member ID */}
          <div className="flex-1 min-w-36">
            <label className="block text-xs font-medium text-gray-600 mb-1">Member ID</label>
            <input
              type="text"
              value={memberId}
              onChange={(e) => setMemberId(e.target.value)}
              placeholder="STH-XXXXX"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold bg-white"
            />
          </div>

          {/* Phone */}
          <div className="flex-1 min-w-36">
            <label className="block text-xs font-medium text-gray-600 mb-1">Phone Number</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="9XXXXXXXXX"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold bg-white"
            />
          </div>

          {/* Role */}
          <div className="flex-1 min-w-40">
            <label className="block text-xs font-medium text-gray-600 mb-1">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as Role | '')}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold bg-white"
            >
              <option value="">All Roles</option>
              {MEMBER_ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </select>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pb-0.5">
            <button
              onClick={handleSearch}
              className="bg-gold text-navy font-semibold px-4 py-2 rounded-lg hover:opacity-90 text-sm"
            >
              Search
            </button>
            <button
              onClick={handleReset}
              className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 text-sm"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Hierarchy tree */}
      {isLoading ? (
        <div className="text-center py-16 text-gray-400">Loading hierarchy…</div>
      ) : members.length === 0 ? (
        <div className="text-center py-16 text-gray-400">No members found</div>
      ) : (
        <div className="space-y-8">
          {/* CMD row */}
          {cmdMember && (
            <div className="flex justify-center">
              <CmdCard
                member={cmdMember}
                totalCount={members.length - 1}
                onView={() => setActiveModal({ type: 'overview', member: cmdMember })}
              />
            </div>
          )}

          {/* Connector line */}
          {cmdMember && members.length > 1 && (
            <div className="flex justify-center">
              <div className="w-px h-6 bg-gray-300" />
            </div>
          )}

          {/* Role rows */}
          {MEMBER_ROLES.map((r) => {
            const group = byRole[r];
            if (!group || group.length === 0) return null;
            return (
              <div key={r} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                <SectionHeader label={ROLE_LABELS[r]} count={group.length} />
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {group.map((m) => (
                    <MemberCard
                      key={m.id}
                      member={m}
                      onView={() => setActiveModal({ type: 'overview', member: m })}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      {activeModal?.type === 'overview' && (
        <MemberOverviewModal
          member={activeModal.member}
          onClose={() => setActiveModal(null)}
          onEdit={() => setActiveModal({ type: 'edit', member: activeModal.member })}
          allMembers={members}
        />
      )}
      {activeModal?.type === 'edit' && (
        <EditMemberModal
          member={activeModal.member}
          onClose={() => setActiveModal(null)}
        />
      )}
    </div>
  );
};

export default SuperAdminMembersPage;
