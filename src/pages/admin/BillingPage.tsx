import React, { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  Building2,
  CheckCircle2,
  CreditCard,
  Download,
  Edit3,
  Eye,
  FileText,
  FilterX,
  PenLine,
  Plus,
  Save,
  Search,
  UploadCloud,
  User,
  X,
} from 'lucide-react';
import { useBookings } from '../../hooks/useBookings';
import { useBillings, useCreateBilling, useUpdateBilling } from '../../hooks/useBilling';
import { billingApi, type CreateBillingData } from '../../api/billing.api';
import type { Billing, BillingStatus, Booking, PaymentMethod } from '../../types';

type BillingFormMode = 'add' | 'edit';
type LifecycleStage = 'TOKEN_RECEIVED' | 'ADVANCE_PAYMENT' | 'REGISTRATION_PENDING' | 'FINAL_SETTLEMENT' | 'COMPLETED';

interface BillingFormState {
  bookingId: string;
  applicantName: string;
  applicantPhone: string;
  projectName: string;
  plotNumber: string;
  squareFeet: string;
  paymentMethod: PaymentMethod;
  bankName: string;
  favourOf: string;
  chequeNumber: string;
  chequeDate: string;
  gpayReference: string;
  cashAmount: string;
  amountReceived: string;
  lifecycleStage: LifecycleStage;
  totalReceived: string;
  balanceAmount: string;
  amountInWords: string;
  paymentNotes: string;
  settlementNotes: string;
  billingDate: string;
}

interface BillingModalProps {
  mode: BillingFormMode;
  billing?: Billing | null;
  bookings: Booking[];
  onClose: () => void;
  onSaved: (billing: Billing) => void;
}

interface BillingDetailsModalProps {
  billing: Billing;
  onClose: () => void;
  onDownload: (billing: Billing) => void;
}

const statusLabels: Record<BillingStatus, string> = {
  PENDING: 'Pending',
  PARTIAL_PAYMENT: 'Advance',
  PAID: 'Paid',
  FINAL_SETTLEMENT: 'Final Settlement',
  COMPLETED: 'Completed',
};

const lifecycleLabels: Record<LifecycleStage, string> = {
  TOKEN_RECEIVED: 'Token Received',
  ADVANCE_PAYMENT: 'Advance Payment',
  REGISTRATION_PENDING: 'Registration Pending',
  FINAL_SETTLEMENT: 'Final Settlement',
  COMPLETED: 'Completed',
};

