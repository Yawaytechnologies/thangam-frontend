import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateMember } from '../../hooks/useMembers';
import { useMembers } from '../../hooks/useMembers';
import { useAuthStore } from '../../stores/auth.store';
import api from '../../lib/axios';
import type { Role } from '../../types';

// ─── Zod Schema ──────────────────────────────────────────────────────────────
const schema = z.object({
  // Section A
  fullName: z.string().min(2, 'Full name is required'),
  gender: z.string().optional(),
  dob: z.string().optional(),
  bloodGroup: z.string().optional(),
  qualification: z.string().optional(),
  experience: z.string().optional(),
  // Section B
  phone: z.string().min(10, 'Phone number is required'),
  altPhone: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  address: z.string().optional(),
  city: z.string().optional(),
  district: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  // Section C
  pan: z.string().min(10, 'PAN is required').max(10, 'PAN must be 10 characters'),
  aadhaar: z.string().min(12, 'Aadhaar must be 12 digits').max(12, 'Aadhaar must be 12 digits'),
  voterId: z.string().optional(),
  drivingLicense: z.string().optional(),
  // Section D
  role: z.enum(['DIRECTOR', 'EXECUTIVE_DIRECTOR', 'DEPUTY_DIRECTOR', 'SENIOR_MANAGER', 'BUSINESS_MANAGER', 'AGENT'] as const),
  introName: z.string().optional(),
  reportsToId: z.string().optional(),
  codeNumber: z.string().optional(),
  // Section E
  nomineeName: z.string().optional(),
  nomineeRelationship: z.string().optional(),
  nomineePhone: z.string().optional(),
  // Section F
  bankName: z.string().optional(),
  accountHolder: z.string().optional(),
  accountNumber: z.string().optional(),
  ifsc: z.string().optional(),
  bankBranch: z.string().optional(),
  // password required for member creation
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type AddMemberFormData = z.infer<typeof schema>;

// ─── Helpers ─────────────────────────────────────────────────────────────────
const sectionTitle = (title: string) => (
  <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4 pb-2 border-b border-gray-200">
    {title}
  </h2>
);

const Field: React.FC<{
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}> = ({ label, error, required, children }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1.5">
      {label}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
    {children}
    {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
  </div>
);

const inputCls =
  'w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500';

const disabledInputCls =
  'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed';

// ─── Document upload state type ───────────────────────────────────────────────
type DocKey = 'profilePhoto' | 'panCard' | 'aadhaarCard' | 'addressProof' | 'bankPassbook';
type DocFiles = Record<DocKey, File | null>;

const DOC_LABELS: Record<DocKey, string> = {
  profilePhoto: 'Profile Photo',
  panCard: 'PAN Card',
  aadhaarCard: 'Aadhaar Card',
  addressProof: 'Address Proof',
  bankPassbook: 'Bank Passbook',
};

// ─── Component ────────────────────────────────────────────────────────────────
const AddMemberPage: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const createMember = useCreateMember();

  const branchId = user?.admin?.branchId ?? '';
  const branchName = user?.admin?.branch?.name ?? 'Your Branch';

  // Searchable reports-to
  const [reportsToSearch, setReportsToSearch] = useState('');
  const { data: reportsToData } = useMembers({
    search: reportsToSearch || undefined,
    limit: 20,
  });
  const reportsCandidates = reportsToData?.data ?? [];

  // Document files
  const [docFiles, setDocFiles] = useState<DocFiles>({
    profilePhoto: null,
    panCard: null,
    aadhaarCard: null,
    addressProof: null,
    bankPassbook: null,
  });

  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [submitError, setSubmitError] = useState<string>('');

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<AddMemberFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      role: 'AGENT',
    },
  });

  const handleDocChange = (key: DocKey, file: File | null) => {
    setDocFiles((prev) => ({ ...prev, [key]: file }));
  };

  const uploadDocuments = async (memberId: string) => {
    const keys = Object.keys(docFiles) as DocKey[];
    for (const key of keys) {
      const file = docFiles[key];
      if (!file) continue;
      const formData = new FormData();
      formData.append('file', file);
      formData.append('entityType', 'member');
      formData.append('entityId', memberId);
      formData.append('documentType', key);
      try {
        await api.post('/documents/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setUploadStatus(`Uploaded ${DOC_LABELS[key]}`);
      } catch {
        setUploadStatus(`Failed to upload ${DOC_LABELS[key]}`);
      }
    }
  };

  const onSubmit = async (data: AddMemberFormData) => {
    setSubmitError('');
    if (!branchId) {
      setSubmitError('Your admin account is not linked to a branch. Contact the super-admin.');
      return;
    }
    try {
      const member = await createMember.mutateAsync({
        fullName: data.fullName,
        phone: data.phone,
        email: data.email || undefined,
        role: data.role as Role,
        branchId,
        reportsToId: data.reportsToId || undefined,
        codeNumber: data.codeNumber || undefined,
        password: data.password,
        gender: data.gender || undefined,
        dateOfBirth: data.dob || undefined,
        bloodGroup: data.bloodGroup || undefined,
        qualification: data.qualification || undefined,
        experience: data.experience || undefined,
        alternatePhone: data.altPhone || undefined,
        address: data.address || undefined,
        city: data.city || undefined,
        district: data.district || undefined,
        state: data.state || undefined,
        pincode: data.pincode || undefined,
        panNumber: data.pan || undefined,
        aadhaarNumber: data.aadhaar || undefined,
        voterIdNumber: data.voterId || undefined,
        drivingLicense: data.drivingLicense || undefined,
        introName: data.introName || undefined,
        nomineeName: data.nomineeName || undefined,
        nomineeRelation: data.nomineeRelationship || undefined,
        nomineePhone: data.nomineePhone || undefined,
        bankName: data.bankName || undefined,
        accountHolder: data.accountHolder || undefined,
        accountNumber: data.accountNumber || undefined,
        ifscCode: data.ifsc || undefined,
        bankBranch: data.bankBranch || undefined,
      });

      // Upload documents after member creation
      await uploadDocuments(member.id);
      navigate('/admin/members');
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      setSubmitError(error?.response?.data?.message ?? 'Failed to create member. Please try again.');
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
          aria-label="Go back"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add New Member</h1>
          <p className="text-sm text-gray-500">Fill in all sections to register a new member</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* ─── Section A: Basic Details ─── */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          {sectionTitle('A. Basic Details')}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Field label="Full Name" required error={errors.fullName?.message}>
              <input {...register('fullName')} className={inputCls} placeholder="Enter full name" />
            </Field>
            <Field label="Gender">
              <select {...register('gender')} className={inputCls}>
                <option value="">Select gender</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </Field>
            <Field label="Date of Birth">
              <input type="date" {...register('dob')} className={inputCls} />
            </Field>
            <Field label="Blood Group">
              <select {...register('bloodGroup')} className={inputCls}>
                <option value="">Select blood group</option>
                {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map((bg) => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </select>
            </Field>
            <Field label="Qualification">
              <input {...register('qualification')} className={inputCls} placeholder="e.g. B.Sc, MBA" />
            </Field>
            <Field label="Experience">
              <input {...register('experience')} className={inputCls} placeholder="e.g. 3 years in real estate" />
            </Field>
          </div>
        </div>

        {/* ─── Section B: Contact Details ─── */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          {sectionTitle('B. Contact Details')}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Field label="Phone" required error={errors.phone?.message}>
              <input {...register('phone')} className={inputCls} placeholder="10-digit mobile" type="tel" />
            </Field>
            <Field label="Alternate Phone">
              <input {...register('altPhone')} className={inputCls} placeholder="Alternate number" type="tel" />
            </Field>
            <Field label="Email" error={errors.email?.message}>
              <input {...register('email')} className={inputCls} placeholder="email@example.com" type="email" />
            </Field>
            <Field label="Address">
              <input {...register('address')} className={inputCls} placeholder="Door No., Street" />
            </Field>
            <Field label="City">
              <input {...register('city')} className={inputCls} placeholder="City" />
            </Field>
            <Field label="District">
              <input {...register('district')} className={inputCls} placeholder="District" />
            </Field>
            <Field label="State">
              <input {...register('state')} className={inputCls} placeholder="State" />
            </Field>
            <Field label="Pincode">
              <input {...register('pincode')} className={inputCls} placeholder="6-digit pincode" maxLength={6} />
            </Field>
          </div>
        </div>

        {/* ─── Section C: Identity Details ─── */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          {sectionTitle('C. Identity Details')}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Field label="PAN Number" required error={errors.pan?.message}>
              <input
                {...register('pan')}
                className={inputCls}
                placeholder="ABCDE1234F"
                maxLength={10}
                style={{ textTransform: 'uppercase' }}
              />
            </Field>
            <Field label="Aadhaar Number" required error={errors.aadhaar?.message}>
              <input
                {...register('aadhaar')}
                className={inputCls}
                placeholder="12-digit Aadhaar"
                maxLength={12}
                type="text"
              />
            </Field>
            <Field label="Voter ID">
              <input {...register('voterId')} className={inputCls} placeholder="Voter ID number" />
            </Field>
            <Field label="Driving License">
              <input {...register('drivingLicense')} className={inputCls} placeholder="DL number" />
            </Field>
          </div>
        </div>

        {/* ─── Section D: Hierarchy Details ─── */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          {sectionTitle('D. Hierarchy Details')}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Field label="Role" required error={errors.role?.message}>
              <select {...register('role')} className={inputCls}>
                <option value="DIRECTOR">Director</option>
                <option value="EXECUTIVE_DIRECTOR">Executive Director</option>
                <option value="DEPUTY_DIRECTOR">Deputy Director</option>
                <option value="SENIOR_MANAGER">Senior Manager</option>
                <option value="BUSINESS_MANAGER">Business Manager</option>
                <option value="AGENT">Agent</option>
              </select>
            </Field>
            <Field label="Intro Name">
              <input {...register('introName')} className={inputCls} placeholder="Introduced by" />
            </Field>
            <Field label="Reports To (search member)">
              <Controller
                name="reportsToId"
                control={control}
                render={({ field }) => (
                  <div className="relative">
                    <input
                      type="text"
                      value={reportsToSearch}
                      onChange={(e) => setReportsToSearch(e.target.value)}
                      className={inputCls}
                      placeholder="Search by name or ID..."
                    />
                    {reportsToSearch && reportsCandidates.length > 0 && (
                      <div className="absolute z-20 left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                        {reportsCandidates.map((m) => (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => {
                              field.onChange(m.id);
                              setReportsToSearch(`${m.fullName} (${m.memberId})`);
                            }}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 border-b border-gray-100 last:border-0"
                          >
                            <span className="font-medium">{m.fullName}</span>
                            <span className="text-gray-400 ml-2 text-xs">{m.memberId} • {m.role}</span>
                          </button>
                        ))}
                      </div>
                    )}
                    {field.value && (
                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-xs text-green-600">Selected</span>
                        <button
                          type="button"
                          onClick={() => { field.onChange(''); setReportsToSearch(''); }}
                          className="text-xs text-gray-400 hover:text-red-500"
                        >
                          Clear
                        </button>
                      </div>
                    )}
                  </div>
                )}
              />
            </Field>
            <Field label="Code Number">
              <input {...register('codeNumber')} className={inputCls} placeholder="Member code" />
            </Field>
            <Field label="Branch">
              <input value={branchName} className={disabledInputCls} readOnly />
            </Field>
          </div>
        </div>

        {/* ─── Section E: Nominee Details ─── */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          {sectionTitle('E. Nominee Details')}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Nominee Name">
              <input {...register('nomineeName')} className={inputCls} placeholder="Nominee full name" />
            </Field>
            <Field label="Relationship">
              <select {...register('nomineeRelationship')} className={inputCls}>
                <option value="">Select relationship</option>
                <option value="SPOUSE">Spouse</option>
                <option value="PARENT">Parent</option>
                <option value="CHILD">Child</option>
                <option value="SIBLING">Sibling</option>
                <option value="OTHER">Other</option>
              </select>
            </Field>
            <Field label="Nominee Phone">
              <input {...register('nomineePhone')} className={inputCls} placeholder="Phone number" type="tel" />
            </Field>
          </div>
        </div>

        {/* ─── Section F: Bank Details ─── */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          {sectionTitle('F. Bank Details')}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Field label="Bank Name">
              <input {...register('bankName')} className={inputCls} placeholder="e.g. State Bank of India" />
            </Field>
            <Field label="Account Holder Name">
              <input {...register('accountHolder')} className={inputCls} placeholder="As in passbook" />
            </Field>
            <Field label="Account Number">
              <input {...register('accountNumber')} className={inputCls} placeholder="Account number" />
            </Field>
            <Field label="IFSC Code">
              <input
                {...register('ifsc')}
                className={inputCls}
                placeholder="SBIN0001234"
                style={{ textTransform: 'uppercase' }}
              />
            </Field>
            <Field label="Bank Branch Name">
              <input {...register('bankBranch')} className={inputCls} placeholder="Branch name" />
            </Field>
          </div>
        </div>

        {/* ─── Section G: Document Uploads ─── */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          {sectionTitle('G. Document Uploads')}
          <p className="text-xs text-gray-500 mb-4">
            Documents will be uploaded after member record is created. Supported: JPG, PNG, PDF.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(Object.keys(DOC_LABELS) as DocKey[]).map((key) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {DOC_LABELS[key]}
                </label>
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={(e) => handleDocChange(key, e.target.files?.[0] ?? null)}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                />
                {docFiles[key] && (
                  <p className="mt-1 text-xs text-green-600 truncate">{docFiles[key]!.name}</p>
                )}
              </div>
            ))}
          </div>
          {uploadStatus && (
            <p className="mt-3 text-xs text-blue-600">{uploadStatus}</p>
          )}
        </div>

        {/* ─── Password ─── */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          {sectionTitle('H. Account Credentials')}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-md">
            <Field label="Password" required error={errors.password?.message}>
              <input
                type="password"
                {...register('password')}
                className={inputCls}
                placeholder="Min 6 characters"
              />
            </Field>
          </div>
        </div>

        {/* ─── Error & Actions ─── */}
        {submitError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
            <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-red-700">{submitError}</p>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pb-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || createMember.isPending}
            className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {(isSubmitting || createMember.isPending) && (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
            {isSubmitting || createMember.isPending ? 'Saving...' : 'Save Member'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddMemberPage;
