import React, { useEffect, useMemo, useState } from 'react';
import { useForm, useWatch, type FieldErrors } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import toast from 'react-hot-toast';
import {
  CheckCircle2,
  ChevronDown,
  Filter,
  ImagePlus,
  RefreshCw,
  Upload,
  UserPlus,
  X,
} from 'lucide-react';
import { useBranches } from '../../hooks/useBranches';
import { useCreateMember, useMembers, useUploadMemberPhoto } from '../../hooks/useMembers';
import { useUploadDocument } from '../../hooks/useDocuments';
import { useAuthStore } from '../../stores/auth.store';
import { authApi } from '../../api/auth.api';
import { Pagination } from '../../components/ui/Pagination';
import { SearchableSelect, type SearchableSelectOption } from '../../components/ui/SearchableSelect';
import { resolveFileUrl } from '../../lib/file-url';
import { extractEntityId } from '../../lib/upload-helpers';
import type { Branch, Member, Role, UserStatus } from '../../types';

const parentRolesByRole: Partial<Record<Role, Role[]>> = {
  EXECUTIVE_DIRECTOR: ['DIRECTOR'],
  DEPUTY_DIRECTOR: ['EXECUTIVE_DIRECTOR'],
  SENIOR_MANAGER: ['DEPUTY_DIRECTOR'],
  BUSINESS_MANAGER: ['SENIOR_MANAGER'],
  AGENT: ['BUSINESS_MANAGER'],
};

const mobileRegex = /^[6-9][0-9]{9}$/;
const mobileValidationMessage = 'Enter a valid 10-digit mobile number starting with 6, 7, 8, or 9.';
const nameRegex = /^[A-Za-z .]+$/;
const alphaSpaceRegex = /^[A-Za-z ]+$/;
const qualificationRegex = /^[A-Za-z0-9 .,-]+$/;
const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
const aadhaarRegex = /^[0-9]{12}$/;
const pincodeRegex = /^[1-9][0-9]{5}$/;
const maxUploadSize = 2 * 1024 * 1024;
const photoTypes = ['image/jpeg', 'image/png'];
const idProofTypes = ['application/pdf', 'image/jpeg', 'image/png'];
const photoExtensions = ['.jpg', '.jpeg', '.png'];
const idProofExtensions = ['.pdf', '.jpg', '.jpeg', '.png'];
const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

function optionalTrimmedString() {
  return z.string().transform((value) => value.trim()).optional();
}

function optionalPattern(regex: RegExp, message: string, minLength?: number) {
  return z.string().transform((value) => value.trim()).refine((value) => {
    if (!value) return true;
    if (minLength && value.length < minLength) return false;
    return regex.test(value);
  }, message);
}

