import React, { useState } from 'react';
import {
  useBillings,
  useBilling,
  useCreateBilling,
  useUpdateBilling,
} from '../../hooks/useBilling';
import { useBranches } from '../../hooks/useBranches';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Pagination } from '../../components/ui/Pagination';
import { Modal } from '../../components/ui/Modal';
import { billingApi } from '../../api/billing.api';
import type { BillingStatus, PaymentMethod, Billing } from '../../types';

// ─── Style constants ──────────────────────────────────────────────────────────

const inputClass =
  'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold bg-white';
const labelClass = 'block text-xs font-medium text-gray-600 mb-1';
const sectionHeaderClass =
  'flex items-center gap-2 text-gold text-xs font-semibold uppercase tracking-wide mb-3';

// ─── Options ─────────────────────────────────────────────────────────────────

const STATUS_OPTIONS: BillingStatus[] = [
  'PENDING',
  'PARTIAL_PAYMENT',
  'PAID',
  'FINAL_SETTLEMENT',
  'COMPLETED',
];

const PAYMENT_METHOD_OPTIONS: { value: PaymentMethod; label: string }[] = [
  { value: 'BANK_TRANSFER', label: 'NEFT / Bank Transfer' },
  { value: 'CHEQUE', label: 'Cheque' },
  { value: 'CASH', label: 'Cash' },
  { value: 'UPI', label: 'UPI' },
  { value: 'GPAY', label: 'GPay' },
];

// ─── Icons ────────────────────────────────────────────────────────────────────

const EyeIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const PencilIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
  </svg>
);

const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const UploadIcon = () => (
  <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
  </svg>
);

const DownloadIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);

const PrintIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
  </svg>
);

const FileIcon = () => (
  <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n);
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase();
}

function paymentMethodLabel(method: PaymentMethod): string {
  const found = PAYMENT_METHOD_OPTIONS.find((o) => o.value === method);
  return found ? found.label : method.replace(/_/g, ' ');
}

function paymentMethodBadgeClass(method: PaymentMethod): string {
  switch (method) {
    case 'BANK_TRANSFER': return 'bg-blue-100 text-blue-800';
    case 'CHEQUE': return 'bg-purple-100 text-purple-800';
    case 'CASH': return 'bg-green-100 text-green-800';
    case 'UPI': return 'bg-orange-100 text-orange-800';
    case 'GPAY': return 'bg-indigo-100 text-indigo-800';
    default: return 'bg-gray-100 text-gray-700';
  }
}

// ─── BillingForm type ─────────────────────────────────────────────────────────

interface BillingForm {
  // Applicant
  buyerName: string;
  buyerPhone: string;
  buyerEmail: string;
  buyerAddress: string;
  // Property
  projectName: string;
  plotNumber: string;
  plotArea: string;
  branchId: string;
  // Payment
  paymentMethod: PaymentMethod;
  bankName: string;
  referenceNumber: string;
  amountInNumbers: string;
  billingStatus: BillingStatus;
  billingDate: string;
  remarks: string;
}

const emptyForm: BillingForm = {
  buyerName: '',
  buyerPhone: '',
  buyerEmail: '',
  buyerAddress: '',
  projectName: '',
  plotNumber: '',
  plotArea: '',
  branchId: '',
  paymentMethod: 'BANK_TRANSFER',
  bankName: '',
  referenceNumber: '',
  amountInNumbers: '',
  billingStatus: 'PENDING',
  billingDate: '',
  remarks: '',
};

// ─── UploadArea sub-component ─────────────────────────────────────────────────

function UploadArea({ label }: { label: string }) {
  return (
    <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-gold transition-colors">
      <UploadIcon />
      <p className="text-sm font-medium text-gray-600 text-center">{label}</p>
      <p className="text-xs text-gray-400">Supported: PDF, JPG, PNG (Max 5MB)</p>
      <button
        type="button"
        className="mt-1 border border-gray-300 text-gray-700 px-3 py-1.5 rounded-lg text-xs hover:bg-gray-50 transition-colors"
      >
        Browse Files
      </button>
    </div>
  );
}

