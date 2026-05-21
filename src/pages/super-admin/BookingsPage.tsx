import React, { useState } from 'react';
import {
  useBookings,
  useBooking,
  useCreateBooking,
  useUpdateBooking,
} from '../../hooks/useBookings';
import { useProperties } from '../../hooks/useProperties';
import { useBranches } from '../../hooks/useBranches';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Pagination } from '../../components/ui/Pagination';
import { Modal } from '../../components/ui/Modal';
import { bookingsApi } from '../../api/bookings.api';
import type { BookingStatus, Booking } from '../../types';

// ─── Style constants ──────────────────────────────────────────────────────────

const inputClass =
  'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold bg-white';
const labelClass = 'block text-xs font-medium text-gray-600 mb-1';
const sectionHeaderClass =
  'flex items-center gap-2 text-gold text-xs font-semibold uppercase tracking-wide mb-3';

// ─── Status options ───────────────────────────────────────────────────────────

const STATUS_OPTIONS: BookingStatus[] = [
  'BOOKING_INITIATED',
  'TOKEN_RECEIVED',
  'ADVANCE_PAYMENT',
  'REGISTRATION_PENDING',
  'FINAL_SETTLEMENT_PENDING',
  'COMPLETED',
  'CANCELLED',
];

// ─── Denomination types ───────────────────────────────────────────────────────

const DENOM_VALUES = [2000, 1000, 500, 200, 100, 50, 20, 10] as const;
type DenomValue = (typeof DENOM_VALUES)[number];

interface DenomRow {
  id: number;
  denomination: DenomValue;
  count: number;
}

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

const PlusCircleIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const FilterIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
  </svg>
);

const DownloadIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
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

