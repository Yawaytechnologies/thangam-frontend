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
import type { DbTopPerformer } from '../../api/top-performers.api';

const KPI_CARDS = [
  { key: 'totalMembers', label: 'Total Members', icon: '👥', color: 'text-indigo-600 bg-indigo-50' },
  { key: 'activeMembers', label: 'Active Members', icon: '✅', color: 'text-green-600 bg-green-50' },
  { key: 'totalBranches', label: 'Total Branches', icon: '🏢', color: 'text-blue-600 bg-blue-50' },
  { key: 'activeBranches', label: 'Active Branches', icon: '🏬', color: 'text-teal-600 bg-teal-50' },
  { key: 'totalProperties', label: 'Total Properties', icon: '🏗️', color: 'text-purple-600 bg-purple-50' },
  { key: 'totalBookings', label: 'Total Bookings', icon: '📋', color: 'text-orange-600 bg-orange-50' },
] as const;

type StatsKey = typeof KPI_CARDS[number]['key'];

const MEMBER_ROLES = [
  'DIRECTOR', 'EXECUTIVE_DIRECTOR', 'DEPUTY_DIRECTOR',
  'SENIOR_MANAGER', 'BUSINESS_MANAGER', 'AGENT',
];

function PerformerCard({ performer, froze, onRemove }: {
  performer: DbTopPerformer;
  froze: boolean;
  onRemove: () => void;
}) {
  return (
    <div className={`flex-shrink-0 w-52 bg-white border rounded-xl p-4 shadow-sm ${froze ? 'border-amber-300 bg-amber-50' : 'border-gray-200'}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-bold">
          #{performer.rank}
        </div>
        {froze && (
          <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-medium">Frozen</span>
        )}
      </div>
      <p className="text-sm font-semibold text-gray-900 truncate">{performer.member.fullName}</p>
      <p className="text-xs text-gray-500 mt-0.5">{performer.role.replace(/_/g, ' ')}</p>
      {performer.member.branch && (
        <p className="text-xs text-gray-400 truncate">{performer.member.branch.name}</p>
      )}
      <div className="mt-2 pt-2 border-t border-gray-100 space-y-0.5 text-xs text-gray-500">
        <p>Tagged: <span className="font-semibold text-gray-800">{performer.taggedCount}</span></p>
        <p>Properties: <span className="font-semibold text-gray-800">{performer.propertiesCount}</span></p>
      </div>
      <button
        onClick={onRemove}
        className="mt-2 w-full text-xs py-1 rounded border border-red-200 text-red-600 hover:bg-red-50"
      >
        Remove
      </button>
    </div>
  );
}

function ManageTopPerformersModal({ open, onClose, froze }: {
  open: boolean;
  onClose: () => void;
  froze: boolean;
}) {
  const { data } = useTopPerformers();
  const { data: membersData } = useMembers({ limit: 100 });
  const createMutation = useCreateTopPerformer();
  const removeMutation = useRemoveTopPerformer();
  const reorderMutation = useReorderTopPerformers();
  const freezeMutation = useToggleFreeze();

  const [form, setForm] = useState({
    memberId: '',
    role: 'DIRECTOR',
    rank: 1,
    displayOrder: 0,
    taggedCount: 0,
    propertiesCount: 0,
  });

  const members = membersData?.data ?? [];
  const allItems: DbTopPerformer[] = (data?.performers ?? []).flatMap((g) => g.items);
  const sorted = [...allItems].sort((a, b) => a.displayOrder - b.displayOrder || a.rank - b.rank);

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!form.memberId) return;
    createMutation.mutate(
      {
        memberId: form.memberId,
        role: form.role,
        rank: form.rank,
        displayOrder: form.displayOrder,
        taggedCount: form.taggedCount,
        propertiesCount: form.propertiesCount,
      },
      { onSuccess: () => setForm({ memberId: '', role: 'DIRECTOR', rank: 1, displayOrder: 0, taggedCount: 0, propertiesCount: 0 }) },
    );
  }

  function handleMoveUp(index: number) {
    if (index === 0) return;
    const ids = sorted.map((p) => p.id);
    [ids[index - 1], ids[index]] = [ids[index], ids[index - 1]];
    reorderMutation.mutate({ orderedIds: ids });
  }

  function handleMoveDown(index: number) {
    if (index >= sorted.length - 1) return;
    const ids = sorted.map((p) => p.id);
    [ids[index], ids[index + 1]] = [ids[index + 1], ids[index]];
    reorderMutation.mutate({ orderedIds: ids });
  }

  return (
    <Modal open={open} onClose={onClose} title="Manage Top Performers" size="2xl">
      {/* Global freeze toggle */}
      <div className={`flex items-center justify-between rounded-lg p-3 mb-5 ${froze ? 'bg-amber-50 border border-amber-200' : 'bg-gray-50 border border-gray-200'}`}>
        <div>
          <p className="text-sm font-medium text-gray-800">Top Performers Display</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {froze ? 'Leaderboard is frozen — rankings are locked' : 'Leaderboard is live — rankings update normally'}
          </p>
        </div>
        <button
          onClick={() => freezeMutation.mutate(!froze)}
          disabled={freezeMutation.isPending}
          className={`px-3 py-1.5 text-sm font-medium rounded-lg disabled:opacity-50 ${
            froze
              ? 'bg-amber-600 text-white hover:bg-amber-700'
              : 'bg-gray-600 text-white hover:bg-gray-700'
          }`}
        >
          {freezeMutation.isPending ? '...' : froze ? 'Unfreeze' : 'Freeze'}
        </button>
      </div>

      {/* Add form */}
      <form onSubmit={handleAdd} className="bg-gray-50 rounded-lg p-4 mb-6 space-y-3">
        <p className="text-sm font-medium text-gray-700">Add Performer</p>
        <div className="grid grid-cols-2 gap-3">
          <select
            value={form.memberId}
            onChange={(e) => setForm((f) => ({ ...f, memberId: e.target.value }))}
            className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Select member</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>{m.fullName} ({m.role})</option>
            ))}
          </select>
          <select
            value={form.role}
            onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
            className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {MEMBER_ROLES.map((r) => (
              <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>
            ))}
          </select>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Rank</label>
            <input
              type="number"
              min={1}
              value={form.rank}
              onChange={(e) => setForm((f) => ({ ...f, rank: Number(e.target.value) }))}
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Display Order</label>
            <input
              type="number"
              min={0}
              value={form.displayOrder}
              onChange={(e) => setForm((f) => ({ ...f, displayOrder: Number(e.target.value) }))}
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Tagged Count</label>
            <input
              type="number"
              min={0}
              value={form.taggedCount}
              onChange={(e) => setForm((f) => ({ ...f, taggedCount: Number(e.target.value) }))}
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Properties Count</label>
            <input
              type="number"
              min={0}
              value={form.propertiesCount}
              onChange={(e) => setForm((f) => ({ ...f, propertiesCount: Number(e.target.value) }))}
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={createMutation.isPending || !form.memberId}
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
            <div key={p.id} className="flex items-center gap-3 p-3 rounded-lg border bg-white border-gray-200">
              <span className="text-gray-400 font-bold text-sm w-6 text-center">#{p.rank}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{p.member.fullName}</p>
                <p className="text-xs text-gray-500">
                  {p.role.replace(/_/g, ' ')}
                  {p.member.branch ? ` • ${p.member.branch.name}` : ''}
                </p>
              </div>
              <span className="text-xs text-gray-500">
                Tagged: {p.taggedCount} · Props: {p.propertiesCount}
              </span>
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
  const { data: topData } = useTopPerformers();
  const [manageOpen, setManageOpen] = useState(false);

  const statsRecord = stats as Record<StatsKey, number> | undefined;
  const froze = topData?.froze ?? false;
  const performerGroups = topData?.performers ?? [];

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
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-gray-900">Top Performers</h2>
            {froze && (
              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">Frozen</span>
            )}
          </div>
          <button
            onClick={() => setManageOpen(true)}
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Manage Top Performers
          </button>
        </div>

        {performerGroups.length === 0 ? (
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
            {performerGroups.map((group) => (
              group.items.length > 0 && (
                <div key={group.role}>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">{group.role.replace(/_/g, ' ')}</h3>
                  <div className="flex gap-4 overflow-x-auto pb-2">
                    {[...group.items].sort((a, b) => a.rank - b.rank).map((performer) => (
                      <PerformerCard
                        key={performer.id}
                        performer={performer}
                        froze={froze}
                        onRemove={() => {}}
                      />
                    ))}
                  </div>
                </div>
              )
            ))}
          </div>
        )}
      </div>

      <ManageTopPerformersModal open={manageOpen} onClose={() => setManageOpen(false)} froze={froze} />
    </div>
  );
};

export default SuperAdminDashboardPage;
