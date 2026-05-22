import React, { useState } from 'react';
import { useBookings, useBooking, useUpdateBookingStatus, useCreateBooking } from '../../hooks/useBookings';
import { useProperties } from '../../hooks/useProperties';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Pagination } from '../../components/ui/Pagination';
import { SearchInput } from '../../components/ui/SearchInput';
import { Modal } from '../../components/ui/Modal';
import { bookingsApi } from '../../api/bookings.api';
import { documentsApi } from '../../api/documents.api';
import type { BookingStatus, Booking, Property } from '../../types';
import type { CreateBookingData, BookingPaymentData, BookingDenominationData } from '../../api/bookings.api';

const inputCls = 'w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500';
const labelCls = 'block text-xs font-medium text-gray-600 mb-1';

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex items-center gap-2 mb-4">
    <div className="w-1 h-5 bg-gold rounded-full" />
    <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wide">{children}</h3>
  </div>
);

const DENOMINATIONS = [100, 200, 500, 2000];
const PAYMENT_METHODS = ['CASH', 'CHEQUE', 'BANK_TRANSFER', 'GPAY', 'UPI'];

function CreateBookingModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const create = useCreateBooking();
  const { data: propertiesData } = useProperties({ limit: 200, workflowStatus: 'AVAILABLE' });
  const properties: Property[] = propertiesData?.data ?? [];

  const [form, setForm] = useState<CreateBookingData>({
    propertyId: '',
    applicantName: '',
    cellNumber: '',
    projectName: '',
    plotNumber: '',
    bookingDate: new Date().toISOString().split('T')[0],
  });

  const [payment, setPayment] = useState<BookingPaymentData>({
    bankName: '',
    favourOf: 'Sri Thangam Housing',
    chequeNumber: '',
    chequeDate: '',
    gpayReference: '',
    cashAmount: 0,
    totalAmount: 0,
    paymentMethod: 'CASH',
  });

  const [denominations, setDenominations] = useState<BookingDenominationData[]>([
    { denomination: 2000, count: 0, amount: 0 },
  ]);

  const [signatureFile, setSignatureFile] = useState<File | null>(null);

  function handlePropertyChange(propertyId: string) {
    const prop = properties.find((p) => p.id === propertyId);
    setForm((f) => ({
      ...f,
      propertyId,
      projectName: prop?.projectName ?? f.projectName,
      plotNumber: prop?.plotNumber ?? f.plotNumber,
      squareFeet: prop?.squareFeet ?? f.squareFeet,
    }));
  }

  function updateDenomination(idx: number, field: keyof BookingDenominationData, value: number) {
    setDenominations((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      if (field === 'denomination' || field === 'count') {
        next[idx].amount = next[idx].denomination * next[idx].count;
      }
      return next;
    });
  }

  function addDenomRow() {
    setDenominations((prev) => [...prev, { denomination: 500, count: 0, amount: 0 }]);
  }

  function removeDenomRow(idx: number) {
    setDenominations((prev) => prev.filter((_, i) => i !== idx));
  }

  const denomTotal = denominations.reduce((s, d) => s + d.amount, 0);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validDenoms = denominations.filter((d) => d.count > 0);
    const hasPayment = payment.totalAmount > 0;
    create.mutate(
      {
        ...form,
        payments: hasPayment ? [payment] : undefined,
        denominations: validDenoms.length > 0 ? validDenoms : undefined,
      },
      {
        onSuccess: async (booking) => {
          if (signatureFile) {
            try {
              const doc = await documentsApi.upload('booking', booking.id, 'BOOKING_DOCUMENT', signatureFile);
              await bookingsApi.update(booking.id, { signatureUrl: doc.documentUrl });
            } catch {
              // non-critical
            }
          }
          onClose();
          setForm({ propertyId: '', applicantName: '', cellNumber: '', projectName: '', plotNumber: '', bookingDate: new Date().toISOString().split('T')[0] });
          setPayment({ bankName: '', favourOf: 'Sri Thangam Housing', chequeNumber: '', chequeDate: '', gpayReference: '', cashAmount: 0, totalAmount: 0, paymentMethod: 'CASH' });
          setDenominations([{ denomination: 2000, count: 0, amount: 0 }]);
          setSignatureFile(null);
        },
      },
    );
  }

  return (
    <Modal open={open} onClose={onClose} title="Add Property Booking" size="2xl">
      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Property Details */}
        <div>
          <SectionTitle>Property Details</SectionTitle>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="col-span-2">
              <label className={labelCls}>Project Name *</label>
              <select required value={form.propertyId} onChange={(e) => handlePropertyChange(e.target.value)} className={inputCls}>
                <option value="">Select Project</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>{p.projectName} — Plot {p.plotNumber}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Plot Number</label>
              <input className={inputCls} value={form.plotNumber} onChange={(e) => setForm((f) => ({ ...f, plotNumber: e.target.value }))} placeholder="e.g. A-102" required />
            </div>
            <div>
              <label className={labelCls}>Square Feet</label>
              <input className={inputCls} type="number" value={form.squareFeet ?? ''} onChange={(e) => setForm((f) => ({ ...f, squareFeet: e.target.value ? Number(e.target.value) : undefined }))} placeholder="Total Area" />
            </div>
            <div>
              <label className={labelCls}>Booking Date *</label>
              <input className={inputCls} type="date" required value={form.bookingDate} onChange={(e) => setForm((f) => ({ ...f, bookingDate: e.target.value }))} />
            </div>
          </div>
        </div>

        {/* Applicant Details */}
        <div>
          <SectionTitle>Applicant Details</SectionTitle>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="col-span-2">
              <label className={labelCls}>Applicant Name *</label>
              <input className={inputCls} required value={form.applicantName} onChange={(e) => setForm((f) => ({ ...f, applicantName: e.target.value }))} placeholder="Full Legal Name" />
            </div>
            <div className="col-span-2">
              <label className={labelCls}>S/O D/O C/O W/O</label>
              <input className={inputCls} value={form.relation ?? ''} onChange={(e) => setForm((f) => ({ ...f, relation: e.target.value }))} placeholder="Relationship Details" />
            </div>
            <div className="col-span-4">
              <label className={labelCls}>Address</label>
              <input className={inputCls} value={form.applicantAddress ?? ''} onChange={(e) => setForm((f) => ({ ...f, applicantAddress: e.target.value }))} placeholder="Full Residential Address" />
            </div>
            <div>
              <label className={labelCls}>PIN Code</label>
              <input className={inputCls} value={form.pinCode ?? ''} onChange={(e) => setForm((f) => ({ ...f, pinCode: e.target.value }))} placeholder="600001" maxLength={6} />
            </div>
            <div>
              <label className={labelCls}>Cell Number *</label>
              <input
                className={inputCls}
                type="tel"
                required
                pattern="[6-9][0-9]{9}"
                maxLength={10}
                value={form.cellNumber}
                onChange={(e) => setForm((f) => ({ ...f, cellNumber: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                placeholder="+91 XXXXX XXXXX"
              />
            </div>
            <div>
              <label className={labelCls}>Date of Birth</label>
              <input className={inputCls} type="date" value={form.dateOfBirth ?? ''} onChange={(e) => setForm((f) => ({ ...f, dateOfBirth: e.target.value }))} />
            </div>
            <div>
              <label className={labelCls}>Wedding Day</label>
              <input className={inputCls} type="date" value={form.weddingDay ?? ''} onChange={(e) => setForm((f) => ({ ...f, weddingDay: e.target.value }))} />
            </div>
          </div>
        </div>

        {/* Reference Details */}
        <div>
          <SectionTitle>Reference Details</SectionTitle>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className={labelCls}>ED / DD / SM / BM Name</label>
              <input className={inputCls} value={form.edDdSmBmName ?? ''} onChange={(e) => setForm((f) => ({ ...f, edDdSmBmName: e.target.value }))} placeholder="Manager Name" />
            </div>
            <div>
              <label className={labelCls}>Code Number</label>
              <input className={inputCls} value={form.referenceCode ?? ''} onChange={(e) => setForm((f) => ({ ...f, referenceCode: e.target.value }))} placeholder="System ID" />
            </div>
            <div>
              <label className={labelCls}>Director Name</label>
              <input className={inputCls} value={form.directorName ?? ''} onChange={(e) => setForm((f) => ({ ...f, directorName: e.target.value }))} placeholder="Assigned Director" />
            </div>
          </div>
        </div>

        {/* Payment Details */}
        <div>
          <SectionTitle>Payment Details</SectionTitle>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className={labelCls}>Payment Method *</label>
              <select className={inputCls} value={payment.paymentMethod} onChange={(e) => setPayment((p) => ({ ...p, paymentMethod: e.target.value }))}>
                {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m.replace('_', ' ')}</option>)}
              </select>
            </div>

            {/* Bank name — required for CHEQUE and BANK_TRANSFER */}
            {(payment.paymentMethod === 'CHEQUE' || payment.paymentMethod === 'BANK_TRANSFER') && (
              <div>
                <label className={labelCls}>Bank Name *</label>
                <input
                  className={inputCls}
                  required
                  value={payment.bankName ?? ''}
                  onChange={(e) => setPayment((p) => ({ ...p, bankName: e.target.value }))}
                  placeholder="e.g. State Bank of India"
                />
              </div>
            )}

            {/* Favour Of — CHEQUE / BANK_TRANSFER */}
            {(payment.paymentMethod === 'CHEQUE' || payment.paymentMethod === 'BANK_TRANSFER') && (
              <div>
                <label className={labelCls}>Favour Of</label>
                <input className={inputCls} value={payment.favourOf ?? ''} onChange={(e) => setPayment((p) => ({ ...p, favourOf: e.target.value }))} />
              </div>
            )}

            {/* Cheque fields — required for CHEQUE */}
            {payment.paymentMethod === 'CHEQUE' && (
              <>
                <div>
                  <label className={labelCls}>Cheque Number *</label>
                  <input
                    className={inputCls}
                    required
                    pattern="[0-9]{6}"
                    maxLength={6}
                    value={payment.chequeNumber ?? ''}
                    onChange={(e) => setPayment((p) => ({ ...p, chequeNumber: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
                    placeholder="6-digit number"
                  />
                </div>
                <div>
                  <label className={labelCls}>Cheque Date *</label>
                  <input
                    className={inputCls}
                    type="date"
                    required
                    value={payment.chequeDate ?? ''}
                    onChange={(e) => setPayment((p) => ({ ...p, chequeDate: e.target.value }))}
                  />
                </div>
              </>
            )}

            {/* GPay / UPI reference — required for GPAY and UPI */}
            {(payment.paymentMethod === 'GPAY' || payment.paymentMethod === 'UPI') && (
              <div>
                <label className={labelCls}>Transaction Reference *</label>
                <input
                  className={inputCls}
                  required
                  value={payment.gpayReference ?? ''}
                  onChange={(e) => setPayment((p) => ({ ...p, gpayReference: e.target.value }))}
                  placeholder="UPI / GPay Transaction ID"
                />
              </div>
            )}

            {/* Cash amount — CASH only */}
            {payment.paymentMethod === 'CASH' && (
              <div>
                <label className={labelCls}>Cash Amount (₹) *</label>
                <input
                  className={inputCls}
                  type="number"
                  min="1"
                  required
                  value={payment.cashAmount ?? 0}
                  onChange={(e) => setPayment((p) => ({ ...p, cashAmount: Number(e.target.value) }))}
                />
              </div>
            )}

            <div>
              <label className={labelCls}>Total Amount (₹) *</label>
              <input
                className={`${inputCls} bg-yellow-50 font-semibold`}
                type="number"
                min="1"
                required
                value={payment.totalAmount}
                onChange={(e) => setPayment((p) => ({ ...p, totalAmount: Number(e.target.value) }))}
              />
            </div>
          </div>
        </div>

        {/* Denomination Details */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-1 h-5 bg-gold rounded-full" />
              <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wide">Denomination Details</h3>
            </div>
            <button type="button" onClick={addDenomRow} className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
              <span>+</span> Add Row
            </button>
          </div>
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-2 font-medium text-gray-600">Denomination Type</th>
                  <th className="text-left px-4 py-2 font-medium text-gray-600">Count</th>
                  <th className="text-left px-4 py-2 font-medium text-gray-600">Amount (₹)</th>
                  <th className="px-2 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {denominations.map((d, idx) => (
                  <tr key={idx}>
                    <td className="px-4 py-2">
                      <select
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                        value={d.denomination}
                        onChange={(e) => updateDenomination(idx, 'denomination', Number(e.target.value))}
                      >
                        {DENOMINATIONS.map((v) => <option key={v} value={v}>₹{v}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number" min="0"
                        className="w-24 px-2 py-1 text-sm border border-gray-300 rounded"
                        value={d.count}
                        onChange={(e) => updateDenomination(idx, 'count', Number(e.target.value))}
                      />
                    </td>
                    <td className="px-4 py-2 font-medium text-gray-700">₹{d.amount.toLocaleString('en-IN')}</td>
                    <td className="px-2 py-2">
                      {denominations.length > 1 && (
                        <button type="button" onClick={() => removeDenomRow(idx)} className="text-red-400 hover:text-red-600 text-xs">✕</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              {denomTotal > 0 && (
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan={2} className="px-4 py-2 text-sm font-semibold text-gray-700">Total</td>
                    <td className="px-4 py-2 text-sm font-bold text-gray-900">₹{denomTotal.toLocaleString('en-IN')}</td>
                    <td />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

        {/* Signature */}
        <div>
          <SectionTitle>Applicant Signature</SectionTitle>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Upload Signature Image</label>
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 cursor-pointer hover:border-blue-400 transition-colors bg-gray-50">
                <svg className="w-6 h-6 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <span className="text-xs text-gray-500">{signatureFile ? signatureFile.name : 'Drag & drop or browse'}</span>
                <span className="text-xs text-gray-400 mt-0.5">PNG, JPG up to 2MB</span>
                <input type="file" accept=".png,.jpg,.jpeg" className="hidden" onChange={(e) => setSignatureFile(e.target.files?.[0] ?? null)} />
              </label>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex items-center justify-center">
              <p className="text-xs text-gray-400 text-center">Digital signature pad<br />(optional — upload above)</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
          <button type="button" onClick={onClose} className="px-5 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
            Cancel
          </button>
          <button
            type="submit"
            disabled={create.isPending}
            className="px-5 py-2 text-sm bg-gold text-navy font-semibold rounded-lg hover:opacity-90 disabled:opacity-50"
          >
            {create.isPending ? 'Saving...' : 'Save Booking'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

const NEXT_STATUS: Partial<Record<BookingStatus, BookingStatus>> = {
  BOOKING_INITIATED: 'TOKEN_RECEIVED',
  TOKEN_RECEIVED: 'ADVANCE_PAYMENT',
  ADVANCE_PAYMENT: 'REGISTRATION_PENDING',
  REGISTRATION_PENDING: 'FINAL_SETTLEMENT_PENDING',
  FINAL_SETTLEMENT_PENDING: 'COMPLETED',
};

const STATUS_LABELS: Record<BookingStatus, string> = {
  BOOKING_INITIATED: 'Booking Initiated',
  TOKEN_RECEIVED: 'Token Received',
  ADVANCE_PAYMENT: 'Advance Payment',
  REGISTRATION_PENDING: 'Registration Pending',
  FINAL_SETTLEMENT_PENDING: 'Final Settlement Pending',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

function BookingDetailModal({ booking, onClose }: { booking: Booking; onClose: () => void }) {
  const { data: detail } = useBooking(booking.id);
  const updateStatus = useUpdateBookingStatus();
  const b = detail ?? booking;
  const [downloading, setDownloading] = useState(false);

  const nextStatus = NEXT_STATUS[b.status];

  async function handleDownload() {
    setDownloading(true);
    try { await bookingsApi.downloadPdf(b.id); } finally { setDownloading(false); }
  }

  return (
    <Modal open onClose={onClose} title="Booking Details" size="xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3">
          {[
            ['Booking ID', b.bookingId],
            ['Applicant Name', b.applicantName],
            ['Cell Number', b.cellNumber],
            ['Project Name', b.projectName],
            ['Plot Number', b.plotNumber],
            ['Booking Date', new Date(b.bookingDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })],
          ].map(([label, val]) => (
            <div key={label as string}>
              <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">{label}</p>
              <p className="text-sm text-gray-900 mt-0.5 font-medium">{val}</p>
            </div>
          ))}
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Status</p>
            <div className="mt-1"><StatusBadge status={b.status} /></div>
          </div>
        </div>
        <div className="space-y-4">
          {nextStatus && (
            <div className="bg-amber-50 border border-amber-100 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-700 mb-3">Advance to Next Stage</p>
              <button
                onClick={() => updateStatus.mutate({ id: b.id, status: nextStatus }, { onSuccess: onClose })}
                disabled={updateStatus.isPending}
                className="w-full px-4 py-2 bg-gold text-navy text-sm font-semibold rounded-lg hover:opacity-90 disabled:opacity-50"
              >
                {updateStatus.isPending ? 'Updating...' : `Move to ${STATUS_LABELS[nextStatus]}`}
              </button>
            </div>
          )}
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="w-full px-4 py-2 bg-gray-700 text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50"
          >
            {downloading ? 'Downloading...' : 'Download PDF'}
          </button>
          {b.property && (
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-2">Property</p>
              <div className="bg-gray-50 rounded-lg p-3 space-y-1 text-sm">
                <p><span className="text-gray-500">Name:</span> {b.property.propertyName}</p>
                <p><span className="text-gray-500">Type:</span> {b.property.propertyType}</p>
                {b.property.squareFeet && <p><span className="text-gray-500">Area:</span> {b.property.squareFeet} sq.ft</p>}
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

const AdminBookingsPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<BookingStatus | ''>('');
  const [selected, setSelected] = useState<Booking | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const { data, isLoading } = useBookings({
    page,
    limit: 20,
    search: search || undefined,
    status: status || undefined,
  });


  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Book Property</h1>
          <p className="text-sm text-gray-500 mt-0.5">Create and manage property booking records</p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="px-4 py-2.5 bg-gold text-navy text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Booking
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-4 border-b border-gray-200 flex flex-wrap gap-3">
          <SearchInput
            value={search}
            onChange={(v) => { setSearch(v); setPage(1); }}
            placeholder="Search by booking ID, applicant name..."
            className="w-72"
          />
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value as BookingStatus | ''); setPage(1); }}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Statuses</option>
            {Object.entries(STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Booking ID</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Applicant Details</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Project / Plot</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Booking Date</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Loading...</td></tr>
              ) : !data?.data?.length ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No bookings found</td></tr>
              ) : (
                data.data.map((b) => (
                  <tr key={b.id} className="hover:bg-amber-50/30 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{b.bookingId}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{b.applicantName}</p>
                      <p className="text-xs text-gray-500">{b.cellNumber}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800">{b.projectName}</p>
                      <p className="text-xs text-gray-500">Plot {b.plotNumber}</p>
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={b.status} /></td>
                    <td className="px-4 py-3 text-gray-500">{new Date(b.bookingDate).toLocaleDateString('en-IN')}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setSelected(b)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                        title="View Details"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Summary Stats */}
        {data && data.total > 0 && (
          <div className="grid grid-cols-4 divide-x divide-gray-100 border-t border-gray-100">
            {[
              { label: 'Total Active Bookings', value: data.total },
              { label: 'Completed This Month', value: data.data?.filter((b) => b.status === 'COMPLETED').length ?? 0 },
              { label: 'Pending Registration', value: data.data?.filter((b) => b.status === 'REGISTRATION_PENDING').length ?? 0 },
              { label: 'Advance Received', value: data.data?.filter((b) => b.status === 'ADVANCE_PAYMENT').length ?? 0 },
            ].map(({ label, value }) => (
              <div key={label} className="p-4 text-center">
                <p className="text-xs text-gray-500 mb-1">{label}</p>
                <p className="text-xl font-bold text-gray-900">{value}</p>
              </div>
            ))}
          </div>
        )}

        {data && <Pagination page={page} total={data.total} limit={data.limit} onPageChange={setPage} />}
      </div>

      <CreateBookingModal open={createOpen} onClose={() => setCreateOpen(false)} />
      {selected && <BookingDetailModal booking={selected} onClose={() => setSelected(null)} />}
    </div>
  );
};

export default AdminBookingsPage;
