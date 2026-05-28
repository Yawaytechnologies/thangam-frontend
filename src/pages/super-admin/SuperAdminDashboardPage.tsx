import React, { useEffect, useMemo, useState } from 'react';
import { useSuperAdminStats } from '../../hooks/useDashboard';
import {
  useTopPerformers,
  useCreateTopPerformer,
  useRemoveTopPerformer,
  useReorderTopPerformers,
  useToggleFreeze,
} from '../../hooks/useTopPerformers';
import { useMembers } from '../../hooks/useMembers';
import type { DbTopPerformer } from '../../api/top-performers.api';

const MEMBER_ROLES = [
  'DIRECTOR',
  'EXECUTIVE_DIRECTOR',
  'DEPUTY_DIRECTOR',
  'SENIOR_MANAGER',
  'BUSINESS_MANAGER',
  'AGENT',
];

const ROLE_LABELS: Record<string, string> = {
  DIRECTOR: 'Directors',
  EXECUTIVE_DIRECTOR: 'Executive Directors',
  DEPUTY_DIRECTOR: 'Deputy Directors',
  SENIOR_MANAGER: 'Senior Managers',
  BUSINESS_MANAGER: 'Business Managers',
  AGENT: 'Agents',
};

const ROLE_BADGES: Record<string, string> = {
  DIRECTOR: 'DIRECTOR',
  EXECUTIVE_DIRECTOR: 'EXECUTIVE DIRECTOR',
  DEPUTY_DIRECTOR: 'DEPUTY DIRECTOR',
  SENIOR_MANAGER: 'SENIOR MANAGER',
  BUSINESS_MANAGER: 'BUSINESS MANAGER',
  AGENT: 'AGENT',
};

type MemberOption = {
  id: string;
  fullName: string;
  phone?: string | null;
  email?: string | null;
  memberId?: string | null;
};

function formatRole(role: string) {
  return ROLE_LABELS[role] ?? role.replace(/_/g, ' ');
}

function formatNumber(value: unknown) {
  if (typeof value !== 'number') return '0';
  return value.toLocaleString('en-IN');
}