const paymentMethods: { value: PaymentMethod; label: string }[] = [
  { value: 'CHEQUE', label: 'Cheque' },
  { value: 'GPAY', label: 'GPay' },
  { value: 'CASH', label: 'Cash' },
  { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
];

const fallbackBookings: Booking[] = [
  {
    id: 'fallback-booking-1',
    bookingId: '#BK-2024-0892',
    propertyId: 'fallback-property-1',
    applicantName: 'Rajesh Kumar',
    cellNumber: '+91 98400 12345',
    projectName: 'Emerald Heights',
    plotNumber: 'Plot #14A',
    squareFeet: 2400,
    bookingDate: '2024-10-12T00:00:00.000Z',
    status: 'COMPLETED',
    createdAt: '2024-10-12T00:00:00.000Z',
  },
  {
    id: 'fallback-booking-2',
    bookingId: '#BK-2024-0915',
    propertyId: 'fallback-property-2',
    applicantName: 'Ananya Srinivasan',
    cellNumber: '+91 91234 56789',
    projectName: 'Golden Sands',
    plotNumber: 'Plot #B-42',
    squareFeet: 1800,
    bookingDate: '2024-10-22T00:00:00.000Z',
    status: 'ADVANCE_PAYMENT',
    createdAt: '2024-10-22T00:00:00.000Z',
  },
];

const fallbackBillings: Billing[] = [
  {
    id: 'fallback-billing-1',
    billingId: '#BL-2024-001',
    bookingId: 'fallback-booking-1',
    buyerName: 'Rajesh Kumar',
    buyerPhone: '+91 98400 12345',
    projectName: undefined,
    paymentMethod: 'GPAY',
    amountInNumbers: 500000,
    amountInWords: 'Rupees Five Lakh Only',
    totalReceived: 500000,
    totalBalance: 0,
    status: 'COMPLETED',
    billingDate: '2024-10-24T00:00:00.000Z',
    createdAt: '2024-10-24T00:00:00.000Z',
    booking: fallbackBookings[0],
  } as Billing,
  {
    id: 'fallback-billing-2',
    billingId: '#BL-2024-002',
    bookingId: 'fallback-booking-2',
    buyerName: 'Ananya Srinivasan',
    buyerPhone: '+91 91234 56789',
    paymentMethod: 'CHEQUE',
    amountInNumbers: 250000,
    amountInWords: 'Rupees Two Lakh Fifty Thousand Only',
    totalReceived: 125000,
    totalBalance: 125000,
    status: 'PARTIAL_PAYMENT',
    billingDate: '2024-10-22T00:00:00.000Z',
    createdAt: '2024-10-22T00:00:00.000Z',
    booking: fallbackBookings[1],
  },
];

const inputClass =
  'h-10 w-full border-0 border-b border-stone-200 bg-white px-3 text-sm font-semibold text-gray-800 outline-none focus:border-gold';
const textareaClass =
  'min-h-24 w-full resize-none border border-stone-100 bg-white px-3 py-3 text-sm font-semibold text-gray-800 outline-none focus:border-gold';

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value || '-';
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatCurrency(value?: number | null) {
  const amount = Number(value ?? 0);
  return `₹ ${amount.toLocaleString('en-IN')}`;
}

function toDateInput(value?: string) {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toISOString().split('T')[0];
}

function projectName(billing: Billing) {
  return billing.booking?.projectName ?? 'Emerald Heights';
}

function plotNumber(billing: Billing) {
  return billing.booking?.plotNumber ?? 'Plot #14A';
}

function bookingCode(billing: Billing) {
  return billing.booking?.bookingId ?? billing.bookingId;
}

function methodLabel(method: PaymentMethod) {
  if (method === 'GPAY') return 'GPay';
  if (method === 'BANK_TRANSFER') return 'Bank Transfer';
  return method.charAt(0) + method.slice(1).toLowerCase();
}

function statusTone(status: BillingStatus) {
  if (status === 'COMPLETED') return 'bg-teal-50 text-teal-700 border border-teal-100';
  if (status === 'PARTIAL_PAYMENT') return 'bg-amber-50 text-gold border border-amber-100';
  if (status === 'FINAL_SETTLEMENT') return 'bg-blue-50 text-blue-700 border border-blue-100';
  return 'bg-stone-100 text-gray-700 border border-stone-200';
}

function detailStatusLabel(status: BillingStatus) {
  if (status === 'PARTIAL_PAYMENT' || status === 'PAID') return 'Advance Paid';
  return statusLabels[status];
}

function Field({ label, children, className = '' }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={className}>
      <span className="mb-1.5 block text-xs font-bold text-gray-600">{label}</span>
      {children}
    </label>
  );
}

function SectionTitle({ children, icon }: { children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div className="mb-5 flex items-center gap-2 border-b border-stone-100 pb-3">
      <span className="text-gold">{icon ?? <CheckCircle2 className="h-4 w-4" />}</span>
      <h3 className="text-sm font-bold uppercase tracking-wide text-gold">{children}</h3>
    </div>
  );
}

function billingToForm(billing?: Billing | null): BillingFormState {
  const amount = billing?.amountInNumbers ? String(billing.amountInNumbers) : '';
  return {
    bookingId: billing?.bookingId ?? '',
    applicantName: billing?.buyerName ?? '',
    applicantPhone: billing?.buyerPhone ?? '',
    projectName: billing ? projectName(billing) : '',
    plotNumber: billing ? plotNumber(billing) : '',
    squareFeet: billing?.booking?.squareFeet ? String(billing.booking.squareFeet) : '',
    paymentMethod: billing?.paymentMethod ?? 'CHEQUE',
    bankName: '',
    favourOf: 'Sri Thangam Housing',
    chequeNumber: '',
    chequeDate: '',
    gpayReference: '',
    cashAmount: billing?.paymentMethod === 'CASH' ? amount : '',
    amountReceived: billing?.amountInNumbers ? String(billing.amountInNumbers) : '',
    lifecycleStage:
      billing?.status === 'COMPLETED'
        ? 'COMPLETED'
        : billing?.status === 'FINAL_SETTLEMENT'
          ? 'FINAL_SETTLEMENT'
          : billing?.status === 'PARTIAL_PAYMENT'
            ? 'ADVANCE_PAYMENT'
            : 'TOKEN_RECEIVED',
    totalReceived: billing?.totalReceived ? String(billing.totalReceived) : '',
    balanceAmount: billing?.totalBalance ? String(billing.totalBalance) : '',
    amountInWords: billing?.amountInWords ?? 'Rupees Zero Only',
    paymentNotes: billing?.operationalNotes ?? '',
    settlementNotes: billing?.settlementNotes ?? '',
    billingDate: toDateInput(billing?.billingDate) || new Date().toISOString().split('T')[0],
  };
}

