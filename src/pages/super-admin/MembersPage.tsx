import React, { useState } from 'react';
import {
  useMembers,
  useUpdateMemberStatus,
  useUpdateMember,
  useUploadMemberPhoto,
} from '../../hooks/useMembers';
import { useBranches } from '../../hooks/useBranches';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Pagination } from '../../components/ui/Pagination';
import { Modal } from '../../components/ui/Modal';
import { SearchInput } from '../../components/ui/SearchInput';
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

function MemberAvatar({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <div className="w-9 h-9 rounded-full bg-gold/15 flex items-center justify-center text-navy font-semibold text-sm shrink-0">
      {initials}
    </div>
  );
}

function formatDate(dateStr?: string) {
  if (!dateStr) return '—';

  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
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

function MailIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
      <path
        d="M4 6h16v12H4V6zM4 7l8 6 8-6"
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

function HierarchyIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 4v5M6 15v5M18 15v5M6 15h12M12 9H6v6M12 9h6v6M9 4h6v5H9V4z"
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

function InfoRow({
  icon,
  label,
  value,
  status,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  status?: boolean;
}) {
  return (
    <div className="flex min-h-[52px] items-center gap-4 rounded-[11px] border border-[#eeeeee] bg-white px-3 py-2.5">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] border border-[#eee7d7] bg-[#fbfaf5] text-[#a88213]">
        {icon}
      </div>

      <div className="min-w-0">
        <p className="mb-0.5 text-[9px] font-medium text-[#8c8c8c]">
          {label}
        </p>

        <div className="break-words text-[12px] font-bold leading-[1.15] text-[#2f2f2f]">
          {status ? (
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[#2f7d68]" />
              {value}
            </span>
          ) : (
            value
          )}
        </div>
      </div>
    </div>
  );
}

function DownlineItem({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[1fr_auto] items-center gap-3">
      <span className="text-[10px] font-medium text-[#727272]">{label}</span>
      <span className="text-[14px] font-extrabold text-[#2f2f2f]">
        {value}
      </span>
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

  const raw = member as any;

  const imageSource =
    raw.photo ||
    raw.photoUrl ||
    raw.profilePhoto ||
    raw.profileImage ||
    '';

  const joinedDate = formatDate(raw.createdAt || raw.created_at);

  const branchName = member.branch?.name || raw.branchName || '—';
  const reportsTo = member.reportsTo?.fullName || raw.reportsToName || '—';

  const networkSize =
    raw.networkSize ||
    raw.totalNetworkSize ||
    raw.totalDownline ||
    '—';

  const downlineSummary = raw.downlineSummary || {};

  const executiveDirectors =
    downlineSummary.executiveDirectors ??
    raw.executiveDirectors ??
    '—';

  const deputyDirectors =
    downlineSummary.deputyDirectors ??
    raw.deputyDirectors ??
    '—';

  const seniorManagers =
    downlineSummary.seniorManagers ??
    raw.seniorManagers ??
    '—';

  const businessManagers =
    downlineSummary.businessManagers ??
    raw.businessManagers ??
    '—';

  const agents = downlineSummary.agents ?? raw.agents ?? '—';

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/45 px-4 py-4 backdrop-blur-[3px]">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative flex w-full max-w-[850px] max-h-[calc(100vh-32px)] flex-col overflow-hidden rounded-[18px] border border-[#ededed] bg-white shadow-[0_24px_70px_rgba(0,0,0,0.28)]">
        {/* Header */}
        <div className="relative shrink-0 px-[34px] pb-5 pt-[22px]">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-[30px] top-[18px] flex h-8 w-8 items-center justify-center rounded-full border border-[#b8cdfb] bg-white text-[#777] shadow-[0_0_0_2px_rgba(96,165,250,0.12)] transition hover:bg-[#f8fbff]"
            aria-label="Close"
          >
            <CloseIcon />
          </button>

          <h2 className="text-[18px] font-extrabold leading-none text-[#2d2d2d]">
            Member Overview
          </h2>

          <p className="mt-2 text-[12px] font-medium text-[#747474]">
            View member profile, hierarchy details, and current status.
          </p>
        </div>

        {/* Scrollable Body */}
        <div className="min-h-0 flex-1 overflow-y-auto px-[34px] pb-6">
          {/* Profile Card */}
          <div className="flex min-h-[98px] items-center justify-between gap-5 rounded-[9px] border border-[#f0f0f2] bg-[#f7f7f9] px-4 py-4">
            <div className="flex min-w-0 items-center gap-4">
              <div className="relative shrink-0">
                {imageSource ? (
                  <img
                    src={imageSource}
                    alt={member.fullName}
                    className="h-[64px] w-[64px] rounded-[9px] border border-[#cfcfcf] object-cover"
                  />
                ) : (
                  <div className="flex h-[64px] w-[64px] items-center justify-center rounded-[9px] border border-[#cfcfcf] bg-[#dedede] text-lg font-bold text-[#555]">
                    {member.fullName?.charAt(0)?.toUpperCase() || 'M'}
                  </div>
                )}

                <span className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-white bg-[#2f7d68]" />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <h3 className="truncate text-[21px] font-extrabold leading-none text-[#2d2d2d]">
                    {member.fullName}
                  </h3>

                  <span className="rounded-md border border-[#cddfd9] bg-[#dcebe5] px-2 py-0.5 text-[9px] font-extrabold text-[#477463]">
                    {member.role.replace(/_/g, ' ')}
                  </span>
                </div>

                <p className="mt-2 text-[13px] font-extrabold text-[#b08a13]">
                  {member.memberId}
                </p>
              </div>
            </div>

            <div className="shrink-0 space-y-2 text-right">
              <p className="flex items-center justify-end gap-1.5 text-[10.5px] font-medium text-[#6f6f6f]">
                <CalendarIcon />
                <span>
                  <span className="font-extrabold">Joined Date:</span>{' '}
                  {joinedDate}
                </span>
              </p>

              <p className="flex items-center justify-end gap-1.5 text-[10.5px] font-extrabold text-[#555]">
                <BuildingIcon />
                <span>{branchName}</span>
              </p>
            </div>
          </div>

          {/* Two Columns */}
          <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
            {/* Contact */}
            <div>
              <SectionHeading icon={<FileIcon />} title="Contact Information" />

              <div className="space-y-2.5">
                <InfoRow
                  icon={<PhoneIcon />}
                  label="Phone Number"
                  value={member.phone || '—'}
                />

                <InfoRow
                  icon={<MailIcon />}
                  label="Email Address"
                  value={member.email || '—'}
                />

                <InfoRow
                  icon={<BranchIcon />}
                  label="Branch Assignment"
                  value={branchName}
                />

                <InfoRow
                  icon={<ShieldIcon />}
                  label="Current Status"
                  value={member.status}
                  status
                />
              </div>
            </div>

            {/* Hierarchy */}
            <div>
              <SectionHeading
                icon={<HierarchyIcon />}
                title="Hierarchy Position"
              />

              <div className="rounded-[11px] border border-[#eeeeee] bg-white px-4 py-4">
                <div className="space-y-5">
                  <div className="flex items-start justify-between gap-4">
                    <p className="text-[12px] font-medium text-[#727272]">
                      Reports To:
                    </p>

                    <p className="max-w-[185px] text-right text-[12px] font-extrabold text-[#9f7e18]">
                      {reportsTo}
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <p className="text-[12px] font-medium text-[#727272]">
                      Total Network Size:
                    </p>

                    <span className="rounded-full bg-[#f0e6bb] px-2.5 py-1 text-[11px] font-extrabold text-[#917416]">
                      {networkSize}
                    </span>
                  </div>
                </div>

                <div className="mt-6">
                  <p className="mb-4 text-[9px] font-extrabold uppercase tracking-[0.04em] text-[#686868]">
                    Downline Summary (12 Sub-Levels)
                  </p>

                  <div className="grid grid-cols-2 gap-x-7 gap-y-4">
                    <DownlineItem
                      label="Executive Directors"
                      value={executiveDirectors}
                    />

                    <DownlineItem
                      label="Deputy Directors"
                      value={deputyDirectors}
                    />

                    <DownlineItem
                      label="Senior Managers"
                      value={seniorManagers}
                    />

                    <DownlineItem
                      label="Business Managers"
                      value={businessManagers}
                    />

                    <DownlineItem label="Agents" value={agents} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="mt-5">
            <SectionHeading icon={<ClockIcon />} title="Recent Activity" />

            <div className="min-h-[48px] border-t border-[#f5f5f5]" />
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 flex items-center justify-end gap-4 border-t border-[#ececf0] bg-[#f8f8fb] px-[34px] py-3">
          <button
            type="button"
            onClick={() => onEdit(member)}
            className="inline-flex h-[34px] min-w-[118px] items-center justify-center gap-2 rounded-[9px] border border-[#d1bd75] bg-white px-4 text-[12px] font-extrabold text-[#a98313] shadow-sm transition hover:bg-[#fffaf0]"
          >
            <EditIcon />
            Edit Member
          </button>

          <button
            type="button"
            onClick={() => onToggleStatus(member)}
            className="inline-flex h-[34px] min-w-[150px] items-center justify-center gap-2 rounded-[9px] border border-[#e49c97] bg-white px-4 text-[12px] font-extrabold text-[#d8463b] shadow-sm transition hover:bg-[#fff6f5]"
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

function EditMemberModal({
  member,
  open,
  onClose,
}: {
  member: Member | null;
  open: boolean;
  onClose: () => void;
}) {
  const updateMutation = useUpdateMember();
  const uploadMemberPhoto = useUploadMemberPhoto();
  const branchesQuery = useBranches();
  const branches = branchesQuery.data?.data ?? [];

  const [form, setForm] = useState<UpdateMemberData>({});
  const [memberPhotoFile, setMemberPhotoFile] = useState<File | null>(null);

  React.useEffect(() => {
    if (member) {
      setForm({
        fullName: member.fullName,
        phone: member.phone,
        email: member.email,
        role: member.role,
        branchId: member.branchId,
        codeNumber: member.codeNumber,
      });
    }
  }, [member]);

  if (!member) return null;

  const currentMember = member;

  function handleClose() {
    setMemberPhotoFile(null);
    onClose();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    updateMutation.mutate(
      {
        id: currentMember.id,
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
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Full Name
            </label>

            <input
              type="text"
              value={form.fullName ?? ''}
              onChange={(e) =>
                setForm((f) => ({ ...f, fullName: e.target.value }))
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
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
                setForm((f) => ({
                  ...f,
                  phone: e.target.value.replace(/\D/g, '').slice(0, 10),
                }))
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Email
            </label>

            <input
              type="email"
              value={form.email ?? ''}
              onChange={(e) =>
                setForm((f) => ({ ...f, email: e.target.value }))
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Role
            </label>

            <select
              value={form.role ?? ''}
              onChange={(e) =>
                setForm((f) => ({ ...f, role: e.target.value as Role }))
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Branch
            </label>

            <select
              value={form.branchId ?? ''}
              onChange={(e) =>
                setForm((f) => ({ ...f, branchId: e.target.value }))
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold"
            >
              <option value="">Select branch</option>

              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Code Number
            </label>

            <input
              type="text"
              value={form.codeNumber ?? ''}
              onChange={(e) =>
                setForm((f) => ({ ...f, codeNumber: e.target.value }))
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Profile Photo
          </label>

          <input
            type="file"
            accept="image/*"
            onChange={(e) => setMemberPhotoFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gold/10 file:text-navy hover:file:bg-gold/20"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="px-4 py-2 text-sm bg-gold text-navy font-semibold rounded-lg hover:opacity-90 disabled:opacity-50"
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
      <p className="text-sm text-gray-600 mb-6">
        {isActive
          ? `Are you sure you want to deactivate ${member.fullName}? They will lose access to the system.`
          : `Are you sure you want to activate ${member.fullName}?`}
      </p>

      <div className="flex justify-end gap-2">
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>

        <button
          onClick={() =>
            updateStatus.mutate(
              { id: member.id, status: newStatus },
              { onSuccess: () => onClose() }
            )
          }
          disabled={updateStatus.isPending}
          className={`px-4 py-2 text-sm rounded-lg text-white disabled:opacity-50 ${
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
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [branchFilter, setBranchFilter] = useState('');

  const [viewMember, setViewMember] = useState<Member | null>(null);
  const [editMember, setEditMember] = useState<Member | null>(null);
  const [deactivateMember, setDeactivateMember] = useState<Member | null>(null);

  const branchesQuery = useBranches({ limit: 100 });
  const branches = branchesQuery.data?.data ?? [];

  const { data, isLoading } = useMembers({
    page,
    limit: 10,
    search: search || undefined,
    role: (role as Role) || undefined,
    status: (status as UserStatus) || undefined,
    branchId: branchFilter || undefined,
  });

  const members = data?.data ?? [];
  const total = data?.total ?? 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Members</h1>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 bg-white border border-gray-200 rounded-xl p-4">
        <SearchInput
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          placeholder="Search members..."
          className="w-56"
        />

        <select
          value={role}
          onChange={(e) => {
            setRole(e.target.value);
            setPage(1);
          }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-gold"
        >
          <option value="">All Roles</option>

          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r.replace(/_/g, ' ')}
            </option>
          ))}
        </select>

        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-gold"
        >
          <option value="">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
          <option value="PENDING">Pending</option>
        </select>

        <select
          value={branchFilter}
          onChange={(e) => {
            setBranchFilter(e.target.value);
            setPage(1);
          }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-gold"
        >
          <option value="">All Branches</option>

          {branches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Member
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  ID
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Phone
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Role
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Branch
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Status
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-gray-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : members.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-10 text-center text-gray-500 text-sm"
                  >
                    No members found.
                  </td>
                </tr>
              ) : (
                members.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <MemberAvatar name={member.fullName} />

                        <span className="font-medium text-gray-900">
                          {member.fullName}
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-3 text-gray-600 font-mono text-xs">
                      {member.memberId}
                    </td>

                    <td className="px-4 py-3 text-gray-600">
                      {member.phone}
                    </td>

                    <td className="px-4 py-3">
                      <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">
                        {member.role.replace(/_/g, ' ')}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-gray-600">
                      {member.branch?.name ?? '—'}
                    </td>

                    <td className="px-4 py-3">
                      <StatusBadge status={member.status} />
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => setViewMember(member)}
                          className="px-2.5 py-1.5 text-xs text-gray-600 hover:text-gold hover:bg-gold/10 rounded-lg transition-colors"
                        >
                          View
                        </button>

                        <button
                          onClick={() => setEditMember(member)}
                          className="px-2.5 py-1.5 text-xs text-gray-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() => setDeactivateMember(member)}
                          className={`px-2.5 py-1.5 text-xs rounded-lg transition-colors ${
                            member.status === 'ACTIVE'
                              ? 'text-red-600 hover:bg-red-50'
                              : 'text-green-600 hover:bg-green-50'
                          }`}
                        >
                          {member.status === 'ACTIVE'
                            ? 'Deactivate'
                            : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          page={page}
          total={total}
          limit={10}
          onPageChange={setPage}
        />
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