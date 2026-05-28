import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  useBookings,
  useBooking,
  useCreateBooking,
  useUpdateBooking,
  useDeleteBooking,
} from '../../hooks/useBookings';
import { useProperties } from '../../hooks/useProperties';
import { useBranches } from '../../hooks/useBranches';
import { Pagination } from '../../components/ui/Pagination';
import { Modal } from '../../components/ui/Modal';
import { bookingsApi } from '../../api/bookings.api';
import type { BookingStatus, Booking } from '../../types';

// ─── Style constants ──────────────────────────────────────────────────────────

const inputClass =
  'h-10 min-w-0 w-full rounded-lg border border-[#ded6c7] bg-white px-3 text-[13px] text-gray-800 placeholder:text-gray-400 outline-none transition focus:border-gold focus:ring-2 focus:ring-gold/20 disabled:cursor-not-allowed disabled:bg-gray-100';

const textareaClass =
  'min-w-0 w-full rounded-lg border border-[#ded6c7] bg-white px-3 py-2 text-[13px] text-gray-800 placeholder:text-gray-400 outline-none transition focus:border-gold focus:ring-2 focus:ring-gold/20 resize-none';

const labelClass = 'mb-1.5 block text-[11px] font-semibold text-[#6f6a5f]';

const sectionHeaderClass =
  'mb-4 flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.18em] text-[#9c7a10]';

const primaryButtonClass =
  'inline-flex h-10 min-w-0 items-center justify-center gap-2 rounded-lg bg-gold px-4 text-[13px] font-bold text-navy shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 whitespace-nowrap';

const secondaryButtonClass =
  'inline-flex h-10 min-w-0 items-center justify-center gap-2 rounded-lg border border-[#ded6c7] bg-white px-4 text-[13px] font-semibold text-gray-700 transition hover:bg-gray-50 whitespace-nowrap';

const iconButtonClass =
  'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition';

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

type DenomData = {
  denomination: DenomValue;
  count: number;
  amount: number;
};

// ─── Icons ────────────────────────────────────────────────────────────────────

interface IconProps {
  className?: string;
}

const EyeIcon = ({ className = 'h-4 w-4' }: IconProps) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
    />
  </svg>
);

const PencilIcon = ({ className = 'h-4 w-4' }: IconProps) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
    />
  </svg>
);

const TrashIcon = ({ className = 'h-4 w-4' }: IconProps) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
    />
  </svg>
);

const UploadIcon = ({ className = 'h-8 w-8 text-[#d2c2a3]' }: IconProps) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.7}
      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
    />
  </svg>
);

const PlusIcon = ({ className = 'h-4 w-4' }: IconProps) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const FilterIcon = ({ className = 'h-4 w-4' }: IconProps) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
    />
  </svg>
);

const DownloadIcon = ({ className = 'h-4 w-4' }: IconProps) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
    />
  </svg>
);

const SearchIcon = ({ className = 'h-4 w-4' }: IconProps) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
    />
  </svg>
);

const CloseIcon = ({ className = 'h-4 w-4' }: IconProps) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const UserIcon = ({ className = 'h-4 w-4' }: IconProps) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14c-4.418 0-8 2.015-8 4.5V20h16v-1.5c0-2.485-3.582-4.5-8-4.5z"
    />
  </svg>
);

const BuildingIcon = ({ className = 'h-4 w-4' }: IconProps) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 21h18M6 21V5a2 2 0 012-2h8a2 2 0 012 2v16M9 7h1m4 0h1M9 11h1m4 0h1M9 15h1m4 0h1"
    />
  </svg>
);

const LinkIcon = ({ className = 'h-4 w-4' }: IconProps) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M13.828 10.172a4 4 0 010 5.656l-1.414 1.414a4 4 0 01-5.657-5.657l1.414-1.414m2.829 2.829a4 4 0 010-5.656l1.414-1.414a4 4 0 115.657 5.657l-1.414 1.414"
    />
  </svg>
);

const WalletIcon = ({ className = 'h-4 w-4' }: IconProps) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h14a2 2 0 002-2v-5a2 2 0 00-2-2h-5a2 2 0 000 4h5"
    />
  </svg>
);

const DocumentIcon = ({ className = 'h-4 w-4' }: IconProps) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 12h6m-6 4h6M7 3h7l5 5v13H7a2 2 0 01-2-2V5a2 2 0 012-2z"
    />
  </svg>
);

const CheckIcon = ({ className = 'h-4 w-4' }: IconProps) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.4} d="M5 13l4 4L19 7" />
  </svg>
);

const BookmarkIcon = ({ className = 'h-4 w-4' }: IconProps) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-4-7 4V5z" />
  </svg>
);