function parseDDMMYYYY(value: string) {
  const parts = value.trim().split('-');
  if (parts.length !== 3) return null;

  const [first, second, third] = parts;
  const isIsoDate = first.length === 4;
  const yearPart = isIsoDate ? first : third;
  const monthPart = second;
  const dayPart = isIsoDate ? third : first;

  if (yearPart.length !== 4 || !/^\d+$/.test(dayPart + monthPart + yearPart)) return null;

  const day = Number(dayPart);
  const month = Number(monthPart);
  const year = Number(yearPart);
  const date = new Date(year, month - 1, day);

  if (
    Number.isNaN(date.getTime()) ||
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

function ageFromDate(dob: Date) {
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) age -= 1;
  return age;
}

function dateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const memberSchema = z.object({
  introNo: optionalPattern(/^[0-9]+$/, 'Intro No must contain only numbers.').refine(
    (value) => !value || value.length <= 10,
    'Intro No must be 10 digits or fewer.',
  ),
  introName: optionalPattern(nameRegex, 'Intro Name must contain only alphabets, spaces, and dots.', 2),
  fullName: z.string().transform((value) => value.trim()).pipe(
    z.string()
      .min(2, 'Enter a valid full name.')
      .regex(nameRegex, 'Enter a valid full name.'),
  ),
  city: optionalPattern(alphaSpaceRegex, 'City must contain only alphabets and spaces.'),
  district: optionalPattern(alphaSpaceRegex, 'District must contain only alphabets and spaces.'),
  state: optionalPattern(alphaSpaceRegex, 'State must contain only alphabets and spaces.'),
  pincode: optionalPattern(pincodeRegex, 'Enter a valid 6-digit pincode.'),
  mobile1: z.string().regex(mobileRegex, mobileValidationMessage),
  mobile2: z.string().optional().refine((value) => !value || mobileRegex.test(value), {
    message: mobileValidationMessage,
  }),
  dateOfBirth: z.string().transform((value) => value.trim()).pipe(
    z.string().min(1, 'Enter a valid Date of Birth.'),
  ),
  weddingDate: optionalTrimmedString(),
  bloodGroup: z.string().refine((value) => !value || bloodGroups.includes(value), 'Select a valid blood group.').optional(),
  email: z.string().transform((value) => value.trim()).refine(
    (value) => !value || z.string().email().safeParse(value).success,
    'Enter a valid email address.',
  ),
  qualification: optionalPattern(
    qualificationRegex,
    'Qualification can contain only letters, numbers, spaces, dots, commas, and hyphen.',
  ).refine((value) => !value || value.length <= 100, 'Qualification must be 100 characters or fewer.'),
  nomineeName: optionalPattern(nameRegex, 'Nominee Name must contain only alphabets, spaces, and dots.', 2),
  relationship: optionalPattern(alphaSpaceRegex, 'Relationship must contain only alphabets and spaces.'),
  experience: optionalPattern(/^[0-9]+$/, 'Experience must contain only numbers.').refine((value) => {
    if (!value) return true;
    const years = Number(value);
    return years >= 0 && years <= 60;
  }, 'Experience must be between 0 and 60 years.'),
  panNo: z.string().transform((value) => value.trim().toUpperCase()).refine(
    (value) => !value || panRegex.test(value),
    'Enter a valid PAN number.',
  ),
  aadhaarNo: optionalPattern(aadhaarRegex, 'Enter a valid 12-digit Aadhaar number.'),
  parentGuardianName: optionalPattern(nameRegex, 'Parent/Guardian Name must contain only alphabets, spaces, and dots.', 2),
  role: z.enum(['DIRECTOR', 'EXECUTIVE_DIRECTOR', 'DEPUTY_DIRECTOR', 'SENIOR_MANAGER', 'BUSINESS_MANAGER', 'AGENT'] as const),
  branchId: z.string().min(1, 'Branch is required'),
  reportsToId: z.string().optional(),
  addressLine1: z.string().transform((value) => value.trim()).refine(
    (value) => !value || (value.length >= 3 && value.length <= 150),
    'Address Line 1 must be between 3 and 150 characters.',
  ),
  addressLine2: z.string().transform((value) => value.trim()).refine(
    (value) => !value || value.length <= 150,
    'Address Line 2 must be 150 characters or fewer.',
  ),
}).superRefine((data, ctx) => {
  if (data.mobile2 && data.mobile1 === data.mobile2) {
    ctx.addIssue({
      code: 'custom',
      path: ['mobile2'],
      message: 'Alternate mobile must be different from Primary mobile.',
    });
  }

  if (data.dateOfBirth) {
    const dateOfBirth = parseDDMMYYYY(data.dateOfBirth);
    if (!dateOfBirth) {
      ctx.addIssue({ code: 'custom', path: ['dateOfBirth'], message: 'Enter a valid Date of Birth.' });
    } else if (dateOfBirth > new Date()) {
      ctx.addIssue({ code: 'custom', path: ['dateOfBirth'], message: 'Date of Birth cannot be a future date.' });
    } else if (ageFromDate(dateOfBirth) < 18) {
      ctx.addIssue({ code: 'custom', path: ['dateOfBirth'], message: 'Member must be at least 18 years old.' });
    }
  }

  if (data.weddingDate) {
    const weddingDate = parseDDMMYYYY(data.weddingDate);
    if (!weddingDate) {
      ctx.addIssue({ code: 'custom', path: ['weddingDate'], message: 'Enter a valid Wedding Date.' });
    } else if (weddingDate > new Date()) {
      ctx.addIssue({ code: 'custom', path: ['weddingDate'], message: 'Wedding Date cannot be a future date.' });
    } else if (data.dateOfBirth) {
      const dob = parseDDMMYYYY(data.dateOfBirth);
      if (!dob) return;

      if (weddingDate <= dob) {
        ctx.addIssue({ code: 'custom', path: ['weddingDate'], message: 'Wedding date must be after Date of Birth.' });
      } else if (weddingDate.getFullYear() <= dob.getFullYear()) {
        ctx.addIssue({ code: 'custom', path: ['weddingDate'], message: 'Wedding year must be greater than Date of Birth year.' });
      }
    }
  }

  if (data.role !== 'DIRECTOR' && !data.reportsToId) {
    ctx.addIssue({
      code: 'custom',
      path: ['reportsToId'],
      message: 'Please select reporting member.',
    });
  }
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
  error?: string;
  onChange: (file: File | null) => void;
}> = ({ label, helper, icon, file, accept, error, onChange }) => (
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
    {error && <span className="mt-1 text-xs font-semibold text-red-600">{error}</span>}
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
  const { data: reportsToResponse, isLoading: reportsToLoading } = useMembers({
    limit: 1000,
    branchId: defaultBranchId || undefined,
  });
  const [photo, setPhoto] = useState<File | null>(null);
  const [idProof, setIdProof] = useState<File | null>(null);
  const [photoError, setPhotoError] = useState('');
  const [idProofError, setIdProofError] = useState('');
  const [submitError, setSubmitError] = useState('');

  const {
    register,
    handleSubmit,
    getValues,
    reset,
    setValue,
    setFocus,
    control,
    formState: { errors, isSubmitting },
  } = useForm<MemberFormData>({
    resolver: zodResolver(memberSchema),
    defaultValues: {
      role: 'AGENT',
      branchId: defaultBranchId,
      reportsToId: '',
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
  const selectedRole = useWatch({
    control,
    name: 'role',
  });
  const watchedBranchId = useWatch({
    control,
    name: 'branchId',
  }) ?? '';
  const selectedBranchId = defaultBranchId || watchedBranchId;
  const selectedBranch = branches.find((branch) => branch.id === selectedBranchId);
  const todayMaxDate = dateInputValue(new Date());

  useEffect(() => {
    if (defaultBranchId && watchedBranchId !== defaultBranchId) {
      setValue('branchId', defaultBranchId, { shouldValidate: true });
    }
  }, [defaultBranchId, watchedBranchId, setValue]);

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

  const isSaving = isSubmitting || createMember.isPending || uploadPhoto.isPending || uploadDocument.isPending;

  const restrictDigits = (field: keyof MemberFormData, maxLength: number) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const digitsOnly = event.target.value.replace(/\D/g, '').slice(0, maxLength);
    event.target.value = digitsOnly;
    setValue(field, digitsOnly, { shouldDirty: true, shouldValidate: true });
  };

  const restrictMobileInput = (field: 'mobile1' | 'mobile2') => (event: React.ChangeEvent<HTMLInputElement>) => {
    const digitsOnly = event.target.value.replace(/\D/g, '').slice(0, 10);
    if (digitsOnly && !/^[6-9]/.test(digitsOnly)) {
      event.target.value = getValues(field) ?? '';
      return;
    }

    event.target.value = digitsOnly;
    setValue(field, digitsOnly, { shouldDirty: true, shouldValidate: true });
  };

  const normalizePanInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const pan = event.target.value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 10).toUpperCase();
    event.target.value = pan;
    setValue('panNo', pan, { shouldDirty: true, shouldValidate: true });
  };

  const validateUpload = (
    file: File,
    allowedTypes: string[],
    allowedExtensions: string[],
    label: string,
  ) => {
    const fileName = file.name.toLowerCase();
    const hasAllowedType = allowedTypes.includes(file.type);
    const hasAllowedExtension = allowedExtensions.some((extension) => fileName.endsWith(extension));
    if (!hasAllowedType && !hasAllowedExtension) {
      return `${label} must be ${allowedExtensions.join(', ')}.`;
    }
    if (file.size > maxUploadSize) {
      return `${label} must be 2MB or smaller.`;
    }
    return '';
  };

  const handlePhotoChange = (file: File | null) => {
    if (!file) {
      setPhoto(null);
      setPhotoError('');
      return;
    }

    const error = validateUpload(file, photoTypes, photoExtensions, 'Photo');
    setPhotoError(error);
    setPhoto(error ? null : file);
    if (error) toast.error(error);
  };

  const handleIdProofChange = (file: File | null) => {
    if (!file) {
      setIdProof(null);
      setIdProofError('');
      return;
    }

    const error = validateUpload(file, idProofTypes, idProofExtensions, 'ID Proof');
    setIdProofError(error);
    setIdProof(error ? null : file);
    if (error) toast.error(error);
  };

  const discardDraft = () => {
    reset({ role: 'AGENT', branchId: defaultBranchId, reportsToId: '' });
    setPhoto(null);
    setIdProof(null);
    setPhotoError('');
    setIdProofError('');
    setSubmitError('');
    onClose();
  };

  const onSubmit = async (data: MemberFormData) => {
    setSubmitError('');
    const assignedBranchId = defaultBranchId;

    if (!assignedBranchId || !branches.some((branch) => branch.id === assignedBranchId)) {
      toast.error('Assigned branch not found.');
      setSubmitError('Assigned branch not found.');
      return;
    }

    if (data.role !== 'DIRECTOR' && !data.reportsToId) {
      toast.error('Please select reporting member.');
      setSubmitError('Please select reporting member.');
      return;
    }

    if (data.role !== 'DIRECTOR' && !eligibleReportsToMembers.length) {
      toast.error('No eligible reporting members found.');
      setSubmitError('No eligible reporting members found.');
      return;
    }

    if (
      data.role !== 'DIRECTOR' &&
      !eligibleReportsToMembers.some((member) => member.id === data.reportsToId)
    ) {
      toast.error('Selected reporting member is not eligible for this role.');
      setSubmitError('Selected reporting member is not eligible for this role.');
      return;
    }

    if (photoError || idProofError) {
      const fileError = photoError || idProofError;
      toast.error(fileError);
      setSubmitError(fileError);
      return;
    }

    try {
      const address = [data.addressLine1, data.addressLine2].filter(Boolean).join(', ');
      const primaryMobile = data.mobile1.replace(/\D/g, '');
      const alternateMobile = data.mobile2?.replace(/\D/g, '') || undefined;
      const aadhaarNumber = data.aadhaarNo.replace(/\D/g, '') || undefined;
      const pincode = data.pincode.replace(/\D/g, '') || undefined;
      const member = await createMember.mutateAsync({
        fullName: data.fullName.trim(),
        phone: primaryMobile,
        email: data.email.trim() || undefined,
        role: data.role,
        branchId: assignedBranchId,
        reportsToId: data.reportsToId || undefined,
        codeNumber: data.introNo.replace(/\D/g, '') || undefined,
        password: generateTempPassword(data.fullName.trim(), primaryMobile),
        dateOfBirth: data.dateOfBirth || undefined,
        bloodGroup: data.bloodGroup || undefined,
        qualification: data.qualification || undefined,
        experience: data.experience.replace(/\D/g, '') || undefined,
        alternatePhone: alternateMobile,
        address: address || undefined,
        city: data.city || undefined,
        district: data.district || undefined,
        state: data.state || undefined,
        pincode,
        panNumber: data.panNo || undefined,
        aadhaarNumber,
        introName: data.introName || undefined,
        nomineeName: data.nomineeName || undefined,
        nomineeRelation: data.relationship || undefined,
      });

      const memberId = extractEntityId(member, ['member']);
      if ((photo || idProof) && !memberId) {
        throw new Error('Member created, but file upload failed. Please retry upload.');
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
      } catch {
        throw new Error('Member created, but file upload failed. Please retry upload.');
      }

      onClose();
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      setSubmitError(
        error?.response?.data?.message ??
          (err instanceof Error ? err.message : 'Failed to create member. Please try again.'),
      );
    }
  };

  const onInvalidSubmit = (formErrors: FieldErrors<MemberFormData>) => {
    const fieldOrder: Array<keyof MemberFormData> = [
      'introNo',
      'city',
      'district',
      'introName',
      'state',
      'pincode',
      'fullName',
      'mobile1',
      'mobile2',
      'dateOfBirth',
      'weddingDate',
      'bloodGroup',
      'email',
      'qualification',
      'nomineeName',
      'relationship',
      'experience',
      'panNo',
      'aadhaarNo',
      'parentGuardianName',
      'role',
      'branchId',
      'reportsToId',
      'addressLine1',
      'addressLine2',
    ];
    const firstInvalidField = fieldOrder.find((field) => formErrors[field]);
    if (firstInvalidField) setFocus(firstInvalidField);

    if (formErrors.mobile1?.message || formErrors.mobile2?.message) {
      toast.error(mobileValidationMessage);
      setSubmitError(mobileValidationMessage);
      return;
    }

    if (formErrors.reportsToId?.message) {
      if (selectedRole !== 'DIRECTOR' && !eligibleReportsToMembers.length) {
        const message = 'No eligible reporting members found.';
        toast.error(message);
        setSubmitError(message);
        return;
      }

      toast.error('Please select reporting member.');
      setSubmitError('Please select reporting member.');
      return;
    }

    const firstError = Object.values(formErrors).find((error) => error?.message);
    if (firstError?.message && typeof firstError.message === 'string') {
      toast.error(firstError.message);
      setSubmitError(firstError.message);
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

        <form onSubmit={handleSubmit(onSubmit, onInvalidSubmit)} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
            <div className="grid grid-cols-1 gap-x-8 gap-y-5 md:grid-cols-2 lg:grid-cols-3">
              <Field label="Intro No">
                <input
                  {...register('introNo')}
                  className={inputClass}
                  placeholder="001"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={10}
                  onChange={restrictDigits('introNo', 10)}
                />
              </Field>
              <Field label="City" error={errors.city?.message}>
                <input {...register('city')} className={inputClass} placeholder="Chennai" />
              </Field>
              <Field label="District" error={errors.district?.message}>
                <input {...register('district')} className={inputClass} placeholder="Chennai" />
              </Field>
              <Field label="Intro Name" error={errors.introName?.message}>
                <input {...register('introName')} className={inputClass} placeholder="Introduced by" />
              </Field>
              <Field label="State" error={errors.state?.message}>
                <input {...register('state')} className={inputClass} placeholder="Tamil Nadu" />
              </Field>
              <Field label="Pincode" error={errors.pincode?.message}>
                <input
                  {...register('pincode')}
                  className={inputClass}
                  placeholder="600032"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  onChange={restrictDigits('pincode', 6)}
                />
              </Field>
              <Field label="Full Name" error={errors.fullName?.message}>
                <input {...register('fullName')} className={inputClass} placeholder="Member name" />
              </Field>
              <Field label="Mobile 1" error={errors.mobile1?.message}>
                <input
                  {...register('mobile1')}
                  className={inputClass}
                  placeholder="Primary mobile"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={10}
                  onChange={restrictMobileInput('mobile1')}
                />
              </Field>
              <Field label="Mobile 2" error={errors.mobile2?.message}>
                <input
                  {...register('mobile2')}
                  className={inputClass}
                  placeholder="Alternate mobile"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={10}
                  onChange={restrictMobileInput('mobile2')}
                />
              </Field>
              <Field label="Date of Birth" error={errors.dateOfBirth?.message}>
                <input type="date" {...register('dateOfBirth')} className={inputClass} max={todayMaxDate} />
              </Field>
              <Field label="Wedding Date" error={errors.weddingDate?.message}>
                <input type="date" {...register('weddingDate')} className={inputClass} max={todayMaxDate} />
              </Field>
              <SelectField label="Blood Group" error={errors.bloodGroup?.message}>
                <select {...register('bloodGroup')} className={selectClass}>
                  <option value="">Select blood group</option>
                  {bloodGroups.map((group) => (
                    <option key={group} value={group}>
                      {group}
                    </option>
                  ))}
                </select>
              </SelectField>
              <Field label="Email" error={errors.email?.message}>
                <input type="email" {...register('email')} className={inputClass} placeholder="name@example.com" />
              </Field>
              <Field label="Qualification" error={errors.qualification?.message}>
                <input {...register('qualification')} className={inputClass} placeholder="B.Sc Computer Science" maxLength={100} />
              </Field>
              <Field label="Nominee Name" error={errors.nomineeName?.message}>
                <input {...register('nomineeName')} className={inputClass} placeholder="Nominee name" />
              </Field>
              <Field label="Relationship" error={errors.relationship?.message}>
                <input {...register('relationship')} className={inputClass} placeholder="Relationship" />
              </Field>
              <Field label="Experience (Years)" error={errors.experience?.message}>
                <input
                  {...register('experience')}
                  className={inputClass}
                  placeholder="5"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={2}
                  onChange={restrictDigits('experience', 2)}
                />
              </Field>
              <Field label="PAN No" error={errors.panNo?.message}>
                <input {...register('panNo')} className={inputClass} placeholder="ABCDE1234F" maxLength={10} onChange={normalizePanInput} />
              </Field>
              <Field label="Aadhaar No" error={errors.aadhaarNo?.message}>
                <input
                  {...register('aadhaarNo')}
                  className={inputClass}
                  placeholder="12 digit Aadhaar"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={12}
                  onChange={restrictDigits('aadhaarNo', 12)}
                />
              </Field>
              <Field label="Parent/Guardian Name" error={errors.parentGuardianName?.message}>
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
              {branches.length <= 1 ? (
                <Field label="Branch" error={errors.branchId?.message}>
                  <input
                    value={selectedBranch?.name ?? ''}
                    className={inputClass}
                    placeholder="Assigned branch not found"
                    readOnly
                    disabled
                  />
                  <input type="hidden" {...register('branchId')} />
                </Field>
              ) : (
                <SelectField label="Branch" error={errors.branchId?.message}>
                  <select
                    value={selectedBranchId}
                    onChange={(event) => setValue('branchId', event.target.value, { shouldDirty: true, shouldValidate: true })}
                    className={selectClass}
                  >
                    <option value="">Select Branch</option>
                    {branches.map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name}
                      </option>
                    ))}
                  </select>
                  <input type="hidden" {...register('branchId')} />
                </SelectField>
              )}
              <Field label={selectedRole === 'DIRECTOR' ? 'Reports To' : 'Reports To *'} error={errors.reportsToId?.message}>
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
              <Field label="Address Line 1" error={errors.addressLine1?.message}>
                <input {...register('addressLine1')} className={inputClass} placeholder="Door No, Street" />
              </Field>
              <Field label="Address Line 2" error={errors.addressLine2?.message}>
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
                error={photoError}
                onChange={handlePhotoChange}
              />
              <FileDrop
                label="Upload ID Proof"
                helper="PDF or Image (Aadhaar/PAN)"
                icon={<Upload className="h-7 w-7" />}
                file={idProof}
                accept=".jpg,.jpeg,.png,.pdf"
                error={idProofError}
                onChange={handleIdProofChange}
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

const AdminMembersListPage: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const [page, setPage] = useState(1);
  const [role, setRole] = useState<Role | ''>('');
  const [status, setStatus] = useState<UserStatus | ''>('');
  const [branchId, setBranchId] = useState('');
  const [createOpen, setCreateOpen] = useState(false);

  const { data: branchesResponse } = useBranches({ limit: 100 });
  const shouldFetchMe =
    user?.role === 'ADMIN' && (!user.admin?.branchId || !user.admin?.branch);
  const { data: me } = useQuery({
    queryKey: ['auth', 'me', 'admin-branch'],
    queryFn: authApi.getMe,
    enabled: shouldFetchMe,
  });
  const admin = me?.admin ?? user?.admin;
  const assignedBranchId = admin?.branchId ?? admin?.branch?.id ?? '';
  const branches = useMemo(() => {
    const list = branchesResponse?.data ?? [];
    if (!assignedBranchId) return [];

    const adminBranch = admin?.branch ?? list.find((branch) => branch.id === assignedBranchId);
    return adminBranch ? [adminBranch] : list.filter((branch) => branch.id === assignedBranchId);
  }, [admin?.branch, assignedBranchId, branchesResponse?.data]);

  const defaultBranchId = assignedBranchId && branches.some((branch) => branch.id === assignedBranchId)
    ? assignedBranchId
    : '';
  const activeBranchId = branchId || defaultBranchId || undefined;

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

      {createOpen && (
        <CreateMemberModal branches={branches} defaultBranchId={defaultBranchId} onClose={closeCreateModal} />
      )}
    </div>
  );
};

export default AdminMembersListPage;