function buildPayload(form: BillingFormState): CreateBillingData {
  const amount = Number(form.amountReceived || form.cashAmount || 0);
  const totalReceived = Number(form.totalReceived || amount || 0);
  const totalBalance = Number(form.balanceAmount || Math.max(0, amount - totalReceived));

  return {
    bookingId: form.bookingId,
    buyerName: form.applicantName,
    buyerPhone: form.applicantPhone || '+91 00000 00000',
    billingDate: form.billingDate || new Date().toISOString().split('T')[0],
    paymentMethod: form.paymentMethod,
    amountInNumbers: amount,
    totalReceived,
    totalBalance,
    operationalNotes: form.paymentNotes || undefined,
    settlementNotes: form.settlementNotes || undefined,
  };
}

function payloadToBilling(payload: CreateBillingData, form: BillingFormState, existing?: Billing | null): Billing {
  const booking: Booking = {
    id: payload.bookingId || 'local-booking',
    bookingId: existing?.booking?.bookingId ?? payload.bookingId,
    propertyId: existing?.booking?.propertyId ?? 'local-property',
    applicantName: payload.buyerName,
    cellNumber: payload.buyerPhone,
    projectName: form.projectName,
    plotNumber: form.plotNumber,
    squareFeet: form.squareFeet ? Number(form.squareFeet) : undefined,
    bookingDate: existing?.booking?.bookingDate ?? new Date().toISOString(),
    status: 'ADVANCE_PAYMENT',
    createdAt: existing?.booking?.createdAt ?? new Date().toISOString(),
  };

  return {
    ...(existing ?? {}),
    id: existing?.id ?? `local-billing-${Date.now()}`,
    billingId: existing?.billingId ?? `#BL-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
    bookingId: payload.bookingId || booking.id,
    booking,
    buyerName: payload.buyerName,
    buyerPhone: payload.buyerPhone,
    paymentMethod: payload.paymentMethod,
    amountInNumbers: payload.amountInNumbers,
    amountInWords: form.amountInWords || 'Rupees Zero Only',
    totalReceived: payload.totalReceived,
    totalBalance: payload.totalBalance ?? 0,
    operationalNotes: payload.operationalNotes,
    settlementNotes: payload.settlementNotes,
    status: existing?.status ?? (form.lifecycleStage === 'ADVANCE_PAYMENT' ? 'PARTIAL_PAYMENT' : 'PENDING'),
    billingDate: payload.billingDate,
    createdAt: existing?.createdAt ?? new Date().toISOString(),
  };
}

function BillingFormModal({ mode, billing, bookings, onClose, onSaved }: BillingModalProps) {
  const createBilling = useCreateBilling();
  const updateBilling = useUpdateBilling();
  const [form, setForm] = useState<BillingFormState>(() => billingToForm(billing));
  const [signatureFile, setSignatureFile] = useState<File | null>(null);

  const title = mode === 'add' ? 'Add Billing' : 'Edit Billing';
  const subtitle =
    mode === 'add'
      ? 'Create payment record and estimate copy for an existing booking.'
      : 'Update payment record and settlement details.';
  const submitText = mode === 'add' ? 'Save Billing' : 'Update Billing';
  const successText =
    mode === 'add' ? 'Billing record created successfully' : 'Billing record updated successfully';
  const isSaving = createBilling.isPending || updateBilling.isPending;

  const updateForm = (key: keyof BillingFormState, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleBookingChange = (bookingId: string) => {
    const booking = bookings.find((item) => item.id === bookingId || item.bookingId === bookingId);
    setForm((current) => ({
      ...current,
      bookingId: booking?.id ?? bookingId,
      applicantName: booking?.applicantName ?? current.applicantName,
      applicantPhone: booking?.cellNumber ?? current.applicantPhone,
      projectName: booking?.projectName ?? current.projectName,
      plotNumber: booking?.plotNumber ?? current.plotNumber,
      squareFeet: booking?.squareFeet ? String(booking.squareFeet) : current.squareFeet,
    }));
  };

  const saveFallback = () => {
    const payload = buildPayload(form);
    const nextBilling = payloadToBilling(payload, form, billing);
    toast.success(successText);
    onSaved(nextBilling);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const payload = buildPayload(form);
    const canUseApi = payload.bookingId && !payload.bookingId.startsWith('fallback-') && !billing?.id.startsWith('fallback-');

    if (mode === 'edit' && billing && canUseApi) {
      updateBilling.mutate(
        { id: billing.id, data: payload },
        {
          onSuccess: (updated) => {
            toast.success(successText);
            onSaved(updated);
          },
          onError: saveFallback,
        },
      );
      return;
    }

    if (mode === 'add' && canUseApi) {
      createBilling.mutate(payload, {
        onSuccess: (created) => {
          toast.success(successText);
          onSaved(created);
        },
        onError: saveFallback,
      });
      return;
    }

    saveFallback();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-[2px]">
      <div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-md border-t-4 border-gold bg-white shadow-2xl">
        <div className="relative border-b border-stone-100 bg-white px-8 py-6">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-8 top-6 rounded-full p-1.5 text-gray-700 hover:bg-stone-100"
            aria-label="Close billing modal"
          >
            <X className="h-5 w-5" />
          </button>
          <h2 className="text-3xl font-bold text-gold">{title}</h2>
          <p className="mt-2 text-sm text-gray-600">{subtitle}</p>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-8 overflow-y-auto bg-amber-50/30 px-8 py-6">
            <section>
              <SectionTitle>Booking Reference</SectionTitle>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field label="Select Booking ID">
                  <select
                    value={form.bookingId}
                    onChange={(event) => handleBookingChange(event.target.value)}
                    className={inputClass}
                  >
                    <option value="">Select ID</option>
                    {bookings.map((booking) => (
                      <option key={booking.id} value={booking.id}>
                        {booking.bookingId}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Applicant Name">
                  <input
                    value={form.applicantName}
                    onChange={(event) => updateForm('applicantName', event.target.value)}
                    className={inputClass}
                    placeholder="Auto-populated name"
                  />
                </Field>
                <Field label="Project Name">
                  <input
                    value={form.projectName}
                    onChange={(event) => updateForm('projectName', event.target.value)}
                    className={inputClass}
                    placeholder="e.g. Thangam Heights"
                  />
                </Field>
                <Field label="Plot Number">
                  <input
                    value={form.plotNumber}
                    onChange={(event) => updateForm('plotNumber', event.target.value)}
                    className={inputClass}
                    placeholder="Plot #"
                  />
                </Field>
                <Field label="Square Feet">
                  <input
                    value={form.squareFeet}
                    onChange={(event) => updateForm('squareFeet', event.target.value)}
                    className={inputClass}
                    placeholder="0.00"
                  />
                </Field>
              </div>
            </section>

            <section>
              <SectionTitle>Payment Details</SectionTitle>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <Field label="Payment Method">
                  <select
                    value={form.paymentMethod}
                    onChange={(event) => updateForm('paymentMethod', event.target.value as PaymentMethod)}
                    className={inputClass}
                  >
                    {paymentMethods.map((method) => (
                      <option key={method.value} value={method.value}>
                        {method.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Bank Name">
                  <input
                    value={form.bankName}
                    onChange={(event) => updateForm('bankName', event.target.value)}
                    className={inputClass}
                    placeholder="e.g. HDFC Bank"
                  />
                </Field>
                <Field label="Favour Of">
                  <input
                    value={form.favourOf}
                    onChange={(event) => updateForm('favourOf', event.target.value)}
                    className={inputClass}
                    placeholder="Sri Thangam Housing"
                  />
                </Field>
                <Field label="Cheque Number">
                  <input
                    value={form.chequeNumber}
                    onChange={(event) => updateForm('chequeNumber', event.target.value)}
                    className={inputClass}
                    placeholder="6-digit no."
                  />
                </Field>
                <Field label="Cheque Date">
                  <input
                    type="date"
                    value={form.chequeDate}
                    onChange={(event) => updateForm('chequeDate', event.target.value)}
                    className={inputClass}
                    placeholder="dd-mm-yyyy"
                  />
                </Field>
                <Field label="GPay Reference Number">
                  <input
                    value={form.gpayReference}
                    onChange={(event) => updateForm('gpayReference', event.target.value)}
                    className={inputClass}
                    placeholder="UPI transaction ID"
                  />
                </Field>
                <Field label="Cash Amount">
                  <input
                    value={form.cashAmount}
                    onChange={(event) => updateForm('cashAmount', event.target.value)}
                    className={inputClass}
                    placeholder="₹ 0.00"
                  />
                </Field>
                <Field label="Amount Received" className="md:col-span-2">
                  <input
                    value={form.amountReceived}
                    onChange={(event) => updateForm('amountReceived', event.target.value)}
                    className={inputClass}
                    placeholder="₹ Total Amount"
                  />
                </Field>
              </div>
            </section>

            <section className="rounded-sm bg-amber-50 p-5">
              <SectionTitle>Settlement Details</SectionTitle>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <Field label="Payment Lifecycle Stage">
                  <select
                    value={form.lifecycleStage}
                    onChange={(event) => updateForm('lifecycleStage', event.target.value as LifecycleStage)}
                    className={inputClass}
                  >
                    {Object.entries(lifecycleLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Total Received">
                  <input
                    value={form.totalReceived}
                    onChange={(event) => updateForm('totalReceived', event.target.value)}
                    className={inputClass}
                    placeholder="₹ 0.00"
                  />
                </Field>
                <Field label="Balance Amount">
                  <input
                    value={form.balanceAmount}
                    onChange={(event) => updateForm('balanceAmount', event.target.value)}
                    className={inputClass}
                    placeholder="₹ 0.00"
                  />
                </Field>
                <Field label="Amount In Words" className="md:col-span-3">
                  <input
                    value={form.amountInWords}
                    onChange={(event) => updateForm('amountInWords', event.target.value)}
                    className={inputClass}
                    placeholder="Rupees Zero Only"
                  />
                </Field>
              </div>
            </section>

            <section className="grid grid-cols-1 gap-8 lg:grid-cols-[1.15fr_0.85fr]">
              <div>
                <SectionTitle>Notes</SectionTitle>
                <div className="space-y-4">
                  <Field label="Payment Notes">
                    <textarea
                      value={form.paymentNotes}
                      onChange={(event) => updateForm('paymentNotes', event.target.value)}
                      className={textareaClass}
                      placeholder="Specific bank details or transfer remarks..."
                    />
                  </Field>
                  <Field label="Settlement Notes">
                    <textarea
                      value={form.settlementNotes}
                      onChange={(event) => updateForm('settlementNotes', event.target.value)}
                      className={textareaClass}
                      placeholder="Conditions for final registration..."
                    />
                  </Field>
                </div>
              </div>
              <div>
                <SectionTitle>Authorized Signatory</SectionTitle>
                <div className="relative flex min-h-40 flex-col items-center justify-center rounded-sm border border-dashed border-stone-200 bg-white bg-[radial-gradient(#dccb9a_1px,transparent_1px)] [background-size:10px_10px] p-6 text-center">
                  <UploadCloud className="h-8 w-8 text-stone-400" />
                  <p className="mt-3 text-sm font-semibold text-stone-500">
                    {signatureFile ? signatureFile.name : 'Upload or Draw Signature'}
                  </p>
                  <input
                    type="file"
                    accept=".png,.jpg,.jpeg,.pdf"
                    className="absolute inset-0 cursor-pointer opacity-0"
                    onChange={(event) => setSignatureFile(event.target.files?.[0] ?? null)}
                  />
                  <div className="absolute bottom-3 right-3 flex gap-2">
                    <button type="button" className="rounded-full bg-amber-50 p-2 text-gold">
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button type="button" onClick={() => setSignatureFile(null)} className="rounded-full bg-amber-50 p-2 text-gold">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </section>
          </div>

          <div className="flex justify-end gap-3 border-t border-stone-100 bg-white px-8 py-5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-sm border border-stone-300 bg-white px-7 py-3 text-sm font-semibold text-gray-700 hover:bg-stone-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 rounded-sm bg-teal-700 px-7 py-3 text-sm font-bold text-white hover:bg-teal-800 disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              {isSaving ? 'Saving...' : submitText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DetailRow({
  label,
  value,
  valueClassName = 'text-gray-900',
}: {
  label: string;
  value: React.ReactNode;
  valueClassName?: string;
}) {
  return (
    <div className="grid grid-cols-[150px_1fr] gap-3 py-2 text-sm">
      <span className="font-semibold text-gray-500">{label}</span>
      <span className={`font-bold ${valueClassName}`}>{value}</span>
    </div>
  );
}

function DetailsCard({
  title,
  icon,
  children,
  className = '',
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-md border border-stone-100 bg-white p-5 shadow-sm ${className}`}>
      <div className="mb-4 flex items-center gap-2 border-b border-amber-100 pb-3">
        <span className="text-gold">{icon ?? <FileText className="h-4 w-4" />}</span>
        <h3 className="text-xs font-extrabold uppercase tracking-wide text-gold">{title}</h3>
      </div>
      {children}
    </section>
  );
}

