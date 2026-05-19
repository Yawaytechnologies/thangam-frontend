import React, { useState } from 'react';
import { useSuperAdminStats } from '../../hooks/useDashboard';
import {
  useTopPerformers,
  useCreateTopPerformer,
  useRemoveTopPerformer,
  useReorderTopPerformers,
  useToggleFreeze,
} from '../../hooks/useTopPerformers';
import { useMembers } from '../../hooks/useMembers';
import { Modal } from '../../components/ui/Modal';
import type { TopPerformer } from '../../api/top-performers.api';

const KPI_CARDS = [
  { key: 'totalMembers', label: 'Total Members', icon: '👥', color: 'text-indigo-600 bg-indigo-50' },
  { key: 'activeMembers', label: 'Active Members', icon: '✅', color: 'text-green-600 bg-green-50' },
  { key: 'totalBranches', label: 'Total Branches', icon: '🏢', color: 'text-blue-600 bg-blue-50' },
  { key: 'activeBranches', label: 'Active Branches', icon: '🏬', color: 'text-teal-600 bg-teal-50' },
  { key: 'totalProperties', label: 'Total Properties', icon: '🏗️', color: 'text-purple-600 bg-purple-50' },
  { key: 'totalBookings', label: 'Total Bookings', icon: '📋', color: 'text-orange-600 bg-orange-50' },
] as const;

type StatsKey = typeof KPI_CARDS[number]['key'];

const ROLE_GROUPS = [
  { label: 'Directors', roles: ['DIRECTOR'] },
  { label: 'Executive Directors', roles: ['EXECUTIVE_DIRECTOR'] },
  { label: 'Deputy Directors', roles: ['DEPUTY_DIRECTOR'] },
  { label: 'Senior Managers', roles: ['SENIOR_MANAGER'] },
];