function draftTime(): string {
  const now = new Date();
  return now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

// ─── Denomination Table sub-component ────────────────────────────────────────

interface DenominationTableProps {
  rows: DenomRow[];
  onAdd: () => void;
  onRemove: (id: number) => void;
  onChange: (id: number, field: 'denomination' | 'count', value: string) => void;
}

function DenominationTable({ rows, onAdd, onRemove, onChange }: DenominationTableProps) {
  return (
    <div>
      <div className={sectionHeaderClass}>
        <span>5.</span>
        <span>Denomination Details</span>
      </div>
      <div className="overflow-x-auto rounded-lg border border-gray-100">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Denomination Type
              </th>
              <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Count
              </th>
              <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Amount
              </th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="px-3 py-2">
                  <select
                    value={row.denomination}
                    onChange={(e) => onChange(row.id, 'denomination', e.target.value)}
                    className={inputClass}
                  >
                    {DENOM_VALUES.map((d) => (
                      <option key={d} value={d}>
                        ₹{d}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    min={0}
                    value={row.count}
                    onChange={(e) => onChange(row.id, 'count', e.target.value)}
                    className={inputClass}
                  />
                </td>
                <td className="px-3 py-2 text-sm font-medium text-gray-700">
                  {formatCurrency(row.denomination * row.count)}
                </td>
                <td className="px-3 py-2">
                  <button
                    type="button"
                    onClick={() => onRemove(row.id)}
                    className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                  >
                    <TrashIcon />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button
        type="button"
        onClick={onAdd}
        className="mt-3 flex items-center gap-1.5 text-gold text-sm font-semibold hover:opacity-80 transition-opacity"
      >
        <PlusCircleIcon />
        Add Row
      </button>
    </div>
  );
}

// ─── Booking form state ───────────────────────────────────────────────────────

interface BookingForm {
  // Section 1: Property Details
  projectName: string;
  propertyId: string;
  plotNumber: string;
  squareFeet: string;
  bookingDate: string;
  // Section 2: Applicant Details
  applicantName: string;
  relationship: string;
  cellNumber: string;
  address: string;
  pinCode: string;
  dateOfBirth: string;
  weddingDay: string;
  // Section 3: Reference Details
  edDdSmBmName: string;
  codeNumber: string;
  directorName: string;
  // Section 4: Payment Details
  bankName: string;
  favourOf: string;
  chequeNumber: string;
  chequeDate: string;
  gpayReference: string;
  cashAmount: string;
  // Meta
  branchId: string;
}

const emptyForm: BookingForm = {
  projectName: '',
  propertyId: '',
  plotNumber: '',
  squareFeet: '',
  bookingDate: '',
  applicantName: '',
  relationship: '',
  cellNumber: '',
  address: '',
  pinCode: '',
  dateOfBirth: '',
  weddingDay: '',
  edDdSmBmName: '',
  codeNumber: '',
  directorName: '',
  bankName: '',
  favourOf: '',
  chequeNumber: '',
  chequeDate: '',
  gpayReference: '',
  cashAmount: '',
  branchId: '',
};

// ─── CreateBookingModal ───────────────────────────────────────────────────────

interface CreateBookingModalProps {
  open: boolean;
  onClose: () => void;
}

function CreateBookingModal({ open, onClose }: CreateBookingModalProps) {
  const create = useCreateBooking();
  const propertiesQuery = useProperties({ limit: 100 });
  const branchesQuery = useBranches({ limit: 100 });
  const properties = propertiesQuery.data?.data ?? [];
  const branches = branchesQuery.data?.data ?? [];

  const [form, setForm] = useState<BookingForm>(emptyForm);
  const [denomRows, setDenomRows] = useState<DenomRow[]>([]);
  let nextDenomId = React.useRef(1);

  const denomTotal = denomRows.reduce((sum, r) => sum + r.denomination * r.count, 0);
  const cashAmount = parseFloat(form.cashAmount) || 0;
  const totalAmount = denomTotal + cashAmount;

  function setField(field: keyof BookingForm, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function addDenomRow() {
    setDenomRows((rows) => [
      ...rows,
      { id: nextDenomId.current++, denomination: 500, count: 0 },
    ]);
  }

  function removeDenomRow(id: number) {
    setDenomRows((rows) => rows.filter((r) => r.id !== id));
  }

  function changeDenomRow(id: number, field: 'denomination' | 'count', value: string) {
    setDenomRows((rows) =>
      rows.map((r) =>
        r.id === id
          ? {
              ...r,
              [field]:
                field === 'denomination'
                  ? (parseInt(value) as DenomValue)
                  : Math.max(0, parseInt(value) || 0),
            }
          : r
      )
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    create.mutate(
      {
        propertyId: form.propertyId,
        applicantName: form.applicantName,
        cellNumber: form.cellNumber,
        projectName: form.projectName,
        plotNumber: form.plotNumber,
        bookingDate: form.bookingDate,
        branchId: form.branchId || undefined,
      },
      {
        onSuccess: () => {
          onClose();
          setForm(emptyForm);
          setDenomRows([]);
        },
      }
    );
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Book Property"
      subtitle="Create a property booking record using Sri Thangam Housing booking form details."
      size="3xl"
    >
      <form onSubmit={handleSubmit}>
        {/* ── Section 1: Property Details ── */}
        <div>
          <div className={sectionHeaderClass}>
            <span>1.</span>
            <span>Property Details</span>
          </div>
          <div className="grid grid-cols-4 gap-4">
            <div className="col-span-2">
              <label className={labelClass}>Project Name *</label>
              <select
                required
                value={form.propertyId}
                onChange={(e) => {
                  const prop = properties.find((p) => p.id === e.target.value);
                  setForm((f) => ({
                    ...f,
                    propertyId: e.target.value,
                    projectName: prop?.projectName ?? '',
                    plotNumber: prop?.plotNumber ?? '',
                    squareFeet: prop?.squareFeet?.toString() ?? '',
                  }));
                }}
                className={inputClass}
              >
                <option value="">Select project</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.projectName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Plot Number</label>
              <input
                type="text"
                value={form.plotNumber}
                onChange={(e) => setField('plotNumber', e.target.value)}
                className={inputClass}
                placeholder="e.g. A-42"
              />
            </div>
            <div>
              <label className={labelClass}>Square Feet</label>
              <input
                type="number"
                min={0}
                value={form.squareFeet}
                onChange={(e) => setField('squareFeet', e.target.value)}
                className={inputClass}
                placeholder="e.g. 1200"
              />
            </div>
            <div>
              <label className={labelClass}>Booking Date *</label>
              <input
                type="date"
                required
                value={form.bookingDate}
                onChange={(e) => setField('bookingDate', e.target.value)}
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

        <hr className="border-gray-100 my-5" />

        {/* ── Section 2: Applicant Details ── */}
        <div>
          <div className={sectionHeaderClass}>
            <span>2.</span>
            <span>Applicant Details</span>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-3">
              <label className={labelClass}>Applicant Name *</label>
              <input
                type="text"
                required
                value={form.applicantName}
                onChange={(e) => setField('applicantName', e.target.value)}
                className={inputClass}
                placeholder="Full name as per documents"
              />
            </div>
            <div>
              <label className={labelClass}>S/D/C/W/O</label>
              <input
                type="text"
                value={form.relationship}
                onChange={(e) => setField('relationship', e.target.value)}
                className={inputClass}
                placeholder="e.g. S/O Ramesh Kumar"
              />
            </div>
            <div>
              <label className={labelClass}>Cell Number *</label>
              <input
                type="tel"
                required
                value={form.cellNumber}
                onChange={(e) => setField('cellNumber', e.target.value)}
                className={inputClass}
                placeholder="+91 98765 43210"
              />
            </div>
            <div>
              <label className={labelClass}>PIN Code</label>
              <input
                type="text"
                maxLength={6}
                value={form.pinCode}
                onChange={(e) => setField('pinCode', e.target.value)}
                className={inputClass}
                placeholder="6-digit PIN"
              />
            </div>
            <div className="col-span-3">
              <label className={labelClass}>Address</label>
              <textarea
                rows={2}
                value={form.address}
                onChange={(e) => setField('address', e.target.value)}
                className={`${inputClass} resize-none`}
                placeholder="Full residential address"
              />
            </div>
            <div>
              <label className={labelClass}>Date of Birth</label>
              <input
                type="date"
                value={form.dateOfBirth}
                onChange={(e) => setField('dateOfBirth', e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Wedding Day (optional)</label>
              <input
                type="date"
                value={form.weddingDay}
                onChange={(e) => setField('weddingDay', e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
        </div>

        <hr className="border-gray-100 my-5" />

        {/* ── Section 3: Reference Details ── */}
        <div>
          <div className={sectionHeaderClass}>
            <span>3.</span>
            <span>Reference Details</span>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>ED/DD/SM/BM Name</label>
              <input
                type="text"
                value={form.edDdSmBmName}
                onChange={(e) => setField('edDdSmBmName', e.target.value)}
                className={inputClass}
                placeholder="Reference agent name"
              />
            </div>
            <div>
              <label className={labelClass}>Code Number</label>
              <input
                type="text"
                value={form.codeNumber}
                onChange={(e) => setField('codeNumber', e.target.value)}
                className={inputClass}
                placeholder="Agent code"
              />
            </div>
            <div>
              <label className={labelClass}>Director Name</label>
              <input
                type="text"
                value={form.directorName}
                onChange={(e) => setField('directorName', e.target.value)}
                className={inputClass}
                placeholder="Director name"
              />
            </div>
          </div>
        </div>

        <hr className="border-gray-100 my-5" />

        {/* ── Section 4: Payment Details ── */}
        <div>
          <div className={sectionHeaderClass}>
            <span>4.</span>
            <span>Payment Details</span>
          </div>
          <div className="grid grid-cols-4 gap-4">
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
              <label className={labelClass}>Favour Of</label>
              <input
                type="text"
                value={form.favourOf}
                onChange={(e) => setField('favourOf', e.target.value)}
                className={inputClass}
                placeholder="Payee name"
              />
            </div>
            <div>
              <label className={labelClass}>Cheque Number</label>
              <input
                type="text"
                value={form.chequeNumber}
                onChange={(e) => setField('chequeNumber', e.target.value)}
                className={inputClass}
                placeholder="e.g. 001234"
              />
            </div>
            <div>
              <label className={labelClass}>Cheque Date</label>
              <input
                type="date"
                value={form.chequeDate}
                onChange={(e) => setField('chequeDate', e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="col-span-2">
              <label className={labelClass}>GPay Reference (UPI Transaction ID)</label>
              <input
                type="text"
                value={form.gpayReference}
                onChange={(e) => setField('gpayReference', e.target.value)}
                className={inputClass}
                placeholder="e.g. 12345678901234"
              />
            </div>
            <div>
              <label className={labelClass}>Cash Amount</label>
              <input
                type="number"
                min={0}
                value={form.cashAmount}
                onChange={(e) => setField('cashAmount', e.target.value)}
                className={inputClass}
                placeholder="0"
              />
            </div>
            <div>
              <label className={labelClass}>Total Amount</label>
              <input
                readOnly
                value={formatCurrency(totalAmount)}
                className={`${inputClass} bg-gray-50 cursor-not-allowed font-medium text-gray-700`}
              />
            </div>
          </div>
        </div>

        <hr className="border-gray-100 my-5" />

        {/* ── Section 5: Denomination Details ── */}
        <DenominationTable
          rows={denomRows}
          onAdd={addDenomRow}
          onRemove={removeDenomRow}
          onChange={changeDenomRow}
        />

        <hr className="border-gray-100 my-5" />

        {/* ── Section 6: Authorization ── */}
        <div>
          <div className={sectionHeaderClass}>
            <span>6.</span>
            <span>Authorization</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {/* Signature upload */}
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-gold transition-colors">
              <UploadIcon />
              <p className="text-sm font-medium text-gray-600 text-center">
                Upload Applicant Signature
              </p>
              <p className="text-xs text-gray-400">PNG, JPG, GIF up to 2MB</p>
            </div>

            {/* Draw signature */}
            <div className="border border-gray-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Draw Signature Below
                </p>
                <button
                  type="button"
                  className="text-xs font-semibold text-gold hover:opacity-80 transition-opacity"
                >
                  Clear
                </button>
              </div>
              <div className="h-32 bg-gray-50 rounded-lg border border-dashed border-gray-200 flex items-center justify-center">
                <p className="text-xs text-gray-400">Draw your signature here</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Modal footer ── */}
        <div className="flex items-center justify-between pt-5 mt-5 border-t border-gray-100">
          <p className="text-xs text-gray-400">Draft saved at {draftTime()}</p>
          <div className="flex items-center gap-3">
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
              {create.isPending ? 'Saving...' : 'Save Booking'}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}

// ─── EditBookingModal ─────────────────────────────────────────────────────────

interface EditBookingModalProps {
  open: boolean;
  onClose: () => void;
  booking: Booking;
}

function EditBookingModal({ open, onClose, booking }: EditBookingModalProps) {
  const update = useUpdateBooking();
  const propertiesQuery = useProperties({ limit: 100 });
  const branchesQuery = useBranches({ limit: 100 });
  const properties = propertiesQuery.data?.data ?? [];
  const branches = branchesQuery.data?.data ?? [];

  const [form, setForm] = useState<BookingForm>({
    ...emptyForm,
    projectName: booking.projectName,
    propertyId: booking.propertyId,
    plotNumber: booking.plotNumber,
    squareFeet: booking.property?.squareFeet?.toString() ?? '',
    bookingDate: booking.bookingDate.split('T')[0],
    applicantName: booking.applicantName,
    cellNumber: booking.cellNumber,
    branchId: booking.branch?.id ?? '',
  });

  const [denomRows, setDenomRows] = useState<DenomRow[]>([]);
  const nextDenomId = React.useRef(1);

  const denomTotal = denomRows.reduce((sum, r) => sum + r.denomination * r.count, 0);
  const cashAmount = parseFloat(form.cashAmount) || 0;
  const totalAmount = denomTotal + cashAmount;

  function setField(field: keyof BookingForm, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function addDenomRow() {
    setDenomRows((rows) => [
      ...rows,
      { id: nextDenomId.current++, denomination: 500, count: 0 },
    ]);
  }

  function removeDenomRow(id: number) {
    setDenomRows((rows) => rows.filter((r) => r.id !== id));
  }

  function changeDenomRow(id: number, field: 'denomination' | 'count', value: string) {
    setDenomRows((rows) =>
      rows.map((r) =>
        r.id === id
          ? {
              ...r,
              [field]:
                field === 'denomination'
                  ? (parseInt(value) as DenomValue)
                  : Math.max(0, parseInt(value) || 0),
            }
          : r
      )
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    update.mutate(
      {
        id: booking.id,
        data: {
          propertyId: form.propertyId || undefined,
          applicantName: form.applicantName || undefined,
          cellNumber: form.cellNumber || undefined,
          projectName: form.projectName || undefined,
          plotNumber: form.plotNumber || undefined,
          bookingDate: form.bookingDate || undefined,
          branchId: form.branchId || undefined,
        },
      },
      { onSuccess: onClose }
    );
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Book Property"
      subtitle="Create a property booking record using Sri Thangam Housing booking form details."
      size="3xl"
    >
      <form onSubmit={handleSubmit}>
        {/* ── Section 1: Property Details ── */}
        <div>
          <div className={sectionHeaderClass}>
            <span>1.</span>
            <span>Property Details</span>
          </div>
          <div className="grid grid-cols-4 gap-4">
            <div className="col-span-2">
              <label className={labelClass}>Project Name *</label>
              <select
                required
                value={form.propertyId}
                onChange={(e) => {
                  const prop = properties.find((p) => p.id === e.target.value);
                  setForm((f) => ({
                    ...f,
                    propertyId: e.target.value,
                    projectName: prop?.projectName ?? '',
                    plotNumber: prop?.plotNumber ?? '',
                    squareFeet: prop?.squareFeet?.toString() ?? '',
                  }));
                }}
                className={inputClass}
              >
                <option value="">Select project</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.projectName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Plot Number</label>
              <input
                type="text"
                value={form.plotNumber}
                onChange={(e) => setField('plotNumber', e.target.value)}
                className={inputClass}
                placeholder="e.g. A-42"
              />
            </div>
            <div>
              <label className={labelClass}>Square Feet</label>
              <input
                type="number"
                min={0}
                value={form.squareFeet}
                onChange={(e) => setField('squareFeet', e.target.value)}
                className={inputClass}
                placeholder="e.g. 1200"
              />
            </div>
            <div>
              <label className={labelClass}>Booking Date *</label>
              <input
                type="date"
                required
                value={form.bookingDate}
                onChange={(e) => setField('bookingDate', e.target.value)}
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

        <hr className="border-gray-100 my-5" />

        {/* ── Section 2: Applicant Details ── */}
        <div>
          <div className={sectionHeaderClass}>
            <span>2.</span>
            <span>Applicant Details</span>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-3">
              <label className={labelClass}>Applicant Name *</label>
              <input
                type="text"
                required
                value={form.applicantName}
                onChange={(e) => setField('applicantName', e.target.value)}
                className={inputClass}
                placeholder="Full name as per documents"
              />
            </div>
            <div>
              <label className={labelClass}>S/D/C/W/O</label>
              <input
                type="text"
                value={form.relationship}
                onChange={(e) => setField('relationship', e.target.value)}
                className={inputClass}
                placeholder="e.g. S/O Ramesh Kumar"
              />
            </div>
            <div>
              <label className={labelClass}>Cell Number *</label>
              <input
                type="tel"
                required
                value={form.cellNumber}
                onChange={(e) => setField('cellNumber', e.target.value)}
                className={inputClass}
                placeholder="+91 98765 43210"
              />
            </div>
            <div>
              <label className={labelClass}>PIN Code</label>
              <input
                type="text"
                maxLength={6}
                value={form.pinCode}
                onChange={(e) => setField('pinCode', e.target.value)}
                className={inputClass}
                placeholder="6-digit PIN"
              />
            </div>
            <div className="col-span-3">
              <label className={labelClass}>Address</label>
              <textarea
                rows={2}
                value={form.address}
                onChange={(e) => setField('address', e.target.value)}
                className={`${inputClass} resize-none`}
                placeholder="Full residential address"
              />
            </div>
            <div>
              <label className={labelClass}>Date of Birth</label>
              <input
                type="date"
                value={form.dateOfBirth}
                onChange={(e) => setField('dateOfBirth', e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Wedding Day (optional)</label>
              <input
                type="date"
                value={form.weddingDay}
                onChange={(e) => setField('weddingDay', e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
        </div>

        <hr className="border-gray-100 my-5" />

        {/* ── Section 3: Reference Details ── */}
        <div>
          <div className={sectionHeaderClass}>
            <span>3.</span>
            <span>Reference Details</span>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>ED/DD/SM/BM Name</label>
              <input
                type="text"
                value={form.edDdSmBmName}
                onChange={(e) => setField('edDdSmBmName', e.target.value)}
                className={inputClass}
                placeholder="Reference agent name"
              />
            </div>
            <div>
              <label className={labelClass}>Code Number</label>
              <input
                type="text"
                value={form.codeNumber}
                onChange={(e) => setField('codeNumber', e.target.value)}
                className={inputClass}
                placeholder="Agent code"
              />
            </div>
            <div>
              <label className={labelClass}>Director Name</label>
              <input
                type="text"
                value={form.directorName}
                onChange={(e) => setField('directorName', e.target.value)}
                className={inputClass}
                placeholder="Director name"
              />
            </div>
          </div>
        </div>

        <hr className="border-gray-100 my-5" />

        {/* ── Section 4: Payment Details ── */}
        <div>
          <div className={sectionHeaderClass}>
            <span>4.</span>
            <span>Payment Details</span>
          </div>
          <div className="grid grid-cols-4 gap-4">
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
              <label className={labelClass}>Favour Of</label>
              <input
                type="text"
                value={form.favourOf}
                onChange={(e) => setField('favourOf', e.target.value)}
                className={inputClass}
                placeholder="Payee name"
              />
            </div>
            <div>
              <label className={labelClass}>Cheque Number</label>
              <input
                type="text"
                value={form.chequeNumber}
                onChange={(e) => setField('chequeNumber', e.target.value)}
                className={inputClass}
                placeholder="e.g. 001234"
              />
            </div>
            <div>
              <label className={labelClass}>Cheque Date</label>
              <input
                type="date"
                value={form.chequeDate}
                onChange={(e) => setField('chequeDate', e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="col-span-2">
              <label className={labelClass}>GPay Reference (UPI Transaction ID)</label>
              <input
                type="text"
                value={form.gpayReference}
                onChange={(e) => setField('gpayReference', e.target.value)}
                className={inputClass}
                placeholder="e.g. 12345678901234"
              />
            </div>
            <div>
              <label className={labelClass}>Cash Amount</label>
              <input
                type="number"
                min={0}
                value={form.cashAmount}
                onChange={(e) => setField('cashAmount', e.target.value)}
                className={inputClass}
                placeholder="0"
              />
            </div>
            <div>
              <label className={labelClass}>Total Amount</label>
              <input
                readOnly
                value={formatCurrency(totalAmount)}
                className={`${inputClass} bg-gray-50 cursor-not-allowed font-medium text-gray-700`}
              />
            </div>
          </div>
        </div>

        <hr className="border-gray-100 my-5" />

        {/* ── Section 5: Denomination Details ── */}
        <DenominationTable
          rows={denomRows}
          onAdd={addDenomRow}
          onRemove={removeDenomRow}
          onChange={changeDenomRow}
        />

        <hr className="border-gray-100 my-5" />

        {/* ── Section 6: Authorization ── */}
        <div>
          <div className={sectionHeaderClass}>
            <span>6.</span>
            <span>Authorization</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-gold transition-colors">
              <UploadIcon />
              <p className="text-sm font-medium text-gray-600 text-center">
                Upload Applicant Signature
              </p>
              <p className="text-xs text-gray-400">PNG, JPG, GIF up to 2MB</p>
            </div>
            <div className="border border-gray-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Draw Signature Below
                </p>
                <button
                  type="button"
                  className="text-xs font-semibold text-gold hover:opacity-80 transition-opacity"
                >
                  Clear
                </button>
              </div>
              <div className="h-32 bg-gray-50 rounded-lg border border-dashed border-gray-200 flex items-center justify-center">
                <p className="text-xs text-gray-400">Draw your signature here</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Modal footer ── */}
        <div className="flex items-center justify-between pt-5 mt-5 border-t border-gray-100">
          <p className="text-xs text-gray-400">Draft saved at {draftTime()}</p>
          <div className="flex items-center gap-3">
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
              {update.isPending ? 'Saving...' : 'Save Booking'}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}

// ─── ViewBookingModal ─────────────────────────────────────────────────────────

interface ViewBookingModalProps {
  open: boolean;
  onClose: () => void;
  booking: Booking;
  onEdit: (b: Booking) => void;
}

function ViewBookingModal({ open, onClose, booking, onEdit }: ViewBookingModalProps) {
  const { data: detail } = useBooking(booking.id);
  const b = detail ?? booking;
  const [downloading, setDownloading] = useState(false);

  async function handleDownload() {
    setDownloading(true);
    try {
      await bookingsApi.downloadPdf(b.id);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Booking Details"
      subtitle="View complete booking information."
      size="2xl"
    >
      <div className="space-y-5">
        {/* Booking header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gold font-bold text-lg font-mono">#{b.bookingId}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              Generated on {formatDate(b.createdAt)}
            </p>
          </div>
          <StatusBadge status={b.status} />
        </div>

        {/* Two-column cards */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Applicant Details
            </p>
            {[
              ['Name', b.applicantName],
              ['Cell Number', b.cellNumber],
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
              ['Project', b.projectName],
              ['Plot', b.plotNumber],
              ['Area', b.property?.squareFeet ? `${b.property.squareFeet} sq.ft` : '—'],
            ].map(([label, value]) => (
              <div key={label as string}>
                <p className="text-xs text-gray-400">{label}</p>
                <p className="text-sm font-medium text-gray-800">{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Reference + Payment */}
        <div className="grid grid-cols-2 gap-4">
          <div className="border border-gray-100 rounded-xl p-4 space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Reference Details
            </p>
            {[
              ['Branch', b.branch?.name ?? '—'],
              ['Booking Date', formatDate(b.bookingDate)],
            ].map(([label, value]) => (
              <div key={label as string}>
                <p className="text-xs text-gray-400">{label}</p>
                <p className="text-sm font-medium text-gray-800">{value}</p>
              </div>
            ))}
          </div>

          <div className="border border-gray-100 rounded-xl p-4 space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Property Info
            </p>
            {b.property && [
              ['Property ID', b.property.propertyId],
              ['Type', b.property.propertyType],
            ].map(([label, value]) => (
              <div key={label as string}>
                <p className="text-xs text-gray-400">{label}</p>
                <p className="text-sm font-medium text-gray-800">{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer actions */}
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
            onClick={() => { onClose(); onEdit(booking); }}
            className="border border-gold text-gold px-4 py-2 rounded-lg hover:bg-gold/5 text-sm font-medium"
          >
            Edit Booking
          </button>
          <button
            type="button"
            onClick={() => void handleDownload()}
            disabled={downloading}
            className="bg-gold text-navy font-semibold px-4 py-2 rounded-lg hover:opacity-90 disabled:opacity-50 text-sm flex items-center gap-2"
          >
            <DownloadIcon />
            {downloading ? 'Downloading...' : 'Download PDF'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── BookingsPage ─────────────────────────────────────────────────────────────

const SuperAdminBookingsPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<BookingStatus | ''>('');
  const [branchFilter, setBranchFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const [createOpen, setCreateOpen] = useState(false);
  const [viewBooking, setViewBooking] = useState<Booking | null>(null);
  const [editBooking, setEditBooking] = useState<Booking | null>(null);

  const branchesQuery = useBranches({ limit: 100 });
  const branches = branchesQuery.data?.data ?? [];

  const { data, isLoading } = useBookings({
    page,
    limit: 20,
    search: search || undefined,
    status: status || undefined,
    branchId: branchFilter || undefined,
  });

  const bookings = data?.data ?? [];

  // Summary stats computed from current page data
  const totalBookings = data?.total ?? 0;
  const completed = bookings.filter((b) => b.status === 'COMPLETED').length;
  const inProgress = bookings.filter(
    (b) =>
      b.status !== 'COMPLETED' &&
      b.status !== 'CANCELLED'
  ).length;
  const cancelled = bookings.filter((b) => b.status === 'CANCELLED').length;

  function handleDelete(b: Booking) {
    if (window.confirm(`Delete booking "${b.bookingId}"? This action cannot be undone.`)) {
      // no-op until delete hook is added
    }
  }

  return (
    <div className="p-6 pb-24">
      {/* ── Page Header ── */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold text-gray-900">Book Property</h1>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="bg-gold text-navy font-semibold px-4 py-2 rounded-lg hover:opacity-90 text-sm"
        >
          + Add Booking
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
            placeholder="Search by applicant, project, plot..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold bg-white"
          />
        </div>

        {/* Status dropdown */}
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as BookingStatus | '');
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

        {/* Branch dropdown */}
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

        {/* Date range */}
        <div className="flex items-center gap-1.5">
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold bg-white text-gray-700"
          />
          <span className="text-gray-400 text-sm">–</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold bg-white text-gray-700"
          />
        </div>

        {/* Filter button */}
        <button
          type="button"
          className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <FilterIcon />
          Filter
        </button>
      </div>

      {/* ── Bookings Table ── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Table header */}
        <div className="bg-gray-50 border-b border-gray-200">
          <table className="w-full text-xs">
            <thead>
              <tr>
                <th className="text-left px-5 py-3 font-semibold text-gray-500 uppercase tracking-wide">
                  Booking ID
                </th>
                <th className="text-left px-5 py-3 font-semibold text-gray-500 uppercase tracking-wide">
                  Applicant Details
                </th>
                <th className="text-left px-5 py-3 font-semibold text-gray-500 uppercase tracking-wide">
                  Project / Plot
                </th>
                <th className="text-left px-5 py-3 font-semibold text-gray-500 uppercase tracking-wide">
                  Branch
                </th>
                <th className="text-left px-5 py-3 font-semibold text-gray-500 uppercase tracking-wide">
                  Status
                </th>
                <th className="text-left px-5 py-3 font-semibold text-gray-500 uppercase tracking-wide">
                  Date
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
                  <td colSpan={7} className="px-5 py-12 text-center text-gray-400">
                    Loading bookings...
                  </td>
                </tr>
              ) : bookings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-gray-400">
                    No bookings found
                  </td>
                </tr>
              ) : (
                bookings.map((b) => (
                  <tr
                    key={b.id}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    {/* Booking ID */}
                    <td className="px-5 py-4">
                      <span className="font-mono text-sm text-gold font-semibold">
                        #{b.bookingId}
                      </span>
                    </td>

                    {/* Applicant */}
                    <td className="px-5 py-4">
                      <p className="font-medium text-sm text-gray-900">{b.applicantName}</p>
                      <p className="text-xs text-gray-500">{b.cellNumber}</p>
                    </td>

                    {/* Project / Plot */}
                    <td className="px-5 py-4">
                      <p className="text-sm font-medium text-blue-600">{b.projectName}</p>
                      <p className="text-xs text-gray-500">
                        Plot: {b.plotNumber}
                        {b.property?.squareFeet ? ` | ${b.property.squareFeet} sq.ft` : ''}
                      </p>
                    </td>

                    {/* Branch */}
                    <td className="px-5 py-4 text-sm text-gray-600">
                      {b.branch?.name ?? '—'}
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4">
                      <StatusBadge status={b.status} />
                    </td>

                    {/* Date */}
                    <td className="px-5 py-4 text-xs text-gray-500">
                      {formatDate(b.bookingDate)}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setViewBooking(b)}
                          className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                          aria-label="View booking"
                        >
                          <EyeIcon />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditBooking(b)}
                          className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                          aria-label="Edit booking"
                        >
                          <PencilIcon />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(b)}
                          className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                          aria-label="Delete booking"
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

      {/* ── Fixed Summary Footer ── */}
      <div className="fixed bottom-0 left-64 right-0 bg-white border-t border-gray-200 px-8 py-3 flex items-center gap-12 z-10">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide">Total Bookings</p>
          <p className="text-lg font-bold text-gray-900 leading-tight">{totalBookings}</p>
          <p className="text-xs text-gray-400">All time</p>
        </div>

        <div className="w-px h-10 bg-gray-200" />

        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide">Completed</p>
          <p className="text-lg font-bold text-green-600 leading-tight">{completed}</p>
          <p className="text-xs text-gray-400">This page</p>
        </div>

        <div className="w-px h-10 bg-gray-200" />

        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide">In Progress</p>
          <p className="text-lg font-bold text-blue-600 leading-tight">{inProgress}</p>
          <p className="text-xs text-gray-400">Active bookings</p>
        </div>

        <div className="w-px h-10 bg-gray-200" />

        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide">Cancelled</p>
          <p className="text-lg font-bold text-red-500 leading-tight">{cancelled}</p>
          <p className="text-xs text-gray-400">This page</p>
        </div>
      </div>

      {/* ── Modals ── */}
      <CreateBookingModal open={createOpen} onClose={() => setCreateOpen(false)} />

      {viewBooking && (
        <ViewBookingModal
          open
          onClose={() => setViewBooking(null)}
          booking={viewBooking}
          onEdit={(b) => { setViewBooking(null); setEditBooking(b); }}
        />
      )}

      {editBooking && (
        <EditBookingModal
          open
          onClose={() => setEditBooking(null)}
          booking={editBooking}
        />
      )}
    </div>
  );
};

export default SuperAdminBookingsPage;