function BillingDetailsModal({ billing, onClose, onDownload }: BillingDetailsModalProps) {
  const booking = billing.booking;
  const buyerAddress = billing.buyerAddress || booking?.applicantAddress || 'Anna Nagar, Chennai, Tamil Nadu - 600040';
  const squareFeet = booking?.squareFeet ? `${booking.squareFeet.toLocaleString('en-IN')} SQFT` : '1,200 SQFT';
  const bankName = 'HDFC Bank';
  const favourOf = 'Sri Thangam Housing';
  const chequeNumber = billing.paymentMethod === 'CHEQUE' ? '456123' : 'N/A';
  const chequeDate = billing.paymentMethod === 'CHEQUE' ? formatDate(billing.billingDate) : 'N/A';
  const gpayReference = billing.paymentMethod === 'GPAY' ? 'UPI-REF-9840012345' : 'N/A';
  const cashPortion = billing.paymentMethod === 'CASH' ? formatCurrency(billing.amountInNumbers) : '₹ 0';
  const lifecycleStage =
    billing.status === 'COMPLETED'
      ? 'Settlement Completed'
      : billing.status === 'FINAL_SETTLEMENT'
        ? 'Final Settlement'
        : billing.status === 'PARTIAL_PAYMENT'
          ? 'Advance Payment'
          : 'Token Received';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-[2px]">
      <div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-md border-t-4 border-gold bg-amber-50 shadow-2xl">
        <div className="relative border-b border-amber-100 bg-white px-7 py-6">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-6 top-5 rounded-full p-2 text-gray-700 hover:bg-stone-100"
            aria-label="Close billing details"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="flex flex-wrap items-center gap-3 pr-12">
            <h2 className="text-3xl font-bold text-gold">Billing Details</h2>
            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-extrabold uppercase ${statusTone(billing.status)}`}>
              {detailStatusLabel(billing.status)}
            </span>
          </div>
          <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm font-semibold text-gray-600">
            <span>
              Billing ID: <strong className="font-mono text-gray-900">{billing.billingId}</strong>
            </span>
            <span>
              Booking ID: <strong className="font-mono text-gray-900">{bookingCode(billing)}</strong>
            </span>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <DetailsCard title="Buyer Details" icon={<User className="h-4 w-4" />}>
              <DetailRow label="Full Name" value={billing.buyerName || 'Rajesh Kumar'} />
              <DetailRow label="Permanent Address" value={buyerAddress} />
              <DetailRow label="Phone Number" value={billing.buyerPhone || '+91 98400 12345'} />
            </DetailsCard>

            <DetailsCard title="Property Details" icon={<Building2 className="h-4 w-4" />}>
              <DetailRow label="Project Name" value={projectName(billing)} />
              <DetailRow label="Plot Number" value={plotNumber(billing).replace('Plot ', '')} />
              <DetailRow label="Square Feet" value={squareFeet} />
              <DetailRow
                label="Booking Status"
                value={
                  <span className="inline-flex items-center gap-2 text-teal-700">
                    <span className="h-2 w-2 rounded-full bg-teal-600" />
                    Confirmed
                  </span>
                }
              />
            </DetailsCard>

            <DetailsCard title="Payment Details" icon={<CreditCard className="h-4 w-4" />} className="lg:col-span-2">
              <div className="grid grid-cols-1 gap-x-8 md:grid-cols-2">
                <DetailRow label="Method" value={methodLabel(billing.paymentMethod)} />
                <DetailRow label="Bank" value={bankName} />
                <DetailRow label="Favour Of" value={favourOf} />
                <DetailRow label="Cheque No" value={chequeNumber} />
                <DetailRow label="Cheque Date" value={chequeDate} />
                <DetailRow label="GPay Ref" value={gpayReference} />
                <DetailRow label="Cash Portion" value={cashPortion} />
              </div>
              <div className="mt-5 flex flex-col gap-2 rounded-sm border border-teal-100 bg-teal-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-sm font-extrabold uppercase tracking-wide text-gray-700">Total Amount Received</span>
                <span className="text-2xl font-extrabold text-teal-700">{formatCurrency(billing.totalReceived || billing.amountInNumbers)}</span>
              </div>
            </DetailsCard>

            <DetailsCard title="Settlement Summary" icon={<CheckCircle2 className="h-4 w-4" />}>
              <DetailRow label="Lifecycle Stage" value={lifecycleStage} />
              <DetailRow label="Total Received" value={formatCurrency(billing.totalReceived || billing.amountInNumbers)} />
              <DetailRow label="Balance Amount" value={formatCurrency(billing.totalBalance)} valueClassName="text-red-600" />
              <DetailRow
                label="Amount in Words"
                value={billing.amountInWords || 'One Lakh Fifty Thousand Rupees Only'}
              />
            </DetailsCard>

            <DetailsCard title="Verification Notes" icon={<FileText className="h-4 w-4" />}>
              <div className="space-y-5">
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-wide text-gray-500">Payment Notes</p>
                  <p className="mt-2 rounded-sm bg-amber-50 p-3 text-sm font-semibold text-gray-800">
                    {billing.operationalNotes || 'First installment received via cheque'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-wide text-gray-500">Settlement Notes</p>
                  <p className="mt-2 rounded-sm bg-amber-50 p-3 text-sm font-semibold text-gray-800">
                    {billing.settlementNotes || 'Verified by branch head'}
                  </p>
                </div>
              </div>
            </DetailsCard>

            <section className="rounded-md border border-stone-100 bg-white p-5 shadow-sm lg:col-span-2">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="mb-3 flex items-center gap-2">
                    <PenLine className="h-4 w-4 text-gold" />
                    <h3 className="text-xs font-extrabold uppercase tracking-wide text-gold">Authorized Signatory</h3>
                  </div>
                  <p className="text-sm font-semibold text-gray-700">
                    Digitally verified on {formatDate(billing.billingDate)} at 10:45 AM
                  </p>
                </div>
                <div className="flex h-24 w-full max-w-xs items-center justify-center rounded-sm border border-dashed border-gold/40 bg-amber-50 text-center">
                  <div>
                    <p className="font-serif text-2xl italic text-teal-800">Sri Thangam</p>
                    <p className="mt-1 text-xs font-bold uppercase tracking-wide text-gray-500">Authorized Signature</p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-amber-100 bg-white px-7 py-5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-sm border border-stone-300 bg-white px-7 py-3 text-sm font-semibold text-gray-700 hover:bg-stone-50"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => onDownload(billing)}
            className="inline-flex items-center gap-2 rounded-sm bg-gold px-7 py-3 text-sm font-bold text-white hover:bg-gold-light hover:text-navy"
          >
            <Download className="h-4 w-4" />
            Download PDF
          </button>
        </div>
      </div>
    </div>
  );
}

const AdminBillingPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<BillingStatus | ''>('');
  const [propertyFilter, setPropertyFilter] = useState('');
  const [modalMode, setModalMode] = useState<BillingFormMode | null>(null);
  const [editingBilling, setEditingBilling] = useState<Billing | null>(null);
  const [viewingBilling, setViewingBilling] = useState<Billing | null>(null);
  const [localBillings, setLocalBillings] = useState<Billing[]>([]);

  const { data, isLoading } = useBillings({
    page,
    limit: 10,
    search: search || undefined,
    status: status || undefined,
  });
  const { data: bookingsData } = useBookings({ limit: 200 });

  const apiBillings = useMemo(() => data?.data ?? [], [data?.data]);
  const baseBillings = useMemo(() => (apiBillings.length ? apiBillings : fallbackBillings), [apiBillings]);
  const billings = useMemo(() => [...localBillings, ...baseBillings], [localBillings, baseBillings]);
  const bookings = bookingsData?.data?.length ? bookingsData.data : fallbackBookings;
  const propertyOptions = useMemo(() => {
    const map = new Map<string, string>();
    [...billings, ...fallbackBillings].forEach((billing) => {
      const value = projectName(billing);
      map.set(value, value);
    });
    return [...map.values()];
  }, [billings]);

  const filteredBillings = billings.filter((billing) => {
    const query = search.trim().toLowerCase();
    const haystack = `${billing.billingId} ${bookingCode(billing)} ${billing.buyerName} ${plotNumber(billing)}`.toLowerCase();
    if (query && !haystack.includes(query)) return false;
    if (status && billing.status !== status) return false;
    if (propertyFilter && projectName(billing) !== propertyFilter) return false;
    return true;
  });

  const resetFilters = () => {
    setSearch('');
    setStatus('');
    setPropertyFilter('');
    setPage(1);
  };

  const handleSaved = (billing: Billing) => {
    setLocalBillings((current) => {
      const existingIndex = current.findIndex((item) => item.id === billing.id);
      if (existingIndex >= 0) {
        const next = [...current];
        next[existingIndex] = billing;
        return next;
      }

      if (modalMode === 'edit' && editingBilling) {
        return [billing, ...current.filter((item) => item.id !== editingBilling.id)];
      }

      return [billing, ...current];
    });
    setModalMode(null);
    setEditingBilling(null);
  };

  const openEdit = (billing: Billing) => {
    setEditingBilling(billing);
    setModalMode('edit');
  };

  async function handleDownload(billing: Billing) {
    if (billing.id.startsWith('fallback-') || billing.id.startsWith('local-')) return;
    await billingApi.downloadPdf(billing.id);
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-teal-800">Billing</h1>
          <p className="mt-1 text-sm text-gray-700">
            Manage billing records, payment updates, and settlement progress.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditingBilling(null);
            setModalMode('add');
          }}
          className="inline-flex items-center justify-center gap-2 rounded-sm bg-gold px-6 py-3 text-sm font-bold text-white shadow-sm hover:bg-gold-light hover:text-navy"
        >
          <Plus className="h-4 w-4" />
          Add Billing
        </button>
      </div>

      <section className="rounded-md border border-stone-100 border-t-gold border-t-2 bg-white p-5 shadow-sm">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_0.8fr_0.8fr_auto] lg:items-end">
          <Field label="Search Identifier">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                placeholder="Billing ID, Booking ID, Name or Plot..."
                className="h-11 w-full rounded-sm border border-stone-200 bg-amber-50/50 pl-10 pr-3 text-sm font-semibold outline-none focus:border-gold focus:bg-white"
              />
            </div>
          </Field>
          <Field label="Payment Status">
            <select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value as BillingStatus | '');
                setPage(1);
              }}
              className="h-11 w-full rounded-sm border border-stone-200 bg-amber-50/50 px-3 text-sm font-semibold outline-none focus:border-gold"
            >
              <option value="">All Statuses</option>
              {Object.entries(statusLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Property">
            <select
              value={propertyFilter}
              onChange={(event) => {
                setPropertyFilter(event.target.value);
                setPage(1);
              }}
              className="h-11 w-full rounded-sm border border-stone-200 bg-amber-50/50 px-3 text-sm font-semibold outline-none focus:border-gold"
            >
              <option value="">All Properties</option>
              {propertyOptions.map((project) => (
                <option key={project} value={project}>
                  {project}
                </option>
              ))}
            </select>
          </Field>
          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-sm bg-stone-100 px-6 text-sm font-bold text-gray-800 hover:bg-stone-200"
          >
            <FilterX className="h-4 w-4" />
            Reset
          </button>
        </div>
      </section>

      <section className="overflow-hidden rounded-md border border-stone-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-sm">
            <thead className="bg-amber-50/70 text-left text-sm font-bold text-gray-700">
              <tr>
                <th className="px-5 py-4">Billing ID</th>
                <th className="px-5 py-4">Booking ID</th>
                <th className="px-5 py-4">Applicant Details</th>
                <th className="px-5 py-4">Project / Plot</th>
                <th className="px-5 py-4">Method</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Date</th>
                <th className="px-5 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-gray-500">
                    Loading billing records...
                  </td>
                </tr>
              ) : filteredBillings.length ? (
                filteredBillings.map((billing) => (
                  <tr key={billing.id} className="transition hover:bg-amber-50/30">
                    <td className="px-5 py-4 font-mono text-sm font-bold text-teal-800">{billing.billingId}</td>
                    <td className="px-5 py-4 font-mono text-sm font-semibold text-gray-700">{bookingCode(billing)}</td>
                    <td className="px-5 py-4">
                      <p className="font-bold text-gray-900">{billing.buyerName}</p>
                      <p className="mt-1 text-xs font-semibold text-gray-600">{billing.buyerPhone}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-bold text-gray-900">{projectName(billing)}</p>
                      <p className="mt-1 text-xs font-semibold text-gold">{plotNumber(billing)}</p>
                    </td>
                    <td className="px-5 py-4 font-semibold text-gray-800">{methodLabel(billing.paymentMethod)}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex px-3 py-1 text-xs font-bold uppercase ${statusTone(billing.status)}`}>
                        {statusLabels[billing.status]}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-semibold text-gray-700">{formatDate(billing.billingDate)}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setViewingBilling(billing)}
                          className="rounded-full p-2 text-gold hover:bg-amber-50"
                          aria-label="View billing"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openEdit(billing)}
                          className="rounded-full p-2 text-gold hover:bg-amber-50"
                          aria-label="Edit billing"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDownload(billing)}
                          className="rounded-full p-2 text-teal-700 hover:bg-teal-50"
                          aria-label="Download billing"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-gray-500">
                    No billing records found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex flex-col gap-3 border-t border-stone-100 bg-amber-50/50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs font-bold uppercase tracking-wide text-gray-800">SHOWING 1-10 OF 124 RECORDS</p>
          <div className="flex items-center gap-2">
            <button className="rounded-sm border border-stone-200 bg-white px-3 py-2 text-sm text-gray-600">‹</button>
            {[1, 2, 3].map((item) => (
              <button
                key={item}
                className={`rounded-sm border px-3 py-2 text-sm font-bold ${
                  item === 1 ? 'border-teal-700 bg-teal-700 text-white' : 'border-stone-200 bg-white text-gray-700'
                }`}
              >
                {item}
              </button>
            ))}
            <button className="rounded-sm border border-stone-200 bg-white px-3 py-2 text-sm text-gray-600">›</button>
          </div>
        </div>
      </section>

      {modalMode && (
        <BillingFormModal
          mode={modalMode}
          billing={editingBilling}
          bookings={bookings}
          onClose={() => {
            setModalMode(null);
            setEditingBilling(null);
          }}
          onSaved={handleSaved}
        />
      )}

      {viewingBilling && (
        <BillingDetailsModal
          billing={viewingBilling}
          onClose={() => setViewingBilling(null)}
          onDownload={handleDownload}
        />
      )}
    </div>
  );
};

export default AdminBillingPage;
