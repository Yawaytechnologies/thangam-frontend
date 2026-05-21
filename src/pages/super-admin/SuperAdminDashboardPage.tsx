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

const MEMBER_ROLES = [
  'DIRECTOR', 'EXECUTIVE_DIRECTOR', 'DEPUTY_DIRECTOR',
  'SENIOR_MANAGER', 'BUSINESS_MANAGER', 'AGENT',
];

// ─── SVG Icons ───────────────────────────────────────────────────────────────

function IconUsers() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function IconCalendar() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

function IconHouse() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  );
}

function IconBranch() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  );
}

function IconActivity() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );
}

function IconClipboard() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  );
}

function IconSnowflake() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18M3 12h18M5.636 5.636l12.728 12.728M18.364 5.636L5.636 18.364" />
    </svg>
  );
}

function IconTrash() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}

// ─── KPI Cards ────────────────────────────────────────────────────────────────

interface KpiCard {
  label: string;
  valueKey: string;
  icon: React.ReactNode;
}

const KPI_CONFIG: KpiCard[] = [
  { label: 'Total Members',    valueKey: 'totalMembers',    icon: <IconUsers /> },
  { label: 'Active Members',   valueKey: 'activeMembers',   icon: <IconActivity /> },
  { label: 'Total Branches',   valueKey: 'totalBranches',   icon: <IconBranch /> },
  { label: 'Total Properties', valueKey: 'totalProperties', icon: <IconHouse /> },
  { label: 'Total Bookings',   valueKey: 'totalBookings',   icon: <IconClipboard /> },
  { label: 'Total Revenue',    valueKey: 'totalRevenue',    icon: <IconCalendar /> },
];

// ─── Performer Card (display only) ───────────────────────────────────────────

function PerformerCard({ performer, froze }: {
  performer: DbTopPerformer;
  froze: boolean;
}) {
  const initials = performer.member.fullName
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  return (
    <div className={`flex-shrink-0 w-52 bg-white rounded-xl border shadow-sm p-4 ${froze ? 'border-amber-300' : 'border-gray-200'}`}>
      {/* Rank badge */}
      <div className="flex items-center justify-between mb-3">
        <div className="w-7 h-7 rounded-full bg-gold/10 flex items-center justify-center">
          <span className="text-xs font-bold text-gold">#{performer.rank}</span>
        </div>
        {froze && (
          <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-medium">Frozen</span>
        )}
      </div>

      {/* Avatar */}
      <div className="w-10 h-10 rounded-full bg-navy/10 flex items-center justify-center mb-2 mx-auto">
        <span className="text-sm font-bold text-navy">{initials}</span>
      </div>

      {/* Name */}
      <p className="text-sm font-semibold text-gray-900 text-center truncate">{performer.member.fullName}</p>

      {/* Role badge */}
      <div className="mt-1 flex justify-center">
        <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">
          {performer.role.replace(/_/g, ' ')}
        </span>
      </div>

      {/* Branch */}
      {performer.member.branch && (
        <p className="text-xs text-gray-400 text-center truncate mt-1">{performer.member.branch.name}</p>
      )}

      {/* Stats */}
      <div className="mt-3 pt-2 border-t border-gray-100 flex justify-between text-xs text-gray-500">
        <span>Tagged <span className="font-semibold text-gray-800">{performer.taggedCount}</span></span>
        <span>Props <span className="font-semibold text-gray-800">{performer.propertiesCount}</span></span>
      </div>
    </div>
  );
}

// ─── Manage Modal ─────────────────────────────────────────────────────────────

