import React, { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  CheckCircle2,
  ChevronDown,
  Clock,
  Filter,
  ImagePlus,
  MapPin,
  RefreshCw,
  Upload,
  UserPlus,
  X,
} from 'lucide-react';
import { useBranches } from '../../hooks/useBranches';
import { useCreateMember, useMembers, useUploadMemberPhoto } from '../../hooks/useMembers';
import { useUploadDocument } from '../../hooks/useDocuments';
import { useAuthStore } from '../../stores/auth.store';
import { Pagination } from '../../components/ui/Pagination';
import type { Branch, Member, Role, UserStatus } from '../../types';

const memberSchema = z.object({
  introNo: z.string().optional(),
  introName: z.string().optional(),
  fullName: z.string().min(2, 'Full name is required'),
  city: z.string().optional(),
  district: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  mobile1: z.string().min(10, 'Mobile 1 is required'),
  mobile2: z.string().optional(),
  dateOfBirth: z.string().optional(),
  weddingDate: z.string().optional(),
  bloodGroup: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  qualification: z.string().optional(),
  nomineeName: z.string().optional(),
  relationship: z.string().optional(),
  experience: z.string().optional(),
  panNo: z.string().optional(),
  aadhaarNo: z.string().optional(),
  parentGuardianName: z.string().optional(),
  role: z.enum(['DIRECTOR', 'EXECUTIVE_DIRECTOR', 'DEPUTY_DIRECTOR', 'SENIOR_MANAGER', 'BUSINESS_MANAGER', 'AGENT'] as const),
  branchId: z.string().min(1, 'Branch is required'),
  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
});

type MemberFormData = z.infer<typeof memberSchema>;

const roles: { value: Role; label: string }[] = [
  { value: 'DIRECTOR', label: 'Director' },
  { value: 'EXECUTIVE_DIRECTOR', label: 'Executive Director' },
  { value: 'DEPUTY_DIRECTOR', label: 'Deputy Director' },
  { value: 'SENIOR_MANAGER', label: 'Senior Manager' },
  { value: 'BUSINESS_MANAGER', label: 'Business Manager' },
  { value: 'AGENT', label: 'Agent' },
];

const statuses: { value: UserStatus; label: string }[] = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'INACTIVE', label: 'Inactive' },
];

const inputClass =
  'h-10 w-full border-0 border-b border-gray-200 bg-amber-50/30 px-0 text-sm font-medium text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-teal-700 focus:bg-white';

const selectClass =
  'h-10 w-full appearance-none border-0 border-b border-gray-200 bg-amber-50/30 px-0 pr-8 text-sm font-medium text-gray-800 outline-none transition focus:border-teal-700 focus:bg-white';

