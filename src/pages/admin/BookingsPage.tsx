import React, { useMemo, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  Building2,
  CalendarDays,
  CreditCard,
  Edit3,
  Eye,
  FileSignature,
  FileText,
  FilterX,
  Plus,
  Save,
  Search,
  Trash2,
  Upload,
  User,
  X,
} from 'lucide-react';
import { useBooking, useBookings, useCreateBooking, useUpdateBooking, useUploadBookingSignature } from '../../hooks/useBookings';
import { useProperties } from '../../hooks/useProperties';
import { useDocuments, useDocumentUrl } from '../../hooks/useDocuments';
import { propertiesApi } from '../../api/properties.api';
import { resolveFileUrl } from '../../lib/file-url';
import { extractEntityId } from '../../lib/upload-helpers';
import type { Booking, BookingStatus, Property } from '../../types';
import type { BookingDenominationData, BookingPaymentData, CreateBookingData } from '../../api/bookings.api';

type BookingFormMode = 'add' | 'edit';

interface BookingFormState {
  propertyId: string;
  projectName: string;
  plotNumber: string;
  squareFeet: string;
  bookingDate: string;
  applicantName: string;
  relation: string;
  applicantAddress: string;
  pinCode: string;
  cellNumber: string;
  dateOfBirth: string;
  weddingDay: string;
  edDdSmBmName: string;
  referenceCode: string;
  directorName: string;
  bankName: string;
  favourOf: string;
  chequeNumber: string;
  chequeDate: string;
  gpayReference: string;
  cashAmount: string;
  totalAmount: string;
}

interface BookingModalProps {
  mode: BookingFormMode;
  booking?: Booking | null;
  properties: Property[];
  initialPropertyId?: string;
  onClose: () => void;
  onSaved: (booking: Booking) => void;
}

interface BookingDetailsModalProps {
  booking: Booking;
  onClose: () => void;
}

