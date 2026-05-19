import React, { useState } from 'react';
import { useMembers, useUpdateMemberStatus, useUpdateMember, useCreateMember } from '../../hooks/useMembers';
import { useBranches } from '../../hooks/useBranches';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Pagination } from '../../components/ui/Pagination';
import { Modal } from '../../components/ui/Modal';
import { SearchInput } from '../../components/ui/SearchInput';
import type { Member, Role, UserStatus } from '../../types';
import type { UpdateMemberData, CreateMemberData } from '../../api/members.api';

const ROLES: Role[] = ['DIRECTOR', 'EXECUTIVE_DIRECTOR', 'DEPUTY_DIRECTOR', 'SENIOR_MANAGER', 'BUSINESS_MANAGER', 'AGENT'];

function MemberAvatar({ name }: { name: string }) {
  const initials = name.split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('');
  return (
    <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-semibold text-sm flex-shrink-0">
      {initials}
    </div>
  );
}

function MemberOverviewModal({ member, open, onClose }: { member: Member | null; open: boolean; onClose: () => void }) {
  if (!member) return null;
  const fields: { label: string; value: string | undefined }[] = [
    { label: 'Member ID', value: member.memberId },
    { label: 'Full Name', value: member.fullName },
    { label: 'Phone', value: member.phone },
    { label: 'Email', value: member.email || '—' },
    { label: 'Role', value: member.role.replace(/_/g, ' ') },
    { label: 'Branch', value: member.branch?.name || '—' },
    { label: 'Code Number', value: member.codeNumber || '—' },
    { label: 'Reports To', value: member.reportsTo?.fullName || '—' },
    { label: 'Status', value: member.status },
    { label: 'Created At', value: new Date(member.createdAt).toLocaleDateString('en-IN') },
  ];

  return (
    <Modal open={open} onClose={onClose} title="Member Overview" size="lg">
      <div className="flex items-center gap-4 mb-6 pb-4 border-b border-gray-100">
        <MemberAvatar name={member.fullName} />
        <div>
          <p className="font-semibold text-gray-900">{member.fullName}</p>
          <p className="text-sm text-gray-500">{member.memberId}</p>
        </div>
        <StatusBadge status={member.status} className="ml-auto" />
      </div>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-4">
        {fields.map((f) => (
          <div key={f.label}>
            <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">{f.label}</dt>
            <dd className="mt-0.5 text-sm text-gray-900">{f.value}</dd>
          </div>
        ))}
      </dl>
    </Modal>
  );
}

