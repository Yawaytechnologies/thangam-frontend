import React, { useRef, useState } from 'react';
import { useBranches, useCreateBranch, useUpdateBranch, useUpdateBranchStatus } from '../../hooks/useBranches';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Modal } from '../../components/ui/Modal';
import type { CreateBranchData, UpdateBranchData } from '../../api/branches.api';
import type { Branch, BranchStatus } from '../../types';

// ─── Icons ───────────────────────────────────────────────────────────────────

const PinIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
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

const BuildingIcon = () => (
  <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);

const UploadIcon = () => (
  <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
  </svg>
);

const PhoneIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 7V5z" />
  </svg>
);

// ─── Shared input style helpers ───────────────────────────────────────────────

const inputClass =
  'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold bg-white';
const labelClass = 'block text-xs font-medium text-gray-600 mb-1';

// ─── Branch location helper ───────────────────────────────────────────────────

function branchLocation(b: Branch): string {
  return [b.city, b.state].filter(Boolean).join(', ') || '—';
}

// ─── CreateBranchModal ────────────────────────────────────────────────────────

interface CreateBranchModalProps {
  open: boolean;
  onClose: () => void;
}

function CreateBranchModal({ open, onClose }: CreateBranchModalProps) {
  const create = useCreateBranch();
  const [form, setForm] = useState<CreateBranchData>({ name: '' });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    create.mutate(form, {
      onSuccess: () => {
        onClose();
        setForm({ name: '' });
      },
    });
  }

  function field<K extends keyof CreateBranchData>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value || undefined }));
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create New Branch"
      subtitle="Add a new regional branch to the organisation."
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Branch Name — full width */}
        <div>
          <label className={labelClass}>Branch Name *</label>
          <input
            type="text"
            required
            placeholder="e.g. Chennai North Branch"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className={inputClass}
          />
        </div>

        {/* Branch Type + Phone */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Branch Type</label>
            <select
              value={form.branchType ?? ''}
              onChange={(e) => field('branchType', e.target.value)}
              className={inputClass}
            >
              <option value="">Select type</option>
              <option value="Main Branch">Main Branch</option>
              <option value="Sub Branch">Sub Branch</option>
              <option value="Regional Office">Regional Office</option>
              <option value="City Office">City Office</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Phone Number</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <PhoneIcon />
              </span>
              <input
                type="tel"
                placeholder="+91 98765 43210"
                value={form.phone ?? ''}
                onChange={(e) => field('phone', e.target.value)}
                className={`${inputClass} pl-9`}
              />
            </div>
          </div>
        </div>

        {/* Location Address */}
        <div>
          <label className={labelClass}>Location Address</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <PinIcon />
            </span>
            <input
              type="text"
              placeholder="Street address"
              value={form.address ?? ''}
              onChange={(e) => field('address', e.target.value)}
              className={`${inputClass} pl-9`}
            />
          </div>
        </div>

        {/* City / District / State / Pincode */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>City</label>
            <input
              type="text"
              placeholder="Chennai"
              value={form.city ?? ''}
              onChange={(e) => field('city', e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>District</label>
            <input
              type="text"
              placeholder="Chennai"
              value={form.district ?? ''}
              onChange={(e) => field('district', e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>State</label>
            <input
              type="text"
              placeholder="Tamil Nadu"
              value={form.state ?? ''}
              onChange={(e) => field('state', e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Pincode</label>
            <input
              type="text"
              placeholder="600001"
              value={form.pincode ?? ''}
              onChange={(e) => field('pincode', e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        {/* Image upload placeholder */}
        <div>
          <label className={labelClass}>Branch Image</label>
          <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-gold transition-colors bg-gray-50">
            <UploadIcon />
            <p className="text-sm font-medium text-gray-600">Click to upload or drag &amp; drop</p>
            <p className="text-xs text-gray-400">PNG, JPG up to 10MB</p>
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
            {create.isPending ? 'Submitting...' : 'Submit Branch'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ─── EditBranchModal ──────────────────────────────────────────────────────────

interface EditBranchModalProps {
  open: boolean;
  onClose: () => void;
  branch: Branch;
}

function EditBranchModal({ open, onClose, branch }: EditBranchModalProps) {
  const update = useUpdateBranch();
  const [form, setForm] = useState<UpdateBranchData>({
    name: branch.name,
    branchType: branch.branchType,
    phone: branch.phone,
    address: branch.address,
    city: branch.city,
    district: branch.district,
    state: branch.state,
    pincode: branch.pincode,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    update.mutate({ id: branch.id, data: form }, { onSuccess: onClose });
  }

  function field<K extends keyof UpdateBranchData>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value || undefined }));
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit Branch"
      subtitle="Update the details for this regional branch."
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={labelClass}>Branch Name *</label>
          <input
            type="text"
            required
            value={form.name ?? ''}
            onChange={(e) => field('name', e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Branch Type</label>
            <select
              value={form.branchType ?? ''}
              onChange={(e) => field('branchType', e.target.value)}
              className={inputClass}
            >
              <option value="">Select type</option>
              <option value="Main Branch">Main Branch</option>
              <option value="Sub Branch">Sub Branch</option>
              <option value="Regional Office">Regional Office</option>
              <option value="City Office">City Office</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Phone Number</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <PhoneIcon />
              </span>
              <input
                type="tel"
                value={form.phone ?? ''}
                onChange={(e) => field('phone', e.target.value)}
                className={`${inputClass} pl-9`}
              />
            </div>
          </div>
        </div>

        <div>
          <label className={labelClass}>Location Address</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <PinIcon />
            </span>
            <input
              type="text"
              value={form.address ?? ''}
              onChange={(e) => field('address', e.target.value)}
              className={`${inputClass} pl-9`}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>City</label>
            <input type="text" value={form.city ?? ''} onChange={(e) => field('city', e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>District</label>
            <input type="text" value={form.district ?? ''} onChange={(e) => field('district', e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>State</label>
            <input type="text" value={form.state ?? ''} onChange={(e) => field('state', e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Pincode</label>
            <input type="text" value={form.pincode ?? ''} onChange={(e) => field('pincode', e.target.value)} className={inputClass} />
          </div>
        </div>

        <div>
          <label className={labelClass}>Branch Image</label>
          <div
            className="border-2 border-dashed border-gray-200 rounded-xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-gold transition-colors bg-gray-50"
            onClick={() => imageInputRef.current?.click()}
          >
            <input
              type="file"
              accept="image/*"
              ref={imageInputRef}
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) setImageFile(file);
              }}
            />
            <UploadIcon />
            <p className="text-sm font-medium text-gray-600">
              {imageFile ? 'Replace selected branch image' : 'Choose a new branch image'}
            </p>
            <p className="text-xs text-gray-400">PNG, JPG up to 10MB</p>
            {imageFile && <p className="text-xs text-gray-500">{imageFile.name}</p>}
            <button
              type="button"
              className="mt-2 text-sm text-gold font-semibold"
              onClick={(e) => {
                e.stopPropagation();
                imageInputRef.current?.click();
              }}
            >
              Select Image
            </button>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 text-sm">
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

// ─── ViewBranchModal ──────────────────────────────────────────────────────────

interface ViewBranchModalProps {
  open: boolean;
  onClose: () => void;
  branch: Branch;
}

function ViewBranchModal({ open, onClose, branch }: ViewBranchModalProps) {

  return (
    <Modal open={open} onClose={onClose} title="Branch Details" size="xl">
      {/* Hero */}
      <div className="rounded-xl overflow-hidden relative h-48 bg-gray-800 mb-6 flex items-end">
        <div className="absolute inset-0 flex items-center justify-center">
          <BuildingIcon />
        </div>
        <div className="absolute inset-0 bg-linear-to-t from-black/70 to-transparent" />
        <div className="relative z-10 p-4 w-full flex items-end justify-between">
          <div>
            <h3 className="text-xl font-bold text-white">{branch.name}</h3>
            <p className="text-sm text-gray-300 flex items-center gap-1 mt-0.5">
              <PinIcon />
              {branchLocation(branch)}
            </p>
          </div>
          <StatusBadge status={branch.status} />
        </div>
      </div>

      {/* Two-column sections */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Branch Overview */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-800 border-b border-gray-100 pb-2">Branch Overview</h4>
          {[
            { label: 'Official Name', value: branch.name },
            { label: 'Branch Code', value: branch.branchCode },
            { label: 'Registered Phone', value: branch.phone ?? '—' },
            { label: 'Email', value: branch.email ?? '—' },
            { label: 'City', value: branch.city ?? '—' },
            { label: 'State', value: branch.state ?? '—' },
            { label: 'Established', value: new Date(branch.createdAt).toLocaleDateString('en-IN') },
            { label: 'Operational Status', value: <StatusBadge status={branch.status} /> },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between items-center">
              <span className="text-xs text-gray-500 uppercase tracking-wide">{label}</span>
              <span className="text-xs font-medium text-gray-800">{value}</span>
            </div>
          ))}
        </div>

        {/* Additional details */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-800 border-b border-gray-100 pb-2">Location Details</h4>
          {[
            { label: 'Address', value: branch.address ?? '—' },
            { label: 'District', value: branch.district ?? '—' },
            { label: 'Pincode', value: branch.pincode ?? '—' },
            { label: 'Branch Type', value: branch.branchType ?? '—' },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between items-center">
              <span className="text-xs text-gray-500 uppercase tracking-wide">{label}</span>
              <span className="text-xs font-medium text-gray-800">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
        <button
          type="button"
          onClick={onClose}
          className="bg-gold text-navy font-semibold px-4 py-2 rounded-lg hover:opacity-90 text-sm"
        >
          Close
        </button>
      </div>
    </Modal>
  );
}

// ─── BranchCard ───────────────────────────────────────────────────────────────

interface BranchCardProps {
  branch: Branch;
  onView: (b: Branch) => void;
  onEdit: (b: Branch) => void;
  onDelete: (b: Branch) => void;
}

function BranchCard({ branch, onView, onEdit, onDelete }: BranchCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
      {/* Image area */}
      <div className="h-40 bg-gray-200 relative flex items-center justify-center">
        <BuildingIcon />
        {/* Status badge overlay */}
        <div className="absolute top-3 right-3">
          <StatusBadge status={branch.status} />
        </div>
      </div>

      {/* Card body */}
      <div className="p-4 flex-1">
        <h3 className="font-semibold text-gray-900 text-sm mb-1 truncate">{branch.name}</h3>
        <p className="text-xs text-gray-500 flex items-center gap-1 mb-3">
          <PinIcon />
          <span className="truncate">{branchLocation(branch)}</span>
        </p>

        {/* 2-col stats */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-gray-50 rounded-lg p-2">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Manager</p>
            <p className="text-xs font-medium text-gray-700 truncate">{branch.email ?? '—'}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-2">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Members</p>
            <p className="text-xs font-medium text-gray-700">{branch._count?.members ?? 0}</p>
          </div>
        </div>
      </div>

      {/* Card footer */}
      <div className="border-t border-gray-100 px-4 pt-3 pb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => onView(branch)}
          className="text-xs font-semibold text-gold hover:opacity-80 transition-opacity"
        >
          View Details
        </button>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onEdit(branch)}
            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
            aria-label="Edit branch"
          >
            <PencilIcon />
          </button>
          <button
            type="button"
            onClick={() => onDelete(branch)}
            className="p-1.5 rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
            aria-label="Delete branch"
          >
            <TrashIcon />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Filter tab types ─────────────────────────────────────────────────────────

type FilterTab = 'all' | BranchStatus;

const filterTabs: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'All Branches' },
  { key: 'ACTIVE', label: 'Active' },
  { key: 'INACTIVE', label: 'Inactive' },
];

// ─── BranchesPage ─────────────────────────────────────────────────────────────

const BranchesPage: React.FC = () => {
  const { data: branchesPage, isLoading } = useBranches();
  const updateBranchStatus = useUpdateBranchStatus();
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [viewBranch, setViewBranch] = useState<Branch | null>(null);
  const [editBranch, setEditBranch] = useState<Branch | null>(null);

  const branches = branchesPage?.data ?? [];

  const filtered = activeFilter === 'all'
    ? branches
    : branches.filter((b) => b.status === activeFilter);

  const activeCount = branches.filter((b) => b.status === 'ACTIVE').length;

  function handleDelete(b: Branch) {
    if (b.status === 'INACTIVE') {
      alert(`Branch "${b.name}" is already inactive.`);
      return;
    }
    if (window.confirm(`Deactivate branch "${b.name}"? Members and admins will lose access.`)) {
      updateBranchStatus.mutate({ id: b.id, status: 'INACTIVE' });
    }
  }

  return (
    <div className="p-6">
      {/* Page header */}
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Branch Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage and monitor {activeCount} active regional branch{activeCount !== 1 ? 'es' : ''}
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Filter tabs */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1 gap-1">
            {filterTabs.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setActiveFilter(key)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  activeFilter === key
                    ? 'bg-gold text-navy shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Add Branch button */}
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="bg-gold text-navy font-semibold px-4 py-2 rounded-lg hover:opacity-90 text-sm"
          >
            + Add Branch
          </button>
        </div>
      </div>

      {/* Branch card grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden animate-pulse">
              <div className="h-40 bg-gray-100" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-gray-100 rounded w-3/4" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
                <div className="h-12 bg-gray-100 rounded mt-3" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <BuildingIcon />
          </div>
          <p className="text-gray-600 font-medium">No branches found</p>
          <p className="text-sm text-gray-400 mt-1">
            {activeFilter === 'all' ? 'Create your first branch to get started.' : `No ${activeFilter.toLowerCase()} branches.`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((b) => (
            <BranchCard
              key={b.id}
              branch={b}
              onView={setViewBranch}
              onEdit={setEditBranch}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <CreateBranchModal open={createOpen} onClose={() => setCreateOpen(false)} />

      {viewBranch && (
        <ViewBranchModal
          open
          onClose={() => setViewBranch(null)}
          branch={viewBranch}
        />
      )}

      {editBranch && (
        <EditBranchModal
          open
          onClose={() => setEditBranch(null)}
          branch={editBranch}
        />
      )}
    </div>
  );
};

export default BranchesPage;
