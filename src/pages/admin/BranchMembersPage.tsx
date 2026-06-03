import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  Building2,
  ChevronDown,
  ChevronsUpDown,
  GitBranch,
  MapPin,
  Search,
  SlidersHorizontal,
  UserCheck,
  Users,
} from 'lucide-react';
import { useMembers } from '../../hooks/useMembers';
import { useAuthStore } from '../../stores/auth.store';
import type { Branch, Member, Role, UserStatus } from '../../types';

interface PersonRecord {
  id: string;
  name: string;
  role: Role;
  phone: string;
  branch: string;
  status: UserStatus;
  taggedCount: number;
}

interface DirectorRecord extends PersonRecord {
  region: string;
}

const roleLabels: Record<Role, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
  DIRECTOR: 'Director',
  EXECUTIVE_DIRECTOR: 'Executive Director',
  DEPUTY_DIRECTOR: 'Deputy Director',
  SENIOR_MANAGER: 'Senior Manager',
  BUSINESS_MANAGER: 'Business Manager',
  AGENT: 'Agent',
};

const fallbackDirectors: DirectorRecord[] = [
  {
    id: 'fallback-director-1',
    name: 'S. Meenakshi',
    role: 'DIRECTOR',
    phone: '+91 98402 10001',
    branch: 'Chennai Central',
    region: 'Chennai Central',
    status: 'ACTIVE',
    taggedCount: 42,
  },
  {
    id: 'fallback-director-2',
    name: 'K. Raghuveer',
    role: 'DIRECTOR',
    phone: '+91 98402 10002',
    branch: 'Chennai South',
    region: 'Chennai South',
    status: 'ACTIVE',
    taggedCount: 38,
  },
  {
    id: 'fallback-director-3',
    name: 'P. Anitha',
    role: 'DIRECTOR',
    phone: '+91 98402 10003',
    branch: 'Chennai North',
    region: 'Chennai North',
    status: 'ACTIVE',
    taggedCount: 29,
  },
];

const fallbackExecutive: PersonRecord = {
  id: 'fallback-executive-1',
  name: 'A. Rajesh Kumar',
  role: 'EXECUTIVE_DIRECTOR',
  phone: '+91 98402 12345',
  branch: 'Chennai Central',
  status: 'ACTIVE',
  taggedCount: 12,
};

const fallbackDeputies: PersonRecord[] = [
  {
    id: 'fallback-deputy-1',
    name: 'V. Suresh',
    role: 'DEPUTY_DIRECTOR',
    phone: '+91 98402 54321',
    branch: 'Chennai Central',
    status: 'ACTIVE',
    taggedCount: 5,
  },
  {
    id: 'fallback-deputy-2',
    name: 'M. Divya',
    role: 'SENIOR_MANAGER',
    phone: '+91 91234 56789',
    branch: 'Chennai Central',
    status: 'ACTIVE',
    taggedCount: 3,
  },
];

const fallbackCollapsedExecutive: PersonRecord = {
  id: 'fallback-executive-2',
  name: 'L. Prabhakar',
  role: 'EXECUTIVE_DIRECTOR',
  phone: '+91 98402 90008',
  branch: 'Chennai Central',
  status: 'ACTIVE',
  taggedCount: 8,
};

function initials(name: string) {
  return (
    name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('') || 'M'
  );
}

function branchLocation(branch?: Branch) {
  if (!branch) return 'Anna Salai, Chennai';
  return [branch.address, branch.city].filter(Boolean).join(', ') || branch.city || 'Anna Salai, Chennai';
}

function countTagged(member: Member, members: Member[], fallback: number) {
  const directReports = members.filter((item) => item.reportsToId === member.id).length;
  return directReports || fallback;
}

function memberToPerson(member: Member, members: Member[], fallbackCount: number): PersonRecord {
  return {
    id: member.id,
    name: member.fullName,
    role: member.role,
    phone: member.phone,
    branch: member.branch?.name ?? 'Chennai Central',
    status: member.status,
    taggedCount: countTagged(member, members, fallbackCount),
  };
}

function StatusBadge({ status }: { status: UserStatus }) {
  const isActive = status === 'ACTIVE';
  return (
    <span
      className={`inline-flex items-center rounded-sm px-2 py-0.5 text-[10px] font-bold uppercase ${
        isActive ? 'bg-teal-50 text-teal-700' : 'bg-amber-50 text-amber-700'
      }`}
    >
      {isActive ? 'ACTIVE' : status}
    </span>
  );
}