function getInitials(name?: string) {
  return (name || 'NA')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

function getAvatarUrl(member: DbTopPerformer['member']) {
  const m = member as unknown as Record<string, string | undefined>;
  return m.avatarUrl || m.profileImage || m.profileImageUrl || m.photoUrl || m.imageUrl || m.image || '';
}

// ─── Icons ───────────────────────────────────────────────────────────────────

function IconUsers({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function IconCalendar({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

function IconActivity({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );
}

function IconClipboard({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  );
}

function IconTrash({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}

function IconSnowflake({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18M3 12h18M5.636 5.636l12.728 12.728M18.364 5.636L5.636 18.364" />
    </svg>
  );
}

function IconSearch({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m1.1-5.4a6.5 6.5 0 11-13 0 6.5 6.5 0 0113 0z" />
    </svg>
  );
}

function IconClose({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function IconInfo({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 3a9 9 0 100 18 9 9 0 000-18z" />
    </svg>
  );
}

function IconCheck({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function IconLock({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  );
}

function DragHandle({ disabled }: { disabled: boolean }) {
  return (
    <span className={`grid grid-cols-2 gap-[2px] ${disabled ? 'opacity-35' : 'cursor-grab text-gray-400'}`}>
      {Array.from({ length: 6 }).map((_, i) => (
        <span key={i} className="h-1 w-1 rounded-full bg-current" />
      ))}
    </span>
  );
}

// ─── KPI Cards ───────────────────────────────────────────────────────────────

const KPI_CONFIG = [
  {
    label: 'MEMBERS TODAY',
    valueKey: 'membersToday',
    icon: <IconUsers />,
    trend: '+12%',
    tone: 'bg-[#f5f0df] text-[#a47d05]',
  },
  {
    label: 'JOINED THIS WEEK',
    valueKey: 'joinedThisWeek',
    icon: <IconUsers />,
    trend: '+8%',
    tone: 'bg-emerald-50 text-emerald-600',
  },
  {
    label: 'JOINED THIS MONTH',
    valueKey: 'joinedThisMonth',
    icon: <IconCalendar />,
    trend: '+24%',
    tone: 'bg-red-50 text-red-500',
  },
  {
    label: 'TOTAL DIRECTORS',
    valueKey: 'totalDirectors',
    icon: <IconClipboard />,
    tag: 'Global',
    tone: 'bg-[#f5f0df] text-[#a47d05]',
  },
  {
    label: 'ACTIVE MEMBERS',
    valueKey: 'activeMembers',
    icon: <IconActivity />,
    tag: 'Active',
    tone: 'bg-emerald-50 text-emerald-600',
  },
];

function KpiCard({
  label,
  value,
  icon,
  trend,
  tag,
  tone,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  trend?: string;
  tag?: string;
  tone: string;
}) {
  return (
    <div className="min-h-[138px] rounded-[14px] border border-[#ececf1] bg-white px-5 py-5 shadow-[0_8px_24px_rgba(15,20,25,0.045)]">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div className={`flex h-9 w-9 items-center justify-center rounded-[10px] ${tone}`}>
          {icon}
        </div>

        {trend && (
          <span className="rounded-md bg-emerald-50 px-2 py-1 text-[11px] font-extrabold text-emerald-500">
            {trend}
          </span>
        )}

        {tag && (
          <span className={`rounded-md px-2 py-1 text-[10px] font-extrabold ${tone}`}>
            {tag}
          </span>
        )}
      </div>

      <p className="text-[11px] font-extrabold uppercase tracking-[0.02em] text-[#70727a]">
        {label}
      </p>
      <p className="mt-1 text-[26px] font-black leading-none text-[#171a21]">
        {value}
      </p>
    </div>
  );
}

// ─── Performer Card ─────────────────────────────────────────────────────────

function PerformerCard({
  performer,
  isFrozen,
}: {
  performer: DbTopPerformer;
  isFrozen: boolean;
}) {
  const avatarUrl = getAvatarUrl(performer.member);
  const rankIsFirst = performer.rank === 1;

  return (
    <article
      className={`relative min-h-[236px] rounded-[15px] border bg-white p-5 shadow-[0_10px_26px_rgba(15,20,25,0.045)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_34px_rgba(15,20,25,0.075)] ${
        isFrozen ? 'border-amber-200' : 'border-[#eeeeF3]'
      }`}
    >
      <div
        className={`absolute -left-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full text-[12px] font-black shadow-sm ${
          rankIsFirst ? 'bg-[#ffd90a] text-white' : 'bg-[#e6e7eb] text-white'
        }`}
      >
        #{performer.rank}
      </div>

      <div className="flex items-start gap-4">
        <div className="flex h-[54px] w-[54px] shrink-0 items-center justify-center overflow-hidden rounded-[10px] border border-[#e8e8ee] bg-[#0f1419]/10 text-sm font-black text-navy">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={performer.member.fullName}
              className="h-full w-full object-cover"
            />
          ) : (
            getInitials(performer.member.fullName)
          )}
        </div>

        <div className="min-w-0 pt-1">
          <h3 className="truncate text-[14px] font-black leading-tight text-[#22252c]">
            {performer.member.fullName}
          </h3>

          <span className="mt-1 inline-flex rounded-[4px] bg-emerald-50 px-1.5 py-[2px] text-[8px] font-black uppercase tracking-tight text-emerald-700">
            {ROLE_BADGES[performer.role] ?? performer.role.replace(/_/g, ' ')}
          </span>

          {performer.member.branch?.name && (
            <p className="mt-1 truncate text-[11px] font-medium text-[#8d8f96]">
              {performer.member.branch.name}
            </p>
          )}
        </div>
      </div>

      <div className="mt-6 space-y-3 text-[11px]">
        <div className="flex items-center justify-between gap-3">
          <span className="font-semibold text-[#777983]">Status</span>
          <span className="inline-flex items-center gap-1.5 font-black text-emerald-600">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Active
          </span>
        </div>

        <div className="flex items-center justify-between gap-3">
          <span className="font-semibold text-[#777983]">Tagged Members</span>
          <span className="font-black text-[#9b7a09]">
            {formatNumber(performer.taggedCount)}
          </span>
        </div>

        <div className="flex items-center justify-between gap-3">
          <span className="font-semibold text-[#777983]">Properties Handled</span>
          <span className="font-black text-emerald-700">
            {formatNumber(performer.propertiesCount)} Active
          </span>
        </div>
      </div>

      <button
        type="button"
        className="mt-5 h-10 w-full rounded-[10px] border border-dashed border-[#d9d5c6] bg-[#faf9f4] text-[11px] font-black text-[#9b7a09] transition hover:border-gold hover:bg-gold/10"
      >
        View Profile
      </button>
    </article>
  );
}

// ─── Manage Modal ───────────────────────────────────────────────────────────

function ManageTopPerformersModal({
  open,
  onClose,
  isFrozen,
  onRequestUnfreeze,
}: {
  open: boolean;
  onClose: () => void;
  isFrozen: boolean;
  onRequestUnfreeze: () => void;
}) {
  const { data } = useTopPerformers();
  const { data: membersData } = useMembers({ limit: 100 });
  const createMutation = useCreateTopPerformer();
  const removeMutation = useRemoveTopPerformer();
  const reorderMutation = useReorderTopPerformers();

  const [selectedRole, setSelectedRole] = useState('EXECUTIVE_DIRECTOR');
  const [memberSearch, setMemberSearch] = useState('');
  const [rankInput, setRankInput] = useState<number>(0);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const members = ((membersData?.data ?? []) as MemberOption[]).filter(Boolean);

  const allItems = useMemo(() => {
    return ((data?.performers ?? []) as Array<{ items: DbTopPerformer[] }>).flatMap((g) => g.items ?? []);
  }, [data?.performers]);

  const sorted = useMemo(() => {
    return [...allItems].sort((a, b) => a.displayOrder - b.displayOrder || a.rank - b.rank);
  }, [allItems]);

  const filteredMembers = useMemo(() => {
    const search = memberSearch.trim().toLowerCase();

    if (!search) return members.slice(0, 20);

    return members
      .filter((m) => {
        return (
          m.fullName?.toLowerCase().includes(search) ||
          String(m.id).includes(search) ||
          m.memberId?.toLowerCase().includes(search) ||
          m.phone?.toLowerCase().includes(search) ||
          m.email?.toLowerCase().includes(search)
        );
      })
      .slice(0, 20);
  }, [memberSearch, members]);

  const selectedMember = useMemo(() => {
    const search = memberSearch.trim().toLowerCase();
    if (!search) return undefined;

    return (
      members.find((m) => m.fullName.toLowerCase() === search) ||
      filteredMembers[0]
    );
  }, [filteredMembers, memberSearch, members]);

  function buildReorderItems(performers: DbTopPerformer[]) {
    return performers.map((p, i) => ({
      id: p.id,
      rank: i + 1,
      displayOrder: i + 1,
    }));
  }

  function handleAdd() {
    if (!selectedMember || isFrozen) return;

    createMutation.mutate(
      {
        memberId: selectedMember.id,
        role: selectedRole,
        rank: rankInput > 0 ? rankInput : sorted.length + 1,
        displayOrder: sorted.length + 1,
        taggedCount: 0,
        propertiesCount: 0,
      },
      {
        onSuccess: () => {
          setMemberSearch('');
          setRankInput(0);
        },
      },
    );
  }

  function handleDrop(targetIndex: number) {
    if (isFrozen || draggedId === null) return;

    const sourceIndex = sorted.findIndex((p) => p.id === draggedId);
    if (sourceIndex === -1 || sourceIndex === targetIndex) {
      setDraggedId(null);
      return;
    }

    const reordered = [...sorted];
    const [moved] = reordered.splice(sourceIndex, 1);
    reordered.splice(targetIndex, 0, moved);

    reorderMutation.mutate({ items: buildReorderItems(reordered) });
    setDraggedId(null);
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/45 px-3 py-4 backdrop-blur-[3px]"
      onMouseDown={onClose}
    >
      <section
        className="flex max-h-[calc(100dvh-32px)] w-[min(94vw,820px)] flex-col overflow-hidden rounded-[9px] bg-white shadow-[0_24px_80px_rgba(0,0,0,0.28)]"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <header className="relative px-6 pb-4 pt-5 sm:px-14">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full border border-dashed border-blue-400 bg-white text-[#20242c] transition hover:bg-gray-50"
            aria-label="Close modal"
          >
            <IconClose />
          </button>

          <h2 className="pr-14 text-[25px] font-black leading-tight text-[#20242c]">
            Manage Top Performers
          </h2>
          <p className="mt-1 text-[13px] font-medium text-[#666974]">
            Add, rank, reorder, and manage role-wise top performers.
          </p>
        </header>

        {isFrozen && (
          <div className="flex items-center gap-3 bg-[#fdebe8] px-6 py-3 sm:px-14">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#be2f21] text-white">
              <IconInfo className="h-3.5 w-3.5" />
            </span>
            <p className="text-[12px] font-extrabold text-[#c72b1f]">
              Top Performers are frozen. Unfreeze to manage performers.
            </p>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-6 py-6 sm:px-14">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_1fr_92px_96px] md:items-end">
            <div>
              <label className="mb-1.5 block text-[11px] font-bold text-[#595c65]">
                Role Selection
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                disabled={isFrozen}
                className="h-10 w-full rounded-[6px] border border-[#d8d9df] bg-[#f3f3f4] px-3 text-[13px] font-medium text-[#8a8c93] outline-none transition focus:border-gold focus:ring-2 focus:ring-gold/20 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {MEMBER_ROLES.map((role) => (
                  <option key={role} value={role}>
                    {formatRole(role)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] font-bold text-[#595c65]">
                Member Search
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca0a8]">
                  <IconSearch />
                </span>
                <input
                  list="top-performer-members"
                  type="text"
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  placeholder="Name, ID, or Phone"
                  disabled={isFrozen}
                  className="h-10 w-full rounded-[6px] border border-[#d8d9df] bg-[#f3f3f4] pl-10 pr-3 text-[13px] font-medium text-[#333741] outline-none transition placeholder:text-[#a0a2a8] focus:border-gold focus:ring-2 focus:ring-gold/20 disabled:cursor-not-allowed disabled:opacity-70"
                />
                <datalist id="top-performer-members">
                  {filteredMembers.map((m) => (
                    <option key={m.id} value={m.fullName}>
                      {m.phone || m.email || m.memberId || m.id}
                    </option>
                  ))}
                </datalist>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] font-bold text-[#595c65]">
                Rank
              </label>
              <input
                type="number"
                min={0}
                value={rankInput}
                onChange={(e) => setRankInput(Number(e.target.value))}
                disabled={isFrozen}
                className="h-10 w-full rounded-[6px] border border-[#d8d9df] bg-[#f3f3f4] px-3 text-[13px] font-semibold text-[#5f6470] outline-none transition focus:border-gold focus:ring-2 focus:ring-gold/20 disabled:cursor-not-allowed disabled:opacity-70"
              />
            </div>

            <button
              type="button"
              onClick={handleAdd}
              disabled={isFrozen || createMutation.isPending || !selectedMember}
              className="flex h-10 items-center justify-center gap-2 rounded-[7px] bg-[#d9cfb8] px-4 text-[11px] font-black leading-tight text-[#5b4706] transition hover:bg-gold disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="text-xl leading-none">+</span>
              <span>
                Add
                <br />
                Performer
              </span>
            </button>
          </div>

          <div className="mt-8 overflow-hidden rounded-[10px] border border-[#e6e7eb] bg-white">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] text-left">
                <thead>
                  <tr className="bg-[#f7f7f9] text-[11px] font-black uppercase tracking-[0.03em] text-[#626571]">
                    <th className="w-[128px] px-5 py-3">Rank</th>
                    <th className="px-4 py-3">Member</th>
                    <th className="px-4 py-3">Branch</th>
                    <th className="w-[96px] px-5 py-3 text-center">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#f0f1f4]">
                  {sorted.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-5 py-12 text-center text-[13px] font-semibold text-[#9a9da5]">
                        No top performers added yet.
                      </td>
                    </tr>
                  ) : (
                    sorted.map((p, index) => {
                      const avatarUrl = getAvatarUrl(p.member);

                      return (
                        <tr
                          key={p.id}
                          draggable={!isFrozen}
                          onDragStart={() => setDraggedId(p.id)}
                          onDragOver={(e) => {
                            if (!isFrozen) e.preventDefault();
                          }}
                          onDrop={() => handleDrop(index)}
                          onDragEnd={() => setDraggedId(null)}
                          className={`transition ${
                            draggedId === p.id ? 'bg-amber-50/60' : 'hover:bg-[#fafafa]'
                          }`}
                        >
                          <td className="px-5 py-5">
                            <div className="flex items-center gap-4">
                              <DragHandle disabled={isFrozen} />
                              <span
                                className={`flex h-8 w-8 items-center justify-center rounded-full text-[13px] font-black ${
                                  p.rank === 1
                                    ? 'bg-[#ffdb6d] text-[#7b5d05]'
                                    : 'bg-[#e9eaed] text-[#686c75]'
                                }`}
                              >
                                {p.rank}
                              </span>
                            </div>
                          </td>

                          <td className="px-4 py-5">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-[8px] bg-[#0f1419]/10 text-[11px] font-black text-navy">
                                {avatarUrl ? (
                                  <img src={avatarUrl} alt={p.member.fullName} className="h-full w-full object-cover" />
                                ) : (
                                  getInitials(p.member.fullName)
                                )}
                              </div>

                              <div className="min-w-0">
                                <p className="truncate text-[13px] font-black text-[#252832]">
                                  {p.member.fullName}
                                </p>
                                <p className="truncate text-[10px] font-semibold text-[#7b7f88]">
                                  ID: STH-{String(p.id).padStart(4, '0')} · {ROLE_BADGES[p.role] ?? p.role.replace(/_/g, ' ')}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-5 text-[13px] font-medium text-[#4e525c]">
                            {p.member.branch?.name ?? '—'}
                          </td>

                          <td className="px-5 py-5 text-center">
                            <button
                              type="button"
                              onClick={() => removeMutation.mutate(p.id)}
                              disabled={isFrozen || removeMutation.isPending}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-red-400 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-35"
                              title="Remove performer"
                            >
                              <IconTrash />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <footer className="flex flex-col gap-3 bg-[#f5f6f9] px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-14">
          {isFrozen ? (
            <button
              type="button"
              onClick={onRequestUnfreeze}
              className="inline-flex h-9 w-fit items-center gap-1.5 rounded-[4px] border border-dashed border-blue-400 bg-[#fffbe9] px-2 text-[12px] font-black text-[#9b7a09] transition hover:bg-gold/10"
            >
              <IconLock className="h-3.5 w-3.5" />
              Unfreeze Ranking
            </button>
          ) : (
            <p className="text-[12px] font-bold text-emerald-600">Live editing enabled</p>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <button
              type="button"
              onClick={onClose}
              className="h-10 min-w-[160px] rounded-[6px] border border-[#a9a9ad] bg-white px-8 text-[12px] font-black text-[#333741] transition hover:bg-gray-50"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={onClose}
              disabled={isFrozen}
              className="h-10 min-w-[200px] rounded-[6px] bg-[#cfd0d3] px-8 text-[12px] font-black text-white shadow-sm transition hover:bg-gold disabled:cursor-not-allowed disabled:opacity-80"
            >
              Save Changes
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
}

// ─── Unfreeze Confirm Modal ─────────────────────────────────────────────────

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
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 px-3 py-4 backdrop-blur-[3px]"
      onMouseDown={onClose}
    >
      <section
        className="w-[min(92vw,462px)] overflow-hidden rounded-[7px] border-t-[6px] border-gold bg-white shadow-[0_24px_80px_rgba(0,0,0,0.30)]"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="p-8">
          <div className="flex items-start gap-5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] bg-[#f5f0df] text-[#a47d05]">
              <IconSnowflake />
            </div>

            <div>
              <h2 className="text-[27px] font-black leading-[1.08] text-[#252832]">
                Unfreeze Top
                <br />
                Performers?
              </h2>

              <p className="mt-3 max-w-[310px] text-[13px] font-medium leading-6 text-[#5f636d]">
                This will allow Super Admin to manage, reorder, and update Top Performers again.
                This action re-enables live editing for all administrative branches.
              </p>
            </div>
          </div>

          <div className="mt-6 flex items-start gap-3 rounded-[9px] border border-[#dedfe5] bg-[#f4f4f6] px-5 py-4">
            <IconInfo className="mt-0.5 h-4 w-4 shrink-0 text-[#a47d05]" />
            <p className="text-[10px] font-semibold leading-4 text-[#777a83]">
              The current rankings will remain as they are until manually modified.
            </p>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onClose}
              className="h-12 rounded-[8px] border border-dashed border-blue-400 bg-white text-[13px] font-bold text-[#686b73] transition hover:bg-gray-50"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={onConfirm}
              disabled={isPending}
              className="h-12 rounded-[8px] bg-gold text-[13px] font-black text-white shadow-sm transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending ? 'Unfreezing…' : 'Unfreeze'}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

// ─── Toast ──────────────────────────────────────────────────────────────────

function ActionToast({
  show,
  onClose,
  message,
}: {
  show: boolean;
  onClose: () => void;
  message: string;
}) {
  if (!show) return null;

  return (
    <div className="fixed bottom-7 right-7 z-[120] flex w-[min(92vw,400px)] items-center gap-4 rounded-[8px] bg-[#33363b] px-7 py-5 text-white shadow-[0_18px_50px_rgba(0,0,0,0.35)]">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
        <IconCheck className="h-5 w-5" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-black">Action Confirmed</p>
        <p className="mt-0.5 text-[11px] font-semibold leading-4 text-white/85">
          {message}
        </p>
      </div>

      <button
        type="button"
        onClick={onClose}
        className="rounded-full p-1 text-white/80 transition hover:bg-white/10 hover:text-white"
        aria-label="Close toast"
      >
        <IconClose className="h-4 w-4" />
      </button>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────

const SuperAdminDashboardPage: React.FC = () => {
  const { data: stats, isLoading } = useSuperAdminStats();
  const { data: topData } = useTopPerformers();
  const freezeMutation = useToggleFreeze();

  const [manageOpen, setManageOpen] = useState(false);
  const [unfreezeOpen, setUnfreezeOpen] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);

  const isFrozen = topData?.froze ?? false;
  const performerGroups = topData?.performers ?? [];
  const statsRecord = stats as Record<string, number> | undefined;

  useEffect(() => {
    if (!toastOpen) return;

    const timer = window.setTimeout(() => {
      setToastOpen(false);
    }, 3500);

    return () => window.clearTimeout(timer);
  }, [toastOpen]);

  function handleToggleFreeze() {
    if (freezeMutation.isPending) return;

    if (isFrozen) {
      setUnfreezeOpen(true);
      return;
    }

    freezeMutation.mutate(true, {
      onSuccess: () => setToastOpen(true),
    });
  }

  function handleConfirmUnfreeze() {
    freezeMutation.mutate(false, {
      onSuccess: () => {
        setUnfreezeOpen(false);
        setToastOpen(true);
      },
    });
  }

  return (
    <div className="min-h-full bg-[#f8f8fb] px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-[1180px] space-y-9">
        <section>
          {isLoading ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
              {KPI_CONFIG.map((card) => (
                <div
                  key={card.label}
                  className="min-h-[138px] animate-pulse rounded-[14px] border border-[#ececf1] bg-white"
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
              {KPI_CONFIG.map((card) => (
                <KpiCard
                  key={card.label}
                  label={card.label}
                  value={formatNumber(statsRecord?.[card.valueKey])}
                  icon={card.icon}
                  trend={card.trend}
                  tag={card.tag}
                  tone={card.tone}
                />
              ))}
            </div>
          )}
        </section>

        <section>
          <div className="mb-7 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-[27px] font-black leading-none text-[#11141a]">
                Top Performers
              </h1>
              <p className="mt-2 max-w-[460px] text-[14px] font-medium leading-5 text-[#4f535d]">
                Role-wise leading members across the organization
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center lg:justify-end">
              <button
                type="button"
                onClick={() => setManageOpen(true)}
                className="h-12 rounded-[10px] border border-dashed border-blue-400 bg-white px-8 text-[12px] font-black leading-tight text-[#7f6508] shadow-sm transition hover:border-gold hover:bg-gold/10 sm:w-[178px]"
              >
                Manage Top
                <br />
                Performers
              </button>

              <button
                type="button"
                onClick={handleToggleFreeze}
                disabled={freezeMutation.isPending}
                className="flex h-10 items-center justify-between gap-4 rounded-full border border-[#e8e3d4] bg-[#f3f0e8] px-3 pl-4 text-left transition hover:bg-[#eee8d8] disabled:cursor-not-allowed disabled:opacity-60 sm:min-w-[160px]"
              >
                <span className="text-[11px] font-black leading-tight text-[#2e3037]">
                  Freeze
                  <br />
                  Ranking
                </span>

                <span
                  className={`relative h-6 w-11 rounded-full transition ${
                    isFrozen ? 'bg-[#2d4a9a]' : 'bg-[#d5d7dd]'
                  }`}
                >
                  <span
                    className={`absolute top-1 h-4 w-4 rounded-full bg-gold shadow transition ${
                      isFrozen ? 'left-6' : 'left-1'
                    }`}
                  />
                </span>
              </button>

              {isFrozen && (
                <span className="inline-flex h-10 items-center gap-2 rounded-full border border-red-200 bg-[#fae8e6] px-4 text-[10px] font-black uppercase leading-tight text-[#d43427]">
                  <IconLock className="h-3.5 w-3.5" />
                  Frozen by Super
                  <br />
                  Admin
                </span>
              )}
            </div>
          </div>

          {performerGroups.length === 0 ? (
            <div className="rounded-[16px] border border-dashed border-[#d8d9df] bg-white px-5 py-14 text-center">
              <p className="text-[14px] font-semibold text-[#8b8e96]">
                No top performers configured yet.
              </p>
              <button
                type="button"
                onClick={() => setManageOpen(true)}
                className="mt-3 text-[13px] font-black text-[#9b7a09] hover:underline"
              >
                Add performers
              </button>
            </div>
          ) : (
            <div className="space-y-12">
              {MEMBER_ROLES.map((role) => {
                const group = performerGroups.find((g) => g.role === role);
                const items = group ? [...group.items].sort((a, b) => a.rank - b.rank) : [];

                if (items.length === 0) return null;

                const memberCount =
                  Number((group as unknown as Record<string, number | undefined>).totalMembers) ||
                  Number((group as unknown as Record<string, number | undefined>).memberCount) ||
                  Number((group as unknown as Record<string, number | undefined>).count) ||
                  items.length;

                return (
                  <div key={role}>
                    <div className="mb-5 flex items-center gap-3">
                      <h2 className="text-[25px] font-black leading-none text-[#11141a]">
                        {formatRole(role)}
                      </h2>
                      <span className="h-1 w-1 rounded-full bg-[#9d9fa7]" />
                      <span className="text-[13px] font-bold text-[#737781]">
                        {memberCount} Member{memberCount !== 1 ? 's' : ''}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                      {items.map((performer) => (
                        <PerformerCard
                          key={performer.id}
                          performer={performer}
                          isFrozen={isFrozen}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      <ManageTopPerformersModal
        open={manageOpen}
        onClose={() => setManageOpen(false)}
        isFrozen={isFrozen}
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

      <ActionToast
        show={toastOpen}
        onClose={() => setToastOpen(false)}
        message="TopPerformers freeze setting updated successfully"
      />
    </div>
  );
};

export default SuperAdminDashboardPage;