function ManageTopPerformersModal({
  open,
  onClose,
  froze,
  onRequestUnfreeze,
}: {
  open: boolean;
  onClose: () => void;
  froze: boolean;
  onRequestUnfreeze: () => void;
}) {
  const { data } = useTopPerformers();
  const { data: membersData } = useMembers({ limit: 100 });
  const createMutation = useCreateTopPerformer();
  const removeMutation = useRemoveTopPerformer();
  const reorderMutation = useReorderTopPerformers();

  const [selectedRole, setSelectedRole] = useState('DIRECTOR');
  const [memberSearch, setMemberSearch] = useState('');
  const [rankInput, setRankInput] = useState<number>(1);

  const members = membersData?.data ?? [];
  const allItems: DbTopPerformer[] = (data?.performers ?? []).flatMap((g) => g.items);
  const sorted = [...allItems].sort((a, b) => a.displayOrder - b.displayOrder || a.rank - b.rank);

  const filteredMembers = members.filter((m) =>
    memberSearch.trim() === '' || m.fullName.toLowerCase().includes(memberSearch.toLowerCase()),
  );
  const selectedMember = filteredMembers[0];

  function handleAdd() {
    if (!selectedMember) return;
    createMutation.mutate(
      {
        memberId: selectedMember.id,
        role: selectedRole,
        rank: rankInput,
        displayOrder: sorted.length,
        taggedCount: 0,
        propertiesCount: 0,
      },
      {
        onSuccess: () => {
          setMemberSearch('');
          setRankInput(1);
        },
      },
    );
  }

  function buildReorderItems(performers: typeof sorted) {
    return performers.map((p, i) => ({ id: p.id, rank: i + 1, displayOrder: i + 1 }));
  }

  function handleMoveUp(index: number) {
    if (index === 0) return;
    const reordered = [...sorted];
    [reordered[index - 1], reordered[index]] = [reordered[index], reordered[index - 1]];
    reorderMutation.mutate({ items: buildReorderItems(reordered) });
  }

  function handleMoveDown(index: number) {
    if (index >= sorted.length - 1) return;
    const reordered = [...sorted];
    [reordered[index], reordered[index + 1]] = [reordered[index + 1], reordered[index]];
    reorderMutation.mutate({ items: buildReorderItems(reordered) });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Manage Top Performers"
      subtitle="Add, rank, reorder, and manage role-wise top performers."
      size="xl"
    >
      {/* Frozen banner */}
      {froze && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-5">
          <span className="text-red-500">
            <IconSnowflake />
          </span>
          <p className="text-sm text-red-700 font-medium">
            Top Performers are frozen. Unfreeze to manage performers.
          </p>
        </div>
      )}

      {/* Filters + Add */}
      <div className="flex flex-wrap items-end gap-3 mb-5">
        {/* Role dropdown */}
        <div className="flex-1 min-w-[140px]">
          <label className="block text-xs text-gray-500 mb-1 font-medium">Role</label>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold bg-white"
            disabled={froze}
          >
            {MEMBER_ROLES.map((r) => (
              <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>
            ))}
          </select>
        </div>

        {/* Member search */}
        <div className="flex-1 min-w-[160px]">
          <label className="block text-xs text-gray-500 mb-1 font-medium">Member Search</label>
          <input
            type="text"
            placeholder="Search member name..."
            value={memberSearch}
            onChange={(e) => setMemberSearch(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold bg-white"
            disabled={froze}
          />
        </div>

        {/* Rank */}
        <div className="w-24">
          <label className="block text-xs text-gray-500 mb-1 font-medium">Rank</label>
          <input
            type="number"
            min={1}
            value={rankInput}
            onChange={(e) => setRankInput(Number(e.target.value))}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold bg-white"
            disabled={froze}
          />
        </div>

        {/* Add button */}
        <button
          onClick={handleAdd}
          disabled={froze || createMutation.isPending || !selectedMember}
          className="bg-gold text-navy font-semibold px-4 py-2 rounded-lg hover:opacity-90 disabled:opacity-50 text-sm flex-shrink-0"
        >
          {createMutation.isPending ? 'Adding…' : '+ Add Performer'}
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide w-12">Rank</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Member</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Branch</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide w-16">Order</th>
              <th className="w-16 px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-400">
                  No top performers added yet.
                </td>
              </tr>
            ) : (
              sorted.map((p, idx) => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="w-7 h-7 rounded-full bg-gold/10 flex items-center justify-center">
                      <span className="text-xs font-bold text-gold">#{p.rank}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-navy/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-navy">
                          {p.member.fullName.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate">{p.member.fullName}</p>
                        <p className="text-xs text-gray-500">{p.role.replace(/_/g, ' ')}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500 hidden sm:table-cell text-xs">
                    {p.member.branch?.name ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-0.5">
                      <button
                        onClick={() => handleMoveUp(idx)}
                        disabled={idx === 0 || reorderMutation.isPending}
                        className="p-0.5 rounded hover:bg-gray-100 text-gray-400 disabled:opacity-30"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleMoveDown(idx)}
                        disabled={idx === sorted.length - 1 || reorderMutation.isPending}
                        className="p-0.5 rounded hover:bg-gray-100 text-gray-400 disabled:opacity-30"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => removeMutation.mutate(p.id)}
                      disabled={removeMutation.isPending}
                      className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40"
                      title="Remove performer"
                    >
                      <IconTrash />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-5 mt-2 border-t border-gray-100">
        <button
          onClick={onRequestUnfreeze}
          className="text-sm text-gray-500 border border-dashed border-gray-300 px-4 py-2 rounded-lg hover:border-gold hover:text-gold transition-colors"
        >
          Unfreeze Ranking
        </button>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="text-sm text-gray-600 border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onClose}
            className="bg-gold text-navy font-semibold px-4 py-2 rounded-lg hover:opacity-90 text-sm"
          >
            Save Changes
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Unfreeze Confirm Modal ───────────────────────────────────────────────────

function UnfreezeConfirmModal({
  open,
  onClose,
  onConfirm,
  isPending,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isPending: boolean;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Unfreeze Top Performers?"
      size="sm"
    >
      <div className="flex flex-col items-center text-center py-2">
        {/* Gold icon */}
        <div className="w-14 h-14 rounded-full bg-gold/10 flex items-center justify-center mb-4">
          <span className="text-gold">
            <IconSnowflake />
          </span>
        </div>

        <p className="text-sm text-gray-600 mb-3">
          Unfreezing will allow rankings to update dynamically again. This action will lift the Super Admin lock on the leaderboard.
        </p>

        {/* Info note */}
        <div className="w-full bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-5">
          <p className="text-xs text-amber-700">
            Members and admins will see live rankings once unfrozen.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 w-full">
          <button
            onClick={onClose}
            className="flex-1 text-sm text-gray-500 border border-dashed border-gray-300 px-4 py-2 rounded-lg hover:border-gray-400 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            className="flex-1 bg-gold text-navy font-semibold px-4 py-2 rounded-lg hover:opacity-90 disabled:opacity-50 text-sm"
          >
            {isPending ? 'Unfreezing…' : 'Unfreeze'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const SuperAdminDashboardPage: React.FC = () => {
  const { data: stats, isLoading } = useSuperAdminStats();
  const { data: topData } = useTopPerformers();
  const freezeMutation = useToggleFreeze();

  const [manageOpen, setManageOpen] = useState(false);
  const [unfreezeOpen, setUnfreezeOpen] = useState(false);

  const froze = topData?.froze ?? false;
  const performerGroups = topData?.performers ?? [];

  // Stats as a loose record for dynamic access
  const statsRecord = stats as Record<string, number> | undefined;

  function handleConfirmUnfreeze() {
    freezeMutation.mutate(false, {
      onSuccess: () => {
        setUnfreezeOpen(false);
      },
    });
  }

  return (
    <div className="p-6 space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">Welcome back, Super Admin</p>
      </div>

      {/* ── KPI Cards ── */}
      <div>
        <div className="flex items-center gap-2 text-gold text-xs font-semibold uppercase tracking-wide mb-3">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Overview
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
            {KPI_CONFIG.map((c) => (
              <div key={c.label} className="bg-white rounded-xl border border-gray-200 h-24 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
            {KPI_CONFIG.map((card) => {
              const value = statsRecord?.[card.valueKey] ?? 0;
              return (
                <div key={card.label} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                  <div className="w-9 h-9 rounded-lg bg-gold/10 flex items-center justify-center text-gold mb-3">
                    {card.icon}
                  </div>
                  <p className="text-xs text-gray-500 leading-tight">{card.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-0.5">
                    {typeof value === 'number' ? value.toLocaleString('en-IN') : '—'}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Top Performers ── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        {/* Section header row */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-5">
          <div>
            <h2 className="text-base font-bold text-gray-900">Top Performers</h2>
            <p className="text-xs text-gray-500 mt-0.5">Role-wise leading members across the organisation</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {froze && (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 bg-red-50 border border-red-200 px-2.5 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                Frozen by Super Admin
              </span>
            )}

            <button
              onClick={() => setManageOpen(true)}
              className="text-sm border border-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors font-medium"
            >
              Manage Top Performers
            </button>

            <button
              onClick={() => (froze ? setUnfreezeOpen(true) : freezeMutation.mutate(true))}
              disabled={freezeMutation.isPending}
              className="bg-gold text-navy font-semibold px-4 py-2 rounded-lg hover:opacity-90 text-sm disabled:opacity-50"
            >
              {freezeMutation.isPending
                ? '…'
                : froze
                ? 'Frozen'
                : 'Freeze Ranking'}
            </button>
          </div>
        </div>

        {/* Role groups */}
        {performerGroups.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-sm text-gray-400">No top performers configured yet.</p>
            <button
              onClick={() => setManageOpen(true)}
              className="mt-2 text-sm text-gold hover:underline font-medium"
            >
              Add performers
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {MEMBER_ROLES.map((role) => {
              const group = performerGroups.find((g) => g.role === role);
              const items = group ? [...group.items].sort((a, b) => a.rank - b.rank) : [];
              if (items.length === 0) return null;

              return (
                <div key={role}>
                  {/* Role group header */}
                  <div className="flex items-center gap-2 text-gold text-xs font-semibold uppercase tracking-wide mb-3">
                    <span className="w-4 h-0.5 bg-gold/30 rounded" />
                    {role.replace(/_/g, ' ')} — {items.length} Member{items.length !== 1 ? 's' : ''}
                  </div>

                  {/* Horizontal scroll row */}
                  <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-200">
                    {items.map((performer) => (
                      <PerformerCard
                        key={performer.id}
                        performer={performer}
                        froze={froze}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      <ManageTopPerformersModal
        open={manageOpen}
        onClose={() => setManageOpen(false)}
        froze={froze}
        onRequestUnfreeze={() => {
          setManageOpen(false);
          setUnfreezeOpen(true);
        }}
      />

      <UnfreezeConfirmModal
        open={unfreezeOpen}
        onClose={() => setUnfreezeOpen(false)}
        onConfirm={handleConfirmUnfreeze}
        isPending={freezeMutation.isPending}
      />
    </div>
  );
};

export default SuperAdminDashboardPage;