function EditMemberModal({ member, open, onClose }: { member: Member | null; open: boolean; onClose: () => void }) {
  const updateMutation = useUpdateMember();
  const { data: branchesData } = useBranches();
  const branches = branchesData?.data ?? [];

  const [form, setForm] = useState<UpdateMemberData>({});

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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    updateMutation.mutate(
      { id: member!.id, data: form },
      { onSuccess: () => onClose() }
    );
  }

  return (
    <Modal open={open} onClose={onClose} title="Edit Member" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Full Name</label>
            <input
              type="text"
              value={form.fullName ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Phone</label>
            <input
              type="tel"
              value={form.phone ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={form.email ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Role</label>
            <select
              value={form.role ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as Role }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Branch</label>
            <select
              value={form.branchId ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, branchId: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select branch</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Code Number</label>
            <input
              type="text"
              value={form.codeNumber ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, codeNumber: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
            Cancel
          </button>
          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function CreateMemberModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const createMutation = useCreateMember();
  const { data: branchesData } = useBranches();
  const branches = branchesData?.data ?? [];
  const [form, setForm] = useState<CreateMemberData>({
    fullName: '', phone: '', role: 'AGENT', branchId: '', password: '',
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    createMutation.mutate(form, { onSuccess: () => { onClose(); setForm({ fullName: '', phone: '', role: 'AGENT', branchId: '', password: '' }); } });
  }

  return (
    <Modal open={open} onClose={onClose} title="Create Member" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {([
            { key: 'fullName', label: 'Full Name', type: 'text', required: true },
            { key: 'phone', label: 'Phone', type: 'tel', required: true },
            { key: 'email', label: 'Email', type: 'email' },
            { key: 'codeNumber', label: 'Code Number', type: 'text' },
            { key: 'password', label: 'Password', type: 'password', required: true },
          ] as Array<{ key: keyof CreateMemberData; label: string; type: string; required?: boolean }>).map(({ key, label, type, required }) => (
            <div key={key}>
              <label className="block text-xs font-medium text-gray-700 mb-1">{label}{required && ' *'}</label>
              <input
                type={type}
                required={required}
                value={(form[key] as string) ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          ))}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Role *</label>
            <select
              required
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as Role }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {ROLES.map((r) => <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Branch *</label>
            <select
              required
              value={form.branchId}
              onChange={(e) => setForm((f) => ({ ...f, branchId: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select branch</option>
              {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Cancel</button>
          <button type="submit" disabled={createMutation.isPending} className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
            {createMutation.isPending ? 'Creating...' : 'Create Member'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function DeactivateConfirmModal({ member, open, onClose }: { member: Member | null; open: boolean; onClose: () => void }) {
  const updateStatus = useUpdateMemberStatus();
  if (!member) return null;

  const isActive = member.status === 'ACTIVE';
  const newStatus: UserStatus = isActive ? 'INACTIVE' : 'ACTIVE';

  return (
    <Modal open={open} onClose={onClose} title={isActive ? 'Deactivate Member' : 'Activate Member'} size="sm">
      <p className="text-sm text-gray-600 mb-6">
        {isActive
          ? `Are you sure you want to deactivate ${member.fullName}? They will lose access to the system.`
          : `Are you sure you want to activate ${member.fullName}?`}
      </p>
      <div className="flex justify-end gap-2">
        <button onClick={onClose} className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
          Cancel
        </button>
        <button
          onClick={() => updateStatus.mutate({ id: member.id, status: newStatus }, { onSuccess: () => onClose() })}
          disabled={updateStatus.isPending}
          className={`px-4 py-2 text-sm rounded-lg text-white disabled:opacity-50 ${isActive ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
        >
          {updateStatus.isPending ? 'Updating...' : isActive ? 'Deactivate' : 'Activate'}
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
  const [createOpen, setCreateOpen] = useState(false);
  const [viewMember, setViewMember] = useState<Member | null>(null);
  const [editMember, setEditMember] = useState<Member | null>(null);
  const [deactivateMember, setDeactivateMember] = useState<Member | null>(null);

  const { data, isLoading } = useMembers({
    page, limit: 10, search: search || undefined,
    role: (role as Role) || undefined,
    status: (status as UserStatus) || undefined,
  });

  const members = data?.data ?? [];
  const total = data?.total ?? 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Members</h1>
        <button
          onClick={() => setCreateOpen(true)}
          className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
        >
          + Add Member
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 bg-white border border-gray-200 rounded-xl p-4">
        <SearchInput
          value={search}
          onChange={(v) => { setSearch(v); setPage(1); }}
          placeholder="Search members..."
          className="w-56"
        />
        <select
          value={role}
          onChange={(e) => { setRole(e.target.value); setPage(1); }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Roles</option>
          {ROLES.map((r) => <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>)}
        </select>
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
          <option value="PENDING">Pending</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Member</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">ID</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Phone</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Role</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Branch</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
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
                  <td colSpan={7} className="px-4 py-10 text-center text-gray-500 text-sm">
                    No members found.
                  </td>
                </tr>
              ) : (
                members.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <MemberAvatar name={member.fullName} />
                        <span className="font-medium text-gray-900">{member.fullName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 font-mono text-xs">{member.memberId}</td>
                    <td className="px-4 py-3 text-gray-600">{member.phone}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">
                        {member.role.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{member.branch?.name ?? '—'}</td>
                    <td className="px-4 py-3"><StatusBadge status={member.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => setViewMember(member)}
                          className="px-2.5 py-1.5 text-xs text-gray-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors"
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
                          {member.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Pagination page={page} total={total} limit={10} onPageChange={setPage} />
      </div>

      <CreateMemberModal open={createOpen} onClose={() => setCreateOpen(false)} />
      <MemberOverviewModal member={viewMember} open={!!viewMember} onClose={() => setViewMember(null)} />
      <EditMemberModal member={editMember} open={!!editMember} onClose={() => setEditMember(null)} />
      <DeactivateConfirmModal member={deactivateMember} open={!!deactivateMember} onClose={() => setDeactivateMember(null)} />
    </div>
  );
};

export default MembersPage;