function Avatar({ name, selected = false }: { name: string; selected?: boolean }) {
  return (
    <div
      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white shadow-sm ${
        selected ? 'bg-teal-700 ring-2 ring-gold' : 'bg-gradient-to-br from-gray-800 to-gray-500'
      }`}
    >
      {initials(name)}
    </div>
  );
}

function RoleBadge({ role }: { role: Role }) {
  const color =
    role === 'SENIOR_MANAGER'
      ? 'bg-teal-50 text-teal-700'
      : role === 'DEPUTY_DIRECTOR'
        ? 'bg-blue-50 text-blue-700'
        : 'bg-amber-50 text-gold';

  return (
    <span className={`inline-flex rounded-sm px-2 py-0.5 text-[10px] font-bold uppercase ${color}`}>
      {roleLabels[role]}
    </span>
  );
}

function DirectorCard({
  director,
  selected,
  onSelect,
}: {
  director: DirectorRecord;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`relative flex min-h-32 flex-col rounded-lg border bg-white p-4 text-left shadow-sm transition hover:border-gold/70 ${
        selected ? 'border-gold ring-1 ring-gold' : 'border-gray-200'
      }`}
    >
      {selected && (
        <span className="absolute -top-2 right-4 rounded-sm bg-gold px-2 py-0.5 text-[10px] font-bold text-navy">
          SELECTED
        </span>
      )}
      <div className="flex items-start gap-3">
        <Avatar name={director.name} selected={selected} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-gray-900">{director.name}</p>
              <p className="text-xs font-semibold text-gray-700">Director</p>
              <p className="mt-0.5 truncate text-xs text-gray-500">{director.region}</p>
            </div>
            <StatusBadge status={director.status} />
          </div>
        </div>
      </div>
      <div className="mt-4 border-t border-gray-100 pt-3">
        <div className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-1.5 text-xs font-semibold text-gray-700">
            <Users className="h-3.5 w-3.5 text-gold" />
            {director.taggedCount} Tagged Members
          </span>
          <ArrowRight className="h-5 w-5 text-gold" />
        </div>
      </div>
    </button>
  );
}

function PersonRow({ person, indented = false }: { person: PersonRecord; indented?: boolean }) {
  return (
    <div className={`${indented ? 'ml-6 sm:ml-10' : ''}`}>
      <div className="grid grid-cols-1 items-center gap-4 rounded-md border border-gray-200 bg-white px-4 py-4 shadow-sm md:grid-cols-[1.6fr_1fr_1fr_0.7fr_0.7fr]">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar name={person.name} />
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-gray-900">{person.name}</p>
            <div className="mt-1">
              <RoleBadge role={person.role} />
            </div>
          </div>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase text-gray-500">Phone</p>
          <p className="mt-1 text-sm font-semibold text-gray-900">{person.phone}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase text-gray-500">Branch</p>
          <p className="mt-1 text-sm font-semibold text-gray-900">{person.branch}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase text-gray-500">Status</p>
          <p className="mt-1 flex items-center gap-1 text-sm font-semibold text-teal-700">
            <span className="h-1.5 w-1.5 rounded-full bg-teal-700" />
            {person.status === 'ACTIVE' ? 'Active' : person.status}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase text-gray-500">Tagged</p>
          <p className="mt-1 text-sm font-semibold text-gray-900">{person.taggedCount} Members</p>
        </div>
      </div>
    </div>
  );
}

const BranchMembersPage: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const { data: membersData } = useMembers({ limit: 500 });
  const members = useMemo(() => membersData?.data ?? [], [membersData?.data]);
  const branch = user?.admin?.branch;

  const directors = useMemo<DirectorRecord[]>(() => {
    const realDirectors = members.filter((member) => member.role === 'DIRECTOR').slice(0, 3);
    if (!realDirectors.length) return fallbackDirectors;

    const mapped = realDirectors.map((member, index) => ({
      ...memberToPerson(member, members, fallbackDirectors[index]?.taggedCount ?? 0),
      region: member.branch?.name ?? fallbackDirectors[index]?.region ?? 'Chennai Central',
    }));

    return [...mapped, ...fallbackDirectors.slice(mapped.length)].slice(0, 3);
  }, [members]);

  const [selectedDirectorId, setSelectedDirectorId] = useState(fallbackDirectors[0].id);
  const selectedDirector = directors.find((director) => director.id === selectedDirectorId) ?? directors[0];

  const executiveDirector = useMemo(() => {
    const real = members.find((member) => member.role === 'EXECUTIVE_DIRECTOR');
    return real ? memberToPerson(real, members, 12) : fallbackExecutive;
  }, [members]);

  const deputies = useMemo(() => {
    const real = members
      .filter((member) => member.role === 'DEPUTY_DIRECTOR' || member.role === 'SENIOR_MANAGER')
      .slice(0, 2)
      .map((member, index) => memberToPerson(member, members, fallbackDeputies[index]?.taggedCount ?? 0));

    return [...real, ...fallbackDeputies.slice(real.length)].slice(0, 2);
  }, [members]);

  const collapsedExecutive = useMemo(() => {
    const real = members.filter((member) => member.role === 'EXECUTIVE_DIRECTOR')[1];
    return real ? memberToPerson(real, members, 8) : fallbackCollapsedExecutive;
  }, [members]);

  const totalMembers = (membersData?.total ?? members.length) || 142;
  const activeMembers = members.filter((member) => member.status === 'ACTIVE').length || 128;
  const branchName = branch?.name ?? 'Chennai Central Branch';
  const branchLead = user?.admin?.fullName ?? selectedDirector?.name ?? 'R. Jayaraman';

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Branch Members</h1>
          <p className="mt-1 text-sm text-gray-600">Manage and view branch-level member hierarchy</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <input
              aria-label="Search member"
              placeholder="Member/Phone"
              className="h-10 w-full rounded-lg border border-amber-100 bg-amber-50/70 pl-9 pr-3 text-sm outline-none focus:border-gold focus:bg-white sm:w-72"
            />
          </div>
          <button className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-amber-100 bg-white px-4 text-sm font-semibold text-gray-700">
            <SlidersHorizontal className="h-4 w-4" />
            Role
          </button>
          <button className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-amber-100 bg-white px-4 text-sm font-semibold text-gray-700">
            <UserCheck className="h-4 w-4" />
            Status
          </button>
        </div>
      </div>

      <section className="rounded-lg border border-gray-200 border-t-gold border-t-2 bg-white p-5 shadow-sm">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[2fr_1fr_1fr_1fr_1fr] lg:items-center">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-gold">
              <Building2 className="h-7 w-7" />
            </div>
            <div>
              <h2 className="max-w-56 text-lg font-bold leading-tight text-gray-900">{branchName}</h2>
              <p className="mt-1 flex items-center gap-1 text-sm text-gray-600">
                <MapPin className="h-3.5 w-3.5" />
                {branchLocation(branch)}
              </p>
            </div>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">Branch Lead</p>
            <p className="mt-1 text-sm font-bold text-gray-900">{branchLead}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">Total Members</p>
            <p className="mt-1 text-sm font-bold text-gray-900">{totalMembers}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">Active Members</p>
            <p className="mt-1 text-sm font-bold text-gray-900">{activeMembers}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">Branch Status</p>
            <div className="mt-1">
              <StatusBadge status={branch?.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE'} />
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center gap-3">
          <h2 className="shrink-0 text-lg font-bold text-gray-900">Director Network</h2>
          <div className="h-px flex-1 bg-gray-200" />
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {directors.map((director) => (
            <DirectorCard
              key={director.id}
              director={director}
              selected={selectedDirector.id === director.id}
              onSelect={() => setSelectedDirectorId(director.id)}
            />
          ))}
        </div>
      </section>

      <section>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Chennai Central Team Network</h2>
            <p className="mt-1 text-xs text-gray-600">
              Hierarchy drill-down for Director: {selectedDirector.name}
            </p>
          </div>
          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 rounded-sm border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            <ChevronsUpDown className="h-3.5 w-3.5" />
            Collapse All
          </button>
        </div>

        <div className="rounded-lg bg-amber-50/70 p-4 sm:p-6">
          <div className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-gold">
            <GitBranch className="h-5 w-5" />
            Executive Directors
          </div>

          <PersonRow person={executiveDirector} />

          <div className="relative mt-4 pl-6 sm:pl-10">
            <div className="absolute bottom-2 left-2 top-0 w-px bg-gold/60 sm:left-4" />
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-gold">
              Deputy Directors ({deputies.length})
            </h3>
            <div className="space-y-4">
              {deputies.map((person, index) => (
                <div key={person.id} className="relative">
                  <div className="absolute left-[-1rem] top-8 h-px w-5 bg-gold/60 sm:left-[-1.5rem] sm:w-7" />
                  <PersonRow person={person} indented={index > 0} />
                </div>
              ))}
            </div>
            <button
              type="button"
              className="ml-6 mt-4 inline-flex items-center gap-2 text-xs font-semibold text-gold sm:ml-10"
            >
              <span className="h-px w-8 bg-gold/50" />
              Show 2 Business Managers & 1 Agent
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="mt-6 rounded-md border border-gray-200 bg-white px-4 py-4 shadow-sm">
            <div className="flex items-center gap-4">
              <Avatar name={collapsedExecutive.name} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-gray-900">{collapsedExecutive.name}</p>
                <RoleBadge role={collapsedExecutive.role} />
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold uppercase text-gray-500">Tagged</p>
                <p className="text-sm font-semibold text-gray-900">{collapsedExecutive.taggedCount} Members</p>
              </div>
              <ChevronDown className="h-5 w-5 text-gray-600" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default BranchMembersPage;
