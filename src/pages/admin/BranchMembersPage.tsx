import React, { useState, useMemo } from 'react';
import { useMembers } from '../../hooks/useMembers';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { SearchInput } from '../../components/ui/SearchInput';
import type { Member, Role } from '../../types';

const ROLE_LABELS: Record<Role, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
  DIRECTOR: 'Director',
  EXECUTIVE_DIRECTOR: 'Executive Director',
  DEPUTY_DIRECTOR: 'Deputy Director',
  SENIOR_MANAGER: 'Senior Manager',
  BUSINESS_MANAGER: 'Business Manager',
  AGENT: 'Agent',
};

const ROLE_ORDER: Role[] = [
  'DIRECTOR',
  'EXECUTIVE_DIRECTOR',
  'DEPUTY_DIRECTOR',
  'SENIOR_MANAGER',
  'BUSINESS_MANAGER',
  'AGENT',
];

const ROLE_COLORS: Record<string, string> = {
  DIRECTOR: 'bg-purple-100 text-purple-800',
  EXECUTIVE_DIRECTOR: 'bg-blue-100 text-blue-800',
  DEPUTY_DIRECTOR: 'bg-indigo-100 text-indigo-800',
  SENIOR_MANAGER: 'bg-teal-100 text-teal-800',
  BUSINESS_MANAGER: 'bg-green-100 text-green-800',
  AGENT: 'bg-orange-100 text-orange-800',
};

const ROLE_BORDER: Record<string, string> = {
  DIRECTOR: 'border-l-purple-500',
  EXECUTIVE_DIRECTOR: 'border-l-blue-500',
  DEPUTY_DIRECTOR: 'border-l-indigo-500',
  SENIOR_MANAGER: 'border-l-teal-500',
  BUSINESS_MANAGER: 'border-l-green-500',
  AGENT: 'border-l-orange-500',
};

interface TreeNode {
  member: Member;
  children: TreeNode[];
}

function buildTree(members: Member[]): TreeNode[] {
  const byId = new Map(members.map((m) => [m.id, m]));
  const childrenMap = new Map<string | null, Member[]>();

  for (const m of members) {
    const parentId = m.reportsToId ?? null;
    if (!childrenMap.has(parentId)) childrenMap.set(parentId, []);
    childrenMap.get(parentId)!.push(m);
  }

  function buildNode(member: Member): TreeNode {
    return {
      member,
      children: (childrenMap.get(member.id) ?? [])
        .sort((a, b) => ROLE_ORDER.indexOf(a.role) - ROLE_ORDER.indexOf(b.role))
        .map(buildNode),
    };
  }

  const roots = (childrenMap.get(null) ?? []).filter(
    (m) => !byId.has(m.reportsToId ?? '') || m.reportsToId == null,
  );

  return roots
    .sort((a, b) => ROLE_ORDER.indexOf(a.role) - ROLE_ORDER.indexOf(b.role))
    .map(buildNode);
}

