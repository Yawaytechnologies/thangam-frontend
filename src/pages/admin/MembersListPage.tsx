import React, { useEffect, useMemo, useState } from 'react';
import { useForm, useWatch, type FieldErrors } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import {
  CheckCircle2,
  ChevronDown,
  Eye,
  EyeOff,
  Filter,
  ImagePlus,
  Pencil,
  RefreshCw,
  Upload,
  UserPlus,
  X,
} from 'lucide-react';
import { useBranches } from '../../hooks/useBranches';
import { useCreateMember, useMembers, useUpdateMember, useUploadMemberPhoto } from '../../hooks/useMembers';
import { useUploadDocument } from '../../hooks/useDocuments';
import { useAuthStore } from '../../stores/auth.store';
import { Pagination } from '../../components/ui/Pagination';
import { SearchableSelect, type SearchableSelectOption } from '../../components/ui/SearchableSelect';
import { resolveFileUrl } from '../../lib/file-url';
import { extractEntityId } from '../../lib/upload-helpers';
import { getApiError } from '../../lib/api-error';
import { Modal } from '../../components/ui/Modal';
import type { Branch, Member, Role, UserStatus } from '../../types';

const parentRolesByRole: Partial<Record<Role, Role[]>> = {
  EXECUTIVE_DIRECTOR: ['DIRECTOR'],
  DEPUTY_DIRECTOR: ['EXECUTIVE_DIRECTOR'],
  SENIOR_MANAGER: ['DEPUTY_DIRECTOR'],
  BUSINESS_MANAGER: ['SENIOR_MANAGER'],
  AGENT: ['BUSINESS_MANAGER'],
};

