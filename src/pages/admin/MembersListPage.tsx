import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMembers, useMember, useUpdateMemberStatus } from '../../hooks/useMembers';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Modal } from '../../components/ui/Modal';
import { Pagination } from '../../components/ui/Pagination';
import { SearchInput } from '../../components/ui/SearchInput';
import type { Member, Role, UserStatus } from '../../types';

function MemberDetailModal({ member, onClose }: { member: Member; onClose: () => void }) {
  const { data } = useMember(member.id);
  const updateStatus = useUpdateMemberStatus();
  const m = data ?? member;

  return (
    <Modal open onClose={onClose} title="Member Details" size="lg">
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
            <span className="text-blue-700 font-bold text-xl">{m.fullName.charAt(0).toUpperCase()}</span>
          </div>
          <div>
            <p className="text-lg font-bold text-gray-900">{m.fullName}</p>
            <p className="text-sm text-gray-500 font-mono">{m.memberId}</p>
            <div className="mt-1"><StatusBadge status={m.status} /></div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          {([
            ['Phone', m.phone],
            ['Email', m.email ?? '—'],
            ['Role', m.role.replace(/_/g, ' ')],
            ['Branch', m.branch?.name ?? '—'],
            ['Code', m.codeNumber ?? '—'],
            ['Reports To', m.reportsTo?.fullName ?? '—'],
            ['Joined', new Date(m.createdAt).toLocaleDateString('en-IN')],
          ] as [string, string][]).map(([label, val]) => (
            <div key={label}>
              <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">{label}</p>
              <p className="text-gray-800 font-medium mt-0.5">{val}</p>
            </div>
          ))}
        </div>
        <div className="pt-3 border-t border-gray-100 flex gap-2 justify-end">
          {m.status !== 'ACTIVE' && (
            <button
              onClick={() => updateStatus.mutate({ id: m.id, status: 'ACTIVE' }, { onSuccess: onClose })}
              disabled={updateStatus.isPending}
              className="px-4 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium"
            >
              Activate
            </button>
          )}
          {m.status !== 'INACTIVE' && (
            <button
              onClick={() => updateStatus.mutate({ id: m.id, status: 'INACTIVE' }, { onSuccess: onClose })}
              disabled={updateStatus.isPending}
              className="px-4 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium"
            >
              Deactivate
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}

const AdminMembersListPage: React.FC = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState<Role | ''>('');
  const [status, setStatus] = useState<UserStatus | ''>('');
  const [selected, setSelected] = useState<Member | null>(null);

  const { data, isLoading } = useMembers({
    page,
    limit: 20,
    search: search || undefined,
    role: role || undefined,
    status: status || undefined,
  });

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Members</h1>
          <p className="text-sm text-gray-500 mt-0.5">Branch member directory</p>
        </div>
        <button
          onClick={() => navigate('/admin/add-member')}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Member
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        {/* Filters */}
        <div className="p-4 border-b border-gray-200 flex flex-wrap gap-3">
          <SearchInput
            value={search}
            onChange={(v) => { setSearch(v); setPage(1); }}
            placeholder="Search by name, ID, phone, code..."
            className="w-72"
          />
          <select
            value={role}
            onChange={(e) => { setRole(e.target.value as Role | ''); setPage(1); }}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Roles</option>
            <option value="DIRECTOR">Director</option>
            <option value="EXECUTIVE_DIRECTOR">Executive Director</option>
            <option value="DEPUTY_DIRECTOR">Deputy Director</option>
            <option value="SENIOR_MANAGER">Senior Manager</option>
            <option value="BUSINESS_MANAGER">Business Manager</option>
            <option value="AGENT">Agent</option>
          </select>
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value as UserStatus | ''); setPage(1); }}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="PENDING">Pending</option>
          </select>
          {(search || role || status) && (
            <button
              onClick={() => { setSearch(''); setRole(''); setStatus(''); setPage(1); }}
              className="px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Clear
            </button>
          )}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Profile</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Member ID</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Phone</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Role</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Reports To</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Joined Date</th>
                <th className="px-4 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center">
                    <div className="flex items-center justify-center gap-2 text-gray-400">
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      <span>Loading members...</span>
                    </div>
                  </td>
                </tr>
              ) : !data?.data?.length ? (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-gray-400">
                    No members found
                  </td>
                </tr>
              ) : (
                data.data.map((m) => (
                  <tr key={m.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-700 font-semibold text-xs">
                          {m.fullName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{m.memberId}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{m.fullName}</td>
                    <td className="px-4 py-3 text-gray-600">{m.phone}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 uppercase tracking-wide">
                        {m.role.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{m.reportsTo?.fullName ?? '—'}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={m.status} />
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(m.createdAt).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setSelected(m)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                        title="View Details"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && (
          <Pagination page={page} total={data.total} limit={data.limit} onPageChange={setPage} />
        )}
      </div>

      {selected && <MemberDetailModal member={selected} onClose={() => setSelected(null)} />}
    </div>
  );
};

export default AdminMembersListPage;