function MemberCard({ member }: { member: Member; depth?: number }) {
  const initials = member.fullName
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  return (
    <div
      className={`bg-white rounded-xl border border-l-4 ${ROLE_BORDER[member.role] ?? 'border-l-gray-400'} border-gray-200 p-4 shadow-sm`}
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-navy/10 flex items-center justify-center flex-shrink-0">
          <span className="text-navy font-bold text-sm">{initials}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">{member.fullName}</p>
          <p className="text-xs text-gray-500 truncate">{member.phone}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_COLORS[member.role] ?? 'bg-gray-100 text-gray-600'}`}>
            {ROLE_LABELS[member.role] ?? member.role}
          </span>
          <StatusBadge status={member.status} />
        </div>
      </div>
      {member.codeNumber && (
        <p className="text-xs text-gray-400 mt-2 font-mono">Code: {member.codeNumber}</p>
      )}
    </div>
  );
}

function TreeNodeView({ node, depth = 0 }: { node: TreeNode; depth?: number }) {
  const [expanded, setExpanded] = useState(depth < 2);

  return (
    <div>
      <div className="relative">
        <div
          className={`cursor-pointer ${node.children.length > 0 ? 'hover:opacity-90' : ''}`}
          onClick={() => node.children.length > 0 && setExpanded((e) => !e)}
        >
          <MemberCard member={node.member} depth={depth} />
          {node.children.length > 0 && (
            <div className="absolute top-4 right-4 flex items-center gap-1">
              <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-full">
                {node.children.length}
              </span>
              <svg
                className={`w-4 h-4 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          )}
        </div>
      </div>

      {expanded && node.children.length > 0 && (
        <div className="ml-6 mt-2 pl-4 border-l-2 border-gray-200 space-y-2">
          {node.children.map((child) => (
            <TreeNodeView key={child.member.id} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

function RoleGroupView({ role, members }: { role: Role; members: Member[] }) {
  const [open, setOpen] = useState(true);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-200 hover:bg-gray-100 transition-colors"
        onClick={() => setOpen((o) => !o)}
      >
        <div className="flex items-center gap-3">
          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${ROLE_COLORS[role] ?? 'bg-gray-100 text-gray-600'}`}>
            {ROLE_LABELS[role] ?? role}
          </span>
          <span className="text-sm font-medium text-gray-700">{members.length} member{members.length !== 1 ? 's' : ''}</span>
        </div>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="divide-y divide-gray-100">
          {members.map((m) => (
            <div key={m.id} className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50">
              <div className="w-8 h-8 rounded-full bg-navy/10 flex items-center justify-center flex-shrink-0">
                <span className="text-navy font-bold text-xs">
                  {m.fullName.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{m.fullName}</p>
                <p className="text-xs text-gray-500 truncate">{m.phone}{m.codeNumber ? ` · ${m.codeNumber}` : ''}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {m.reportsTo && (
                  <span className="text-xs text-gray-400 hidden md:block truncate max-w-32">
                    → {m.reportsTo.fullName}
                  </span>
                )}
                <StatusBadge status={m.status} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

type ViewMode = 'hierarchy' | 'grouped';

const BranchMembersPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grouped');
  const [roleFilter, setRoleFilter] = useState<Role | ''>('');

  const { data: membersData, isLoading } = useMembers({ limit: 500 });
  const allMembers = membersData?.data ?? [];

  const filtered = useMemo(() => {
    return allMembers.filter((m) => {
      if (roleFilter && m.role !== roleFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          m.fullName.toLowerCase().includes(q) ||
          m.phone.includes(q) ||
          (m.codeNumber?.toLowerCase().includes(q) ?? false)
        );
      }
      return true;
    });
  }, [allMembers, search, roleFilter]);

  const tree = useMemo(() => buildTree(filtered), [filtered]);

  const grouped = useMemo(() => {
    const map = new Map<Role, Member[]>();
    for (const role of ROLE_ORDER) {
      const group = filtered.filter((m) => m.role === role);
      if (group.length > 0) map.set(role, group);
    }
    return map;
  }, [filtered]);

  const totalByRole = useMemo(() => {
    const counts: Partial<Record<Role, number>> = {};
    for (const m of allMembers) counts[m.role] = (counts[m.role] ?? 0) + 1;
    return counts;
  }, [allMembers]);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-navy">Branch Members</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {allMembers.length} total members across {ROLE_ORDER.length} roles
          </p>
        </div>
      </div>

      {/* Role summary cards */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-6">
        {ROLE_ORDER.map((role) => (
          <button
            key={role}
            onClick={() => setRoleFilter(roleFilter === role ? '' : role)}
            className={`rounded-xl border p-3 text-center transition-all ${
              roleFilter === role
                ? 'border-gold bg-gold/10 ring-1 ring-gold'
                : 'border-gray-200 bg-white hover:border-gold/50'
            }`}
          >
            <p className="text-xl font-bold text-navy">{totalByRole[role] ?? 0}</p>
            <p className="text-xs text-gray-500 mt-0.5 leading-tight">{ROLE_LABELS[role]}</p>
          </button>
        ))}
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-3 mb-4 items-center">
        <SearchInput
          value={search}
          onChange={(v) => setSearch(v)}
          placeholder="Search by name, phone or code..."
          className="w-72"
        />
        <div className="flex rounded-lg border border-gray-300 overflow-hidden">
          <button
            onClick={() => setViewMode('grouped')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              viewMode === 'grouped' ? 'bg-navy text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            By Role
          </button>
          <button
            onClick={() => setViewMode('hierarchy')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              viewMode === 'hierarchy' ? 'bg-navy text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            Hierarchy
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
          Loading members...
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
          No members found
        </div>
      ) : viewMode === 'grouped' ? (
        <div className="space-y-4">
          {[...grouped.entries()].map(([role, members]) => (
            <RoleGroupView key={role} role={role} members={members} />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {tree.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
              No hierarchy data available
            </div>
          ) : (
            tree.map((node) => <TreeNodeView key={node.member.id} node={node} />)
          )}
        </div>
      )}
    </div>
  );
};

export default BranchMembersPage;