const ClockIcon = ({ className = 'h-4 w-4' }: IconProps) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 8v5l3 2m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(value?: string): string {
  if (!value) return '—';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return '—';

  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatCurrency(value?: number): string {
  const amount = Number.isFinite(value) ? Number(value) : 0;

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

function safeNumber(value: unknown): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;

  const cleaned = String(value ?? '').replace(/[^0-9.-]/g, '');
  const parsed = Number(cleaned);

  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeDateInput(value?: string): string {
  if (!value) return '';
  return value.split('T')[0] ?? '';
}

function draftTime(): string {
  return new Date().toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function readString(source: unknown, key: string, fallback = ''): string {
  const value = (source as Record<string, unknown> | undefined)?.[key];

  if (value === null || value === undefined || value === '') return fallback;

  return String(value);
}

function readNumber(source: unknown, key: string, fallback = 0): number {
  const value = (source as Record<string, unknown> | undefined)?.[key];
  const amount = safeNumber(value);

  return amount || fallback;
}

function firstPayment(booking: Booking): Record<string, unknown> | undefined {
  const payments = (booking as unknown as { payments?: Record<string, unknown>[] }).payments;

  return Array.isArray(payments) && payments.length > 0 ? payments[0] : undefined;
}

function getBookingDenominations(booking: Booking): DenomRow[] {
  const rows = (booking as unknown as { denominations?: Record<string, unknown>[] }).denominations;

  if (!Array.isArray(rows) || rows.length === 0) {
    return [{ id: 1, denomination: 2000, count: 0 }];
  }

  return rows.map((row, index) => {
    const rawDenomination = safeNumber(row.denomination);
    const denomination = DENOM_VALUES.includes(rawDenomination as DenomValue)
      ? (rawDenomination as DenomValue)
      : 2000;

    return {
      id: index + 1,
      denomination,
      count: safeNumber(row.count),
    };
  });
}

function statusLabel(status?: string): string {
  switch (status) {
    case 'BOOKING_INITIATED':
      return 'Booked';
    case 'TOKEN_RECEIVED':
      return 'Token';
    case 'ADVANCE_PAYMENT':
      return 'Advance';
    case 'REGISTRATION_PENDING':
      return 'Pending';
    case 'FINAL_SETTLEMENT_PENDING':
      return 'Pending';
    case 'COMPLETED':
      return 'Completed';
    case 'CANCELLED':
      return 'Cancelled';
    default:
      return status ? status.replace(/_/g, ' ') : '—';
  }
}

function statusPillClass(status?: string): string {
  if (status === 'COMPLETED') {
    return 'border-[#bfe9de] bg-[#e8f8f4] text-[#1d7663]';
  }

  if (status === 'CANCELLED') {
    return 'border-[#ffd1d1] bg-[#fff0f0] text-[#d92323]';
  }

  if (status === 'BOOKING_INITIATED' || status === 'TOKEN_RECEIVED') {
    return 'border-[#eadcac] bg-[#fbf5df] text-[#94710a]';
  }

  return 'border-[#f1dfa9] bg-[#fff7df] text-[#9a7100]';
}

function inferPaymentMethod(form: BookingForm, validDenoms: DenomData[]): string {
  if (form.paymentMethod) return form.paymentMethod;

  if (form.gpayReference.trim()) return 'UPI';
  if (form.chequeNumber.trim()) return 'CHEQUE';
  if (safeNumber(form.cashAmount) > 0 || validDenoms.some((row) => row.count > 0)) return 'CASH';

  return 'BANK_TRANSFER';
}

// ─── Shared UI ────────────────────────────────────────────────────────────────

function SectionTitle({
  icon,
  title,
}: {
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <div className={sectionHeaderClass}>
      <span className="text-[#9c7a10]">{icon}</span>
      <span>{title}</span>
    </div>
  );
}

function FormField({
  label,
  children,
  className = '',
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`min-w-0 ${className}`}>
      <label className={labelClass}>{label}</label>
      {children}
    </div>
  );
}

function StatusPill({ status }: { status?: string }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-1 text-[10px] font-bold leading-none ${statusPillClass(
        status
      )}`}
    >
      {statusLabel(status)}
    </span>
  );
}

function InfoRow({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div className="min-w-0">
      <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-gray-400">{label}</p>
      <p className={`break-words text-[13px] font-semibold ${highlight ? 'text-[#c44343]' : 'text-gray-800'}`}>
        {value || '—'}
      </p>
    </div>
  );
}

function InfoCard({
  icon,
  title,
  children,
  compact = false,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <div className={`min-w-0 rounded-xl border border-[#eee8dc] bg-white ${compact ? 'p-4' : 'p-5'}`}>
      <SectionTitle icon={icon} title={title} />
      <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>
    </div>
  );
}

function Toast({
  title,
  description,
  onClose,
}: {
  title: string;
  description: string;
  onClose: () => void;
}) {
  return (
    <div className="fixed bottom-5 left-4 right-4 z-[70] mx-auto flex max-w-sm items-start gap-3 rounded-lg bg-[#2c3032] px-4 py-4 text-white shadow-2xl sm:left-auto sm:right-6 sm:mx-0">
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#8ed8c7] text-[#174f43]">
        <CheckIcon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-bold leading-tight">{title}</p>
        <p className="mt-0.5 text-[12px] text-gray-300">{description}</p>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="rounded-md p-1 text-gray-300 transition hover:bg-white/10 hover:text-white"
      >
        <CloseIcon />
      </button>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  tone = 'gold',
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone?: 'gold' | 'green' | 'blue' | 'red';
}) {
  const toneClass = {
    gold: 'bg-[#fbf5df] text-[#9c7a10]',
    green: 'bg-[#e8f8f4] text-[#15735d]',
    blue: 'bg-[#eff6ff] text-[#2563eb]',
    red: 'bg-[#fff0f0] text-[#dc2626]',
  }[tone];

  return (
    <div className="flex min-w-0 items-center gap-3 rounded-xl border border-[#eee8dc] bg-white px-4 py-4 shadow-sm">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${toneClass}`}>
        {icon}
      </div>

      <div className="min-w-0">
        <p className="truncate text-[9px] font-bold uppercase tracking-wide text-gray-500">
          {label}
        </p>
        <p className="mt-1 text-[20px] font-black leading-none text-gray-900">
          {value.toLocaleString('en-IN')}
        </p>
      </div>
    </div>
  );
}

// ─── Denomination Table ───────────────────────────────────────────────────────

interface DenominationTableProps {
  rows: DenomRow[];
  onAdd: () => void;
  onRemove: (id: number) => void;
  onChange: (id: number, field: 'denomination' | 'count', value: string) => void;
}

function DenominationTable({ rows, onAdd, onRemove, onChange }: DenominationTableProps) {
  return (
    <div className="min-w-0 rounded-xl border border-[#eee8dc] bg-[#fafafa] p-4 sm:p-5">
      <SectionTitle icon={<WalletIcon />} title="Denomination Details" />

      <div className="w-full min-w-0 overflow-x-auto">
        <table className="min-w-[520px] w-full text-left">
          <thead>
            <tr className="border-b border-[#e8e0d2]">
              <th className="px-2 pb-3 text-[11px] font-bold text-gray-600">Denomination Type</th>
              <th className="px-2 pb-3 text-[11px] font-bold text-gray-600">Count</th>
              <th className="px-2 pb-3 text-[11px] font-bold text-gray-600">Amount</th>
              <th className="w-10 px-2 pb-3" />
            </tr>
          </thead>

          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="px-2 py-3">
                  <select
                    value={row.denomination}
                    onChange={(event) => onChange(row.id, 'denomination', event.target.value)}
                    className="h-9 w-full rounded-md border border-[#ded6c7] bg-white px-3 text-[13px] outline-none focus:border-gold focus:ring-2 focus:ring-gold/20"
                  >
                    {DENOM_VALUES.map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                </td>

                <td className="px-2 py-3">
                  <input
                    type="number"
                    min={0}
                    value={row.count}
                    onChange={(event) => onChange(row.id, 'count', event.target.value)}
                    className="h-9 w-24 rounded-md border border-[#ded6c7] bg-white px-3 text-[13px] outline-none focus:border-gold focus:ring-2 focus:ring-gold/20"
                  />
                </td>

                <td className="px-2 py-3 text-[13px] font-bold text-gray-700">
                  {formatCurrency(row.denomination * row.count)}
                </td>

                <td className="px-2 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => onRemove(row.id)}
                    className={`${iconButtonClass} text-red-500 hover:bg-red-50`}
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
        className="mt-3 inline-flex items-center gap-1.5 text-[12px] font-bold text-[#9c7a10] transition hover:opacity-75"
      >
        <PlusIcon />
        Add Row
      </button>
    </div>
  );
}

// ─── Booking form state ───────────────────────────────────────────────────────

interface BookingForm {
  projectName: string;
  propertyId: string;
  plotNumber: string;
  squareFeet: string;
  bookingDate: string;
  applicantName: string;
  relationship: string;
  cellNumber: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pinCode: string;
  panAadhaar: string;
  dateOfBirth: string;
  weddingDay: string;
  propertyType: string;
  edDdSmBmName: string;
  codeNumber: string;
  directorName: string;
  paymentMethod: string;
  bankName: string;
  favourOf: string;
  chequeNumber: string;
  chequeDate: string;
  gpayReference: string;
  cashAmount: string;
  paymentTotal: string;
  paymentStatus: string;
  paymentReference: string;
  amountInWords: string;
  branchId: string;
  bookingStatus: BookingStatus | '';
  authorized: boolean;
  notes: string;
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
  email: '',
  address: '',
  city: '',
  state: '',
  pinCode: '',
  panAadhaar: '',
  dateOfBirth: '',
  weddingDay: '',
  propertyType: '',
  edDdSmBmName: '',
  codeNumber: '',
  directorName: '',
  paymentMethod: '',
  bankName: '',
  favourOf: 'Sri Thangam Housing',
  chequeNumber: '',
  chequeDate: '',
  gpayReference: '',
  cashAmount: '',
  paymentTotal: '',
  paymentStatus: 'Verified',
  paymentReference: '',
  amountInWords: '',
  branchId: '',
  bookingStatus: 'BOOKING_INITIATED',
  authorized: true,
  notes: '',
};

// ─── CreateBookingModal ───────────────────────────────────────────────────────

interface CreateBookingModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: (title: string, description: string) => void;
}

function CreateBookingModal({ open, onClose, onSaved }: CreateBookingModalProps) {
  const create = useCreateBooking();
  const propertiesQuery = useProperties({ limit: 100 });

  const properties = propertiesQuery.data?.data ?? [];

  const [form, setForm] = useState<BookingForm>(emptyForm);
  const [denomRows, setDenomRows] = useState<DenomRow[]>([
    { id: 1, denomination: 2000, count: 0 },
  ]);

  const nextDenomId = useRef(2);

  const denomTotal = useMemo(
    () => denomRows.reduce((sum, row) => sum + row.denomination * row.count, 0),
    [denomRows]
  );

  const cashAmount = safeNumber(form.cashAmount);
  const manualTotal = safeNumber(form.paymentTotal);
  const totalAmount = manualTotal || cashAmount + denomTotal;

  function setField<K extends keyof BookingForm>(field: K, value: BookingForm[K]) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function resetForm() {
    setForm(emptyForm);
    setDenomRows([{ id: 1, denomination: 2000, count: 0 }]);
    nextDenomId.current = 2;
  }

  function addDenomRow() {
    setDenomRows((rows) => [
      ...rows,
      {
        id: nextDenomId.current++,
        denomination: 2000,
        count: 0,
      },
    ]);
  }

  function removeDenomRow(id: number) {
    setDenomRows((rows) => {
      if (rows.length === 1) return rows;
      return rows.filter((row) => row.id !== id);
    });
  }

  function changeDenomRow(id: number, field: 'denomination' | 'count', value: string) {
    setDenomRows((rows) =>
      rows.map((row) =>
        row.id === id
          ? {
              ...row,
              [field]:
                field === 'denomination'
                  ? (safeNumber(value) as DenomValue)
                  : Math.max(0, safeNumber(value)),
            }
          : row
      )
    );
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const validDenoms: DenomData[] = denomRows
      .filter((row) => row.count > 0)
      .map((row) => ({
        denomination: row.denomination,
        count: row.count,
        amount: row.denomination * row.count,
      }));

    const hasPayment =
      totalAmount > 0 ||
      Boolean(form.bankName.trim()) ||
      Boolean(form.chequeNumber.trim()) ||
      Boolean(form.gpayReference.trim());

    create.mutate(
      {
        propertyId: form.propertyId,
        applicantName: form.applicantName,
        relation: form.relationship || undefined,
        applicantAddress: form.address || undefined,
        pinCode: form.pinCode || undefined,
        cellNumber: form.cellNumber,
        dateOfBirth: form.dateOfBirth || undefined,
        weddingDay: form.weddingDay || undefined,
        projectName: form.projectName,
        plotNumber: form.plotNumber,
        squareFeet: form.squareFeet ? Number(form.squareFeet) : undefined,
        bookingDate: form.bookingDate,
        edDdSmBmName: form.edDdSmBmName || undefined,
        referenceCode: form.codeNumber || undefined,
        directorName: form.directorName || undefined,
        branchId: form.branchId || undefined,
        payments: hasPayment
          ? [
              {
                paymentMethod: inferPaymentMethod(form, validDenoms),
                bankName: form.bankName || undefined,
                favourOf: form.favourOf || undefined,
                chequeNumber: form.chequeNumber || undefined,
                chequeDate: form.chequeDate || undefined,
                gpayReference: form.gpayReference || undefined,
                cashAmount: cashAmount || undefined,
                totalAmount,
              },
            ]
          : undefined,
        denominations: validDenoms.length > 0 ? validDenoms : undefined,
      },
      {
        onSuccess: () => {
          onSaved(
            'Booking created successfully',
            `Reference ID: ${form.codeNumber || form.plotNumber || 'Booking saved'}`
          );
          resetForm();
          onClose();
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
      <form onSubmit={handleSubmit} className="flex max-h-[calc(100vh-145px)] min-w-0 flex-col">
        <div className="min-w-0 overflow-y-auto pr-1">
          <div className="space-y-7 pb-6">
            <section>
              <SectionTitle icon={<BuildingIcon />} title="Property Details" />

              <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-4">
                <FormField label="Project Name">
                  <select
                    required
                    value={form.propertyId}
                    onChange={(event) => {
                      const selectedId = event.target.value;
                      const property = properties.find((item) => String(item.id) === selectedId);

                      setForm((current) => ({
                        ...current,
                        propertyId: selectedId,
                        projectName: property?.projectName ?? '',
                        plotNumber: property?.plotNumber ?? '',
                        squareFeet: property?.squareFeet?.toString() ?? '',
                        propertyType: property?.propertyType ?? '',
                      }));
                    }}
                    className={inputClass}
                  >
                    <option value="">Select Project</option>
                    {properties.map((property) => (
                      <option key={property.id} value={String(property.id)}>
                        {property.projectName}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Plot Number">
                  <input
                    type="text"
                    value={form.plotNumber}
                    onChange={(event) => setField('plotNumber', event.target.value)}
                    className={inputClass}
                    placeholder="e.g. 402-B"
                  />
                </FormField>

                <FormField label="Square Feet">
                  <input
                    type="number"
                    min={0}
                    value={form.squareFeet}
                    onChange={(event) => setField('squareFeet', event.target.value)}
                    className={inputClass}
                    placeholder="1200"
                  />
                </FormField>

                <FormField label="Booking Date">
                  <input
                    type="date"
                    required
                    value={form.bookingDate}
                    onChange={(event) => setField('bookingDate', event.target.value)}
                    className={inputClass}
                  />
                </FormField>
              </div>
            </section>

            <hr className="border-[#eee8dc]" />

            <section>
              <SectionTitle icon={<UserIcon />} title="Applicant Details" />

              <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-3">
                <FormField label="Applicant Name">
                  <input
                    type="text"
                    required
                    value={form.applicantName}
                    onChange={(event) => setField('applicantName', event.target.value)}
                    className={inputClass}
                    placeholder="Full Name"
                  />
                </FormField>

                <FormField label="S/o D/o C/o W/o">
                  <input
                    type="text"
                    value={form.relationship}
                    onChange={(event) => setField('relationship', event.target.value)}
                    className={inputClass}
                    placeholder="Relationship Name"
                  />
                </FormField>

                <FormField label="Cell Number">
                  <input
                    type="tel"
                    required
                    value={form.cellNumber}
                    onChange={(event) => setField('cellNumber', event.target.value)}
                    className={inputClass}
                    placeholder="+91 00000 00000"
                  />
                </FormField>

                <FormField label="Address" className="md:col-span-2">
                  <textarea
                    rows={3}
                    value={form.address}
                    onChange={(event) => setField('address', event.target.value)}
                    className={textareaClass}
                    placeholder="Permanent Address"
                  />
                </FormField>

                <FormField label="PIN Code">
                  <input
                    type="text"
                    maxLength={6}
                    value={form.pinCode}
                    onChange={(event) => setField('pinCode', event.target.value)}
                    className={inputClass}
                    placeholder="600001"
                  />
                </FormField>

                <FormField label="Date of Birth">
                  <input
                    type="date"
                    value={form.dateOfBirth}
                    onChange={(event) => setField('dateOfBirth', event.target.value)}
                    className={inputClass}
                  />
                </FormField>

                <FormField label="Wedding Day (Optional)">
                  <input
                    type="date"
                    value={form.weddingDay}
                    onChange={(event) => setField('weddingDay', event.target.value)}
                    className={inputClass}
                  />
                </FormField>
              </div>
            </section>

            <hr className="border-[#eee8dc]" />

            <section>
              <SectionTitle icon={<LinkIcon />} title="Reference Details" />

              <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-3">
                <FormField label="ED/DD/SM/BM Name">
                  <input
                    type="text"
                    value={form.edDdSmBmName}
                    onChange={(event) => setField('edDdSmBmName', event.target.value)}
                    className={inputClass}
                    placeholder="Referring Member"
                  />
                </FormField>

                <FormField label="Code Number">
                  <input
                    type="text"
                    value={form.codeNumber}
                    onChange={(event) => setField('codeNumber', event.target.value)}
                    className={inputClass}
                    placeholder="STH-REF-000"
                  />
                </FormField>

                <FormField label="Director Name">
                  <input
                    type="text"
                    value={form.directorName}
                    onChange={(event) => setField('directorName', event.target.value)}
                    className={inputClass}
                    placeholder="Managing Director"
                  />
                </FormField>
              </div>
            </section>

            <hr className="border-[#eee8dc]" />

            <section>
              <SectionTitle icon={<WalletIcon />} title="Payment Details" />

              <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-4">
                <FormField label="Bank Name">
                  <input
                    type="text"
                    value={form.bankName}
                    onChange={(event) => setField('bankName', event.target.value)}
                    className={inputClass}
                    placeholder="e.g. HDFC Bank"
                  />
                </FormField>

                <FormField label="Favour Of">
                  <input
                    type="text"
                    value={form.favourOf}
                    onChange={(event) => setField('favourOf', event.target.value)}
                    className={inputClass}
                    placeholder="Sri Thangam Housing"
                  />
                </FormField>

                <FormField label="Cheque Number">
                  <input
                    type="text"
                    value={form.chequeNumber}
                    onChange={(event) =>
                      setField('chequeNumber', event.target.value.replace(/\D/g, '').slice(0, 6))
                    }
                    className={inputClass}
                    placeholder="000000"
                  />
                </FormField>

                <FormField label="Cheque Date">
                  <input
                    type="date"
                    value={form.chequeDate}
                    onChange={(event) => setField('chequeDate', event.target.value)}
                    className={inputClass}
                  />
                </FormField>

                <FormField label="GPay Reference">
                  <input
                    type="text"
                    value={form.gpayReference}
                    onChange={(event) => setField('gpayReference', event.target.value)}
                    className={inputClass}
                    placeholder="UPI Transaction ID"
                  />
                </FormField>

                <FormField label="Cash Amount">
                  <input
                    type="text"
                    value={form.cashAmount}
                    onChange={(event) => setField('cashAmount', event.target.value)}
                    className={inputClass}
                    placeholder="₹ 0.00"
                  />
                </FormField>

                <FormField label="Total Amount" className="md:col-span-2">
                  <input
                    type="text"
                    value={form.paymentTotal}
                    onChange={(event) => setField('paymentTotal', event.target.value)}
                    className={`${inputClass} bg-gray-100 font-bold`}
                    placeholder={formatCurrency(totalAmount)}
                  />
                </FormField>
              </div>
            </section>

            <DenominationTable
              rows={denomRows}
              onAdd={addDenomRow}
              onRemove={removeDenomRow}
              onChange={changeDenomRow}
            />

            <section>
              <SectionTitle icon={<PencilIcon />} title="Authorization" />

              <div className="grid min-w-0 grid-cols-1 gap-5 md:grid-cols-2">
                <div className="flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#d9ccb3] bg-white p-6 text-center transition hover:border-gold">
                  <UploadIcon />
                  <p className="mt-2 text-[13px] font-bold text-gray-600">Upload Applicant Signature</p>
                  <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                    PNG, JPG, GIF up to 2MB
                  </p>
                </div>

                <div className="rounded-xl border border-[#ded6c7] bg-white p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-gray-600">
                      Draw Signature Below
                    </p>
                    <button
                      type="button"
                      className="text-[10px] font-bold uppercase tracking-wide text-[#9c7a10]"
                    >
                      Clear
                    </button>
                  </div>

                  <div className="mt-3 flex h-28 items-center justify-center rounded-lg border border-dashed border-[#ded6c7] bg-[#fafafa]">
                    <p className="text-[12px] italic text-[#d2c2a3]">Signature Pad Placeholder</p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>

        <div className="-mx-6 flex flex-col gap-3 border-t border-[#eee8dc] bg-white px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[12px] font-medium text-gray-500">Draft saved at {draftTime()}</p>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button type="button" onClick={onClose} className={secondaryButtonClass}>
              Cancel
            </button>

            <button type="submit" disabled={create.isPending} className={primaryButtonClass}>
              <BookmarkIcon />
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
  onSaved: (title: string, description: string) => void;
}

function buildEditForm(booking: Booking): BookingForm {
  const payment = firstPayment(booking);

  return {
    ...emptyForm,
    projectName: booking.projectName ?? '',
    propertyId: booking.propertyId ?? '',
    plotNumber: booking.plotNumber ?? '',
    squareFeet:
      booking.squareFeet?.toString() ??
      booking.property?.squareFeet?.toString() ??
      '',
    bookingDate: normalizeDateInput(booking.bookingDate),
    applicantName: booking.applicantName ?? '',
    relationship: booking.relation ?? '',
    cellNumber: booking.cellNumber ?? '',
    email: readString(booking, 'email'),
    address: booking.applicantAddress ?? '',
    city: readString(booking, 'city'),
    state: readString(booking, 'state'),
    pinCode: booking.pinCode ?? '',
    panAadhaar: readString(booking, 'panAadhaar'),
    dateOfBirth: normalizeDateInput(booking.dateOfBirth),
    weddingDay: normalizeDateInput(booking.weddingDay),
    propertyType: booking.property?.propertyType ?? readString(booking, 'propertyType'),
    edDdSmBmName: booking.edDdSmBmName ?? '',
    codeNumber: booking.referenceCode ?? '',
    directorName: booking.directorName ?? '',
    branchId: booking.branchId ?? '',
    paymentMethod: readString(payment, 'paymentMethod', 'BANK_TRANSFER'),
    bankName: readString(payment, 'bankName'),
    favourOf: readString(payment, 'favourOf', 'Sri Thangam Housing'),
    chequeNumber: readString(payment, 'chequeNumber'),
    chequeDate: normalizeDateInput(readString(payment, 'chequeDate')),
    gpayReference: readString(payment, 'gpayReference'),
    cashAmount: readString(payment, 'cashAmount'),
    paymentTotal: readString(payment, 'totalAmount'),
    paymentStatus: readString(payment, 'paymentStatus', 'Verified'),
    paymentReference: readString(payment, 'paymentReference'),
    amountInWords: readString(payment, 'amountInWords'),
    bookingStatus: booking.status ?? 'BOOKING_INITIATED',
    authorized: true,
    notes: readString(booking, 'notes'),
  };
}

function EditBookingModal({ open, onClose, booking, onSaved }: EditBookingModalProps) {
  const update = useUpdateBooking();
  const propertiesQuery = useProperties({ limit: 100 });
  const branchesQuery = useBranches({ limit: 100 });

  const properties = propertiesQuery.data?.data ?? [];
  const branches = branchesQuery.data?.data ?? [];

  const [form, setForm] = useState<BookingForm>(() => buildEditForm(booking));
  const [denomRows, setDenomRows] = useState<DenomRow[]>(() => getBookingDenominations(booking));
  const nextDenomId = useRef(denomRows.length + 1);

  useEffect(() => {
    if (!open) return;

    const nextRows = getBookingDenominations(booking);
    setForm(buildEditForm(booking));
    setDenomRows(nextRows);
    nextDenomId.current = nextRows.length + 1;
  }, [booking, open]);

  const denomTotal = useMemo(
    () => denomRows.reduce((sum, row) => sum + row.denomination * row.count, 0),
    [denomRows]
  );

  const cashAmount = safeNumber(form.cashAmount);
  const manualTotal = safeNumber(form.paymentTotal);
  const totalAmount = manualTotal || cashAmount + denomTotal;

  function setField<K extends keyof BookingForm>(field: K, value: BookingForm[K]) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const validDenoms: DenomData[] = denomRows
      .filter((row) => row.count > 0)
      .map((row) => ({
        denomination: row.denomination,
        count: row.count,
        amount: row.denomination * row.count,
      }));

    const hasPayment =
      totalAmount > 0 ||
      Boolean(form.bankName.trim()) ||
      Boolean(form.chequeNumber.trim()) ||
      Boolean(form.gpayReference.trim());

    update.mutate(
      {
        id: booking.id,
        data: {
          propertyId: form.propertyId || undefined,
          applicantName: form.applicantName || undefined,
          relation: form.relationship || undefined,
          applicantAddress: form.address || undefined,
          pinCode: form.pinCode || undefined,
          cellNumber: form.cellNumber || undefined,
          dateOfBirth: form.dateOfBirth || undefined,
          weddingDay: form.weddingDay || undefined,
          projectName: form.projectName || undefined,
          plotNumber: form.plotNumber || undefined,
          squareFeet: form.squareFeet ? Number(form.squareFeet) : undefined,
          bookingDate: form.bookingDate || undefined,
          edDdSmBmName: form.edDdSmBmName || undefined,
          referenceCode: form.codeNumber || undefined,
          directorName: form.directorName || undefined,
          branchId: form.branchId || undefined,
          status: form.bookingStatus || undefined,
          payments: hasPayment
            ? [
                {
                  paymentMethod: inferPaymentMethod(form, validDenoms),
                  bankName: form.bankName || undefined,
                  favourOf: form.favourOf || undefined,
                  chequeNumber: form.chequeNumber || undefined,
                  chequeDate: form.chequeDate || undefined,
                  gpayReference: form.gpayReference || undefined,
                  cashAmount: cashAmount || undefined,
                  totalAmount,
                },
              ]
            : undefined,
          denominations: validDenoms.length > 0 ? validDenoms : undefined,
        },
      },
      {
        onSuccess: () => {
          onSaved('Booking updated successfully', 'Changes are now live in the system.');
          onClose();
        },
      }
    );
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit Booking"
      subtitle="Update applicant, property, and payment details."
      size="3xl"
    >
      <form onSubmit={handleSubmit} className="flex max-h-[calc(100vh-145px)] min-w-0 flex-col">
        <div className="min-w-0 overflow-y-auto pr-1">
          <div className="space-y-7 pb-6">
            <section>
              <SectionTitle icon={<UserIcon />} title="Applicant Details" />

              <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-3">
                <FormField label="Name" className="md:col-span-2">
                  <input
                    type="text"
                    value={form.applicantName}
                    onChange={(event) => setField('applicantName', event.target.value)}
                    className={inputClass}
                  />
                </FormField>

                <FormField label="Phone">
                  <input
                    type="tel"
                    value={form.cellNumber}
                    onChange={(event) => setField('cellNumber', event.target.value)}
                    className={inputClass}
                  />
                </FormField>

                <FormField label="Email">
                  <input
                    type="email"
                    value={form.email}
                    onChange={(event) => setField('email', event.target.value)}
                    className={inputClass}
                    placeholder="email@example.com"
                  />
                </FormField>

                <FormField label="Address" className="md:col-span-2">
                  <input
                    type="text"
                    value={form.address}
                    onChange={(event) => setField('address', event.target.value)}
                    className={inputClass}
                  />
                </FormField>

                <FormField label="City">
                  <input
                    type="text"
                    value={form.city}
                    onChange={(event) => setField('city', event.target.value)}
                    className={inputClass}
                  />
                </FormField>

                <FormField label="State">
                  <input
                    type="text"
                    value={form.state}
                    onChange={(event) => setField('state', event.target.value)}
                    className={inputClass}
                  />
                </FormField>

                <FormField label="Pincode">
                  <input
                    type="text"
                    value={form.pinCode}
                    onChange={(event) => setField('pinCode', event.target.value)}
                    className={inputClass}
                  />
                </FormField>

                <FormField label="PAN / Aadhaar">
                  <input
                    type="text"
                    value={form.panAadhaar}
                    onChange={(event) => setField('panAadhaar', event.target.value)}
                    className={inputClass}
                  />
                </FormField>
              </div>
            </section>

            <hr className="border-[#eee8dc]" />

            <div className="grid min-w-0 grid-cols-1 gap-5 lg:grid-cols-2">
              <section>
                <SectionTitle icon={<BuildingIcon />} title="Property Details" />

                <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField label="Project Name" className="sm:col-span-2">
                    <select
                      value={form.propertyId}
                      onChange={(event) => {
                        const selectedId = event.target.value;
                        const property = properties.find((item) => String(item.id) === selectedId);

                        setForm((current) => ({
                          ...current,
                          propertyId: selectedId,
                          projectName: property?.projectName ?? current.projectName,
                          plotNumber: property?.plotNumber ?? current.plotNumber,
                          squareFeet: property?.squareFeet?.toString() ?? current.squareFeet,
                          propertyType: property?.propertyType ?? current.propertyType,
                        }));
                      }}
                      className={inputClass}
                    >
                      <option value="">Select Project</option>
                      {properties.map((property) => (
                        <option key={property.id} value={String(property.id)}>
                          {property.projectName}
                        </option>
                      ))}
                    </select>
                  </FormField>

                  <FormField label="Plot Number">
                    <input
                      type="text"
                      value={form.plotNumber}
                      onChange={(event) => setField('plotNumber', event.target.value)}
                      className={inputClass}
                    />
                  </FormField>

                  <FormField label="Sq.Ft">
                    <input
                      type="text"
                      value={form.squareFeet}
                      onChange={(event) => setField('squareFeet', event.target.value)}
                      className={inputClass}
                    />
                  </FormField>

                  <FormField label="Property Type">
                    <input
                      type="text"
                      value={form.propertyType}
                      onChange={(event) => setField('propertyType', event.target.value)}
                      className={inputClass}
                      placeholder="Residential Plot"
                    />
                  </FormField>

                  <FormField label="Branch">
                    <select
                      value={form.branchId}
                      onChange={(event) => setField('branchId', event.target.value)}
                      className={inputClass}
                    >
                      <option value="">Select Branch</option>
                      {branches.map((branch) => (
                        <option key={branch.id} value={String(branch.id)}>
                          {branch.name}
                        </option>
                      ))}
                    </select>
                  </FormField>
                </div>
              </section>

              <section className="rounded-xl border border-[#eee8dc] bg-[#f7f7f9] p-4">
                <SectionTitle icon={<LinkIcon />} title="Reference Details" />

                <div className="grid min-w-0 grid-cols-1 gap-4">
                  <FormField label="Director Name">
                    <input
                      type="text"
                      value={form.directorName}
                      onChange={(event) => setField('directorName', event.target.value)}
                      className={inputClass}
                    />
                  </FormField>

                  <FormField label="Reference Role Name">
                    <input
                      type="text"
                      value={form.edDdSmBmName}
                      onChange={(event) => setField('edDdSmBmName', event.target.value)}
                      className={inputClass}
                    />
                  </FormField>

                  <FormField label="Code Number">
                    <input
                      type="text"
                      value={form.codeNumber}
                      onChange={(event) => setField('codeNumber', event.target.value)}
                      className={inputClass}
                    />
                  </FormField>
                </div>
              </section>
            </div>

            <hr className="border-[#eee8dc]" />

            <section>
              <SectionTitle icon={<WalletIcon />} title="Payment Details" />

              <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-3">
                <FormField label="Payment Method">
                  <select
                    value={form.paymentMethod}
                    onChange={(event) => setField('paymentMethod', event.target.value)}
                    className={inputClass}
                  >
                    <option value="BANK_TRANSFER">Bank Transfer / UPI</option>
                    <option value="CASH">Cash</option>
                    <option value="CHEQUE">Cheque</option>
                    <option value="GPAY">GPay</option>
                    <option value="UPI">UPI</option>
                  </select>
                </FormField>

                <FormField label="Amount Received">
                  <input
                    type="text"
                    value={form.paymentTotal}
                    onChange={(event) => setField('paymentTotal', event.target.value)}
                    className={`${inputClass} font-bold`}
                    placeholder="₹ 2,15,000"
                  />
                </FormField>

                <FormField label="Payment Status">
                  <select
                    value={form.paymentStatus}
                    onChange={(event) => setField('paymentStatus', event.target.value)}
                    className={`${inputClass} font-semibold text-[#1d7663]`}
                  >
                    <option value="Verified">Verified</option>
                    <option value="Pending">Pending</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </FormField>

                <FormField label="Amount in Words" className="md:col-span-2">
                  <input
                    type="text"
                    value={form.amountInWords}
                    onChange={(event) => setField('amountInWords', event.target.value)}
                    className={`${inputClass} italic`}
                    placeholder="Two Lakh Fifteen Thousand Rupees Only"
                  />
                </FormField>

                <FormField label="Payment Reference">
                  <input
                    type="text"
                    value={form.paymentReference}
                    onChange={(event) => setField('paymentReference', event.target.value)}
                    className={inputClass}
                    placeholder="TXN-BK-2023-8829"
                  />
                </FormField>
              </div>
            </section>

            <hr className="border-[#eee8dc]" />

            <div className="grid min-w-0 grid-cols-1 gap-5 lg:grid-cols-2">
              <section>
                <SectionTitle icon={<CheckIcon />} title="Status & Authorization" />

                <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField label="Booking Status">
                    <select
                      value={form.bookingStatus}
                      onChange={(event) =>
                        setField('bookingStatus', event.target.value as BookingStatus)
                      }
                      className={`${inputClass} font-semibold text-[#9c7a10]`}
                    >
                      {STATUS_OPTIONS.map((item) => (
                        <option key={item} value={item}>
                          {statusLabel(item)}
                        </option>
                      ))}
                    </select>
                  </FormField>

                  <div className="min-w-0">
                    <label className={labelClass}>Authorized Signature</label>
                    <button
                      type="button"
                      onClick={() => setField('authorized', !form.authorized)}
                      className="flex h-10 items-center gap-3"
                    >
                      <span
                        className={`relative inline-flex h-6 w-11 rounded-full transition ${
                          form.authorized ? 'bg-gold' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${
                            form.authorized ? 'left-6' : 'left-1'
                          }`}
                        />
                      </span>
                      <span className="text-[13px] font-medium text-gray-700">
                        {form.authorized ? 'Authorized' : 'Not Authorized'}
                      </span>
                    </button>
                  </div>
                </div>
              </section>

              <section>
                <SectionTitle icon={<DocumentIcon />} title="Notes" />

                <textarea
                  rows={4}
                  value={form.notes}
                  onChange={(event) => setField('notes', event.target.value)}
                  className={textareaClass}
                  placeholder="Add any internal booking notes here..."
                />
              </section>
            </div>

            <hr className="border-[#eee8dc]" />

            <section>
              <SectionTitle icon={<DocumentIcon />} title="Verification Documents" />

              <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2">
                {[
                  {
                    title: 'Applicant ID Proof',
                    file: 'aadhaar_card_v3.pdf',
                  },
                  {
                    title: 'Payment Receipt',
                    file: 'booking_txn_receipt.jpg',
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="flex min-w-0 flex-col gap-3 rounded-xl border border-[#eee8dc] bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#f3efe4] text-[#9c7a10]">
                        <DocumentIcon />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-bold text-gray-800">{item.title}</p>
                        <p className="truncate text-[12px] text-gray-500">{item.file}</p>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-4 text-[12px] font-bold">
                      <button type="button" className="text-[#9c7a10] hover:opacity-75">
                        Preview
                      </button>
                      <button type="button" className="text-gray-600 hover:text-gray-900">
                        Replace
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>

        <div className="-mx-6 flex flex-col gap-3 border-t border-[#eee8dc] bg-white px-6 py-4 sm:flex-row sm:items-center sm:justify-end">
          <button type="button" onClick={onClose} className={secondaryButtonClass}>
            Cancel
          </button>

          <button type="submit" disabled={update.isPending} className={primaryButtonClass}>
            {update.isPending ? 'Saving...' : 'Save Changes'}
          </button>
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
  onEdit: (booking: Booking) => void;
}

function ViewBookingModal({ open, onClose, booking, onEdit }: ViewBookingModalProps) {
  const { data: detail } = useBooking(booking.id);
  const currentBooking = detail ?? booking;
  const payment = firstPayment(currentBooking);

  const [downloading, setDownloading] = useState(false);

  async function handleDownload() {
    setDownloading(true);

    try {
      await bookingsApi.downloadPdf(currentBooking.id);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Booking ID: ${currentBooking.bookingId}`}
      subtitle={`${currentBooking.projectName || 'Property Booking'} • Generated on ${formatDate(
        currentBooking.createdAt
      )}`}
      size="2xl"
    >
      <div className="min-w-0 space-y-5">
        <div className="flex min-w-0 items-center justify-between gap-3 border-b border-[#eee8dc] pb-4">
          <div className="min-w-0">
            <p className="truncate text-[12px] font-semibold text-gray-500">Premium Heritage Series</p>
          </div>
          <StatusPill status={currentBooking.status} />
        </div>

        <div className="grid min-w-0 grid-cols-1 gap-5 lg:grid-cols-2">
          <InfoCard icon={<UserIcon />} title="Applicant Details">
            <InfoRow label="Applicant Name" value={currentBooking.applicantName} />
            <InfoRow label="Cell Number" value={currentBooking.cellNumber} />
            <div className="sm:col-span-2">
              <InfoRow label="Address" value={currentBooking.applicantAddress || '—'} />
            </div>
          </InfoCard>

          <InfoCard icon={<BuildingIcon />} title="Property Details">
            <InfoRow label="Project Name" value={currentBooking.projectName} highlight />
            <InfoRow label="Plot Number" value={currentBooking.plotNumber} />
            <InfoRow
              label="Square Feet"
              value={
                currentBooking.property?.squareFeet || currentBooking.squareFeet
                  ? `${currentBooking.property?.squareFeet ?? currentBooking.squareFeet} Sq.Ft.`
                  : '—'
              }
            />
            <InfoRow label="Property Type" value={currentBooking.property?.propertyType || '—'} />
            <div className="sm:col-span-2">
              <InfoRow label="Branch" value={currentBooking.branch?.name || '—'} />
            </div>
          </InfoCard>

          <InfoCard icon={<LinkIcon />} title="Reference Details" compact>
            <InfoRow label="Director Name" value={currentBooking.directorName || '—'} />
            <InfoRow label="ED/DD/SM/BM Name" value={currentBooking.edDdSmBmName || '—'} />
            <InfoRow label="Code Number" value={currentBooking.referenceCode || '—'} />
            <InfoRow label="Booking Date" value={formatDate(currentBooking.bookingDate)} />
          </InfoCard>

          <InfoCard icon={<WalletIcon />} title="Payment Details" compact>
            <InfoRow label="Bank Name" value={readString(payment, 'bankName', '—')} />
            <InfoRow label="Favour Of" value={readString(payment, 'favourOf', 'Sri Thangam Housing')} />
            <InfoRow label="Cheque Number" value={readString(payment, 'chequeNumber', '—')} />
            <InfoRow label="GPay Ref Number" value={readString(payment, 'gpayReference', '—')} />
            <InfoRow
              label="Cash Amount"
              value={formatCurrency(readNumber(payment, 'cashAmount'))}
            />
            <InfoRow
              label="Total Amount"
              value={formatCurrency(readNumber(payment, 'totalAmount'))}
              highlight
            />
          </InfoCard>
        </div>

        <div className="-mx-6 flex flex-col gap-3 border-t border-[#eee8dc] bg-white px-6 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <button type="button" onClick={onClose} className={secondaryButtonClass}>
            <CloseIcon />
            Close
          </button>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(currentBooking);
              }}
              className={`${primaryButtonClass} min-w-44`}
            >
              <PencilIcon />
              Edit Booking
            </button>

            <button
              type="button"
              onClick={() => void handleDownload()}
              disabled={downloading}
              className={`${primaryButtonClass} min-w-44`}
            >
              <DownloadIcon />
              {downloading ? 'Downloading...' : 'Download PDF'}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

// ─── Table mobile card ────────────────────────────────────────────────────────

function BookingMobileCard({
  booking,
  onView,
  onEdit,
  onDelete,
}: {
  booking: Booking;
  onView: (booking: Booking) => void;
  onEdit: (booking: Booking) => void;
  onDelete: (booking: Booking) => void;
}) {
  return (
    <div className="w-full min-w-0 rounded-xl border border-[#eee8dc] bg-white p-4 shadow-sm">
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="break-words text-[13px] font-black text-[#9c7a10]">
            #{booking.bookingId}
          </p>
          <p className="mt-1 truncate text-[14px] font-bold text-gray-900">
            {booking.applicantName}
          </p>
          <p className="truncate text-[12px] text-gray-500">{booking.cellNumber}</p>
        </div>

        <StatusPill status={booking.status} />
      </div>

      <div className="mt-4 grid min-w-0 grid-cols-1 gap-3 text-[12px] sm:grid-cols-2">
        <div className="min-w-0">
          <p className="font-bold uppercase tracking-wide text-gray-400">Project</p>
          <p className="mt-1 break-words font-semibold text-gray-800">{booking.projectName}</p>
        </div>

        <div className="min-w-0">
          <p className="font-bold uppercase tracking-wide text-gray-400">Plot</p>
          <p className="mt-1 break-words font-semibold text-gray-800">{booking.plotNumber}</p>
        </div>

        <div className="min-w-0">
          <p className="font-bold uppercase tracking-wide text-gray-400">Branch</p>
          <p className="mt-1 break-words font-semibold text-gray-800">
            {booking.branch?.name ?? '—'}
          </p>
        </div>

        <div className="min-w-0">
          <p className="font-bold uppercase tracking-wide text-gray-400">Date</p>
          <p className="mt-1 font-semibold text-gray-800">{formatDate(booking.bookingDate)}</p>
        </div>
      </div>

      <div className="mt-4 flex justify-end gap-2 border-t border-[#eee8dc] pt-3">
        <button
          type="button"
          onClick={() => onView(booking)}
          className={`${iconButtonClass} text-[#007f70] hover:bg-[#e8f8f4]`}
          aria-label="View booking"
        >
          <EyeIcon />
        </button>

        <button
          type="button"
          onClick={() => onEdit(booking)}
          className={`${iconButtonClass} text-[#9c7a10] hover:bg-[#fbf5df]`}
          aria-label="Edit booking"
        >
          <PencilIcon />
        </button>

        <button
          type="button"
          onClick={() => onDelete(booking)}
          className={`${iconButtonClass} text-red-500 hover:bg-red-50`}
          aria-label="Delete booking"
        >
          <TrashIcon />
        </button>
      </div>
    </div>
  );
}

// ─── BookingsPage ─────────────────────────────────────────────────────────────

const SuperAdminBookingsPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<BookingStatus | ''>('');
  const [branchFilter, setBranchFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');

  const [createOpen, setCreateOpen] = useState(false);
  const [viewBooking, setViewBooking] = useState<Booking | null>(null);
  const [editBooking, setEditBooking] = useState<Booking | null>(null);

  const [toast, setToast] = useState<{
    title: string;
    description: string;
  } | null>(null);

  const branchesQuery = useBranches({ limit: 100 });
  const branches = branchesQuery.data?.data ?? [];

  const { data, isLoading } = useBookings({
    page,
    limit: 10,
    search: search || undefined,
    status: status || undefined,
    branchId: branchFilter || undefined,
    startDate: dateFrom || undefined,
  });

  const deleteBooking = useDeleteBooking();
  const bookings = data?.data ?? [];

  const totalBookings = data?.total ?? 0;
  const limit = data?.limit ?? 10;

  const completed = bookings.filter((booking) => booking.status === 'COMPLETED').length;
  const cancelled = bookings.filter((booking) => booking.status === 'CANCELLED').length;
  const inProgress = bookings.filter(
    (booking) => booking.status !== 'COMPLETED' && booking.status !== 'CANCELLED'
  ).length;

  const showingFrom = totalBookings === 0 ? 0 : (page - 1) * limit + 1;
  const showingTo = Math.min(page * limit, totalBookings);

  useEffect(() => {
    if (!toast) return;

    const timer = window.setTimeout(() => {
      setToast(null);
    }, 3500);

    return () => window.clearTimeout(timer);
  }, [toast]);

  function showToast(title: string, description: string) {
    setToast({
      title,
      description,
    });
  }

  function handleDelete(booking: Booking) {
    const confirmed = window.confirm(
      `Delete booking "${booking.bookingId}"? This cannot be undone. Deletion is blocked if billing records exist.`
    );

    if (confirmed) {
      deleteBooking.mutate(booking.id);
    }
  }

  return (
    <div className="min-h-screen w-full min-w-0 overflow-x-hidden bg-[#f7f7f9] px-3 py-4 sm:px-5 lg:px-6">
      <div className="w-full min-w-0 max-w-none">
        <div className="mb-5 min-w-0">
          <p className="mb-1 text-[11px] font-semibold text-gray-400">
            Admin <span className="mx-1">›</span>
            <span className="text-[#9c7a10]">Book Property</span>
          </p>

          <h1 className="text-[24px] font-black tracking-tight text-gray-950 sm:text-[28px]">
            Book Property
          </h1>
          <p className="mt-1 text-[13px] text-gray-500">
            Manage property booking records and applicant details.
          </p>
        </div>

        <div className="mb-5 w-full min-w-0 rounded-xl border border-[#eee8dc] bg-white p-4 shadow-sm">
          <div className="grid w-full min-w-0 grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_130px_150px_165px_145px]">
            <div className="relative min-w-0">
              <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search bookings..."
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                className={`${inputClass} pl-9`}
              />
            </div>

            <select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value as BookingStatus | '');
                setPage(1);
              }}
              className={inputClass}
            >
              <option value="">All Status</option>
              {STATUS_OPTIONS.map((item) => (
                <option key={item} value={item}>
                  {statusLabel(item)}
                </option>
              ))}
            </select>

            <select
              value={branchFilter}
              onChange={(event) => {
                setBranchFilter(event.target.value);
                setPage(1);
              }}
              className={inputClass}
            >
              <option value="">All Branches</option>
              {branches.map((branch) => (
                <option key={branch.id} value={String(branch.id)}>
                  {branch.name}
                </option>
              ))}
            </select>

            <input
              type="date"
              value={dateFrom}
              onChange={(event) => {
                setDateFrom(event.target.value);
                setPage(1);
              }}
              className={inputClass}
            />

            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className={`${primaryButtonClass} w-full px-4`}
            >
              <PlusIcon />
              Add Booking
            </button>
          </div>

          <div className="mt-3 flex w-full min-w-0 items-center justify-start">
            <button
              type="button"
              onClick={() => setPage(1)}
              className={`${secondaryButtonClass} w-full px-4 sm:w-auto sm:min-w-[88px]`}
            >
              <FilterIcon />
              Filter
            </button>
          </div>
        </div>

        <div className="hidden w-full min-w-0 overflow-hidden rounded-xl border border-[#eee8dc] bg-white shadow-sm xl:block">
          <table className="w-full table-fixed text-left">
            <colgroup>
              <col className="w-[13%]" />
              <col className="w-[17%]" />
              <col className="w-[22%]" />
              <col className="w-[16%]" />
              <col className="w-[11%]" />
              <col className="w-[11%]" />
              <col className="w-[10%]" />
            </colgroup>

            <thead className="bg-[#f4f4f6]">
              <tr>
                {[
                  'Booking ID',
                  'Applicant Details',
                  'Project / Plot',
                  'Branch',
                  'Status',
                  'Date',
                  'Actions',
                ].map((heading) => (
                  <th
                    key={heading}
                    className="px-4 py-4 text-[10px] font-black uppercase tracking-[0.14em] text-gray-700"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-[#f0ece3]">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-14 text-center text-[13px] font-medium text-gray-400">
                    Loading bookings...
                  </td>
                </tr>
              ) : bookings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-14 text-center text-[13px] font-medium text-gray-400">
                    No bookings found
                  </td>
                </tr>
              ) : (
                bookings.map((booking) => (
                  <tr key={booking.id} className="transition hover:bg-[#fafafa]">
                    <td className="px-4 py-6 align-middle">
                      <span className="block break-words font-mono text-[13px] font-black leading-relaxed text-[#9c7a10]">
                        #{booking.bookingId}
                      </span>
                    </td>

                    <td className="px-4 py-6 align-middle">
                      <p className="truncate text-[13px] font-black leading-tight text-gray-950">
                        {booking.applicantName}
                      </p>
                      <p className="mt-1 truncate text-[11px] text-gray-500">{booking.cellNumber}</p>
                    </td>

                    <td className="px-4 py-6 align-middle">
                      <p className="break-words text-[13px] font-black leading-tight text-gray-950">
                        {booking.projectName}
                      </p>
                      <p className="mt-1 break-words text-[11px] leading-relaxed text-gray-500">
                        Plot: {booking.plotNumber}
                        {booking.property?.squareFeet ? ` | ${booking.property.squareFeet} sq.ft` : ''}
                      </p>
                    </td>

                    <td className="px-4 py-6 align-middle">
                      <p className="break-words text-[13px] leading-relaxed text-gray-700">
                        {booking.branch?.name ?? '—'}
                      </p>
                    </td>

                    <td className="px-4 py-6 align-middle">
                      <StatusPill status={booking.status} />
                    </td>

                    <td className="px-4 py-6 align-middle">
                      <p className="break-words text-[13px] leading-relaxed text-gray-700">
                        {formatDate(booking.bookingDate)}
                      </p>
                    </td>

                    <td className="px-4 py-6 align-middle">
                      <div className="flex min-w-0 items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => setViewBooking(booking)}
                          className={`${iconButtonClass} text-[#007f70] hover:bg-[#e8f8f4]`}
                          aria-label="View booking"
                        >
                          <EyeIcon />
                        </button>

                        <button
                          type="button"
                          onClick={() => setEditBooking(booking)}
                          className={`${iconButtonClass} text-[#9c7a10] hover:bg-[#fbf5df]`}
                          aria-label="Edit booking"
                        >
                          <PencilIcon />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(booking)}
                          className={`${iconButtonClass} text-red-500 hover:bg-red-50`}
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

          {data && (
            <div className="flex min-w-0 flex-col gap-4 border-t border-[#eee8dc] bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[13px] text-gray-600">
                Showing <span className="font-black text-gray-900">{showingFrom}-{showingTo}</span> of{' '}
                <span className="font-black text-gray-900">{totalBookings}</span> bookings
              </p>

              <Pagination
                page={page}
                total={data.total}
                limit={data.limit}
                onPageChange={setPage}
              />
            </div>
          )}
        </div>

        <div className="space-y-3 xl:hidden">
          {isLoading ? (
            <div className="rounded-xl border border-[#eee8dc] bg-white p-8 text-center text-[13px] font-medium text-gray-400">
              Loading bookings...
            </div>
          ) : bookings.length === 0 ? (
            <div className="rounded-xl border border-[#eee8dc] bg-white p-8 text-center text-[13px] font-medium text-gray-400">
              No bookings found
            </div>
          ) : (
            bookings.map((booking) => (
              <BookingMobileCard
                key={booking.id}
                booking={booking}
                onView={setViewBooking}
                onEdit={setEditBooking}
                onDelete={handleDelete}
              />
            ))
          )}

          {data && (
            <div className="rounded-xl border border-[#eee8dc] bg-white p-4">
              <p className="mb-3 text-[13px] text-gray-600">
                Showing <span className="font-black text-gray-900">{showingFrom}-{showingTo}</span> of{' '}
                <span className="font-black text-gray-900">{totalBookings}</span> bookings
              </p>

              <Pagination
                page={page}
                total={data.total}
                limit={data.limit}
                onPageChange={setPage}
              />
            </div>
          )}
        </div>

        <div className="mt-6 grid w-full min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={<BookmarkIcon />}
            label="Total Bookings"
            value={totalBookings}
            tone="gold"
          />

          <StatCard
            icon={<CheckIcon />}
            label="Completed"
            value={completed}
            tone="green"
          />

          <StatCard
            icon={<ClockIcon />}
            label="In Progress"
            value={inProgress}
            tone="blue"
          />

          <StatCard
            icon={<CloseIcon />}
            label="Cancelled"
            value={cancelled}
            tone="red"
          />
        </div>
      </div>

      <CreateBookingModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSaved={showToast}
      />

      {viewBooking && (
        <ViewBookingModal
          open
          onClose={() => setViewBooking(null)}
          booking={viewBooking}
          onEdit={(booking) => {
            setViewBooking(null);
            setEditBooking(booking);
          }}
        />
      )}

      {editBooking && (
        <EditBookingModal
          open
          onClose={() => setEditBooking(null)}
          booking={editBooking}
          onSaved={showToast}
        />
      )}

      {toast && (
        <Toast
          title={toast.title}
          description={toast.description}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default SuperAdminBookingsPage;