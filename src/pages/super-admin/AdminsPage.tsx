import React, { useMemo, useState } from 'react';
import {
  useAdmins,
  useCreateAdmin,
  useUpdateAdmin,
  useUpdateAdminStatus,
  useDeleteAdmin,
  useUploadAdminPhoto,
} from '../../hooks/useAdmins';
import { useBranches } from '../../hooks/useBranches';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Pagination } from '../../components/ui/Pagination';
import { Modal } from '../../components/ui/Modal';
import type { CreateAdminData, UpdateAdminData } from '../../api/admins.api';
import type { Admin, UserStatus } from '../../types';

const inputClass =
  'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-gold';

const labelClass = 'mb-1 block text-xs font-medium text-gray-600';

const pageCardClass =
  'rounded-xl border border-gray-200 bg-white shadow-[0_6px_20px_rgba(15,23,42,0.05)]';

const PinIcon = () => (
  <svg
    className="h-3.5 w-3.5 flex-shrink-0"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M17.657 16.657 13.414 20.9a1.998 1.998 0 0 1-2.827 0l-4.244-4.243a8 8 0 1 1 11.314 0z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15 11a3 3 0 1 1-6 0 3 3 0 0 1 6 0z"
    />
  </svg>
);

const PhoneIcon = () => (
  <svg
    className="h-3.5 w-3.5 flex-shrink-0"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 5a2 2 0 0 1 2-2h3.28a1 1 0 0 1 .948.684l1.498 4.493a1 1 0 0 1-.502 1.21l-2.257 1.13a11.042 11.042 0 0 0 5.516 5.516l1.13-2.257a1 1 0 0 1 1.21-.502l4.493 1.498a1 1 0 0 1 .684.949V19a2 2 0 0 1-2 2h-1C9.716 21 3 14.284 3 7V5z"
    />
  </svg>
);

const MailIcon = () => (
  <svg
    className="h-3.5 w-3.5 flex-shrink-0"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="m3 8 7.89 5.26a2 2 0 0 0 2.22 0L21 8M5 19h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2z"
    />
  </svg>
);

const EyeIcon = () => (
  <svg
    className="h-4 w-4"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
    />
  </svg>
);

const EyeOffIcon = () => (
  <svg
    className="h-4 w-4"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M13.875 18.825A10.05 10.05 0 0 1 12 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 0 1 1.563-3.029m5.858.908a3 3 0 1 0 4.243 4.243M9.878 9.878l4.242 4.242M3 3l18 18"
    />
  </svg>
);

const PencilIcon = () => (
  <svg
    className="h-4 w-4"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="m15.232 5.232 3.536 3.536m-2.036-5.036a2.5 2.5 0 1 1 3.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
    />
  </svg>
);

const TrashIcon = () => (
  <svg
    className="h-4 w-4"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="m19 7-.867 12.142A2 2 0 0 1 16.138 21H7.862a2 2 0 0 1-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v3M4 7h16"
    />
  </svg>
);

const RefreshIcon = () => (
  <svg
    className="h-4 w-4"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4 4v5h.582m15.356 2A8.001 8.001 0 0 0 4.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 0 1-15.357-2m15.357 2H15"
    />
  </svg>
);

const PlusIcon = () => (
  <svg
    className="h-4 w-4"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2.4}
      d="M12 4v16m8-8H4"
    />
  </svg>
);

const SearchIcon = () => (
  <svg
    className="h-4 w-4"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="m21 21-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0z"
    />
  </svg>
);

const AdminStatIcon = () => (
  <svg
    className="h-4 w-4"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M17 20h5V10H2v10h5m10 0v-6a3 3 0 0 0-6 0v6m6 0H7"
    />
  </svg>
);

const ShieldIcon = () => (
  <svg
    className="h-4 w-4"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 3 19 7v5c0 5-3 8-7 9-4-1-7-4-7-9V7l7-4zm-2.5 9 1.8 1.8L15 10"
    />
  </svg>
);