const statusLabels: Record<BookingStatus, string> = {
  BOOKING_INITIATED: 'Booking Initiated',
  TOKEN_RECEIVED: 'Token Received',
  ADVANCE_PAYMENT: 'Advance Payment',
  REGISTRATION_PENDING: 'Registration Pending',
  FINAL_SETTLEMENT_PENDING: 'Final Settlement Pending',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

const fallbackBookings: Booking[] = [
  {
    id: 'fallback-booking-1',
    bookingId: '#BK-2024-0892',
    propertyId: 'fallback-property-1',
    applicantName: 'Rajesh Kumar',
    cellNumber: '+91 98765 43210',
    projectName: 'Thangam Heritage II',
    plotNumber: 'Plot #42B - East Facing',
    bookingDate: '2023-10-12T00:00:00.000Z',
    status: 'COMPLETED',
    createdAt: '2023-10-12T00:00:00.000Z',
  },
  {
    id: 'fallback-booking-2',
    bookingId: '#BK-2024-0914',
    propertyId: 'fallback-property-2',
    applicantName: 'Anitha Lakshmi',
    cellNumber: '+91 81234 56789',
    projectName: 'Golden Meadows',
    plotNumber: 'Plot #115 - Corner',
    bookingDate: '2023-11-05T00:00:00.000Z',
    status: 'REGISTRATION_PENDING',
    createdAt: '2023-11-05T00:00:00.000Z',
  },
  {
    id: 'fallback-booking-3',
    bookingId: '#BK-2024-0945',
    propertyId: 'fallback-property-3',
    applicantName: 'Suresh Menon',
    cellNumber: '+91 76543 21098',
    projectName: 'Emerald Heights',
    plotNumber: 'Apartment 402-C',
    bookingDate: '2023-11-15T00:00:00.000Z',
    status: 'TOKEN_RECEIVED',
    createdAt: '2023-11-15T00:00:00.000Z',
  },
  {
    id: 'fallback-booking-4',
    bookingId: '#BK-2024-0952',
    propertyId: 'fallback-property-4',
    applicantName: 'Meera Reddy',
    cellNumber: '+91 90000 12345',
    projectName: 'Thangam Heritage II',
    plotNumber: 'Plot #08A',
    bookingDate: '2023-11-18T00:00:00.000Z',
    status: 'FINAL_SETTLEMENT_PENDING',
    createdAt: '2023-11-18T00:00:00.000Z',
  },
];

const fallbackProperties: Property[] = [
  {
    id: 'fallback-property-1',
    propertyId: 'STH-P-001',
    propertyName: 'Thangam Heritage II',
    projectName: 'Thangam Heritage II',
    plotNumber: 'Plot #42B - East Facing',
    propertyType: 'PLOT',
    workflowStatus: 'AVAILABLE',
    createdAt: '2023-10-12T00:00:00.000Z',
  },
  {
    id: 'fallback-property-2',
    propertyId: 'STH-P-002',
    propertyName: 'Golden Meadows',
    projectName: 'Golden Meadows',
    plotNumber: 'Plot #115 - Corner',
    propertyType: 'PLOT',
    workflowStatus: 'AVAILABLE',
    createdAt: '2023-10-12T00:00:00.000Z',
  },
  {
    id: 'fallback-property-3',
    propertyId: 'STH-P-003',
    propertyName: 'Emerald Heights',
    projectName: 'Emerald Heights',
    plotNumber: 'Apartment 402-C',
    propertyType: 'APARTMENT',
    workflowStatus: 'AVAILABLE',
    createdAt: '2023-10-12T00:00:00.000Z',
  },
];

const denominations = [2000, 1000, 500, 200, 100, 50, 20, 10];

function calculateDenominationAmount(denomination: number, count: number) {
  return (Number(denomination) || 0) * (Number(count) || 0);
}

function normalizeDenominationRow(row: BookingDenominationData): BookingDenominationData {
  const denomination = Number(row.denomination) || 0;
  const count = Number(row.count) || 0;

  return {
    denomination,
    count,
    amount: calculateDenominationAmount(denomination, count),
  };
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value || '-';
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatCurrency(value?: number | null) {
  const amount = Number(value ?? 0);
  return `₹ ${amount.toLocaleString('en-IN')}`;
}

function formatOptionalCurrency(value?: number | null) {
  return value === null || value === undefined ? '-' : formatCurrency(value);
}

function formatPaymentMethod(value?: string) {
  return value ? value.replace(/_/g, ' ') : '-';
}

function paymentNumber(payment: unknown, keys: string[]) {
  const record = payment as Record<string, unknown> | undefined;

  for (const key of keys) {
    const value = record?.[key];
    const amount = typeof value === 'number' ? value : Number(value);

    if (Number.isFinite(amount)) return amount;
  }

  return undefined;
}

function toDateInput(value?: string) {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toISOString().split('T')[0];
}

function bookingToForm(booking?: Booking | null, initialProperty?: Property | null): BookingFormState {
  const propertyFields = bookingFormFromProperty(initialProperty);
  return {
    propertyId: booking?.propertyId ?? propertyFields.propertyId ?? '',
    projectName: booking?.projectName ?? propertyFields.projectName ?? '',
    plotNumber: booking?.plotNumber ?? propertyFields.plotNumber ?? '',
    squareFeet: booking?.squareFeet ? String(booking.squareFeet) : propertyFields.squareFeet ?? '',
    bookingDate: toDateInput(booking?.bookingDate),
    applicantName: booking?.applicantName ?? '',
    relation: booking?.relation ?? '',
    applicantAddress: booking?.applicantAddress ?? '',
    pinCode: booking?.pinCode ?? '',
    cellNumber: booking?.cellNumber ?? '',
    dateOfBirth: toDateInput(booking?.dateOfBirth),
    weddingDay: toDateInput(booking?.weddingDay),
    edDdSmBmName: booking?.edDdSmBmName ?? '',
    referenceCode: booking?.referenceCode ?? '',
    directorName: booking?.directorName ?? '',
    bankName: booking?.payments?.[0]?.bankName ?? '',
    favourOf: booking?.payments?.[0]?.favourOf ?? 'Sri Thangam Housing',
    chequeNumber: booking?.payments?.[0]?.chequeNumber ?? '',
    chequeDate: toDateInput(booking?.payments?.[0]?.chequeDate),
    gpayReference: booking?.payments?.[0]?.gpayReference ?? '',
    cashAmount: booking?.payments?.[0]?.cashAmount ? String(booking.payments[0].cashAmount) : '',
    totalAmount: booking?.payments?.[0]?.totalAmount ? String(booking.payments[0].totalAmount) : '',
  };
}

function buildBookingPayload(form: BookingFormState, denominationRows: BookingDenominationData[]): CreateBookingData {
  const validDenominations = denominationRows.map(normalizeDenominationRow).filter((row) => row.count > 0);
  const denominationTotal = validDenominations.reduce((total, row) => total + row.amount, 0);
  const cashAmount = Number(form.cashAmount || 0);
  const calculatedTotalAmount = cashAmount + denominationTotal;
  const totalAmount = Number(form.totalAmount || 0) || calculatedTotalAmount;
  const payment: BookingPaymentData = {
    bankName: form.bankName || undefined,
    favourOf: form.favourOf || 'Sri Thangam Housing',
    chequeNumber: form.chequeNumber || undefined,
    chequeDate: form.chequeDate || undefined,
    gpayReference: form.gpayReference || undefined,
    cashAmount: cashAmount || undefined,
    totalAmount,
    paymentMethod: cashAmount > 0 ? 'CASH' : form.gpayReference ? 'UPI' : form.chequeNumber ? 'CHEQUE' : 'CASH',
  };

  return {
    propertyId: form.propertyId,
    applicantName: form.applicantName,
    relation: form.relation || undefined,
    applicantAddress: form.applicantAddress || undefined,
    pinCode: form.pinCode || undefined,
    cellNumber: form.cellNumber,
    dateOfBirth: form.dateOfBirth || undefined,
    weddingDay: form.weddingDay || undefined,
    projectName: form.projectName,
    plotNumber: form.plotNumber,
    squareFeet: form.squareFeet ? Number(form.squareFeet) : undefined,
    bookingDate: form.bookingDate || new Date().toISOString().split('T')[0],
    edDdSmBmName: form.edDdSmBmName || undefined,
    referenceCode: form.referenceCode || undefined,
    directorName: form.directorName || undefined,
    payments: totalAmount > 0 ? [payment] : undefined,
    denominations: validDenominations,
  };
}

function payloadToBooking(payload: CreateBookingData, existing?: Booking | null): Booking {
  return {
    ...(existing ?? {}),
    id: existing?.id ?? `local-booking-${Date.now()}`,
    bookingId: existing?.bookingId ?? `#BK-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    propertyId: payload.propertyId || 'local-property',
    applicantName: payload.applicantName,
    relation: payload.relation,
    applicantAddress: payload.applicantAddress,
    pinCode: payload.pinCode,
    cellNumber: payload.cellNumber,
    dateOfBirth: payload.dateOfBirth,
    weddingDay: payload.weddingDay,
    projectName: payload.projectName,
    plotNumber: payload.plotNumber,
    squareFeet: payload.squareFeet,
    bookingDate: payload.bookingDate,
    edDdSmBmName: payload.edDdSmBmName,
    referenceCode: payload.referenceCode,
    directorName: payload.directorName,
    status: existing?.status ?? 'BOOKING_INITIATED',
    payments: payload.payments?.map((payment, index) => ({
      id: `${existing?.id ?? 'local'}-payment-${index}`,
      bookingId: existing?.id ?? 'local',
      paymentMethod: payment.paymentMethod as Booking['payments'] extends Array<infer P> ? P extends { paymentMethod: infer M } ? M : never : never,
      bankName: payment.bankName,
      favourOf: payment.favourOf,
      chequeNumber: payment.chequeNumber,
      chequeDate: payment.chequeDate,
      gpayReference: payment.gpayReference,
      cashAmount: payment.cashAmount,
      totalAmount: payment.totalAmount,
    })),
    denominations: payload.denominations?.map((denomination, index) => ({
      id: `${existing?.id ?? 'local'}-denomination-${index}`,
      bookingId: existing?.id ?? 'local',
      denomination: denomination.denomination,
      count: denomination.count,
      amount: denomination.amount,
    })),
    createdAt: existing?.createdAt ?? new Date().toISOString(),
  } as Booking;
}

function statusTone(status: BookingStatus) {
  if (status === 'COMPLETED') return 'bg-teal-100 text-teal-800';
  if (status === 'FINAL_SETTLEMENT_PENDING') return 'bg-red-100 text-red-700';
  if (status === 'REGISTRATION_PENDING') return 'bg-amber-100 text-gold';
  return 'bg-stone-100 text-gray-800';
}

function Field({
  label,
  children,
  className = '',
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={className}>
      <span className="mb-1.5 block text-xs font-bold text-gray-600">{label}</span>
      {children}
    </label>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-center gap-3 border-l-4 border-gold pl-3">
      <h3 className="text-lg font-bold text-teal-700">{children}</h3>
    </div>
  );
}

const inputClass =
  'h-10 w-full rounded-sm border border-stone-300 bg-amber-50/40 px-3 text-sm font-semibold text-gray-800 outline-none focus:border-gold focus:bg-white';
const textareaClass =
  'min-h-20 w-full rounded-sm border border-stone-300 bg-amber-50/40 px-3 py-2 text-sm font-semibold text-gray-800 outline-none focus:border-gold focus:bg-white';
const unavailablePropertyMessage = 'This property is already in booking progress.';
const conflictPropertyMessage = 'This property has already been booked or locked by another branch.';
const signatureMimeTypes = new Set(['image/png', 'image/jpeg']);
const maxSignatureSizeBytes = 2 * 1024 * 1024;
type PropertyBookingStatus = 'AVAILABLE' | 'BOOKING_INITIATED' | 'TOKEN_RECEIVED' | 'ADVANCE_PAYMENT' | 'REGISTRATION_PENDING' | 'FINAL_SETTLEMENT_PENDING' | 'COMPLETED' | 'BOOKED' | '';

function propertyBookingStatus(property?: Property | null) {
  if (!property) return '';
  const extra = property as Property & { status?: string; workflow_status?: string };
  return (property.workflowStatus ?? extra.status ?? extra.workflow_status ?? '') as PropertyBookingStatus;
}

function toLocalDateParam(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatStatusLabel(status: string) {
  const labels: Record<string, string> = {
    AVAILABLE: 'Available',
    BOOKED: 'Completed / Booked',
    BOOKING_INITIATED: 'Booking In Progress',
    TOKEN_RECEIVED: 'Token Received',
    ADVANCE_PAYMENT: 'Advance Payment',
    REGISTRATION_PENDING: 'Registration Pending',
    FINAL_SETTLEMENT_PENDING: 'Final Settlement Pending',
    COMPLETED: 'Completed / Booked',
  };

  return labels[status] ?? status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
}

function isBookableProperty(property?: Property | null) {
  return propertyBookingStatus(property) === 'AVAILABLE';
}

function bookingFormFromProperty(property?: Property | null): Partial<BookingFormState> {
  if (!property) return {};
  return {
    propertyId: property.id,
    projectName: property.projectName,
    plotNumber: property.plotNumber,
    squareFeet: property.squareFeet ? String(property.squareFeet) : '',
  };
}

function isValidSignatureFile(file: File) {
  const hasValidExtension = /\.(png|jpe?g)$/i.test(file.name);
  const hasValidMime = signatureMimeTypes.has(file.type);
  return hasValidExtension && (!file.type || hasValidMime) && file.size <= maxSignatureSizeBytes;
}

function getBookingSignaturePath(booking: Booking): string {
  const record = booking as Booking & {
    applicantSignature?: string;
    applicantSignatureUrl?: string;
    signature?: string;
    documentUrl?: string;
    fileUrl?: string;
    documents?: Array<{
      documentType?: string;
      documentUrl?: string;
      fileUrl?: string;
      url?: string;
    }>;
  };

  const document = record.documents?.find((item) => item.documentType === 'BOOKING_DOCUMENT') ?? record.documents?.[0];

  return (
    record.applicantSignatureUrl ||
    record.applicantSignature ||
    record.signatureUrl ||
    record.signature ||
    record.documentUrl ||
    record.fileUrl ||
    document?.documentUrl ||
    document?.fileUrl ||
    document?.url ||
    ''
  );
}

function bookingSubmitErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 409) return conflictPropertyMessage;
  }

  return 'Unable to create booking. Please try again.';
}

function BookingFormModal({ mode, booking, properties, initialPropertyId, onClose, onSaved }: BookingModalProps) {
  const queryClient = useQueryClient();
  const createBooking = useCreateBooking();
  const updateBooking = useUpdateBooking();
  const uploadBookingSignature = useUploadBookingSignature();
  const initialProperty = mode === 'add' && initialPropertyId
    ? properties.find((property) => property.id === initialPropertyId)
    : null;
  const [form, setForm] = useState<BookingFormState>(() => bookingToForm(booking, initialProperty));
  const [signatureFile, setSignatureFile] = useState<File | null>(null);
  const [signaturePreviewUrl, setSignaturePreviewUrl] = useState('');
  const [isTotalAmountManual, setIsTotalAmountManual] = useState(Boolean(booking?.payments?.[0]?.totalAmount));
  const [denominationRows, setDenominationRows] = useState<BookingDenominationData[]>(
    booking?.denominations?.length
      ? booking.denominations.map((row) =>
          normalizeDenominationRow({
            denomination: row.denomination,
            count: row.count,
            amount: row.amount,
          }),
        )
      : [{ denomination: 2000, count: 0, amount: 0 }],
  );

  const modalTitle = mode === 'add' ? 'Add Property Booking' : 'Edit Property Booking';
  const modalSubtitle =
    mode === 'add'
      ? 'Create a booking record using Sri Thangam Housing booking form details.'
      : 'Update property booking record details.';
  const successText = mode === 'add' ? 'Booking created successfully.' : 'Booking updated successfully.';
  const submitText = mode === 'add' ? 'Save Booking' : 'Update Booking';
  const isSaving = createBooking.isPending || updateBooking.isPending || uploadBookingSignature.isPending;
  const existingSignatureUrl = resolveFileUrl(booking ? getBookingSignaturePath(booking) : '');
  const denominationTotal = useMemo(
    () => denominationRows.reduce((total, row) => total + calculateDenominationAmount(row.denomination, row.count), 0),
    [denominationRows],
  );
  const cashAmount = Number(form.cashAmount || 0);
  const calculatedTotalAmount = cashAmount + denominationTotal;
  const hasManualTotalAmount = isTotalAmountManual && form.totalAmount.trim() !== '';
  const totalAmountForDisplay = hasManualTotalAmount
    ? form.totalAmount
    : calculatedTotalAmount > 0
      ? String(calculatedTotalAmount)
      : '';

  const updateForm = (key: keyof BookingFormState, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const updateTotalAmount = (value: string) => {
    setIsTotalAmountManual(value.trim() !== '');
    updateForm('totalAmount', value);
  };

  const handlePropertyChange = (propertyId: string) => {
    const property = properties.find((item) => item.id === propertyId);
    if (mode === 'add' && property && !isBookableProperty(property)) {
      toast.error(unavailablePropertyMessage);
      return;
    }

    setForm((current) => ({
      ...current,
      propertyId,
      projectName: property?.projectName ?? current.projectName,
      plotNumber: property?.plotNumber ?? current.plotNumber,
      squareFeet: property?.squareFeet ? String(property.squareFeet) : current.squareFeet,
    }));
  };

  const latestSelectedProperty = async (propertyId: string) => {
    if (!propertyId || propertyId.startsWith('fallback-')) {
      return properties.find((property) => property.id === propertyId) ?? null;
    }

    try {
      return await queryClient.fetchQuery({
        queryKey: ['properties', propertyId],
        queryFn: () => propertiesApi.getOne(propertyId),
        staleTime: 0,
      });
    } catch {
      return properties.find((property) => property.id === propertyId) ?? null;
    }
  };

  const updateDenomination = (index: number, key: 'denomination' | 'count', value: number) => {
    setDenominationRows((current) => {
      const next = [...current];
      const denomination = key === 'denomination' ? value : next[index].denomination;
      const count = key === 'count' ? value : next[index].count;
      next[index] = {
        ...next[index],
        [key]: value,
        amount: calculateDenominationAmount(denomination, count),
      };
      return next;
    });
  };

  const setUploadedSignature = (file: File | null) => {
    setSignatureFile(file);
    setSignaturePreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return file ? URL.createObjectURL(file) : '';
    });
  };

  const handleSignatureInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    event.target.value = '';

    if (!file) {
      setUploadedSignature(null);
      return;
    }

    if (!isValidSignatureFile(file)) {
      toast.error('Please upload a valid PNG or JPG signature under 2MB.');
      setUploadedSignature(null);
      return;
    }

    setUploadedSignature(file);
  };

  const signatureForUpload = () => {
    return signatureFile;
  };

  const uploadSignatureIfSelected = async (savedBooking: Booking) => {
    const signature = signatureForUpload();
    if (!signature) return;

    const bookingId = extractEntityId(savedBooking, ['booking']);
    if (!bookingId) {
      throw new Error('Booking saved, but signature upload failed.');
    }

    try {
      await uploadBookingSignature.mutateAsync({ id: bookingId, file: signature });
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ['bookings', bookingId] }),
        queryClient.refetchQueries({ queryKey: ['documents', 'booking', bookingId] }),
      ]);
    } catch {
      throw new Error('Booking saved, but signature upload failed.');
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const payload = buildBookingPayload(form, denominationRows);
    const selectedProperty = mode === 'add'
      ? await latestSelectedProperty(payload.propertyId)
      : properties.find((property) => property.id === payload.propertyId);

    if (mode === 'add' && (!selectedProperty || !isBookableProperty(selectedProperty))) {
      toast.error(unavailablePropertyMessage);
      return;
    }

    const canUseApi = payload.propertyId && !payload.propertyId.startsWith('fallback-') && !booking?.id.startsWith('fallback-');

    try {
      if (mode === 'edit' && booking && canUseApi) {
        const updatedBooking = await updateBooking.mutateAsync({ id: booking.id, data: payload });
        await uploadSignatureIfSelected(updatedBooking);
        toast.success(successText);
        onSaved(updatedBooking);
        return;
      }

      if (mode === 'add' && canUseApi) {
        const createdBooking = await createBooking.mutateAsync(payload);
        await uploadSignatureIfSelected(createdBooking);
        toast.success(successText);
        onSaved(createdBooking);
        return;
      }

      const savedBooking = payloadToBooking(payload, booking);
      toast.success(successText);
      onSaved(savedBooking);
    } catch (error) {
      toast.error(mode === 'add' ? bookingSubmitErrorMessage(error) : error instanceof Error ? error.message : 'Failed to save booking. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-[2px]">
      <div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-md bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-stone-200 bg-white px-6 py-4">
          <div>
            <h2 className="text-2xl font-bold text-gold">{modalTitle}</h2>
            <p className="mt-1 text-sm text-gray-600">{modalSubtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-blue-200 p-2 text-gray-700 transition hover:bg-blue-50"
            aria-label="Close booking form"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-7 overflow-y-auto bg-amber-50/30 px-6 py-5">
            <section>
              <SectionTitle>Property Details</SectionTitle>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <Field label="Project Name">
                  <select
                    value={form.propertyId}
                    onChange={(event) => handlePropertyChange(event.target.value)}
                    className={inputClass}
                  >
                    <option value="">Select available project</option>
                    {properties.map((property) => {
                      const status = propertyBookingStatus(property);
                      const isUnavailable = mode === 'add' && !isBookableProperty(property);

                      return (
                      <option key={property.id} value={property.id} disabled={isUnavailable}>
                        {property.projectName}
                        {isUnavailable && status ? ` - ${formatStatusLabel(status)}` : ''}
                      </option>
                      );
                    })}
                  </select>
                </Field>
                <Field label="Plot Number">
                  <input
                    value={form.plotNumber}
                    onChange={(event) => updateForm('plotNumber', event.target.value)}
                    className={inputClass}
                    placeholder="e.g. A-45"
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
                <Field label="Booking Date">
                  <input
                    type="date"
                    value={form.bookingDate}
                    onChange={(event) => updateForm('bookingDate', event.target.value)}
                    className={inputClass}
                    placeholder="dd-mm-yyyy"
                  />
                </Field>
              </div>
            </section>

            <section>
              <SectionTitle>Applicant Details</SectionTitle>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <Field label="Applicant Name" className="md:col-span-2">
                  <input
                    required
                    value={form.applicantName}
                    onChange={(event) => updateForm('applicantName', event.target.value)}
                    className={inputClass}
                    placeholder="Full Name"
                  />
                </Field>
                <Field label="S/o D/o C/o W/o" className="md:col-span-2">
                  <input
                    value={form.relation}
                    onChange={(event) => updateForm('relation', event.target.value)}
                    className={inputClass}
                    placeholder="Relationship Name"
                  />
                </Field>
                <Field label="Full Address" className="md:col-span-4">
                  <textarea
                    value={form.applicantAddress}
                    onChange={(event) => updateForm('applicantAddress', event.target.value)}
                    className={textareaClass}
                    placeholder="Street, City, District"
                  />
                </Field>
                <Field label="PIN Code">
                  <input
                    value={form.pinCode}
                    onChange={(event) => updateForm('pinCode', event.target.value)}
                    className={inputClass}
                    placeholder="600001"
                  />
                </Field>
                <Field label="Cell Number">
                  <input
                    required
                    value={form.cellNumber}
                    onChange={(event) => updateForm('cellNumber', event.target.value)}
                    className={inputClass}
                    placeholder="+91 00000 00000"
                  />
                </Field>
                <Field label="Date of Birth">
                  <input
                    type="date"
                    value={form.dateOfBirth}
                    onChange={(event) => updateForm('dateOfBirth', event.target.value)}
                    className={inputClass}
                    placeholder="dd-mm-yyyy"
                  />
                </Field>
                <Field label="Wedding Day">
                  <input
                    type="date"
                    value={form.weddingDay}
                    onChange={(event) => updateForm('weddingDay', event.target.value)}
                    className={inputClass}
                    placeholder="dd-mm-yyyy"
                  />
                </Field>
              </div>
            </section>

            <section>
              <SectionTitle>Reference Details</SectionTitle>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <Field label="ED/DD/SM/BM Name">
                  <input
                    value={form.edDdSmBmName}
                    onChange={(event) => updateForm('edDdSmBmName', event.target.value)}
                    className={inputClass}
                    placeholder="Referrer Name"
                  />
                </Field>
                <Field label="Code Number">
                  <input
                    value={form.referenceCode}
                    onChange={(event) => updateForm('referenceCode', event.target.value)}
                    className={inputClass}
                    placeholder="STH-000"
                  />
                </Field>
                <Field label="Director Name">
                  <input
                    value={form.directorName}
                    onChange={(event) => updateForm('directorName', event.target.value)}
                    className={inputClass}
                    placeholder="Director Name"
                  />
                </Field>
              </div>
            </section>

            <section>
              <SectionTitle>Payment Details</SectionTitle>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <Field label="Bank Name">
                  <input
                    value={form.bankName}
                    onChange={(event) => updateForm('bankName', event.target.value)}
                    className={inputClass}
                    placeholder="Bank Name"
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
                <Field label="GPay Reference">
                  <input
                    value={form.gpayReference}
                    onChange={(event) => updateForm('gpayReference', event.target.value)}
                    className={inputClass}
                    placeholder="UPI Transaction ID"
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
                <Field label="Total Amount" className="md:col-span-2">
                  <input
                    value={totalAmountForDisplay}
                    onChange={(event) => updateTotalAmount(event.target.value)}
                    className={`${inputClass} border-gold bg-amber-50`}
                    placeholder="₹ 0.00"
                  />
                  <p className="mt-1 text-xs font-semibold text-gray-500">
                    {hasManualTotalAmount
                      ? `Manual total entered. Calculated total is ${formatCurrency(calculatedTotalAmount)}.`
                      : `Auto-calculated from cash and denominations: ${formatCurrency(calculatedTotalAmount)}.`}
                  </p>
                </Field>
              </div>
            </section>

            <section>
              <div className="mb-4 flex items-center justify-between">
                <SectionTitle>Denomination Details</SectionTitle>
                <button
                  type="button"
                  onClick={() => setDenominationRows((current) => [...current, { denomination: 500, count: 0, amount: 0 }])}
                  className="inline-flex items-center gap-2 text-sm font-bold text-gold"
                >
                  <Plus className="h-4 w-4" />
                  Add Row
                </button>
              </div>
              <div className="overflow-hidden border border-stone-200 bg-white">
                <table className="w-full text-sm">
                  <thead className="bg-stone-100 text-left text-gray-700">
                    <tr>
                      <th className="px-4 py-3 font-bold">Denomination Type</th>
                      <th className="px-4 py-3 font-bold">Count</th>
                      <th className="px-4 py-3 font-bold">Amount</th>
                      <th className="w-12 px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {denominationRows.map((row, index) => (
                      <tr key={`${row.denomination}-${index}`} className="border-t border-stone-100">
                        <td className="px-4 py-3">
                          <select
                            value={row.denomination}
                            onChange={(event) => updateDenomination(index, 'denomination', Number(event.target.value))}
                            className="w-full bg-transparent outline-none"
                          >
                            {denominations.map((value) => (
                              <option key={value} value={value}>
                                ₹ {value}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            min="0"
                            value={row.count}
                            onChange={(event) => updateDenomination(index, 'count', Number(event.target.value))}
                            className="w-24 bg-transparent outline-none"
                          />
                        </td>
                        <td className="px-4 py-3 font-semibold text-gray-800">₹ {row.amount.toFixed(2)}</td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => setDenominationRows((current) => current.filter((_, rowIndex) => rowIndex !== index))}
                            className="text-red-400 transition hover:text-red-600"
                            aria-label="Delete denomination row"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 rounded-sm border border-teal-100 bg-teal-50 px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-sm font-extrabold uppercase tracking-wide text-gray-700">Calculated Total Amount</span>
                  <span className="text-2xl font-extrabold text-teal-700">{formatCurrency(calculatedTotalAmount)}</span>
                </div>
              </div>
            </section>

            <section>
              <SectionTitle>Signature Section</SectionTitle>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <Field label="Upload Applicant Signature">
                  <label className="flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-stone-300 bg-amber-50/30 p-6 text-center transition hover:border-gold">
                    <Upload className="h-8 w-8 text-gray-500" />
                    <span className="mt-3 text-sm font-semibold text-gray-700">
                      {signatureFile ? signatureFile.name : 'Upload Applicant Signature'}
                    </span>
                    <span className="mt-1 text-xs text-gray-500">PNG or JPG up to 2MB</span>
                    <input
                      type="file"
                      accept=".png,.jpg,.jpeg"
                      className="sr-only"
                      onChange={handleSignatureInputChange}
                    />
                  </label>
                  {(signaturePreviewUrl || existingSignatureUrl) && (
                    <div className="mt-3 rounded-sm border border-stone-200 bg-white p-3">
                      <div className="flex h-20 items-center justify-center">
                        <img
                          src={signaturePreviewUrl || existingSignatureUrl}
                          alt="Uploaded applicant signature"
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>
                      {signaturePreviewUrl ? (
                        <button
                          type="button"
                          onClick={() => setUploadedSignature(null)}
                          className="mt-3 text-xs font-bold text-red-600 hover:text-red-700"
                        >
                          Remove signature
                        </button>
                      ) : (
                        <p className="mt-3 text-xs font-semibold text-gray-500">Existing applicant signature</p>
                      )}
                    </div>
                  )}
                </Field>
              </div>
            </section>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-stone-200 bg-white px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-sm border border-stone-300 bg-white px-6 py-3 text-sm font-semibold text-gray-700 transition hover:bg-stone-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 rounded-sm bg-teal-700 px-7 py-3 text-sm font-bold text-white transition hover:bg-teal-800 disabled:opacity-60"
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

function BookingDetailsModal({ booking, onClose }: BookingDetailsModalProps) {
  const { data: bookingDetail, isLoading: isBookingDetailLoading } = useBooking(booking.id);
  const currentBooking = bookingDetail ?? booking;
  const payment = currentBooking.payments?.[0];
  const [signatureFailed, setSignatureFailed] = useState(false);
  const directSignatureUrl = resolveFileUrl(getBookingSignaturePath(currentBooking));
  const { data: bookingDocuments = [] } = useDocuments('booking', currentBooking.id);
  const signatureDocument = useMemo(
    () =>
      [...bookingDocuments]
        .reverse()
        .find((document) => document.documentType === 'BOOKING_DOCUMENT') ?? bookingDocuments[bookingDocuments.length - 1],
    [bookingDocuments],
  );
  const { data: signedSignature } = useDocumentUrl(directSignatureUrl ? '' : (signatureDocument?.id ?? ''));
  const documentSignatureUrl = resolveFileUrl(signedSignature?.signedUrl || signatureDocument?.documentUrl);
  const signatureUrl = signatureFailed ? '' : directSignatureUrl || documentSignatureUrl;
  const detailDenominations =
    currentBooking.denominations?.map((row) => ({
      ...row,
      amount: calculateDenominationAmount(row.denomination, row.count),
    })) ?? [];
  const detailDenominationTotal = detailDenominations.reduce((total, row) => total + row.amount, 0);
  const amountReceived = paymentNumber(payment, ['amountReceived', 'receivedAmount', 'amount', 'totalAmount']);
  const totalAmount = paymentNumber(payment, ['totalAmount']);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-[2px]">
      <div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-md border-t-4 border-gold bg-amber-50 shadow-2xl">
        <div className="relative border-b border-amber-100 bg-white px-7 py-6">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-6 top-5 rounded-full p-2 text-gray-700 hover:bg-stone-100"
            aria-label="Close booking details"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="flex flex-wrap items-center gap-3 pr-12">
            <h2 className="text-3xl font-bold text-gold">Booking Details</h2>
            <span className="inline-flex rounded-full bg-teal-50 px-3 py-1 text-xs font-extrabold uppercase text-teal-700 ring-1 ring-teal-100">
              {statusLabels[currentBooking.status]}
            </span>
          </div>
          <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm font-semibold text-gray-600">
            <span>
              Booking ID: <strong className="font-mono text-gray-900">{currentBooking.bookingId}</strong>
            </span>
            <span>
              Created date: <strong className="text-gray-900">{formatDate(currentBooking.createdAt || currentBooking.bookingDate)}</strong>
            </span>
            {isBookingDetailLoading && <span>Loading latest booking details...</span>}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <DetailsCard title="Applicant Details" icon={<User className="h-4 w-4" />}>
              <DetailRow label="Applicant Name" value={currentBooking.applicantName} />
              <DetailRow label="Phone Number" value={currentBooking.cellNumber} />
              <DetailRow label="Relationship" value={currentBooking.relation || '-'} />
              <DetailRow label="Address" value={currentBooking.applicantAddress || '-'} />
              <DetailRow label="PIN Code" value={currentBooking.pinCode || '-'} />
            </DetailsCard>

            <DetailsCard title="Property Details" icon={<Building2 className="h-4 w-4" />}>
              <DetailRow label="Project Name" value={currentBooking.projectName} />
              <DetailRow label="Plot Number" value={currentBooking.plotNumber} />
              <DetailRow
                label="Square Feet"
                value={currentBooking.squareFeet ? `${currentBooking.squareFeet.toLocaleString('en-IN')} SQFT` : '-'}
              />
              <DetailRow label="Booking Date" value={formatDate(currentBooking.bookingDate)} />
              <DetailRow
                label="Status"
                value={
                  <span className="inline-flex items-center gap-2 text-teal-700">
                    <span className="h-2 w-2 rounded-full bg-teal-600" />
                    {statusLabels[currentBooking.status]}
                  </span>
                }
              />
            </DetailsCard>

            <DetailsCard title="Reference Details" icon={<FileText className="h-4 w-4" />}>
              <DetailRow label="ED/DD/SM/BM" value={currentBooking.edDdSmBmName || '-'} />
              <DetailRow label="Code Number" value={currentBooking.referenceCode || '-'} />
              <DetailRow label="Director Name" value={currentBooking.directorName || '-'} />
            </DetailsCard>

            <DetailsCard title="Payment Details" icon={<CreditCard className="h-4 w-4" />}>
              {payment ? (
                <>
                  <DetailRow label="Payment Method" value={formatPaymentMethod(payment.paymentMethod)} />
                  <DetailRow label="Bank Name" value={payment.bankName || '-'} />
                  <DetailRow label="Favour Of" value={payment.favourOf || '-'} />
                  <DetailRow label="Cheque Number" value={payment.chequeNumber || '-'} />
                  <DetailRow label="Cheque Date" value={payment.chequeDate ? formatDate(payment.chequeDate) : '-'} />
                  <DetailRow label="GPay Reference" value={payment.gpayReference || '-'} />
                  <DetailRow label="Cash Amount" value={formatOptionalCurrency(payment.cashAmount)} />
                  <DetailRow label="Amount Received" value={formatOptionalCurrency(amountReceived)} />
                </>
              ) : (
                <p className="text-sm font-semibold text-gray-600">
                  Payment details are not available in this booking response.
                </p>
              )}
              <div className="mt-4 rounded-sm border border-teal-100 bg-teal-50 px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-extrabold uppercase tracking-wide text-gray-700">Total Amount</span>
                  <span className="text-2xl font-extrabold text-teal-700">{formatOptionalCurrency(totalAmount)}</span>
                </div>
              </div>
            </DetailsCard>

            <DetailsCard title="Denomination Details" icon={<CreditCard className="h-4 w-4" />} className="lg:col-span-2">
              <div className="overflow-hidden rounded-sm border border-stone-100">
                <table className="w-full min-w-[520px] text-sm">
                  <thead className="bg-amber-50 text-left text-xs font-extrabold uppercase tracking-wide text-gray-600">
                    <tr>
                      <th className="px-4 py-3">Denomination Type</th>
                      <th className="px-4 py-3">Count</th>
                      <th className="px-4 py-3">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 bg-white">
                    {detailDenominations.length ? (
                      detailDenominations.map((row) => (
                      <tr key={row.id ?? `${row.denomination}-${row.count}`}>
                        <td className="px-4 py-3 font-bold text-gray-900">₹ {row.denomination}</td>
                        <td className="px-4 py-3 font-semibold text-gray-700">{row.count}</td>
                        <td className="px-4 py-3 font-bold text-teal-700">{formatCurrency(row.amount)}</td>
                      </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="px-4 py-4 text-center font-semibold text-gray-600">
                          Denomination details are not available in this booking response.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {detailDenominations.length > 0 && (
                <div className="mt-4 rounded-sm border border-teal-100 bg-teal-50 px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-extrabold uppercase tracking-wide text-gray-700">
                      Total Denomination Amount
                    </span>
                    <span className="text-2xl font-extrabold text-teal-700">{formatCurrency(detailDenominationTotal)}</span>
                  </div>
                </div>
              )}
            </DetailsCard>

            <section className="rounded-md border border-stone-100 bg-white p-5 shadow-sm lg:col-span-2">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="mb-3 flex items-center gap-2">
                    <FileSignature className="h-4 w-4 text-gold" />
                    <h3 className="text-xs font-extrabold uppercase tracking-wide text-gold">Applicant Signature Preview</h3>
                  </div>
                  <p className="text-sm font-semibold text-gray-700">
                    {signatureUrl ? 'Uploaded applicant signature' : 'No applicant signature uploaded'}
                  </p>
                </div>
                <div className="flex h-24 w-full max-w-xs items-center justify-center rounded-sm border border-dashed border-gold/40 bg-amber-50 text-center">
                  {signatureUrl ? (
                    <img
                      src={signatureUrl}
                      alt="Applicant signature"
                      onError={() => setSignatureFailed(true)}
                      className="max-h-20 max-w-full object-contain"
                    />
                  ) : (
                    <div className="px-4 text-sm font-semibold text-gray-500">No applicant signature uploaded</div>
                  )}
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
        </div>
      </div>
    </div>
  );
}

const AdminBookingsPage: React.FC = () => {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const routeProperty = (location.state as { property?: Property } | null)?.property;
  const routePropertyId = searchParams.get('propertyId') || routeProperty?.id || '';
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<BookingStatus | ''>('');
  const [propertyId, setPropertyId] = useState('');
  const [bookingDate, setBookingDate] = useState('');
  const [modalMode, setModalMode] = useState<BookingFormMode | null>(routePropertyId ? 'add' : null);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [viewingBooking, setViewingBooking] = useState<Booking | null>(null);
  const [localBookings, setLocalBookings] = useState<Booking[]>([]);
  const [initialBookingPropertyId, setInitialBookingPropertyId] = useState(routePropertyId);

  const { data, isLoading, refetch } = useBookings({
    page,
    limit: 10,
    search: search || undefined,
    status: status || undefined,
    propertyId: propertyId || undefined,
    startDate: bookingDate || undefined,
    endDate: bookingDate || undefined,
  });
  const { data: bookingInitiatedStats, isLoading: isBookingInitiatedStatsLoading, isError: isBookingInitiatedStatsError } =
    useBookings({ limit: 1, status: 'BOOKING_INITIATED' });
  const { data: tokenReceivedStats, isLoading: isTokenReceivedStatsLoading, isError: isTokenReceivedStatsError } =
    useBookings({ limit: 1, status: 'TOKEN_RECEIVED' });
  const { data: advancePaymentStats, isLoading: isAdvancePaymentStatsLoading, isError: isAdvancePaymentStatsError } =
    useBookings({ limit: 1, status: 'ADVANCE_PAYMENT' });
  const {
    data: registrationPendingStats,
    isLoading: isRegistrationPendingStatsLoading,
    isError: isRegistrationPendingStatsError,
  } = useBookings({ limit: 1, status: 'REGISTRATION_PENDING' });
  const {
    data: finalSettlementPendingStats,
    isLoading: isFinalSettlementPendingStatsLoading,
    isError: isFinalSettlementPendingStatsError,
  } = useBookings({ limit: 1, status: 'FINAL_SETTLEMENT_PENDING' });
  const currentMonthStart = new Date();
  currentMonthStart.setDate(1);
  const currentMonthEnd = new Date(currentMonthStart.getFullYear(), currentMonthStart.getMonth() + 1, 0);
  const {
    data: completedThisMonthStats,
    isLoading: isCompletedThisMonthStatsLoading,
    isError: isCompletedThisMonthStatsError,
  } = useBookings({
    limit: 1,
    status: 'COMPLETED',
    startDate: toLocalDateParam(currentMonthStart),
    endDate: toLocalDateParam(currentMonthEnd),
  });
  const { data: propertiesData } = useProperties({ limit: 200 });
  const properties = useMemo(() => {
    const list = propertiesData?.data?.length ? propertiesData.data : fallbackProperties;
    if (!routeProperty || list.some((property) => property.id === routeProperty.id)) return list;
    return [routeProperty, ...list];
  }, [propertiesData?.data, routeProperty]);
  const apiBookings = useMemo(() => data?.data ?? [], [data?.data]);
  const baseBookings = useMemo(() => (apiBookings.length ? apiBookings : fallbackBookings), [apiBookings]);
  const allBookings = useMemo(() => [...localBookings, ...baseBookings], [localBookings, baseBookings]);
  const filteredBookings = allBookings.filter((booking) => {
    const query = search.trim().toLowerCase();
    if (query && !`${booking.bookingId} ${booking.applicantName}`.toLowerCase().includes(query)) return false;
    if (status && booking.status !== status) return false;
    if (propertyId && booking.propertyId !== propertyId) return false;
    if (bookingDate && toDateInput(booking.bookingDate) !== bookingDate) return false;
    return true;
  });

  const summary = {
    totalActiveBookings:
      (bookingInitiatedStats?.total ?? 0) +
      (tokenReceivedStats?.total ?? 0) +
      (advancePaymentStats?.total ?? 0) +
      (registrationPendingStats?.total ?? 0) +
      (finalSettlementPendingStats?.total ?? 0),
    completedThisMonth: completedThisMonthStats?.total ?? 0,
    pendingRegistration: registrationPendingStats?.total ?? 0,
    advanceReceived: advancePaymentStats?.total ?? 0,
  };
  const isStatsLoading =
    isBookingInitiatedStatsLoading ||
    isTokenReceivedStatsLoading ||
    isAdvancePaymentStatsLoading ||
    isRegistrationPendingStatsLoading ||
    isFinalSettlementPendingStatsLoading ||
    isCompletedThisMonthStatsLoading;
  const hasStatsError =
    isBookingInitiatedStatsError ||
    isTokenReceivedStatsError ||
    isAdvancePaymentStatsError ||
    isRegistrationPendingStatsError ||
    isFinalSettlementPendingStatsError ||
    isCompletedThisMonthStatsError;
  const statValue = (value: number) => (isStatsLoading ? '-' : value);

  const resetFilters = () => {
    setSearch('');
    setStatus('');
    setPropertyId('');
    setBookingDate('');
    setPage(1);
  };

  const handleSaved = (booking: Booking) => {
    setLocalBookings((current) => {
      const existingIndex = current.findIndex((item) => item.id === booking.id);
      if (existingIndex >= 0) {
        const next = [...current];
        next[existingIndex] = booking;
        return next;
      }

      if (modalMode === 'edit' && editingBooking) {
        return [booking, ...current.filter((item) => item.id !== editingBooking.id)];
      }

      return [booking, ...current];
    });
    setModalMode(null);
    setEditingBooking(null);
    setInitialBookingPropertyId('');
    setSearchParams({}, { replace: true });
    void refetch();
  };

  const openEdit = (booking: Booking) => {
    setEditingBooking(booking);
    setInitialBookingPropertyId('');
    setModalMode('edit');
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Book Property</h1>
          <p className="mt-1 text-sm text-gray-600">
            Create and manage property booking records for assigned operational activities.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditingBooking(null);
            setInitialBookingPropertyId('');
            setSearchParams({}, { replace: true });
            setModalMode('add');
          }}
          className="inline-flex items-center justify-center gap-2 rounded-sm bg-gold px-6 py-3 text-sm font-bold text-navy shadow-sm transition hover:bg-gold-light"
        >
          <Plus className="h-4 w-4" />
          Add Booking
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        {[
          { label: 'Total Active Bookings', value: statValue(summary.totalActiveBookings), accent: 'border-l-gold text-gold' },
          { label: 'Completed This Month', value: statValue(summary.completedThisMonth), accent: 'border-l-teal-700 text-teal-700' },
          { label: 'Pending Registration', value: statValue(summary.pendingRegistration), accent: 'border-l-gold text-gold' },
          { label: 'Advance Received', value: statValue(summary.advanceReceived), accent: 'border-l-blue-700 text-blue-700' },
        ].map((card) => (
          <div key={card.label} className={`rounded-md border border-stone-100 border-l-4 bg-stone-100/80 p-5 shadow-sm ${card.accent}`}>
            <p className="text-xs font-bold uppercase tracking-wide text-gray-700">{card.label}</p>
            <p className="mt-2 text-3xl font-bold">{card.value}</p>
          </div>
        ))}
      </div>
      {hasStatsError && (
        <p className="text-sm font-semibold text-red-600">Unable to load some booking statistics. Unavailable counts are shown as 0.</p>
      )}

      <section className="rounded-md border border-stone-100 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1.4fr_0.8fr_1fr_0.8fr_auto]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Search by booking ID, applicant name"
              className="h-11 w-full rounded-sm border border-stone-200 bg-amber-50/50 pl-10 pr-3 text-sm font-semibold outline-none focus:border-gold focus:bg-white"
            />
          </div>
          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as BookingStatus | '');
              setPage(1);
            }}
            className="h-11 rounded-sm border border-stone-200 bg-amber-50/50 px-3 text-sm font-semibold outline-none focus:border-gold"
          >
            <option value="">All Statuses</option>
            {Object.entries(statusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <select
            value={propertyId}
            onChange={(event) => {
              setPropertyId(event.target.value);
              setPage(1);
            }}
            className="h-11 rounded-sm border border-stone-200 bg-amber-50/50 px-3 text-sm font-semibold outline-none focus:border-gold"
          >
            <option value="">Filter by Property / Project</option>
            {properties.map((property) => (
              <option key={property.id} value={property.id}>
                {property.projectName}
              </option>
            ))}
          </select>
          <div className="relative">
            <input
              type="date"
              value={bookingDate}
              onChange={(event) => {
                setBookingDate(event.target.value);
                setPage(1);
              }}
              className="h-11 w-full rounded-sm border border-stone-200 bg-amber-50/50 px-3 pr-10 text-sm font-semibold outline-none focus:border-gold"
              placeholder="dd-mm-yyyy"
            />
            <CalendarDays className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          </div>
          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex h-11 items-center justify-center rounded-sm border border-stone-200 bg-white px-4 text-gold transition hover:bg-amber-50"
            aria-label="Clear filters"
          >
            <FilterX className="h-5 w-5" />
          </button>
        </div>
      </section>

      <section className="overflow-hidden rounded-md border border-stone-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-sm">
            <thead className="bg-amber-50/60 text-left text-xs font-bold uppercase tracking-wide text-gray-700">
              <tr>
                <th className="px-5 py-4">Booking ID</th>
                <th className="px-5 py-4">Applicant Details</th>
                <th className="px-5 py-4">Project / Plot</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Booking Date</th>
                <th className="px-5 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-gray-500">
                    Loading bookings...
                  </td>
                </tr>
              ) : filteredBookings.length ? (
                filteredBookings.map((booking) => (
                  <tr key={booking.id} className="transition hover:bg-amber-50/30">
                    <td className="px-5 py-4 font-mono text-sm font-semibold text-gold">{booking.bookingId}</td>
                    <td className="px-5 py-4">
                      <p className="font-bold text-gray-900">{booking.applicantName}</p>
                      <p className="mt-1 text-xs font-semibold text-gray-600">{booking.cellNumber}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-bold text-gray-900">{booking.projectName}</p>
                      <p className="mt-1 text-xs font-semibold text-gray-600">{booking.plotNumber}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${statusTone(booking.status)}`}>
                        {statusLabels[booking.status]}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-semibold text-gray-700">{formatDate(booking.bookingDate)}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setViewingBooking(booking)}
                          className="rounded-sm p-2 text-gray-700 transition hover:bg-amber-50 hover:text-gold"
                          aria-label="View booking"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openEdit(booking)}
                          className="rounded-sm p-2 text-gray-700 transition hover:bg-amber-50 hover:text-gold"
                          aria-label="Edit booking"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-gray-500">
                    No bookings found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex flex-col gap-3 border-t border-stone-100 bg-amber-50/50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold text-gray-600">Showing 1 to 10 of 42 bookings</p>
          <div className="flex items-center gap-2">
            <button className="rounded-sm border border-stone-200 bg-white px-3 py-2 text-sm text-gray-600">‹</button>
            {[1, 2, 3].map((item) => (
              <button
                key={item}
                className={`rounded-sm border px-3 py-2 text-sm font-bold ${
                  item === 1 ? 'border-gold bg-gold text-white' : 'border-stone-200 bg-white text-gray-700'
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
        <BookingFormModal
          mode={modalMode}
          booking={editingBooking}
          properties={properties}
          initialPropertyId={initialBookingPropertyId}
          onClose={() => {
            setModalMode(null);
            setEditingBooking(null);
            setInitialBookingPropertyId('');
            setSearchParams({}, { replace: true });
          }}
          onSaved={handleSaved}
        />
      )}

      {viewingBooking && (
        <BookingDetailsModal
          booking={viewingBooking}
          onClose={() => setViewingBooking(null)}
        />
      )}
    </div>
  );
};

export default AdminBookingsPage;