function formatRole(role: Role) {
  return roles.find((item) => item.value === role)?.label ?? role.replace(/_/g, ' ');
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function memberInitials(name: string) {
  return (
    name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('') || 'M'
  );
}

function generateTempPassword(fullName: string, phone: string) {
  const cleanName = fullName.replace(/[^a-zA-Z]/g, '').slice(0, 4) || 'User';
  const phoneTail = phone.replace(/\D/g, '').slice(-4) || '0000';
  const randomTail =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().slice(0, 6)
      : Math.random().toString(36).slice(2, 8);

  return `${cleanName}@${phoneTail}${randomTail}`;
}

const Field: React.FC<{
  label: string;
  error?: string;
  children: React.ReactNode;
}> = ({ label, error, children }) => (
  <label className="block">
    <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">{label}</span>
    {children}
    {error && <span className="mt-1 block text-xs font-semibold text-red-600">{error}</span>}
  </label>
);

const SelectField: React.FC<{
  label: string;
  error?: string;
  children: React.ReactNode;
}> = ({ label, error, children }) => (
  <Field label={label} error={error}>
    <span className="relative block">
      {children}
      <ChevronDown className="pointer-events-none absolute right-0 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
    </span>
  </Field>
);

const FileDrop: React.FC<{
  label: string;
  helper: string;
  icon: React.ReactNode;
  file: File | null;
  accept: string;
  onChange: (file: File | null) => void;
}> = ({ label, helper, icon, file, accept, onChange }) => (
  <label className="flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-amber-200 bg-white px-4 py-5 text-center transition hover:border-gold hover:bg-amber-50/40">
    <input
      type="file"
      accept={accept}
      className="sr-only"
      onChange={(event) => onChange(event.target.files?.[0] ?? null)}
    />
    <span className="text-gray-500">{icon}</span>
    <span className="mt-2 text-sm font-bold text-teal-700">{label}</span>
    <span className="mt-1 text-xs text-gray-500">{file ? file.name : helper}</span>
  </label>
);

const CreateMemberModal: React.FC<{
  branches: Branch[];
  defaultBranchId: string;
  onClose: () => void;
}> = ({ branches, defaultBranchId, onClose }) => {
  const createMember = useCreateMember();
  const uploadPhoto = useUploadMemberPhoto();
  const uploadDocument = useUploadDocument();
  const [photo, setPhoto] = useState<File | null>(null);
  const [idProof, setIdProof] = useState<File | null>(null);
  const [submitError, setSubmitError] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<MemberFormData>({
    resolver: zodResolver(memberSchema),
    defaultValues: {
      role: 'AGENT',
      branchId: defaultBranchId,
    },
  });

  const isSaving = isSubmitting || createMember.isPending || uploadPhoto.isPending || uploadDocument.isPending;

  const discardDraft = () => {
    reset({ role: 'AGENT', branchId: defaultBranchId });
    setPhoto(null);
    setIdProof(null);
    setSubmitError('');
    onClose();
  };

  const onSubmit = async (data: MemberFormData) => {
    setSubmitError('');

    try {
      const address = [data.addressLine1, data.addressLine2].filter(Boolean).join(', ');
      const member = await createMember.mutateAsync({
        fullName: data.fullName,
        phone: data.mobile1,
        email: data.email || undefined,
        role: data.role,
        branchId: data.branchId,
        codeNumber: data.introNo || undefined,
        password: generateTempPassword(data.fullName, data.mobile1),
        dateOfBirth: data.dateOfBirth || undefined,
        bloodGroup: data.bloodGroup || undefined,
        qualification: data.qualification || undefined,
        experience: data.experience || undefined,
        alternatePhone: data.mobile2 || undefined,
        address: address || undefined,
        city: data.city || undefined,
        district: data.district || undefined,
        state: data.state || undefined,
        pincode: data.pincode || undefined,
        panNumber: data.panNo || undefined,
        aadhaarNumber: data.aadhaarNo || undefined,
        introName: data.introName || undefined,
        nomineeName: data.nomineeName || undefined,
        nomineeRelation: data.relationship || undefined,
      });

      if (photo) {
        await uploadPhoto.mutateAsync({ id: member.id, file: photo });
      }

      if (idProof) {
        await uploadDocument.mutateAsync({
          entityType: 'member',
          entityId: member.id,
          documentType: 'idProof',
          file: idProof,
        });
      }

      onClose();
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      setSubmitError(error?.response?.data?.message ?? 'Failed to create member. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-[1px]">
      <div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-lg bg-white shadow-2xl">
        <div className="flex items-start justify-between bg-amber-50 px-6 py-4">
          <div className="flex items-start gap-3">
            <UserPlus className="mt-1 h-5 w-5 text-teal-700" />
            <div>
              <h2 className="text-xl font-bold text-gold">Create New Member</h2>
              <p className="text-sm text-gray-600">Register a new person into the Sri Thangam network.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={discardDraft}
            className="rounded-md p-1 text-gray-500 transition hover:bg-white hover:text-gray-900"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
            <div className="grid grid-cols-1 gap-x-8 gap-y-5 md:grid-cols-2 lg:grid-cols-3">
              <Field label="Intro No">
                <input {...register('introNo')} className={inputClass} placeholder="001" />
              </Field>
              <Field label="City">
                <input {...register('city')} className={inputClass} placeholder="Chennai" />
              </Field>
              <Field label="District">
                <input {...register('district')} className={inputClass} placeholder="Chennai" />
              </Field>
              <Field label="Intro Name">
                <input {...register('introName')} className={inputClass} placeholder="Introduced by" />
              </Field>
              <Field label="State">
                <input {...register('state')} className={inputClass} placeholder="Tamil Nadu" />
              </Field>
              <Field label="Pincode">
                <input {...register('pincode')} className={inputClass} placeholder="600032" maxLength={6} />
              </Field>
              <Field label="Full Name" error={errors.fullName?.message}>
                <input {...register('fullName')} className={inputClass} placeholder="Member name" />
              </Field>
              <Field label="Mobile 1" error={errors.mobile1?.message}>
                <input {...register('mobile1')} className={inputClass} placeholder="Primary mobile" />
              </Field>
              <Field label="Mobile 2">
                <input {...register('mobile2')} className={inputClass} placeholder="Alternate mobile" />
              </Field>
              <Field label="Date of Birth">
                <input type="date" {...register('dateOfBirth')} className={inputClass} />
              </Field>
              <Field label="Wedding Date">
                <input type="date" {...register('weddingDate')} className={inputClass} />
              </Field>
              <SelectField label="Blood Group">
                <select {...register('bloodGroup')} className={selectClass}>
                  <option value="">Select blood group</option>
                  {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map((group) => (
                    <option key={group} value={group}>
                      {group}
                    </option>
                  ))}
                </select>
              </SelectField>
              <Field label="Email" error={errors.email?.message}>
                <input type="email" {...register('email')} className={inputClass} placeholder="name@example.com" />
              </Field>
              <Field label="Qualification">
                <input {...register('qualification')} className={inputClass} placeholder="B.Sc Computer Science" />
              </Field>
              <Field label="Nominee Name">
                <input {...register('nomineeName')} className={inputClass} placeholder="Nominee name" />
              </Field>
              <Field label="Relationship">
                <input {...register('relationship')} className={inputClass} placeholder="Relationship" />
              </Field>
              <Field label="Experience (Years)">
                <input {...register('experience')} className={inputClass} placeholder="5" />
              </Field>
              <Field label="PAN No">
                <input {...register('panNo')} className={inputClass} placeholder="ABCDE1234F" maxLength={10} />
              </Field>
              <Field label="Aadhaar No">
                <input {...register('aadhaarNo')} className={inputClass} placeholder="12 digit Aadhaar" maxLength={12} />
              </Field>
              <Field label="Parent/Guardian Name">
                <input {...register('parentGuardianName')} className={inputClass} placeholder="Parent or guardian" />
              </Field>
              <SelectField label="Role" error={errors.role?.message}>
                <select {...register('role')} className={selectClass}>
                  {roles.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </SelectField>
              <SelectField label="Branch" error={errors.branchId?.message}>
                <select {...register('branchId')} className={selectClass}>
                  <option value="">Select Branch</option>
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              </SelectField>
              <Field label="Address Line 1">
                <input {...register('addressLine1')} className={inputClass} placeholder="Door No, Street" />
              </Field>
              <Field label="Address Line 2">
                <input {...register('addressLine2')} className={inputClass} placeholder="Area, Landmark" />
              </Field>
            </div>

            <div className="mt-7 grid grid-cols-1 gap-5 md:grid-cols-2">
              <FileDrop
                label="Upload Photo"
                helper="JPG or PNG (Max 2MB)"
                icon={<ImagePlus className="h-7 w-7" />}
                file={photo}
                accept=".jpg,.jpeg,.png"
                onChange={setPhoto}
              />
              <FileDrop
                label="Upload ID Proof"
                helper="PDF or Image (Aadhaar/PAN)"
                icon={<Upload className="h-7 w-7" />}
                file={idProof}
                accept=".jpg,.jpeg,.png,.pdf"
                onChange={setIdProof}
              />
            </div>

            {submitError && (
              <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {submitError}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-4 border-t border-amber-100 bg-amber-50 px-6 py-4">
            <button
              type="button"
              onClick={discardDraft}
              className="rounded-lg px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-white"
            >
              Discard Draft
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-6 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <CheckCircle2 className="h-4 w-4" />
              {isSaving ? 'Creating...' : 'Create Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const StatusPill: React.FC<{ status: UserStatus }> = ({ status }) => {
  const styles: Record<UserStatus, string> = {
    ACTIVE: 'text-teal-700',
    PENDING: 'text-amber-700',
    INACTIVE: 'text-gray-500',
  };

  return (
    <span className={`inline-flex items-center gap-2 text-xs font-bold ${styles[status]}`}>
      <span className="h-2 w-2 rounded-full bg-current" />
      {status}
    </span>
  );
};

const RolePill: React.FC<{ role: Role }> = ({ role }) => (
  <span className="inline-flex max-w-28 rounded-md bg-amber-50 px-2 py-1 text-xs font-semibold leading-tight text-gold">
    {formatRole(role)}
  </span>
);

const SummaryCard: React.FC<{
  title: string;
  value: string | number;
  helper?: string;
  icon: React.ReactNode;
  children?: React.ReactNode;
}> = ({ title, value, helper, icon, children }) => (
  <div className="rounded-lg border border-gray-200 bg-amber-50/70 p-5 shadow-sm">
    <div className="mb-4 flex items-center gap-3">
      <span className="text-teal-700">{icon}</span>
      <p className="text-sm font-bold text-teal-800">{title}</p>
    </div>
    <p className="text-3xl font-bold text-gray-900">{value}</p>
    {helper && <p className="mt-2 text-xs font-semibold text-teal-700">{helper}</p>}
    {children}
  </div>
);

const AdminMembersListPage: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const [page, setPage] = useState(1);
  const [role, setRole] = useState<Role | ''>('');
  const [status, setStatus] = useState<UserStatus | ''>('');
  const [branchId, setBranchId] = useState('');
  const [createOpen, setCreateOpen] = useState(false);

  const { data: branchesResponse } = useBranches({ limit: 100 });
  const branches = useMemo(() => {
    const list = branchesResponse?.data ?? [];
    const adminBranch = user?.admin?.branch;
    if (!adminBranch || list.some((branch) => branch.id === adminBranch.id)) return list;
    return [adminBranch, ...list];
  }, [branchesResponse?.data, user?.admin?.branch]);

  const defaultBranchId = user?.admin?.branchId ?? branches[0]?.id ?? '';
  const activeBranchId = branchId || undefined;

  const { data, isLoading, refetch } = useMembers({
    page,
    limit: 20,
    role: role || undefined,
    status: status || undefined,
    branchId: activeBranchId,
  });

  const { data: summaryResponse } = useMembers({ limit: 1000 });
  const summaryMembers = summaryResponse?.data ?? [];

  const newlyJoined = summaryMembers.filter((member) => {
    const joined = new Date(member.createdAt);
    if (Number.isNaN(joined.getTime())) return false;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return joined >= thirtyDaysAgo;
  }).length;

  const pendingApproval = summaryMembers.filter((member) => member.status === 'PENDING').length;
  const activeMembersByRegion = Object.values(
    summaryMembers
      .filter((member) => member.status === 'ACTIVE')
      .reduce<Record<string, { name: string; count: number }>>((acc, member) => {
        const key = member.branch?.id ?? member.branchId ?? 'unknown';
        const name = member.branch?.name ?? 'Unassigned';
        acc[key] = acc[key] ?? { name, count: 0 };
        acc[key].count += 1;
        return acc;
      }, {}),
  )
    .sort((a, b) => b.count - a.count)
    .slice(0, 4);
  const maxRegionCount = Math.max(...activeMembersByRegion.map((item) => item.count), 1);

  const resetFilters = () => {
    setRole('');
    setStatus('');
    setBranchId('');
    setPage(1);
  };

  const closeCreateModal = () => {
    setCreateOpen(false);
    refetch();
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Members Management</h1>
          <p className="mt-1 max-w-2xl text-sm text-gray-600">
            Manage branch network members and profile records for the entire enterprise.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gold px-5 py-3 text-sm font-bold text-navy shadow-sm transition hover:bg-gold-light sm:w-auto"
        >
          <UserPlus className="h-4 w-4" />
          Create New Member
        </button>
      </div>

      <div className="rounded-lg border border-gray-200 bg-amber-50/50 p-4 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-3">
            <SelectField label="Role Filter">
              <select
                value={role}
                onChange={(event) => {
                  setRole(event.target.value as Role | '');
                  setPage(1);
                }}
                className="h-11 w-full appearance-none rounded-lg border border-amber-100 bg-white px-3 pr-9 text-sm font-semibold text-gray-700 outline-none focus:border-gold focus:ring-2 focus:ring-gold/20"
              >
                <option value="">All Roles</option>
                {roles.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </SelectField>
            <SelectField label="Member Status">
              <select
                value={status}
                onChange={(event) => {
                  setStatus(event.target.value as UserStatus | '');
                  setPage(1);
                }}
                className="h-11 w-full appearance-none rounded-lg border border-amber-100 bg-white px-3 pr-9 text-sm font-semibold text-gray-700 outline-none focus:border-gold focus:ring-2 focus:ring-gold/20"
              >
                <option value="">All Status</option>
                {statuses.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </SelectField>
            <SelectField label="Branch Network">
              <select
                value={branchId}
                onChange={(event) => {
                  setBranchId(event.target.value);
                  setPage(1);
                }}
                className="h-11 w-full appearance-none rounded-lg border border-amber-100 bg-white px-3 pr-9 text-sm font-semibold text-gray-700 outline-none focus:border-gold focus:ring-2 focus:ring-gold/20"
              >
                <option value="">All Branches</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </SelectField>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-2 rounded-lg border border-gold/40 bg-white px-4 py-2.5 text-sm font-semibold text-gold transition hover:bg-amber-50"
            >
              <Filter className="h-4 w-4" />
              Advanced Filters
            </button>
            <button
              type="button"
              onClick={() => refetch()}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-amber-100 bg-white text-gold transition hover:bg-amber-50"
              aria-label="Refresh members"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="bg-stone-100 text-xs font-bold uppercase tracking-wide text-gray-600">
              <tr>
                <th className="px-5 py-4 text-left">Photo</th>
                <th className="px-5 py-4 text-left">Member ID</th>
                <th className="px-5 py-4 text-left">Full Name</th>
                <th className="px-5 py-4 text-left">Contact</th>
                <th className="px-5 py-4 text-left">Role</th>
                <th className="px-5 py-4 text-left">Branch</th>
                <th className="px-5 py-4 text-left">Joined Date</th>
                <th className="px-5 py-4 text-left">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-gray-500">
                    Loading members...
                  </td>
                </tr>
              ) : !data?.data?.length ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-gray-500">
                    No members found
                  </td>
                </tr>
              ) : (
                data.data.map((member: Member) => (
                  <tr key={member.id} className="transition hover:bg-amber-50/30">
                    <td className="px-5 py-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-gray-800 text-xs font-bold text-white">
                        {memberInitials(member.fullName)}
                      </div>
                    </td>
                    <td className="px-5 py-4 font-mono text-xs font-semibold text-gray-700">{member.memberId}</td>
                    <td className="px-5 py-4">
                      <p className="font-bold text-gray-900">{member.fullName}</p>
                      {member.email && <p className="mt-0.5 text-xs text-gray-500">{member.email}</p>}
                    </td>
                    <td className="px-5 py-4 font-semibold text-gray-700">{member.phone}</td>
                    <td className="px-5 py-4">
                      <RolePill role={member.role} />
                    </td>
                    <td className="px-5 py-4 font-semibold text-gray-700">
                      {member.branch?.name ?? '-'}
                    </td>
                    <td className="px-5 py-4 text-gray-700">{formatDate(member.createdAt)}</td>
                    <td className="px-5 py-4">
                      <StatusPill status={member.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {data && <Pagination page={page} total={data.total} limit={data.limit} onPageChange={setPage} />}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1fr_2fr]">
        <SummaryCard
          title="Newly Joined"
          value={newlyJoined}
          helper="+ last 30 days"
          icon={<UserPlus className="h-5 w-5" />}
        />
        <SummaryCard
          title="Pending Approval"
          value={pendingApproval.toString().padStart(2, '0')}
          helper="Action required"
          icon={<Clock className="h-5 w-5" />}
        />
        <SummaryCard
          title="Active Members by Region"
          value=""
          icon={<MapPin className="h-5 w-5" />}
        >
          <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {(activeMembersByRegion.length ? activeMembersByRegion : [{ name: 'No active members', count: 0 }]).map(
              (region) => (
                <div key={region.name} className="min-w-0">
                  <div className="flex h-16 items-end rounded bg-white px-2 pb-2">
                    <div
                      className="w-full rounded-sm bg-gold"
                      style={{ height: `${Math.max((region.count / maxRegionCount) * 100, region.count ? 18 : 4)}%` }}
                    />
                  </div>
                  <p className="mt-2 truncate text-xs font-semibold text-gray-600">{region.name}</p>
                  <p className="text-xs font-bold text-gray-900">{region.count}</p>
                </div>
              ),
            )}
          </div>
        </SummaryCard>
      </div>

      {createOpen && (
        <CreateMemberModal branches={branches} defaultBranchId={defaultBranchId} onClose={closeCreateModal} />
      )}
    </div>
  );
};

export default AdminMembersListPage;