// ─── AddBillingModal ──────────────────────────────────────────────────────────

interface AddBillingModalProps {
  open: boolean;
  onClose: () => void;
}

function AddBillingModal({ open, onClose }: AddBillingModalProps) {
  const create = useCreateBilling();
  const branchesQuery = useBranches({ limit: 100 });
  const branches = branchesQuery.data?.data ?? [];

  const [form, setForm] = useState<BillingForm>(emptyForm);

  function setField(field: keyof BillingForm, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    create.mutate(
      {
        bookingId: '', // billing API requires bookingId; pass empty to let backend handle
        buyerName: form.buyerName,
        buyerPhone: form.buyerPhone,
        paymentMethod: form.paymentMethod,
        amountInNumbers: parseFloat(form.amountInNumbers) || 0,
        amountInWords: '',
        billingDate: form.billingDate,
      },
      {
        onSuccess: () => {
          onClose();
          setForm(emptyForm);
        },
      }
    );
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add Billing Record"
      subtitle="Capture new payment and settlement details for property bookings."
      size="2xl"
    >
      <form onSubmit={handleSubmit}>
        {/* ── Section 1: Applicant Details ── */}
        <div>
          <div className={sectionHeaderClass}>
            <span>1.</span>
            <span>Applicant Details</span>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Full Name *</label>
              <input
                type="text"
                required
                value={form.buyerName}
                onChange={(e) => setField('buyerName', e.target.value)}
                className={inputClass}
                placeholder="e.g. Rajesh Kumar"
              />
            </div>
            <div>
              <label className={labelClass}>Phone Number *</label>
              <input
                type="tel"
                required
                value={form.buyerPhone}
                onChange={(e) => setField('buyerPhone', e.target.value)}
                className={inputClass}
                placeholder="+91 98765 43210"
              />
            </div>
            <div>
              <label className={labelClass}>Email Address</label>
              <input
                type="email"
                value={form.buyerEmail}
                onChange={(e) => setField('buyerEmail', e.target.value)}
                className={inputClass}
                placeholder="buyer@example.com"
              />
            </div>
            <div className="col-span-3">
              <label className={labelClass}>Address</label>
              <textarea
                rows={2}
                value={form.buyerAddress}
                onChange={(e) => setField('buyerAddress', e.target.value)}
                className={`${inputClass} resize-none`}
                placeholder="Full residential / office address"
              />
            </div>
          </div>
        </div>

        <hr className="border-gray-100 my-4" />

        {/* ── Section 2: Property Details ── */}
        <div>
          <div className={sectionHeaderClass}>
            <span>2.</span>
            <span>Property Details</span>
          </div>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className={labelClass}>Project Name</label>
              <input
                type="text"
                value={form.projectName}
                onChange={(e) => setField('projectName', e.target.value)}
                className={inputClass}
                placeholder="e.g. Sri Thangam Nagar"
              />
            </div>
            <div>
              <label className={labelClass}>Plot / Unit Number</label>
              <input
                type="text"
                value={form.plotNumber}
                onChange={(e) => setField('plotNumber', e.target.value)}
                className={inputClass}
                placeholder="e.g. A-42"
              />
            </div>
            <div>
              <label className={labelClass}>Plot Area (Sq.Ft)</label>
              <input
                type="number"
                min={0}
                value={form.plotArea}
                onChange={(e) => setField('plotArea', e.target.value)}
                className={inputClass}
                placeholder="e.g. 1200"
              />
            </div>
            <div>
              <label className={labelClass}>Branch</label>
              <select
                value={form.branchId}
                onChange={(e) => setField('branchId', e.target.value)}
                className={inputClass}
              >
                <option value="">Select branch</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <hr className="border-gray-100 my-4" />

        {/* ── Section 3: Payment Details ── */}
        <div>
          <div className={sectionHeaderClass}>
            <span>3.</span>
            <span>Payment Details</span>
          </div>

          {/* Row 1 */}
          <div className="grid grid-cols-4 gap-4 mb-4">
            <div>
              <label className={labelClass}>Payment Method</label>
              <select
                value={form.paymentMethod}
                onChange={(e) => setField('paymentMethod', e.target.value as PaymentMethod)}
                className={inputClass}
              >
                {PAYMENT_METHOD_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Bank Name</label>
              <input
                type="text"
                value={form.bankName}
                onChange={(e) => setField('bankName', e.target.value)}
                className={inputClass}
                placeholder="e.g. State Bank of India"
              />
            </div>
            <div>
              <label className={labelClass}>Reference Number</label>
              <input
                type="text"
                value={form.referenceNumber}
                onChange={(e) => setField('referenceNumber', e.target.value)}
                className={inputClass}
                placeholder="Cheque / UTR / Txn ID"
              />
            </div>
            <div>
              <label className={labelClass}>Amount Received (₹) *</label>
              <input
                type="number"
                required
                min={0}
                value={form.amountInNumbers}
                onChange={(e) => setField('amountInNumbers', e.target.value)}
                className={inputClass}
                placeholder="0"
              />
            </div>
          </div>

          {/* Row 2 */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className={labelClass}>Billing Status</label>
              <select
                value={form.billingStatus}
                onChange={(e) => setField('billingStatus', e.target.value as BillingStatus)}
                className={inputClass}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Transaction Date *</label>
              <input
                type="date"
                required
                value={form.billingDate}
                onChange={(e) => setField('billingDate', e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          {/* Upload */}
          <UploadArea label="Drag and drop file here" />

          {/* Remarks */}
          <div className="mt-4">
            <label className={labelClass}>Remarks / Internal Notes</label>
            <textarea
              rows={3}
              value={form.remarks}
              onChange={(e) => setField('remarks', e.target.value)}
              className={`${inputClass} resize-none`}
              placeholder="Add internal notes about this payment..."
            />
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-end gap-3 pt-5 mt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 text-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={create.isPending}
            className="bg-gold text-navy font-semibold px-4 py-2 rounded-lg hover:opacity-90 disabled:opacity-50 text-sm"
          >
            {create.isPending ? 'Saving...' : 'Save Billing Record'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ─── EditBillingModal ─────────────────────────────────────────────────────────

interface EditBillingModalProps {
  open: boolean;
  onClose: () => void;
  billing: Billing;
}

function EditBillingModal({ open, onClose, billing }: EditBillingModalProps) {
  const update = useUpdateBilling();
  const branchesQuery = useBranches({ limit: 100 });
  const branches = branchesQuery.data?.data ?? [];

  const [form, setForm] = useState<BillingForm>({
    ...emptyForm,
    buyerName: billing.buyerName,
    buyerPhone: billing.buyerPhone,
    paymentMethod: billing.paymentMethod,
    amountInNumbers: billing.amountInNumbers.toString(),
    billingStatus: billing.status,
    billingDate: billing.billingDate.split('T')[0],
    projectName: billing.booking?.projectName ?? '',
    plotNumber: billing.booking?.plotNumber ?? '',
    branchId: billing.booking?.branch?.id ?? '',
  });

  function setField(field: keyof BillingForm, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  const dueDate = ''; // Not stored in current Billing type
  const isOverdue = dueDate ? new Date(dueDate) < new Date() : false;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    update.mutate(
      {
        id: billing.id,
        data: {
          buyerName: form.buyerName || undefined,
          buyerPhone: form.buyerPhone || undefined,
          paymentMethod: form.paymentMethod || undefined,
          amountInNumbers: parseFloat(form.amountInNumbers) || undefined,
          billingDate: form.billingDate || undefined,
        },
      },
      { onSuccess: onClose }
    );
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit Billing"
      subtitle="Update payment, settlement, and documentation details."
      size="2xl"
    >
      <form onSubmit={handleSubmit}>
        {/* ── Section 1: Applicant Details ── */}
        <div>
          <div className={sectionHeaderClass}>
            <span>1.</span>
            <span>Applicant Details</span>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Full Name</label>
              <input
                type="text"
                value={form.buyerName}
                onChange={(e) => setField('buyerName', e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Phone Number</label>
              <input
                type="tel"
                value={form.buyerPhone}
                onChange={(e) => setField('buyerPhone', e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Email Address</label>
              <input
                type="email"
                value={form.buyerEmail}
                onChange={(e) => setField('buyerEmail', e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="col-span-3">
              <label className={labelClass}>Address</label>
              <textarea
                rows={2}
                value={form.buyerAddress}
                onChange={(e) => setField('buyerAddress', e.target.value)}
                className={`${inputClass} resize-none`}
              />
            </div>
          </div>
        </div>

        <hr className="border-gray-100 my-4" />

        {/* ── Section 2: Property Details ── */}
        <div>
          <div className={sectionHeaderClass}>
            <span>2.</span>
            <span>Property Details</span>
          </div>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className={labelClass}>Project Name</label>
              <input
                type="text"
                value={form.projectName}
                onChange={(e) => setField('projectName', e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Plot / Unit Number</label>
              <input
                type="text"
                value={form.plotNumber}
                onChange={(e) => setField('plotNumber', e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Plot Area (Sq.Ft)</label>
              <input
                type="number"
                min={0}
                value={form.plotArea}
                onChange={(e) => setField('plotArea', e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Branch</label>
              <select
                value={form.branchId}
                onChange={(e) => setField('branchId', e.target.value)}
                className={inputClass}
              >
                <option value="">Select branch</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <hr className="border-gray-100 my-4" />

        {/* ── Section 3: Payment Details ── */}
        <div>
          <div className={sectionHeaderClass}>
            <span>3.</span>
            <span>Payment Details</span>
          </div>
          <div className="grid grid-cols-4 gap-4 mb-4">
            <div>
              <label className={labelClass}>Payment Method</label>
              <select
                value={form.paymentMethod}
                onChange={(e) => setField('paymentMethod', e.target.value as PaymentMethod)}
                className={inputClass}
              >
                {PAYMENT_METHOD_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Bank Name</label>
              <input
                type="text"
                value={form.bankName}
                onChange={(e) => setField('bankName', e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Reference Number</label>
              <input
                type="text"
                value={form.referenceNumber}
                onChange={(e) => setField('referenceNumber', e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Amount Received (₹)</label>
              <input
                type="number"
                min={0}
                value={form.amountInNumbers}
                onChange={(e) => setField('amountInNumbers', e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Transaction Date</label>
              <input
                type="date"
                value={form.billingDate}
                onChange={(e) => setField('billingDate', e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
        </div>

        <hr className="border-gray-100 my-4" />

        {/* ── Section 4: Status Update ── */}
        <div>
          <div className={sectionHeaderClass}>
            <span>4.</span>
            <span>Status Update</span>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Billing Status</label>
              <select
                value={form.billingStatus}
                onChange={(e) => setField('billingStatus', e.target.value as BillingStatus)}
                className={inputClass}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Payment Status</label>
              <select className={inputClass} defaultValue="">
                <option value="">Select status</option>
                <option value="RECEIVED">Received</option>
                <option value="PENDING">Pending</option>
                <option value="FAILED">Failed</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Settlement Status</label>
              <select className={inputClass} defaultValue="">
                <option value="">Select status</option>
                <option value="SETTLED">Settled</option>
                <option value="PARTIAL">Partial</option>
                <option value="UNSETTLED">Unsettled</option>
              </select>
            </div>
          </div>
        </div>

        <hr className="border-gray-100 my-4" />

        {/* ── Section 5: Document Upload ── */}
        <div>
          <div className={sectionHeaderClass}>
            <span>5.</span>
            <span>Document Upload</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {/* Upload */}
            <UploadArea label="Replace Receipt or Upload Proof" />

            {/* Existing doc card */}
            <div className="border border-gray-200 rounded-xl p-4 flex flex-col gap-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Current Document
              </p>
              <div className="flex items-start gap-3 bg-gray-50 rounded-lg p-3">
                <FileIcon />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    billing-receipt.pdf
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Uploaded on {formatDate(billing.createdAt)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="border border-gray-300 text-gray-700 px-3 py-1.5 rounded-lg text-xs hover:bg-gray-50 transition-colors"
                >
                  View
                </button>
                <button
                  type="button"
                  className="text-red-500 text-xs font-medium hover:text-red-700 transition-colors"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        </div>

        <hr className="border-gray-100 my-4" />

        {/* ── Section 6: Additional Information ── */}
        <div>
          <div className={sectionHeaderClass}>
            <span>6.</span>
            <span>Additional Information</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Internal Notes</label>
              <textarea
                rows={3}
                value={form.remarks}
                onChange={(e) => setField('remarks', e.target.value)}
                className={`${inputClass} resize-none`}
                placeholder="Add internal notes..."
              />
            </div>
            <div>
              <label className={labelClass}>Due Date</label>
              <input
                type="date"
                className={inputClass}
              />
              {isOverdue && (
                <p className="mt-1.5 text-xs text-red-600 font-medium">
                  Payment overdue — follow up immediately.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-end gap-3 pt-5 mt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 text-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={update.isPending}
            className="bg-gold text-navy font-semibold px-4 py-2 rounded-lg hover:opacity-90 disabled:opacity-50 text-sm"
          >
            {update.isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ─── ViewBillingModal ─────────────────────────────────────────────────────────

interface ViewBillingModalProps {
  open: boolean;
  onClose: () => void;
  billing: Billing;
  onEdit: (b: Billing) => void;
}

function ViewBillingModal({ open, onClose, billing, onEdit }: ViewBillingModalProps) {
  const { data: detail } = useBilling(billing.id);
  const b = detail ?? billing;

  const [dlPdf, setDlPdf] = useState(false);
  const [dlEst, setDlEst] = useState(false);

  async function handlePdf() {
    setDlPdf(true);
    try {
      await billingApi.downloadPdf(b.id);
    } finally {
      setDlPdf(false);
    }
  }

  async function handleEstimate() {
    setDlEst(true);
    try {
      await billingApi.downloadEstimate(b.id);
    } finally {
      setDlEst(false);
    }
  }

  async function handlePrint() {
    window.print();
  }

  const isFullyPaid =
    b.status === 'PAID' || b.status === 'COMPLETED' || b.status === 'FINAL_SETTLEMENT';

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Billing Details"
      subtitle="View applicant, property, payment, and settlement information."
      size="2xl"
    >
      <div className="space-y-5">
        {/* ── Header row ── */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-gold font-bold text-lg font-mono">#{b.billingId}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              Created on {formatDate(b.createdAt)}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={b.status} />
          </div>
        </div>

        {/* ── Two-col: Applicant | Property ── */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Applicant Details
            </p>
            {[
              ['Buyer Name', b.buyerName],
              ['Phone', b.buyerPhone],
            ].map(([label, value]) => (
              <div key={label as string}>
                <p className="text-xs text-gray-400">{label}</p>
                <p className="text-sm font-medium text-gray-800">{value}</p>
              </div>
            ))}
          </div>

          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Property Details
            </p>
            {[
              ['Project', b.booking?.projectName ?? '—'],
              ['Plot', b.booking?.plotNumber ?? '—'],
              ['Branch', b.booking?.branch?.name ?? '—'],
            ].map(([label, value]) => (
              <div key={label as string}>
                <p className="text-xs text-gray-400">{label}</p>
                <p className="text-sm font-medium text-gray-800">{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Payment Details ── */}
        <div className="border border-gray-200 rounded-xl p-4 space-y-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Payment Details
          </p>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-gray-400">Payment Method</p>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${paymentMethodBadgeClass(b.paymentMethod)}`}
              >
                {paymentMethodLabel(b.paymentMethod)}
              </span>
            </div>
            <div>
              <p className="text-xs text-gray-400">Billing Date</p>
              <p className="text-sm font-medium text-gray-800">{formatDate(b.billingDate)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Total Received</p>
              <p className="text-sm font-medium text-green-700">
                {formatCurrency(b.totalReceived)}
              </p>
            </div>
          </div>

          {/* Amount highlight */}
          <div className="bg-gray-50 rounded-lg px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400">Amount (₹)</p>
              <p className="text-2xl font-bold text-gold mt-0.5">
                {formatCurrency(b.amountInNumbers)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">Balance</p>
              <p
                className={`text-lg font-bold mt-0.5 ${
                  b.totalBalance > 0 ? 'text-red-600' : 'text-green-600'
                }`}
              >
                {formatCurrency(b.totalBalance)}
              </p>
            </div>
          </div>

          <p className="text-xs text-gray-500 italic">{b.amountInWords}</p>
        </div>

        {/* ── Settlement Status ── */}
        <div className="border border-gray-200 rounded-xl p-4 space-y-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Settlement Status
          </p>
          <div className="flex items-center gap-3">
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                isFullyPaid
                  ? 'bg-green-100 text-green-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}
            >
              {isFullyPaid ? 'Fully Paid' : 'Pending'}
            </span>
            <span className="text-xs text-gray-500">
              {isFullyPaid ? 'All dues settled' : 'Awaiting payment'}
            </span>
          </div>
        </div>

        {/* ── Documents ── */}
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Documents &amp; Proofs
            </p>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Document Name
                </th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Status
                </th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              <tr>
                <td className="px-4 py-3 text-sm text-gray-700">
                  Billing Receipt
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Generated
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => void handlePdf()}
                      disabled={dlPdf}
                      className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors disabled:opacity-50"
                      aria-label="View receipt"
                    >
                      <EyeIcon />
                    </button>
                    <button
                      type="button"
                      onClick={() => void handlePdf()}
                      disabled={dlPdf}
                      className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors disabled:opacity-50"
                      aria-label="Download receipt"
                    >
                      <DownloadIcon />
                    </button>
                  </div>
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-sm text-gray-700">
                  Estimate PDF
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Available
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => void handleEstimate()}
                      disabled={dlEst}
                      className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors disabled:opacity-50"
                      aria-label="View estimate"
                    >
                      <EyeIcon />
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleEstimate()}
                      disabled={dlEst}
                      className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors disabled:opacity-50"
                      aria-label="Download estimate"
                    >
                      <DownloadIcon />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 text-sm"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              onEdit(billing);
            }}
            className="border border-gold text-gold px-4 py-2 rounded-lg hover:bg-gold/5 text-sm font-medium"
          >
            Edit Billing
          </button>
          <button
            type="button"
            onClick={() => void handleEstimate()}
            disabled={dlEst}
            className="border border-gold text-gold px-4 py-2 rounded-lg hover:bg-gold/5 text-sm font-medium flex items-center gap-2 disabled:opacity-50"
          >
            <DownloadIcon />
            {dlEst ? 'Downloading...' : 'Download Estimate'}
          </button>
          <button
            type="button"
            onClick={() => void handlePrint()}
            className="bg-gold text-navy font-semibold px-4 py-2 rounded-lg hover:opacity-90 text-sm flex items-center gap-2"
          >
            <PrintIcon />
            Print Estimate
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── BillingPage ──────────────────────────────────────────────────────────────

const SuperAdminBillingPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<BillingStatus | ''>('');
  const [branchFilter, setBranchFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  const [addOpen, setAddOpen] = useState(false);
  const [viewBilling, setViewBilling] = useState<Billing | null>(null);
  const [editBilling, setEditBilling] = useState<Billing | null>(null);

  const branchesQuery = useBranches({ limit: 100 });
  const branches = branchesQuery.data?.data ?? [];

  const { data, isLoading } = useBillings({
    page,
    limit: 20,
    search: search || undefined,
    status: status || undefined,
    branchId: branchFilter || undefined,
  });

  const billings = data?.data ?? [];
  const totalRecords = data?.total ?? 0;

  // KPI stats computed from current page data
  const paid = billings.filter(
    (b) => b.status === 'PAID' || b.status === 'COMPLETED'
  ).length;
  const pending = billings.filter(
    (b) => b.status === 'PENDING' || b.status === 'PARTIAL_PAYMENT'
  ).length;
  const pendingVerification = billings.filter(
    (b) => b.status === 'FINAL_SETTLEMENT'
  ).length;

  function handleDelete(b: Billing) {
    if (window.confirm(`Delete billing record "${b.billingId}"? This cannot be undone.`)) {
      // no-op until delete endpoint is available
    }
  }

  return (
    <div className="p-6">
      {/* ── Page Header ── */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Billing Hub</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage property payment records, settlement tracking, and financial documentation.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className="bg-gold text-navy font-semibold px-4 py-2 rounded-lg hover:opacity-90 text-sm flex-shrink-0"
        >
          + Add Billing
        </button>
      </div>

      {/* ── Filter Row ── */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-52 max-w-xs">
          <svg
            className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Search buyer name, billing ID..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold bg-white"
          />
        </div>

        {/* Status */}
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as BillingStatus | '');
            setPage(1);
          }}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold bg-white text-gray-700"
        >
          <option value="">All Status</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s.replace(/_/g, ' ')}
            </option>
          ))}
        </select>

        {/* Branch */}
        <select
          value={branchFilter}
          onChange={(e) => {
            setBranchFilter(e.target.value);
            setPage(1);
          }}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold bg-white text-gray-700"
        >
          <option value="">All Branches</option>
          {branches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>

        {/* Date */}
        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold bg-white text-gray-700"
        />
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {/* Total Billing Records */}
        <div className="bg-white rounded-xl border border-gray-200 px-5 py-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">
            Total Billing Records
          </p>
          <p className="text-2xl font-bold text-gray-900">{totalRecords}</p>
          <p className="text-xs text-gray-400 mt-0.5">All time records</p>
        </div>

        {/* Paid Records */}
        <div className="bg-white rounded-xl border border-gray-200 px-5 py-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">
            Paid Records
          </p>
          <p className="text-2xl font-bold text-green-600">{paid}</p>
          <p className="text-xs text-gray-400 mt-0.5">Fully Settled</p>
        </div>

        {/* Balance Pending */}
        <div className="bg-white rounded-xl border border-gray-200 px-5 py-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">
            Balance Pending
          </p>
          <p className="text-2xl font-bold text-yellow-600">{pending}</p>
          <p className="text-xs text-gray-400 mt-0.5">Awaiting Payment</p>
        </div>

        {/* Pending Verification */}
        <div className="bg-white rounded-xl border border-gray-200 px-5 py-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">
            Pending Verification
          </p>
          <p className="text-2xl font-bold text-red-500">{pendingVerification}</p>
          <p className="text-xs text-red-400 mt-0.5 flex items-center gap-1">
            <span>!</span>
            <span>Requires Review</span>
          </p>
        </div>
      </div>

      {/* ── Billing Table ── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Table header */}
        <div className="bg-gray-50 border-b border-gray-200">
          <table className="w-full text-xs">
            <thead>
              <tr>
                <th className="text-left px-5 py-3 font-semibold text-gray-500 uppercase tracking-wide">
                  Billing ID
                </th>
                <th className="text-left px-5 py-3 font-semibold text-gray-500 uppercase tracking-wide">
                  Applicant
                </th>
                <th className="text-left px-5 py-3 font-semibold text-gray-500 uppercase tracking-wide">
                  Project
                </th>
                <th className="text-left px-5 py-3 font-semibold text-gray-500 uppercase tracking-wide">
                  Plot / Sq.Ft
                </th>
                <th className="text-left px-5 py-3 font-semibold text-gray-500 uppercase tracking-wide">
                  Method
                </th>
                <th className="text-left px-5 py-3 font-semibold text-gray-500 uppercase tracking-wide">
                  Amount
                </th>
                <th className="text-left px-5 py-3 font-semibold text-gray-500 uppercase tracking-wide">
                  Status
                </th>
                <th className="text-left px-5 py-3 font-semibold text-gray-500 uppercase tracking-wide">
                  Actions
                </th>
              </tr>
            </thead>
          </table>
        </div>

        {/* Table body */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-gray-400">
                    Loading billing records...
                  </td>
                </tr>
              ) : billings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-gray-400">
                    No billing records found
                  </td>
                </tr>
              ) : (
                billings.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50/50 transition-colors">
                    {/* Billing ID */}
                    <td className="px-5 py-4">
                      <span className="font-mono text-sm text-gold font-semibold">
                        #{b.billingId}
                      </span>
                    </td>

                    {/* Applicant */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-gold/10 text-gold flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {getInitials(b.buyerName)}
                        </div>
                        <div>
                          <p className="font-medium text-sm text-gray-900">{b.buyerName}</p>
                          <p className="text-xs text-gray-500">{b.buyerPhone}</p>
                        </div>
                      </div>
                    </td>

                    {/* Project */}
                    <td className="px-5 py-4">
                      <p className="text-sm font-medium text-gray-700">
                        {b.booking?.projectName ?? '—'}
                      </p>
                    </td>

                    {/* Plot / Sq.Ft */}
                    <td className="px-5 py-4">
                      <p className="text-xs text-gray-500">
                        {b.booking?.plotNumber
                          ? `Plot: ${b.booking.plotNumber}`
                          : '—'}
                        {b.booking?.property?.squareFeet
                          ? ` | ${b.booking.property.squareFeet} sq.ft`
                          : ''}
                      </p>
                    </td>

                    {/* Method */}
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${paymentMethodBadgeClass(b.paymentMethod)}`}
                      >
                        {paymentMethodLabel(b.paymentMethod)}
                      </span>
                    </td>

                    {/* Amount */}
                    <td className="px-5 py-4">
                      <p className="text-sm font-semibold text-gray-900">
                        {formatCurrency(b.amountInNumbers)}
                      </p>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4">
                      <StatusBadge status={b.status} />
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setViewBilling(b)}
                          className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                          aria-label="View billing"
                        >
                          <EyeIcon />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditBilling(b)}
                          className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                          aria-label="Edit billing"
                        >
                          <PencilIcon />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(b)}
                          className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                          aria-label="Delete billing"
                        >
                          <TrashIcon />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {data && (
          <Pagination
            page={page}
            total={data.total}
            limit={data.limit}
            onPageChange={setPage}
          />
        )}
      </div>

      {/* ── Modals ── */}
      <AddBillingModal open={addOpen} onClose={() => setAddOpen(false)} />

      {viewBilling && (
        <ViewBillingModal
          open
          onClose={() => setViewBilling(null)}
          billing={viewBilling}
          onEdit={(b) => {
            setViewBilling(null);
            setEditBilling(b);
          }}
        />
      )}

      {editBilling && (
        <EditBillingModal
          open
          onClose={() => setEditBilling(null)}
          billing={editBilling}
        />
      )}
    </div>
  );
};

export default SuperAdminBillingPage;
