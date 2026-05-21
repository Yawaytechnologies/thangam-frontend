import React, { useState } from 'react';
import { useAdmins, useCreateAdmin, useUpdateAdmin, useUpdateAdminStatus } from '../../hooks/useAdmins';
import { useBranches } from '../../hooks/useBranches';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Pagination } from '../../components/ui/Pagination';
import { Modal } from '../../components/ui/Modal';
import type { CreateAdminData, UpdateAdminData } from '../../api/admins.api';
import type { Admin, UserStatus } from '../../types';

// ─── Shared style constants ───────────────────────────────────────────────────

const inputClass =
  'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold bg-white';
const labelClass = 'block text-xs font-medium text-gray-600 mb-1';

// ─── Icons ────────────────────────────────────────────────────────────────────

const PinIcon = () => (
  <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const PhoneIcon = () => (
  <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 7V5z" />
  </svg>
);

const MailIcon = () => (
  <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const EyeIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const EyeOffIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
  </svg>
);

const PencilIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
  </svg>
);

const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const RefreshIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const UploadIcon = () => (
  <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
  </svg>
);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ─── Toggle Switch ────────────────────────────────────────────────────────────

interface ToggleSwitchProps {
  active: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

function ToggleSwitch({ active, onToggle, disabled = false }: ToggleSwitchProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      className={`relative w-9 h-5 rounded-full transition-colors flex-shrink-0 ${active ? 'bg-gold' : 'bg-gray-300'} disabled:opacity-50`}
    >
      <span
        className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${active ? 'translate-x-4' : 'translate-x-0.5'}`}
      />
    </button>
  );
}

// ─── ViewAdminModal ───────────────────────────────────────────────────────────

interface ViewAdminModalProps {
  open: boolean;
  onClose: () => void;
  admin: Admin;
}

function ViewAdminModal({ open, onClose, admin }: ViewAdminModalProps) {
  const initials = getInitials(admin.fullName);
  return (
    <Modal open={open} onClose={onClose} title="Admin Details" size="lg">
      <div className="space-y-5">
        {/* Avatar + basic info */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-navy flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
            {initials}
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">{admin.fullName}</h3>
            <p className="text-xs text-gray-400 font-mono">{admin.adminId}</p>
            <div className="mt-1">
              <StatusBadge status={admin.status} />
            </div>
          </div>
        </div>

        {/* Details grid */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Phone', value: admin.phone },
            { label: 'Email', value: admin.email ?? '—' },
            { label: 'Branch', value: admin.branch?.name ?? '—' },
            { label: 'Created', value: formatDate(admin.createdAt) },
          ].map(({ label, value }) => (
            <div key={label} className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{label}</p>
              <p className="text-sm font-medium text-gray-800 truncate">{value}</p>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── AddAdminModal ────────────────────────────────────────────────────────────

interface AddAdminModalProps {
  open: boolean;
  onClose: () => void;
}

function AddAdminModal({ open, onClose }: AddAdminModalProps) {
  const create = useCreateAdmin();
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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const { status: _status, ...rest } = form;
    create.mutate(
      { ...rest, email: rest.email || undefined },
      {
        onSuccess: () => {
          onClose();
          setForm({ fullName: '', phone: '', email: '', branchId: '', password: '', status: 'ACTIVE' });
        },
      }
    );
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add New Admin"
      subtitle="Create a new administrative account and assign branch access."
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Branch Assignment */}
        <div>
          <label className={labelClass}>Branch Assignment *</label>
          <select
            required
            value={form.branchId}
            onChange={(e) => setForm((f) => ({ ...f, branchId: e.target.value }))}
            className={inputClass}
          >
            <option value="">Select branch</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>

        {/* Profile Photo upload */}
        <div>
          <label className={labelClass}>Profile Photo</label>
          <div className="border-2 border-dashed border-gray-200 rounded-xl p-5 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-gold transition-colors bg-gray-50">
            <UploadIcon />
            <p className="text-sm font-medium text-gray-600">Click to upload or drag &amp; drop</p>
            <p className="text-xs text-gray-400">PNG, JPG up to 5MB</p>
          </div>
        </div>

        {/* Full Name */}
        <div>
          <label className={labelClass}>Full Name *</label>
          <input
            type="text"
            required
            placeholder="e.g. Ramesh Kumar"
            value={form.fullName}
            onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
            className={inputClass}
          />
        </div>

        {/* Phone */}
        <div>
          <label className={labelClass}>Phone Number *</label>
          <input
            type="tel"
            required
            placeholder="+91 98765 43210"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            className={inputClass}
          />
        </div>

        {/* Email */}
        <div>
          <label className={labelClass}>Email Address</label>
          <input
            type="email"
            placeholder="admin@thangam.com"
            value={form.email ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            className={inputClass}
          />
        </div>

        {/* Password */}
        <div>
          <label className={labelClass}>Password *</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              required
              placeholder="Min. 8 characters"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              className={`${inputClass} pr-10`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>
        </div>

        {/* Account Status toggle */}
        <div className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3">
          <div>
            <p className="text-sm font-medium text-gray-700">Account Status</p>
            <p className="text-xs text-gray-400">Enable immediate access</p>
          </div>
          <div className="flex items-center gap-2">
            <ToggleSwitch
              active={form.status === 'ACTIVE'}
              onToggle={() =>
                setForm((f) => ({ ...f, status: f.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' }))
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
            onClick={onClose}
            className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 text-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={create.isPending}
            className="bg-gold text-navy font-semibold px-4 py-2 rounded-lg hover:opacity-90 disabled:opacity-50 text-sm"
          >
            {create.isPending ? 'Creating...' : 'Create Admin Account'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ─── EditAdminModal ───────────────────────────────────────────────────────────

interface EditAdminModalProps {
  open: boolean;
  onClose: () => void;
  admin: Admin;
}

function EditAdminModal({ open, onClose, admin }: EditAdminModalProps) {
  const update = useUpdateAdmin();
  const branchesQuery = useBranches();
  const branches = branchesQuery.data?.data ?? [];

  const [form, setForm] = useState<UpdateAdminData & { status: UserStatus }>({
    fullName: admin.fullName,
    phone: admin.phone,
    email: admin.email,
    branchId: admin.branchId,
    status: admin.status,
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const { status: _status, ...rest } = form;
    update.mutate({ id: admin.id, data: rest }, { onSuccess: onClose });
  }

  const initials = getInitials(admin.fullName);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit Admin"
      subtitle="Update admin account and branch access details."
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Profile photo section */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-navy flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Profile Photo</p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="text-xs font-semibold text-gold hover:opacity-80 transition-opacity"
              >
                Replace Photo
              </button>
              <div className="border-2 border-dashed border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-400 hover:border-gold transition-colors cursor-pointer">
                Drag &amp; drop or browse
              </div>
            </div>
          </div>
        </div>

        {/* Full Name + Branch */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Full Name *</label>
            <input
              type="text"
              required
              value={form.fullName ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Branch Assignment *</label>
            <select
              required
              value={form.branchId ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, branchId: e.target.value }))}
              className={inputClass}
            >
              <option value="">Select branch</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Phone + Email */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Phone Number *</label>
            <input
              type="tel"
              required
              value={form.phone ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Email Address</label>
            <input
              type="email"
              value={form.email ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value || undefined }))}
              className={inputClass}
            />
          </div>
        </div>

        {/* Account Status + Reset Password */}
        <div className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3">
          <div className="flex items-center gap-2">
            <ToggleSwitch
              active={form.status === 'ACTIVE'}
              onToggle={() =>
                setForm((f) => ({ ...f, status: f.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' }))
              }
            />
            <span className="text-sm font-medium text-gray-700">
              {form.status === 'ACTIVE' ? 'Active' : 'Inactive'}
            </span>
          </div>
          <button
            type="button"
            className="text-sm font-semibold text-gold hover:opacity-80 transition-opacity"
          >
            Reset Password
          </button>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 text-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={update.isPending}
            className="bg-gold text-navy font-semibold px-4 py-2 rounded-lg hover:opacity-90 disabled:opacity-50 text-sm"
          >
            {update.isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ─── AdminRow ─────────────────────────────────────────────────────────────────

interface AdminRowProps {
  admin: Admin;
  onView: (a: Admin) => void;
  onEdit: (a: Admin) => void;
  onDelete: (a: Admin) => void;
  onToggle: (a: Admin) => void;
  isToggling: boolean;
}

function AdminRow({ admin, onView, onEdit, onDelete, onToggle, isToggling }: AdminRowProps) {
  const initials = getInitials(admin.fullName);

  return (
    <div className="grid items-center px-5 py-4 border-b border-gray-100 hover:bg-gray-50/50 transition-colors"
      style={{ gridTemplateColumns: '2fr 1.2fr 1.5fr 1fr 1fr 1fr' }}>

      {/* 1. Admin Name */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 rounded-full bg-navy flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
          {initials}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">{admin.fullName}</p>
          <p className="text-xs text-gray-400 font-mono truncate">{admin.adminId}</p>
        </div>
      </div>

      {/* 2. Branch */}
      <div className="flex items-center gap-1.5 text-gray-600 min-w-0">
        <PinIcon />
        <span className="text-sm truncate">{admin.branch?.name ?? '—'}</span>
      </div>

      {/* 3. Contact */}
      <div className="space-y-1 min-w-0">
        <div className="flex items-center gap-1.5 text-gray-500">
          <PhoneIcon />
          <span className="text-xs truncate">{admin.phone}</span>
        </div>
        <div className="flex items-center gap-1.5 text-gray-500">
          <MailIcon />
          <span className="text-xs truncate">{admin.email ?? '—'}</span>
        </div>
      </div>

      {/* 4. Status */}
      <div>
        <StatusBadge status={admin.status} />
      </div>

      {/* 5. Created Date */}
      <div className="text-xs text-gray-500">{formatDate(admin.createdAt)}</div>

      {/* 6. Actions */}
      <div className="flex items-center gap-1.5">
        {/* View */}
        <button
          type="button"
          onClick={() => onView(admin)}
          className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
          aria-label="View admin"
        >
          <EyeIcon />
        </button>
        {/* Edit */}
        <button
          type="button"
          onClick={() => onEdit(admin)}
          className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
          aria-label="Edit admin"
        >
          <PencilIcon />
        </button>
        {/* Delete */}
        <button
          type="button"
          onClick={() => onDelete(admin)}
          className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
          aria-label="Delete admin"
        >
          <TrashIcon />
        </button>
        {/* Status toggle */}
        <ToggleSwitch
          active={admin.status === 'ACTIVE'}
          onToggle={() => onToggle(admin)}
          disabled={isToggling}
        />
      </div>
    </div>
  );
}

// ─── AdminsPage ───────────────────────────────────────────────────────────────

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
    limit: 20,
    search: search || undefined,
    branchId: branchFilter || undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
  });

  const updateStatus = useUpdateAdminStatus();
  const branchesQuery = useBranches();
  const branches = branchesQuery.data?.data ?? [];

  const admins = data?.data ?? [];

  const totalCount = data?.total ?? 0;
  const activeCount = admins.filter((a) => a.status === 'ACTIVE').length;
  // Simple heuristic: admins created within the last 30 days
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const addedThisMonth = admins.filter((a) => new Date(a.createdAt).getTime() > thirtyDaysAgo).length;

  function handleDelete(a: Admin) {
    if (window.confirm(`Delete admin "${a.fullName}"? This action cannot be undone.`)) {
      // no-op until delete hook is added
    }
  }

  function handleToggle(a: Admin) {
    const newStatus: UserStatus = a.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    setTogglingId(a.id);
    updateStatus.mutate(
      { id: a.id, status: newStatus },
      { onSettled: () => setTogglingId(null) }
    );
  }

  return (
    <div className="p-6 pb-24">
      {/* ── Page Header ── */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold text-gray-900">Admin Management</h1>
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className="bg-gold text-navy font-semibold px-4 py-2 rounded-lg hover:opacity-90 text-sm"
        >
          + Add Admin
        </button>
      </div>

      {/* ── Filter Row ── */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-52 max-w-xs">
          <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold bg-white"
          />
        </div>

        {/* Branch dropdown */}
        <select
          value={branchFilter}
          onChange={(e) => { setBranchFilter(e.target.value); setPage(1); }}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold bg-white text-gray-700"
        >
          <option value="">All Branches</option>
          {branches.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>

        {/* Status dropdown */}
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value as 'all' | UserStatus); setPage(1); }}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold bg-white text-gray-700"
        >
          <option value="all">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>

        {/* Refresh */}
        <button
          type="button"
          onClick={() => void refetch()}
          className="p-2 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
          aria-label="Refresh"
        >
          <RefreshIcon />
        </button>
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Table header */}
        <div className="grid bg-gray-50 px-5 py-3 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wide"
          style={{ gridTemplateColumns: '2fr 1.2fr 1.5fr 1fr 1fr 1fr' }}>
          <span>Admin Name</span>
          <span>Branch Assigned</span>
          <span>Contact Information</span>
          <span>Account Status</span>
          <span>Created Date</span>
          <span>Actions</span>
        </div>

        {/* Rows */}
        {isLoading ? (
          <div className="px-5 py-12 text-center text-gray-400 text-sm">Loading admins...</div>
        ) : admins.length === 0 ? (
          <div className="px-5 py-12 text-center text-gray-400 text-sm">No admins found</div>
        ) : (
          admins.map((a) => (
            <AdminRow
              key={a.id}
              admin={a}
              onView={setViewAdmin}
              onEdit={setEditAdmin}
              onDelete={handleDelete}
              onToggle={handleToggle}
              isToggling={togglingId === a.id}
            />
          ))
        )}

        {/* Pagination */}
        {data && <Pagination page={page} total={data.total} limit={data.limit} onPageChange={setPage} />}
      </div>

      {/* ── Fixed Summary Footer ── */}
      <div className="fixed bottom-0 left-64 right-0 bg-white border-t border-gray-200 px-8 py-3 flex items-center gap-12 z-10">
        {/* Total Admins */}
        <div className="flex items-center gap-3">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide">Total Admins</p>
            <p className="text-lg font-bold text-gray-900 leading-tight">{totalCount}</p>
            <p className="text-xs text-green-600 font-medium">&#x2191; {addedThisMonth} added this month</p>
          </div>
        </div>

        <div className="w-px h-10 bg-gray-200" />

        {/* Active Sessions */}
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide">Active Sessions</p>
          <p className="text-lg font-bold text-gray-900 leading-tight">{activeCount}</p>
          <p className="text-xs text-gray-400">Across all branch locations</p>
        </div>

        <div className="w-px h-10 bg-gray-200" />

        {/* Pending Approvals */}
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide">Pending Approvals</p>
          <p className="text-lg font-bold text-gray-900 leading-tight">0</p>
          <p className="text-xs text-red-500 font-medium">! Requires super admin action</p>
        </div>
      </div>

      {/* ── Modals ── */}
      <AddAdminModal open={addOpen} onClose={() => setAddOpen(false)} />

      {viewAdmin && (
        <ViewAdminModal open onClose={() => setViewAdmin(null)} admin={viewAdmin} />
      )}

      {editAdmin && (
        <EditAdminModal open onClose={() => setEditAdmin(null)} admin={editAdmin} />
      )}
    </div>
  );
};

export default AdminsPage;