const namePattern = /^[A-Za-z]+(?:[ .'-][A-Za-z]+)*$/;
const mobilePattern = /^[6-9]\d{9}$/;
const pincodePattern = /^\d{6}$/;
const passwordPattern = /^(?=.*[A-Za-z])(?=.*\d)\S{6,}$/;
const optionalName = (label: string) =>
  z.string().trim().refine((value) => !value || namePattern.test(value), {
    message: `${label} should contain only letters and spaces`,
  });

const memberFields = z.object({
  introNo: z.string().optional(),
  introName: optionalName('Intro name').optional(),
  fullName: z.string().trim().min(2, 'Full name is required').regex(namePattern, 'Full name should contain only letters and spaces'),
  city: z.string().optional(),
  district: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().trim().refine((value) => !value || pincodePattern.test(value), {
    message: 'Enter a valid 6-digit pincode',
  }),
  mobile1: z.string().trim().regex(mobilePattern, 'Mobile number must be 10 digits and start with 6, 7, 8, or 9'),
  mobile2: z.string().trim().refine((value) => !value || mobilePattern.test(value), {
    message: 'Mobile number must be 10 digits and start with 6, 7, 8, or 9',
  }),
  password: z.string().regex(passwordPattern, 'Password must be at least 6 characters with letters and numbers'),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  weddingDate: z.string().optional(),
  bloodGroup: z.string().optional(),
  email: z.string().trim().min(1, 'Email is required').email('Enter a valid email address'),
  qualification: z.string().optional(),
  nomineeName: z.string().trim().min(2, 'Nominee name is required').regex(namePattern, 'Nominee name should contain only letters and spaces'),
  relationship: z.string().trim().min(2, 'Relationship is required').regex(namePattern, 'Relationship should contain only letters and spaces'),
  nomineePhone: z.string().trim().regex(mobilePattern, 'Nominee mobile must be 10 digits and start with 6, 7, 8, or 9'),
  experience: z.string().optional(),
  panNo: z.string().trim().regex(/^[A-Za-z]{5}\d{4}[A-Za-z]$/, 'Enter a valid PAN number'),
  aadhaarNo: z.string().trim().regex(/^\d{12}$/, 'Enter a valid 12-digit Aadhaar number'),
  parentGuardianName: optionalName('Parent/guardian name').optional(),
  role: z.enum(['DIRECTOR', 'EXECUTIVE_DIRECTOR', 'DEPUTY_DIRECTOR', 'SENIOR_MANAGER', 'BUSINESS_MANAGER', 'AGENT'] as const),
  branchId: z.string().min(1, 'Branch is required'),
  reportsToId: z.string().optional(),
  status: z.enum(['ACTIVE', 'PENDING', 'INACTIVE']).optional(),
  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
});

const addReportingValidation = (schema: typeof memberFields) => schema.superRefine((data, ctx) => {
  if (data.role !== 'DIRECTOR' && !data.reportsToId) {
    ctx.addIssue({
      code: 'custom',
      path: ['reportsToId'],
      message: 'Please select reporting member.',
    });
  }
});

const memberSchema = addReportingValidation(memberFields);

const editMemberSchema = memberFields.extend({
  password: z.string().refine((value) => !value || passwordPattern.test(value), {
    message: 'Password must be at least 6 characters with letters and numbers',
  }).optional(),
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

function memberOptionLabel(member: Member) {
  return `${member.memberId} — ${member.fullName} — ${formatRole(member.role)}`;
}

function memberSearchText(member: Member) {
  return `${member.memberId} ${member.fullName} ${member.phone} ${member.role} ${formatRole(member.role)}`.toLowerCase();
}

function introNumberFor(member?: Member) {
  return member?.codeNumber || member?.memberId || '';
}

function getStringField(value: unknown) {
  return typeof value === 'string' ? value : '';
}

function memberPhotoUrl(member: Member) {
  const extra = member as Member & Record<string, unknown>;
  return resolveFileUrl(
    member.photo ||
      getStringField(extra.photoUrl) ||
      getStringField(extra.photo_url) ||
      getStringField(extra.profileImageUrl) ||
      getStringField(extra.profile_image_url) ||
      getStringField(extra.profileImage) ||
      getStringField(extra.profilePhoto) ||
      getStringField(extra.member_photo) ||
      getStringField(extra.image_url) ||
      getStringField(extra.avatar),
  );
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

const Field: React.FC<{
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}> = ({ label, error, required = false, children }) => (
  <label className="block">
    <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">
      {label}
      {required && <span className="ml-1 text-red-600" aria-hidden="true">*</span>}
    </span>
    {children}
    {error && <span className="mt-1 block text-xs font-semibold text-red-600">{error}</span>}
  </label>
);

const SelectField: React.FC<{
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}> = ({ label, error, required = false, children }) => (
  <Field label={label} error={error} required={required}>
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
  maxSizeBytes: number;
  onChange: (file: File | null) => void;
}> = ({ label, helper, icon, file, accept, maxSizeBytes, onChange }) => (
  <label className="flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-amber-200 bg-white px-4 py-5 text-center transition hover:border-gold hover:bg-amber-50/40">
    <input
      type="file"
      accept={accept}
      className="sr-only"
      onChange={(event) => {
        const selectedFile = event.target.files?.[0] ?? null;
        onChange(selectedFile && selectedFile.size <= maxSizeBytes ? selectedFile : null);
        event.target.value = '';
      }}
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
  member?: Member;
  fullPage?: boolean;
}> = ({ branches, defaultBranchId, onClose, member, fullPage = false }) => {
  const isEdit = Boolean(member);
  const createMember = useCreateMember();
  const updateMember = useUpdateMember();
  const uploadPhoto = useUploadMemberPhoto();
  const uploadDocument = useUploadDocument();
  const { data: reportsToResponse, isLoading: reportsToLoading } = useMembers({ limit: 1000 });
  const [photo, setPhoto] = useState<File | null>(null);
  const [idProof, setIdProof] = useState<File | null>(null);
  const [submitError, setSubmitError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const memberExtra = (member ?? {}) as Member & Record<string, unknown>;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<MemberFormData>({
    resolver: zodResolver(isEdit ? editMemberSchema : memberSchema) as never,
    defaultValues: {
      introNo: member?.codeNumber ?? '',
      introName: member?.introName ?? getStringField(memberExtra.introName),
      fullName: member?.fullName ?? '',
      city: member?.city ?? '',
      district: member?.district ?? '',
      state: member?.state ?? '',
      pincode: member?.pincode ?? '',
      mobile1: member?.phone ?? '',
      mobile2: member?.alternatePhone ?? '',
      password: '',
      dateOfBirth: member?.dateOfBirth ?? '',
      bloodGroup: member?.bloodGroup ?? '',
      email: member?.email ?? '',
      qualification: member?.qualification ?? '',
      nomineeName: member?.nomineeName ?? '',
      relationship: member?.nomineeRelation ?? '',
      nomineePhone: member?.nomineePhone ?? '',
      experience: member?.experience ?? '',
      panNo: member?.panNumber ?? '',
      aadhaarNo: member?.aadhaarNumber ?? '',
      parentGuardianName: '',
      role: member?.role && member.role !== 'SUPER_ADMIN' && member.role !== 'ADMIN'
        ? member.role
        : 'AGENT',
      branchId: member?.branchId ?? defaultBranchId,
      reportsToId: member?.reportsToId ?? '',
      status: member?.status ?? 'ACTIVE',
      addressLine1: member?.address ?? '',
      addressLine2: '',
    },
  });

  const reportsToMembers = useMemo(
    () => reportsToResponse?.data ?? [],
    [reportsToResponse?.data],
  );
  const selectedReportsToId = useWatch({
    control,
    name: 'reportsToId',
  }) ?? '';
  const selectedIntroNo = useWatch({
    control,
    name: 'introNo',
  }) ?? '';
  const selectedRole = useWatch({
    control,
    name: 'role',
  });
  const selectedBranchId = useWatch({
    control,
    name: 'branchId',
  }) ?? defaultBranchId;
  const selectedStatus = useWatch({
    control,
    name: 'status',
  }) ?? 'ACTIVE';
  const selectedIntroMember = useMemo(
    () => reportsToMembers.find((member) => introNumberFor(member) === selectedIntroNo),
    [reportsToMembers, selectedIntroNo],
  );

  const introMembers = useMemo(() => {
    return reportsToMembers.filter((member) => {
      if (isEdit && member.id === memberExtra.id) return false;
      return !selectedBranchId || member.branchId === selectedBranchId;
    });
  }, [isEdit, memberExtra.id, reportsToMembers, selectedBranchId]);

  const introOptions = useMemo<SearchableSelectOption[]>(() => {
    return introMembers.reduce<SearchableSelectOption[]>((options, member) => {
      const introNo = introNumberFor(member);
      if (!introNo) return options;

      options.push({
        value: introNo,
        label: `${introNo} - ${member.fullName} - ${formatRole(member.role)}`,
        searchText: `${introNo} ${member.memberId} ${member.fullName} ${member.phone} ${member.role} ${formatRole(member.role)}`.toLowerCase(),
      });
      return options;
    }, []);
  }, [introMembers]);

  const eligibleReportsToMembers = useMemo(() => {
    const allowedRoles = parentRolesByRole[selectedRole] ?? [];
    if (!allowedRoles.length) return [];

    return reportsToMembers.filter((member) => {
      const sameBranch = !selectedBranchId || member.branchId === selectedBranchId;
      return sameBranch && allowedRoles.includes(member.role);
    });
  }, [reportsToMembers, selectedBranchId, selectedRole]);

  const reportsToOptions = useMemo<SearchableSelectOption[]>(() => {
    return eligibleReportsToMembers.map((member) => ({
      value: member.id,
      label: memberOptionLabel(member),
      searchText: memberSearchText(member),
    }));
  }, [eligibleReportsToMembers]);

  useEffect(() => {
    if (selectedRole === 'DIRECTOR') {
      if (selectedReportsToId) setValue('reportsToId', '', { shouldDirty: true, shouldValidate: true });
      return;
    }

    if (
      selectedReportsToId &&
      !eligibleReportsToMembers.some((member) => member.id === selectedReportsToId)
    ) {
      setValue('reportsToId', '', { shouldDirty: true, shouldValidate: true });
    }
  }, [eligibleReportsToMembers, selectedReportsToId, selectedRole, setValue]);

  useEffect(() => {
    setValue('introName', selectedIntroMember?.fullName ?? '', { shouldDirty: true, shouldValidate: true });
  }, [selectedIntroMember, setValue]);

  const isSaving = isSubmitting || createMember.isPending || updateMember.isPending || uploadPhoto.isPending || uploadDocument.isPending;

  const discardDraft = () => {
    reset({ role: 'AGENT', branchId: defaultBranchId, reportsToId: '' });
    setPhoto(null);
    setIdProof(null);
    setSubmitError('');
    onClose();
  };

  const onSubmit = async (data: MemberFormData) => {
    setSubmitError('');

    if (!isEdit && data.role !== 'DIRECTOR' && !data.reportsToId) {
      toast.error('Please select reporting member.');
      setSubmitError('Please select reporting member.');
      return;
    }

    try {
      const address = [data.addressLine1, data.addressLine2].filter(Boolean).join(', ');
      const payload = {
        fullName: data.fullName,
        phone: data.mobile1,
        email: data.email || undefined,
        role: data.role,
        branchId: data.branchId,
        reportsToId: data.reportsToId || undefined,
        ...(isEdit && data.status ? { status: data.status } : {}),
        codeNumber: data.introNo || undefined,
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
        nomineePhone: data.nomineePhone || undefined,
      };
      const savedMember = isEdit
        ? await updateMember.mutateAsync({ id: member!.id, data: payload })
        : await createMember.mutateAsync({ ...payload, password: data.password });

      const memberId = extractEntityId(savedMember, ['member']) || member?.id || '';
      if ((photo || idProof) && !memberId) {
        throw new Error(`${isEdit ? 'Member updated' : 'Member created'}, but file upload failed. Please retry upload.`);
      }

      try {
        if (photo) {
          await uploadPhoto.mutateAsync({ id: memberId, file: photo });
        }

        if (idProof) {
          await uploadDocument.mutateAsync({
            entityType: 'member',
            entityId: memberId,
            documentType: 'AADHAAR',
            file: idProof,
          });
        }
      } catch (error) {
        throw new Error(
          `${isEdit ? 'Member updated' : 'Member created'}, but file upload failed: ${getApiError(error)}`,
          { cause: error },
        );
      }

      onClose();
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      setSubmitError(
        error?.response?.data?.message ??
          (err instanceof Error ? err.message : `Failed to ${isEdit ? 'update' : 'create'} member. Please try again.`),
      );
    }
  };

  const onInvalidSubmit = (formErrors: FieldErrors<MemberFormData>) => {
    const message = 'Please correct the highlighted fields before creating the member.';
    setSubmitError(message);
    toast.error(message);

    if (formErrors.reportsToId?.message) {
      toast.error('Please select reporting member.');
      setSubmitError('Please select reporting member.');
    }
  };

  return (
    <div className={fullPage ? 'min-h-[calc(100vh-5rem)] bg-gray-50 p-4 sm:p-6' : 'fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-[1px]'}>
      <div className={fullPage ? 'mx-auto flex min-h-[calc(100vh-8rem)] w-full max-w-6xl flex-col overflow-hidden rounded-lg bg-white shadow-sm' : 'flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-lg bg-white shadow-2xl'}>
        <div className="flex items-start justify-between bg-amber-50 px-6 py-4">
          <div className="flex items-start gap-3">
            <UserPlus className="mt-1 h-5 w-5 text-teal-700" />
            <div>
              <h2 className="text-xl font-bold text-gold">{isEdit ? 'Edit Member' : 'Create New Member'}</h2>
              <p className="text-sm text-gray-600">{isEdit ? 'Update the member profile details.' : 'Register a new person into the Sri Thangam network.'}</p>
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

        <form onSubmit={handleSubmit(onSubmit, onInvalidSubmit)} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
            <div className="grid grid-cols-1 gap-x-8 gap-y-5 md:grid-cols-2 lg:grid-cols-3">
              {isEdit && (
                <div>
                  <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">Member Status</span>
                  <div className="flex min-h-10 items-center justify-between gap-3 border-b border-gray-200">
                    <input type="hidden" {...register('status')} />
                    <span className={`text-sm font-semibold ${selectedStatus === 'ACTIVE' ? 'text-teal-700' : 'text-gray-500'}`}>
                      {selectedStatus === 'ACTIVE' ? 'Active' : selectedStatus === 'PENDING' ? 'Pending' : 'Inactive'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setValue('status', selectedStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE', { shouldDirty: true })}
                      role="switch"
                      aria-checked={selectedStatus === 'ACTIVE'}
                      aria-label={selectedStatus === 'ACTIVE' ? 'Deactivate member' : 'Activate member'}
                      title={selectedStatus === 'ACTIVE' ? 'Deactivate member' : 'Activate member'}
                      disabled={isSaving}
                      className={`relative h-8 w-14 flex-shrink-0 rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${selectedStatus === 'ACTIVE' ? 'bg-gold' : 'bg-gray-300'}`}
                    >
                      <span
                        className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-[left] ${selectedStatus === 'ACTIVE' ? 'left-7' : 'left-1'}`}
                      />
                    </button>
                  </div>
                </div>
              )}
              <Field label="Intro No">
                <SearchableSelect
                  value={selectedIntroNo}
                  options={introOptions}
                  loading={reportsToLoading}
                  placeholder={introOptions.length ? 'Search or select intro no' : 'No members found'}
                  onChange={(value) => setValue('introNo', value, { shouldDirty: true, shouldValidate: true })}
                />
                <input type="hidden" {...register('introNo')} />
              </Field>
              <Field label="City">
                <input {...register('city')} className={inputClass} placeholder="Chennai" />
              </Field>
              <Field label="District">
                <input {...register('district')} className={inputClass} placeholder="Chennai" />
              </Field>
              <Field label="Intro Name">
                <input
                  {...register('introName')}
                  className={`${inputClass} cursor-not-allowed text-gray-500`}
                  placeholder="Auto-filled from Intro No"
                  readOnly
                />
              </Field>
              <Field label="State">
                <input {...register('state')} className={inputClass} placeholder="Tamil Nadu" />
              </Field>
              <Field label="Pincode" error={errors.pincode?.message}>
                <input {...register('pincode')} className={inputClass} placeholder="600032" maxLength={6} inputMode="numeric" />
              </Field>
              <Field label="Full Name" required error={errors.fullName?.message}>
                <input {...register('fullName')} className={inputClass} placeholder="Member name" />
              </Field>
              <Field label="Mobile 1" required error={errors.mobile1?.message}>
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  {...register('mobile1')}
                  className={inputClass}
                  placeholder="10-digit primary mobile"
                />
              </Field>
              <Field label="Mobile 2" error={errors.mobile2?.message}>
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  {...register('mobile2')}
                  className={inputClass}
                  placeholder="10-digit alternate mobile"
                />
              </Field>
              <Field label="Login Password" required={!isEdit} error={errors.password?.message}>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    {...register('password')}
                    className={`${inputClass} pr-8`}
                    placeholder="At least 6 characters"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-500"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </Field>
              <Field label="Date of Birth" required error={errors.dateOfBirth?.message}>
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
              <Field label="Email ID" required error={errors.email?.message}>
                <input type="email" {...register('email')} className={inputClass} placeholder="name@example.com" />
              </Field>
              <Field label="Qualification">
                <input {...register('qualification')} className={inputClass} placeholder="B.Sc Computer Science" />
              </Field>
              <Field label="Nominee Name" required error={errors.nomineeName?.message}>
                <input {...register('nomineeName')} className={inputClass} placeholder="Nominee name" />
              </Field>
              <Field label="Relationship" required error={errors.relationship?.message}>
                <input {...register('relationship')} className={inputClass} placeholder="Relationship" />
              </Field>
              <Field label="Nominee Mobile" required error={errors.nomineePhone?.message}>
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  {...register('nomineePhone')}
                  className={inputClass}
                  placeholder="10-digit nominee mobile"
                />
              </Field>
              <Field label="Experience (Years)">
                <input {...register('experience')} className={inputClass} placeholder="5" />
              </Field>
              <Field label="PAN No" required error={errors.panNo?.message}>
                <input {...register('panNo')} className={inputClass} placeholder="ABCDE1234F" maxLength={10} />
              </Field>
              <Field label="Aadhaar No" required error={errors.aadhaarNo?.message}>
                <input
                  {...register('aadhaarNo')}
                  className={inputClass}
                  placeholder="12 digit Aadhaar"
                  maxLength={12}
                  inputMode="numeric"
                />
              </Field>
              <Field label="Parent/Guardian Name">
                <input {...register('parentGuardianName')} className={inputClass} placeholder="Parent or guardian" />
              </Field>
              <SelectField label="Role" required error={errors.role?.message}>
                <select {...register('role')} className={selectClass}>
                  {roles.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </SelectField>
              <SelectField label="Branch" required error={errors.branchId?.message}>
                <select {...register('branchId')} className={selectClass}>
                  <option value="">Select Branch</option>
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              </SelectField>
              <Field label="Reports To" required={selectedRole !== 'DIRECTOR'} error={errors.reportsToId?.message}>
                <SearchableSelect
                  value={selectedReportsToId}
                  options={reportsToOptions}
                  loading={reportsToLoading}
                  placeholder={
                    selectedRole === 'DIRECTOR'
                      ? 'Not required for Director'
                      : reportsToOptions.length
                        ? 'Search or select reporting member'
                        : 'No eligible reporting members found'
                  }
                  disabled={selectedRole === 'DIRECTOR'}
                  onChange={(value) => setValue('reportsToId', value, { shouldDirty: true, shouldValidate: true })}
                />
                <input type="hidden" {...register('reportsToId')} />
              </Field>
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
                maxSizeBytes={2 * 1024 * 1024}
                onChange={setPhoto}
              />
              <FileDrop
                label="Upload ID Proof"
                helper="PDF or Image (Aadhaar/PAN)"
                icon={<Upload className="h-7 w-7" />}
                file={idProof}
                accept=".jpg,.jpeg,.png,.pdf"
                maxSizeBytes={5 * 1024 * 1024}
                onChange={setIdProof}
              />
            </div>

            {submitError && (
              <div role="alert" className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
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
              {isSaving ? (isEdit ? 'Saving...' : 'Creating...') : (isEdit ? 'Save Changes' : 'Create Member')}
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

const MemberPhoto: React.FC<{ member: Member }> = ({ member }) => {
  const [failed, setFailed] = useState(false);
  const photoUrl = failed ? '' : memberPhotoUrl(member);

  if (!photoUrl) {
    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-gray-800 text-xs font-bold text-white">
        {memberInitials(member.fullName)}
      </div>
    );
  }

  return (
    <img
      src={photoUrl}
      alt={`${member.fullName} photo`}
      onError={() => setFailed(true)}
      className="h-10 w-10 rounded-md object-cover"
    />
  );
};

const MemberViewModal: React.FC<{ member: Member; onClose: () => void }> = ({ member, onClose }) => {
  const extra = member as Member & Record<string, unknown>;
  const extraText = (key: string) => getStringField(extra[key]) || '-';
  const branchDisplay = member.branch?.name || '-';
  const branchIdDisplay = member.branch?.branchCode || member.branch?.name || '-';
  const reportsToDisplay = member.reportsTo?.fullName || '-';
  const details = [
    ['Member ID', member.memberId],
    ['Intro No', member.codeNumber || '-'],
    ['Intro Name', extraText('introName')],
    ['Full Name', member.fullName],
    ['Mobile 1', member.phone],
    ['Mobile 2', member.alternatePhone || '-'],
    ['Email ID', member.email || '-'],
    ['Date of Birth', member.dateOfBirth ? formatDate(member.dateOfBirth) : '-'],
    ['Wedding Date', extraText('weddingDate')],
    ['Blood Group', member.bloodGroup || '-'],
    ['Qualification', member.qualification || '-'],
    ['Experience', member.experience || '-'],
    ['Role', formatRole(member.role)],
    ['Branch', branchDisplay],
    ['Branch ID', branchIdDisplay],
    ['Reports To', reportsToDisplay],
    ['City', member.city || '-'],
    ['District', member.district || '-'],
    ['State', member.state || '-'],
    ['Pincode', member.pincode || '-'],
    ['Address', member.address || '-'],
    ['Parent/Guardian Name', extraText('parentGuardianName')],
    ['Nominee Name', member.nomineeName || '-'],
    ['Nominee Relationship', member.nomineeRelation || '-'],
    ['Nominee Mobile', member.nomineePhone || '-'],
    ['PAN Number', member.panNumber || '-'],
    ['Aadhaar Number', member.aadhaarNumber || '-'],
    ['Status', member.status],
    ['Joined Date', formatDate(member.createdAt)],
  ];

  return (
    <Modal open onClose={onClose} title="Member Details" subtitle={member.memberId} size="lg">
      <div className="space-y-5">
        <div className="flex items-center gap-4">
          <MemberPhoto member={member} />
          <div>
            <h3 className="text-lg font-bold text-gray-900">{member.fullName}</h3>
            <p className="text-sm text-gray-500">{formatRole(member.role)}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {details.map(([label, value]) => (
            <div key={label} className="flex min-h-[76px] flex-col justify-between rounded-md border border-stone-100 bg-stone-50 px-4 py-3">
              <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500">{label}</p>
              <p className={`mt-1 break-words text-sm font-semibold text-gray-900 ${label === 'Joined Date' ? 'whitespace-nowrap' : ''}`}>{value}</p>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
};

const AdminMembersListPage: React.FC<{ addMemberPage?: boolean }> = ({ addMemberPage = false }) => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [page, setPage] = useState(1);
  const [role, setRole] = useState<Role | ''>('');
  const [status, setStatus] = useState<UserStatus | ''>('');
  const [branchId, setBranchId] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [viewMember, setViewMember] = useState<Member | null>(null);
  const [editMember, setEditMember] = useState<Member | null>(null);
  const updateMemberStatus = useUpdateMember();

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

  const handleToggleMemberStatus = async (member: Member) => {
    const nextStatus: UserStatus = member.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';

    try {
      await updateMemberStatus.mutateAsync({ id: member.id, data: { status: nextStatus } });
      toast.success(nextStatus === 'INACTIVE' ? 'Member deactivated.' : 'Member activated.');
    } catch (error) {
      toast.error(getApiError(error));
    }
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
          onClick={() => (addMemberPage ? setCreateOpen(true) : navigate('/admin/add-member'))}
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
                <th className="px-5 py-4 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="px-5 py-12 text-center text-gray-500">
                    Loading members...
                  </td>
                </tr>
              ) : !data?.data?.length ? (
                <tr>
                  <td colSpan={9} className="px-5 py-12 text-center text-gray-500">
                    No members found
                  </td>
                </tr>
              ) : (
                data.data.map((member: Member) => (
                  <tr key={member.id} className="transition hover:bg-amber-50/30">
                    <td className="px-5 py-4">
                      <MemberPhoto member={member} />
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
                    <td className="whitespace-nowrap px-5 py-4 text-gray-700">{formatDate(member.createdAt)}</td>
                    <td className="px-5 py-4">
                      <StatusPill status={member.status} />
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => setViewMember(member)} className="inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-600 transition hover:bg-gray-100" aria-label="View member" title="View member">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button type="button" onClick={() => setEditMember(member)} className="inline-flex h-8 w-8 items-center justify-center rounded-md text-gold transition hover:bg-amber-50" aria-label="Edit member" title="Edit member">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleToggleMemberStatus(member)}
                          disabled={updateMemberStatus.isPending}
                          role="switch"
                          aria-checked={member.status === 'ACTIVE'}
                          aria-label={member.status === 'ACTIVE' ? 'Deactivate member' : 'Activate member'}
                          title={member.status === 'ACTIVE' ? 'Deactivate member' : 'Activate member'}
                          className={`relative ml-2 h-8 w-14 flex-shrink-0 rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${member.status === 'ACTIVE' ? 'bg-gold' : 'bg-gray-300'}`}
                        >
                          <span className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-[left] ${member.status === 'ACTIVE' ? 'left-7' : 'left-1'}`} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {data && <Pagination page={page} total={data.total} limit={data.limit} onPageChange={setPage} />}
      </div>

      {createOpen && (
        <CreateMemberModal branches={branches} defaultBranchId={defaultBranchId} onClose={closeCreateModal} />
      )}
      {viewMember && <MemberViewModal member={viewMember} onClose={() => setViewMember(null)} />}
      {editMember && (
        <CreateMemberModal
          member={editMember}
          branches={branches}
          defaultBranchId={defaultBranchId}
          onClose={() => { setEditMember(null); refetch(); }}
        />
      )}
    </div>
  );
};

export default AdminMembersListPage;