function PerformerCard({ performer, onRemove, onFreeze }: {
  performer: TopPerformer;
  onRemove: () => void;
  onFreeze: () => void;
}) {
  return (
    <div className={`flex-shrink-0 w-52 bg-white border rounded-xl p-4 shadow-sm ${performer.isFrozen ? 'border-amber-300 bg-amber-50' : 'border-gray-200'}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-bold">
          #{performer.rank}
        </div>
        {performer.isFrozen && (
          <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-medium">Frozen</span>
        )}
      </div>
      <p className="text-sm font-semibold text-gray-900 truncate">{performer.memberName}</p>
      <p className="text-xs text-gray-500 mt-0.5">{performer.role.replace(/_/g, ' ')}</p>
      {performer.branchName && (
        <p className="text-xs text-gray-400 truncate">{performer.branchName}</p>
      )}
      <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between">
        <span className="text-xs text-gray-500">{performer.metric}</span>
        <span className="text-sm font-bold text-indigo-600">{performer.value}</span>
      </div>
      <div className="mt-2 flex gap-1">
        <button
          onClick={onFreeze}
          className="flex-1 text-xs py-1 rounded border border-gray-200 text-gray-600 hover:bg-gray-50"
        >
          {performer.isFrozen ? 'Unfreeze' : 'Freeze'}
        </button>
        <button
          onClick={onRemove}
          className="flex-1 text-xs py-1 rounded border border-red-200 text-red-600 hover:bg-red-50"
        >
          Remove
        </button>
      </div>
    </div>
  );
}

function ManageTopPerformersModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data: performers = [] } = useTopPerformers();
  const { data: membersData } = useMembers({ limit: 100 });
  const createMutation = useCreateTopPerformer();
  const removeMutation = useRemoveTopPerformer();
  const reorderMutation = useReorderTopPerformers();
  const freezeMutation = useToggleFreeze();

  const [form, setForm] = useState({ memberId: '', metric: 'tagged_count', value: '' });

  const members = membersData?.data ?? [];

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!form.memberId || !form.value) return;
    createMutation.mutate(
      { memberId: form.memberId, metric: form.metric, value: Number(form.value) },
      { onSuccess: () => setForm({ memberId: '', metric: 'tagged_count', value: '' }) }
    );
  }

  function handleMoveUp(index: number) {
    if (index === 0) return;
    const sorted = [...performers].sort((a, b) => a.rank - b.rank);
    const ids = sorted.map((p) => p.id);
    [ids[index - 1], ids[index]] = [ids[index], ids[index - 1]];
    reorderMutation.mutate({ orderedIds: ids });
  }

  function handleMoveDown(index: number) {
    const sorted = [...performers].sort((a, b) => a.rank - b.rank);
    if (index >= sorted.length - 1) return;
    const ids = sorted.map((p) => p.id);
    [ids[index], ids[index + 1]] = [ids[index + 1], ids[index]];
    reorderMutation.mutate({ orderedIds: ids });
  }

  const sorted = [...performers].sort((a, b) => a.rank - b.rank);

  return (
    <Modal open={open} onClose={onClose} title="Manage Top Performers" size="2xl">
      {/* Add form */}
      <form onSubmit={handleAdd} className="bg-gray-50 rounded-lg p-4 mb-6 space-y-3">
        <p className="text-sm font-medium text-gray-700">Add Performer</p>
        <div className="grid grid-cols-3 gap-3">
          <select
            value={form.memberId}
            onChange={(e) => setForm((f) => ({ ...f, memberId: e.target.value }))}
            className="col-span-1 text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Select member</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>{m.fullName} ({m.role})</option>
            ))}
          </select>
          <select
            value={form.metric}
            onChange={(e) => setForm((f) => ({ ...f, metric: e.target.value }))}
            className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="tagged_count">Tagged Count</option>
            <option value="properties_count">Properties</option>
            <option value="revenue">Revenue</option>
          </select>
          <input
            type="number"
            value={form.value}
            onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
            placeholder="Value"
            className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <button
          type="submit"
          disabled={createMutation.isPending || !form.memberId || !form.value}
          className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-50"
        >
          {createMutation.isPending ? 'Adding...' : 'Add Performer'}
        </button>
      </form>

      {/* List */}
      <div className="space-y-2">
        {sorted.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">No top performers added yet.</p>
        ) : (
          sorted.map((p, idx) => (
            <div key={p.id} className={`flex items-center gap-3 p-3 rounded-lg border ${p.isFrozen ? 'bg-amber-50 border-amber-200' : 'bg-white border-gray-200'}`}>
              <span className="text-gray-400 font-bold text-sm w-6 text-center">#{p.rank}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{p.memberName}</p>
                <p className="text-xs text-gray-500">{p.role.replace(/_/g, ' ')} {p.branchName ? `• ${p.branchName}` : ''}</p>
              </div>
              <span className="text-sm font-bold text-indigo-600">{p.metric}: {p.value}</span>
              {p.isFrozen && <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">Frozen</span>}
              <div className="flex gap-1">
                <button onClick={() => handleMoveUp(idx)} disabled={idx === 0} className="p-1 rounded hover:bg-gray-100 text-gray-500 disabled:opacity-30">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                </button>
                <button onClick={() => handleMoveDown(idx)} disabled={idx === sorted.length - 1} className="p-1 rounded hover:bg-gray-100 text-gray-500 disabled:opacity-30">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <button
                  onClick={() => freezeMutation.mutate(p.id)}
                  className="px-2 py-1 text-xs rounded border border-gray-200 text-gray-600 hover:bg-gray-50"
                >
                  {p.isFrozen ? 'Unfreeze' : 'Freeze'}
                </button>
                <button
                  onClick={() => removeMutation.mutate(p.id)}
                  className="px-2 py-1 text-xs rounded border border-red-200 text-red-600 hover:bg-red-50"
                >
                  Remove
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </Modal>
  );
}

const SuperAdminDashboardPage: React.FC = () => {
  const { data: stats, isLoading } = useSuperAdminStats();
  const { data: performers = [] } = useTopPerformers();
  const [manageOpen, setManageOpen] = useState(false);

  const statsRecord = stats as Record<StatsKey, number> | undefined;

  const performersByRole = ROLE_GROUPS.map((group) => ({
    ...group,
    items: performers
      .filter((p) => group.roles.includes(p.role))
      .sort((a, b) => a.rank - b.rank),
  }));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Welcome back, Super Admin</p>
        </div>
      </div>

      {/* KPI Cards */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {KPI_CARDS.map((c) => (
            <div key={c.key} className="bg-white rounded-xl border border-gray-200 p-4 h-20 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {KPI_CARDS.map((card) => {
            const value = statsRecord?.[card.key] ?? 0;
            return (
              <div key={card.key} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{card.label}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{value.toLocaleString('en-IN')}</p>
                  </div>
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl ${card.color}`}>
                    {card.icon}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Top Performers */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Top Performers</h2>
          <button
            onClick={() => setManageOpen(true)}
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Manage Top Performers
          </button>
        </div>

        {performers.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
            <p className="text-gray-500 text-sm">No top performers configured yet.</p>
            <button
              onClick={() => setManageOpen(true)}
              className="mt-3 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Add performers
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {performersByRole.map((group) => (
              group.items.length > 0 && (
                <div key={group.label}>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">{group.label}</h3>
                  <div className="flex gap-4 overflow-x-auto pb-2">
                    {group.items.map((performer) => (
                      <PerformerCard
                        key={performer.id}
                        performer={performer}
                        onRemove={() => {}}
                        onFreeze={() => {}}
                      />
                    ))}
                  </div>
                </div>
              )
            ))}
          </div>
        )}
      </div>

      <ManageTopPerformersModal open={manageOpen} onClose={() => setManageOpen(false)} />
    </div>
  );
};

export default SuperAdminDashboardPage;