const PendingIcon = () => (
  <svg
    className="h-4 w-4"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 8v4m0 4h.01M10.29 3.86l-7.5 13A1 1 0 0 0 3.66 18h16.68a1 1 0 0 0 .87-1.14l-7.5-13a1 1 0 0 0-1.74 0z"
    />
  </svg>
);

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join('');
}

function formatDate(iso: string): string {
  const date = new Date(iso);

  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function getAdminPhoto(admin: Admin): string {
  const raw = admin as unknown as Record<string, unknown>;

  return (
    (typeof raw.photo === 'string' && raw.photo) ||
    (typeof raw.photoUrl === 'string' && raw.photoUrl) ||
    (typeof raw.profilePhoto === 'string' && raw.profilePhoto) ||
    (typeof raw.profileImage === 'string' && raw.profileImage) ||
    (typeof raw.avatar === 'string' && raw.avatar) ||
    ''
  );
}

interface ToggleSwitchProps {
  active: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

function ToggleSwitch({
  active,
  onToggle,
  disabled = false,
}: ToggleSwitchProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      className={`relative h-5 w-9 flex-shrink-0 rounded-full transition-colors ${
        active ? 'bg-gold' : 'bg-gray-300'
      } disabled:opacity-50`}
    >
      <span
        className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
          active ? 'left-4' : 'left-0.5'
        }`}
      />
    </button>
  );
}

interface ViewAdminModalProps {
  open: boolean;
  onClose: () => void;
  admin: Admin;
}

function ViewAdminModal({ open, onClose, admin }: ViewAdminModalProps) {
  const initials = getInitials(admin.fullName);
  const photo = getAdminPhoto(admin);

  return (
    <Modal open={open} onClose={onClose} title="Admin Details" size="lg">
      <div className="space-y-5">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-navy text-lg font-bold text-white">
            {photo ? (
              <img
                src={photo}
                alt={admin.fullName}
                className="h-full w-full object-cover"
              />
            ) : (
              initials
            )}
          </div>

          <div>
            <h3 className="text-base font-bold text-gray-900">
              {admin.fullName}
            </h3>
            <p className="font-mono text-xs text-gray-400">{admin.adminId}</p>
            <div className="mt-1">
              <StatusBadge status={admin.status} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {[
            { label: 'Phone', value: admin.phone },
            { label: 'Email', value: admin.email ?? '—' },
            { label: 'Branch', value: admin.branch?.name ?? '—' },
            { label: 'Created', value: formatDate(admin.createdAt) },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-lg bg-gray-50 p-3">
              <p className="mb-1 text-xs uppercase tracking-wide text-gray-400">
                {label}
              </p>
              <p className="truncate text-sm font-medium text-gray-800">
                {value}
              </p>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-3 border-t border-gray-100 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}

interface AddAdminModalProps {
  open: boolean;
  onClose: () => void;
}

function AddAdminModal({ open, onClose }: AddAdminModalProps) {
  const create = useCreateAdmin();
  const uploadAdminPhoto = useUploadAdminPhoto();
  const branchesQuery = useBranches();
  const branches = branchesQuery.data?.data ?? [];

  const [form, setForm] = useState<CreateAdminData & { status: UserStatus }>({
    fullName: '',
    phone: '',
    email: '',
    branchId: '',
    password: '',
    status: 'ACTIVE',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  function handleClose() {
    onClose();
    setForm({
      fullName: '',
      phone: '',
      email: '',
      branchId: '',
      password: '',
      status: 'ACTIVE',
    });
    setPhotoFile(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    create.mutate(
      {
        fullName: form.fullName,
        phone: form.phone,
        branchId: form.branchId,
        password: form.password,
        email: form.email || undefined,
        status: form.status,
      },
      {
        onSuccess: (newAdmin) => {
          if (photoFile) {
            uploadAdminPhoto.mutate({
              id: newAdmin.id,
              file: photoFile,
            });
          }

          handleClose();
        },
      }
    );
  }

  return (
    <Modal open={open} onClose={handleClose} title="Add New Admin" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={labelClass}>Branch Assignment *</label>
          <select
            required
            value={form.branchId}
            onChange={(e) =>
              setForm((current) => ({ ...current, branchId: e.target.value }))
            }
            className={inputClass}
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
          <label className={labelClass}>Profile Photo</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm text-gray-500 file:mr-4 file:rounded-lg file:border-0 file:bg-gold/10 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-[#94750d] hover:file:bg-gold/20"
          />
        </div>

        <div>
          <label className={labelClass}>Full Name *</label>
          <input
            type="text"
            required
            placeholder="e.g. Ramesh Kumar"
            value={form.fullName}
            onChange={(e) =>
              setForm((current) => ({ ...current, fullName: e.target.value }))
            }
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Phone Number *</label>
          <input
            type="tel"
            required
            pattern="[6-9][0-9]{9}"
            maxLength={10}
            title="Enter a valid 10-digit Indian mobile number"
            placeholder="9876543210"
            value={form.phone}
            onChange={(e) =>
              setForm((current) => ({
                ...current,
                phone: e.target.value.replace(/\D/g, '').slice(0, 10),
              }))
            }
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Email Address</label>
          <input
            type="email"
            placeholder="admin@thangam.com"
            value={form.email ?? ''}
            onChange={(e) =>
              setForm((current) => ({ ...current, email: e.target.value }))
            }
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Password *</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              required
              placeholder="Min. 8 characters"
              value={form.password}
              onChange={(e) =>
                setForm((current) => ({
                  ...current,
                  password: e.target.value,
                }))
              }
              className={`${inputClass} pr-10`}
            />

            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
          <div>
            <p className="text-sm font-medium text-gray-700">Account Status</p>
            <p className="text-xs text-gray-400">Enable immediate access</p>
          </div>

          <div className="flex items-center gap-2">
            <ToggleSwitch
              active={form.status === 'ACTIVE'}
              onToggle={() =>
                setForm((current) => ({
                  ...current,
                  status:
                    current.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE',
                }))
              }
            />
            <span className="text-sm font-medium text-gray-700">
              {form.status === 'ACTIVE' ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={create.isPending}
            className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-navy hover:opacity-90 disabled:opacity-50"
          >
            {create.isPending ? 'Creating...' : 'Create Admin Account'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

interface EditAdminModalProps {
  open: boolean;
  onClose: () => void;
  admin: Admin;
}

function getAdminForm(admin: Admin): UpdateAdminData & { status: UserStatus } {
  return {
    fullName: admin.fullName,
    phone: admin.phone,
    email: admin.email,
    branchId: admin.branchId,
    status: admin.status,
  };
}

function EditAdminModal({ open, onClose, admin }: EditAdminModalProps) {
  return (
    <EditAdminModalContent
      key={admin.id}
      open={open}
      onClose={onClose}
      admin={admin}
    />
  );
}

function EditAdminModalContent({ open, onClose, admin }: EditAdminModalProps) {
  const update = useUpdateAdmin();
  const updateStatus = useUpdateAdminStatus();
  const uploadAdminPhoto = useUploadAdminPhoto();
  const branchesQuery = useBranches();
  const branches = branchesQuery.data?.data ?? [];

  const [form, setForm] = useState<UpdateAdminData & { status: UserStatus }>(
    () => getAdminForm(admin)
  );

  const [editPhotoFile, setEditPhotoFile] = useState<File | null>(null);

  function handleClose() {
    setEditPhotoFile(null);
    onClose();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const statusChanged = form.status !== admin.status;

    update.mutate(
      {
        id: admin.id,
        data: {
          fullName: form.fullName,
          phone: form.phone,
          branchId: form.branchId,
          email: form.email || undefined,
        },
      },
      {
        onSuccess: () => {
          if (editPhotoFile) {
            uploadAdminPhoto.mutate({
              id: admin.id,
              file: editPhotoFile,
            });
          }

          if (statusChanged) {
            updateStatus.mutate(
              { id: admin.id, status: form.status },
              { onSuccess: handleClose }
            );
          } else {
            handleClose();
          }
        },
      }
    );
  }

  const isPending = update.isPending || updateStatus.isPending;
  const initials = getInitials(admin.fullName);
  const photo = getAdminPhoto(admin);

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Edit Admin"
      subtitle="Update admin account and branch access details."
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-navy text-lg font-bold text-white">
            {photo ? (
              <img
                src={photo}
                alt={admin.fullName}
                className="h-full w-full object-cover"
              />
            ) : (
              initials
            )}
          </div>

          <div className="flex-1">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
              Profile Photo
            </p>

            <input
              type="file"
              accept="image/*"
              onChange={(e) => setEditPhotoFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-gray-500 file:mr-4 file:rounded-lg file:border-0 file:bg-gold/10 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-[#94750d] hover:file:bg-gold/20"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className={labelClass}>Full Name *</label>
            <input
              type="text"
              required
              value={form.fullName ?? ''}
              onChange={(e) =>
                setForm((current) => ({
                  ...current,
                  fullName: e.target.value,
                }))
              }
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Branch Assignment *</label>
            <select
              required
              value={form.branchId ?? ''}
              onChange={(e) =>
                setForm((current) => ({
                  ...current,
                  branchId: e.target.value,
                }))
              }
              className={inputClass}
            >
              <option value="">Select branch</option>

              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className={labelClass}>Phone Number *</label>
            <input
              type="tel"
              required
              pattern="[6-9][0-9]{9}"
              maxLength={10}
              title="Enter a valid 10-digit Indian mobile number"
              placeholder="9876543210"
              value={form.phone ?? ''}
              onChange={(e) =>
                setForm((current) => ({
                  ...current,
                  phone: e.target.value.replace(/\D/g, '').slice(0, 10),
                }))
              }
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Email Address</label>
            <input
              type="email"
              value={form.email ?? ''}
              onChange={(e) =>
                setForm((current) => ({
                  ...current,
                  email: e.target.value || undefined,
                }))
              }
              className={inputClass}
            />
          </div>
        </div>

        <div className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
          <div className="flex items-center gap-2">
            <ToggleSwitch
              active={form.status === 'ACTIVE'}
              onToggle={() =>
                setForm((current) => ({
                  ...current,
                  status:
                    current.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE',
                }))
              }
            />

            <span className="text-sm font-medium text-gray-700">
              {form.status === 'ACTIVE' ? 'Active' : 'Inactive'}
            </span>
          </div>

          <button
            type="button"
            className="text-sm font-semibold text-gold hover:opacity-80"
          >
            Reset Password
          </button>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={isPending}
            className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-navy hover:opacity-90 disabled:opacity-50"
          >
            {isPending ? 'Saving...' : 'Done'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

interface AdminRowProps {
  admin: Admin;
  onView: (admin: Admin) => void;
  onEdit: (admin: Admin) => void;
  onDelete: (admin: Admin) => void;
  onToggle: (admin: Admin) => void;
  isToggling: boolean;
}

function AdminAvatar({ admin }: { admin: Admin }) {
  const photo = getAdminPhoto(admin);
  const initials = getInitials(admin.fullName);

  return (
    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#dfe5e9] text-xs font-bold text-navy">
      {photo ? (
        <img
          src={photo}
          alt={admin.fullName}
          className="h-full w-full object-cover"
        />
      ) : (
        initials
      )}
    </div>
  );
}

function AdminRow({
  admin,
  onView,
  onEdit,
  onDelete,
  onToggle,
  isToggling,
}: AdminRowProps) {
  return (
    <div
      className="grid min-w-[900px] items-center border-b border-[#efefef] px-5 py-4 transition hover:bg-[#fbfbfb]"
      style={{
        gridTemplateColumns: '1.35fr 1.25fr 1.55fr 1fr 0.9fr 1fr',
      }}
    >
      <div className="flex min-w-0 items-center gap-3">
        <AdminAvatar admin={admin} />

        <div className="min-w-0">
          <p className="max-w-[120px] break-words text-[13px] font-extrabold leading-tight text-[#2e2e2e]">
            {admin.fullName}
          </p>
          <p className="mt-1 max-w-[95px] break-words font-mono text-[10px] leading-tight text-gray-400">
            ID: {admin.adminId}
          </p>
        </div>
      </div>

      <div className="flex min-w-0 items-start gap-2 text-[#555]">
        <span className="mt-0.5 text-[#ae8a14]">
          <PinIcon />
        </span>

        <span className="max-w-[135px] break-words text-[12px] font-semibold leading-snug">
          {admin.branch?.name ?? '—'}
        </span>
      </div>

      <div className="min-w-0 space-y-1.5">
        <div className="flex items-center gap-1.5 text-gray-500">
          <PhoneIcon />
          <span className="truncate text-[11px] font-medium">
            {admin.phone}
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-gray-500">
          <MailIcon />
          <span className="truncate text-[11px] font-medium">
            {admin.email ?? '—'}
          </span>
        </div>
      </div>

      <div>
        <StatusBadge status={admin.status} />
      </div>

      <div className="max-w-[80px] break-words text-[12px] font-medium leading-snug text-gray-500">
        {formatDate(admin.createdAt)}
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onView(admin)}
          className="rounded-lg p-1.5 text-[#5c5549] transition hover:bg-gray-100"
          aria-label="View admin"
        >
          <EyeIcon />
        </button>

        <button
          type="button"
          onClick={() => onEdit(admin)}
          className="rounded-lg p-1.5 text-[#a78010] transition hover:bg-[#fff7dd]"
          aria-label="Edit admin"
        >
          <PencilIcon />
        </button>

        <button
          type="button"
          onClick={() => onDelete(admin)}
          className="rounded-lg p-1.5 text-[#e53935] transition hover:bg-red-50"
          aria-label="Delete admin"
        >
          <TrashIcon />
        </button>

        <div className="ml-2">
          <ToggleSwitch
            active={admin.status === 'ACTIVE'}
            onToggle={() => onToggle(admin)}
            disabled={isToggling}
          />
        </div>
      </div>
    </div>
  );
}

function AdminMobileCard({
  admin,
  onView,
  onEdit,
  onDelete,
  onToggle,
  isToggling,
}: AdminRowProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <AdminAvatar admin={admin} />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-gray-900">
                {admin.fullName}
              </h3>
              <p className="mt-0.5 font-mono text-[11px] text-gray-400">
                {admin.adminId}
              </p>
            </div>

            <StatusBadge status={admin.status} />
          </div>

          <div className="mt-3 space-y-2 text-xs text-gray-600">
            <div className="flex items-center gap-2">
              <span className="text-[#ae8a14]">
                <PinIcon />
              </span>
              <span>{admin.branch?.name ?? '—'}</span>
            </div>

            <div className="flex items-center gap-2">
              <PhoneIcon />
              <span>{admin.phone}</span>
            </div>

            <div className="flex items-center gap-2">
              <MailIcon />
              <span className="truncate">{admin.email ?? '—'}</span>
            </div>

            <p className="pt-1 text-gray-400">
              Created: {formatDate(admin.createdAt)}
            </p>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onView(admin)}
                className="rounded-lg p-2 text-[#5c5549] hover:bg-gray-100"
              >
                <EyeIcon />
              </button>

              <button
                type="button"
                onClick={() => onEdit(admin)}
                className="rounded-lg p-2 text-[#a78010] hover:bg-[#fff7dd]"
              >
                <PencilIcon />
              </button>

              <button
                type="button"
                onClick={() => onDelete(admin)}
                className="rounded-lg p-2 text-[#e53935] hover:bg-red-50"
              >
                <TrashIcon />
              </button>
            </div>

            <ToggleSwitch
              active={admin.status === 'ACTIVE'}
              onToggle={() => onToggle(admin)}
              disabled={isToggling}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({
  icon,
  title,
  value,
  subtitle,
  iconBg,
  iconColor,
  subtitleColor = 'text-gray-400',
}: {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  subtitle: string;
  iconBg: string;
  iconColor: string;
  subtitleColor?: string;
}) {
  return (
    <div className={`${pageCardClass} p-4`}>
      <div className="flex items-start gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconBg} ${iconColor}`}
        >
          {icon}
        </div>

        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-gray-400">
            {title}
          </p>
          <p className="mt-1 text-[22px] font-bold leading-none text-[#2b2b2b]">
            {value}
          </p>
          <p className={`mt-2 text-[11px] ${subtitleColor}`}>{subtitle}</p>
        </div>
      </div>
    </div>
  );
}

const AdminsPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | UserStatus>('all');

  const [addOpen, setAddOpen] = useState(false);
  const [viewAdmin, setViewAdmin] = useState<Admin | null>(null);
  const [editAdmin, setEditAdmin] = useState<Admin | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const { data, isLoading, refetch } = useAdmins({
    page,
    limit: 8,
    search: search || undefined,
    branchId: branchFilter || undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
  });

  const updateStatus = useUpdateAdminStatus();
  const deleteAdmin = useDeleteAdmin();
  const branchesQuery = useBranches();
  const branches = branchesQuery.data?.data ?? [];

  const admins = useMemo(() => data?.data ?? [], [data]);

  const totalCount = data?.total ?? 0;
  const showingCount = admins.length;
  const activeCount = admins.filter((admin) => admin.status === 'ACTIVE').length;
  const inactiveCount = admins.filter(
    (admin) => admin.status === 'INACTIVE'
  ).length;

  const [now] = useState(() => Date.now());

  const addedThisMonth = useMemo(
    () =>
      admins.filter(
        (admin) =>
          new Date(admin.createdAt).getTime() >
          now - 30 * 24 * 60 * 60 * 1000
      ).length,
    [admins, now]
  );

  function handleDelete(admin: Admin) {
    if (
      window.confirm(
        `Delete admin "${admin.fullName}"? This cannot be undone and will remove their login access.`
      )
    ) {
      deleteAdmin.mutate(admin.id);
    }
  }

  function handleToggle(admin: Admin) {
    const newStatus: UserStatus =
      admin.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';

    setTogglingId(admin.id);

    updateStatus.mutate(
      {
        id: admin.id,
        status: newStatus,
      },
      {
        onSettled: () => setTogglingId(null),
      }
    );
  }

  return (
    <div className="p-4 text-[13px] md:p-5">
      <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h1 className="text-[24px] font-extrabold tracking-[-0.03em] text-[#262626]">
            Admin Management
          </h1>
          <p className="mt-1 text-xs text-[#7b7b7b]">
            Manage branch admins and account access permissions across all
            housing projects.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gold px-5 text-xs font-bold text-white shadow-[0_8px_16px_rgba(201,162,39,0.2)] transition hover:opacity-90 sm:w-auto xl:min-w-[145px]"
        >
          <PlusIcon />
          Add Admin
        </button>
      </div>

      <div className={`${pageCardClass} mb-5 p-4`}>
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1.7fr_1fr_1fr_auto] xl:items-end">
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <SearchIcon />
            </span>

            <input
              type="text"
              placeholder="Search admin by name, email"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="h-10 w-full rounded-xl border border-gray-200 bg-[#fafafa] pl-10 pr-3 text-xs text-gray-700 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
            />
          </div>

          <div>
            <p className="mb-1 pl-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-gray-400">
              Branch
            </p>

            <select
              value={branchFilter}
              onChange={(e) => {
                setBranchFilter(e.target.value);
                setPage(1);
              }}
              className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-gold"
            >
              <option value="">All Branches</option>

              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <p className="mb-1 pl-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-gray-400">
              Status
            </p>

            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as 'all' | UserStatus);
                setPage(1);
              }}
              className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-gold"
            >
              <option value="all">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>

          <button
            type="button"
            onClick={() => void refetch()}
            className="flex h-10 w-full items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 transition hover:bg-gray-50 hover:text-gray-700 xl:w-10"
            aria-label="Refresh"
          >
            <RefreshIcon />
          </button>
        </div>
      </div>

      <div className={`${pageCardClass} overflow-hidden`}>
        <div className="flex flex-col gap-2 border-b border-[#efefef] bg-[#fbfbfb] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-[15px] font-extrabold text-[#94750d]">
            Admin Accounts List
          </h2>

          <p className="text-[11px] font-medium text-gray-500">
            Showing {showingCount} of {totalCount} Administrators
          </p>
        </div>

        <div className="hidden xl:block">
          <div className="overflow-x-auto">
            <div
              className="grid min-w-[900px] border-b border-[#efefef] bg-[#f7f7f7] px-5 py-3 text-[10px] font-bold uppercase tracking-[0.08em] text-[#8f8b83]"
              style={{
                gridTemplateColumns: '1.35fr 1.25fr 1.55fr 1fr 0.9fr 1fr',
              }}
            >
              <span>Admin Name</span>
              <span>Branch Assigned</span>
              <span>Contact Information</span>
              <span>Account Status</span>
              <span>Created Date</span>
              <span>Actions</span>
            </div>

            {isLoading ? (
              <div className="px-6 py-12 text-center text-sm text-gray-400">
                Loading admins...
              </div>
            ) : admins.length === 0 ? (
              <div className="px-6 py-12 text-center text-sm text-gray-400">
                No admins found
              </div>
            ) : (
              admins.map((admin) => (
                <AdminRow
                  key={admin.id}
                  admin={admin}
                  onView={setViewAdmin}
                  onEdit={setEditAdmin}
                  onDelete={handleDelete}
                  onToggle={handleToggle}
                  isToggling={togglingId === admin.id}
                />
              ))
            )}
          </div>
        </div>

        <div className="space-y-4 p-4 xl:hidden">
          {isLoading ? (
            <div className="py-10 text-center text-sm text-gray-400">
              Loading admins...
            </div>
          ) : admins.length === 0 ? (
            <div className="py-10 text-center text-sm text-gray-400">
              No admins found
            </div>
          ) : (
            admins.map((admin) => (
              <AdminMobileCard
                key={admin.id}
                admin={admin}
                onView={setViewAdmin}
                onEdit={setEditAdmin}
                onDelete={handleDelete}
                onToggle={handleToggle}
                isToggling={togglingId === admin.id}
              />
            ))
          )}
        </div>

        {data && (
          <div className="border-t border-[#efefef] bg-[#fbfbfb] px-4 py-3 sm:px-5">
            <Pagination
              page={page}
              total={data.total}
              limit={data.limit}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <SummaryCard
          icon={<AdminStatIcon />}
          title="Total Admins"
          value={totalCount}
          subtitle={`↗ ${addedThisMonth} added this month`}
          iconBg="bg-[#f4f0e2]"
          iconColor="text-[#a78010]"
          subtitleColor="text-green-600"
        />

        <SummaryCard
          icon={<ShieldIcon />}
          title="Active Sessions"
          value={activeCount}
          subtitle="Across all branch locations"
          iconBg="bg-[#e9f6f1]"
          iconColor="text-[#2c806f]"
        />

        <SummaryCard
          icon={<PendingIcon />}
          title="Pending Approvals"
          value={inactiveCount.toString().padStart(2, '0')}
          subtitle="Requires super admin action"
          iconBg="bg-[#fff0ee]"
          iconColor="text-[#d85245]"
          subtitleColor="text-red-500"
        />
      </div>

      <AddAdminModal open={addOpen} onClose={() => setAddOpen(false)} />

      {viewAdmin && (
        <ViewAdminModal
          open
          onClose={() => setViewAdmin(null)}
          admin={viewAdmin}
        />
      )}

      {editAdmin && (
        <EditAdminModal
          open
          onClose={() => setEditAdmin(null)}
          admin={editAdmin}
        />
      )}
    </div>
  );
};

export default AdminsPage;