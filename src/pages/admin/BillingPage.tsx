import React, { useState } from 'react';
import { useBillings, useBilling, useCreateBilling, useUpdateBillingStatus } from '../../hooks/useBilling';
import { useBookings } from '../../hooks/useBookings';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Pagination } from '../../components/ui/Pagination';
import { SearchInput } from '../../components/ui/SearchInput';
import { Modal } from '../../components/ui/Modal';
import { billingApi } from '../../api/billing.api';
import type { BillingStatus, PaymentMethod, Billing } from '../../types';

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'CASH', label: 'Cash' },
  { value: 'CHEQUE', label: 'Cheque' },
  { value: 'BANK_TRANSFER', label: 'Bank Transfer / NEFT' },
  { value: 'GPAY', label: 'GPay' },
  { value: 'UPI', label: 'UPI' },
];

const STATUS_LABELS: Record<BillingStatus, string> = {
  PENDING: 'Pending',
  PARTIAL_PAYMENT: 'Partial Payment',
  PAID: 'Paid',
  FINAL_SETTLEMENT: 'Final Settlement',
  COMPLETED: 'Completed',
};

const inputCls =
  'w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold';

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="w-1 h-5 bg-gold rounded-full" />
      <h3 className="text-sm font-semibold text-navy uppercase tracking-wide">{children}</h3>
    </div>
  );
}

function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

function AddBillingModal({ onClose }: { onClose: () => void }) {
  const { data: bookingsData } = useBookings({ limit: 200 });
  const create = useCreateBilling();

  const [bookingId, setBookingId] = useState('');
  const [buyerName, setBuyerName] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [buyerAddress, setBuyerAddress] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const [billingNumber, setBillingNumber] = useState('');
  const [billingDate, setBillingDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [amountInNumbers, setAmountInNumbers] = useState('');
  const [totalReceived, setTotalReceived] = useState('');
  const [operationalNotes, setOperationalNotes] = useState('');
  const [settlementNotes, setSettlementNotes] = useState('');
  const [termsConditions, setTermsConditions] = useState('');
  const [signatureUrl, setSignatureUrl] = useState('');

  const bookings = (bookingsData?.data ?? []).filter(
    (b) => b.status !== 'CANCELLED' && b.status !== 'COMPLETED',
  );

  const amtNum = parseFloat(amountInNumbers) || 0;
  const recNum = parseFloat(totalReceived) || 0;
  const totalBalance = amtNum > 0 ? String(Math.max(0, amtNum - recNum)) : '';

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!bookingId || !buyerName || !buyerPhone || !amountInNumbers || !totalReceived) return;
    create.mutate(
      {
        bookingId,
        buyerName,
        buyerPhone,
        buyerAddress: buyerAddress || undefined,
        orderNumber: orderNumber || undefined,
        billingNumber: billingNumber || undefined,
        billingDate,
        paymentMethod,
        amountInNumbers: Number(amountInNumbers),
        totalReceived: Number(totalReceived),
        totalBalance: totalBalance !== '' ? Number(totalBalance) : undefined,
        operationalNotes: operationalNotes || undefined,
        settlementNotes: settlementNotes || undefined,
        termsConditions: termsConditions || undefined,
        signatureUrl: signatureUrl || undefined,
      },
      { onSuccess: onClose },
    );
  }

  return (
    <Modal open onClose={onClose} title="New Billing Record" size="xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Booking Reference */}
        <div className="bg-gray-50 rounded-xl p-4">
          <SectionTitle>Booking Reference</SectionTitle>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <Field label="Select Booking" required>
                <select
                  value={bookingId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setBookingId(id);
                    const found = bookings.find((x) => x.id === id);
                    if (found) { setBuyerName(found.applicantName); setBuyerPhone(found.cellNumber); }
                  }}
                  required
                  className={inputCls}
                >
                  <option value="">— Select a booking —</option>
                  {bookings.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.bookingId} — {b.applicantName} ({b.projectName} / {b.plotNumber})
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <Field label="Billing Date" required>
              <input type="date" value={billingDate} onChange={(e) => setBillingDate(e.target.value)} required className={inputCls} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <Field label="Order Number">
              <input type="text" value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} placeholder="e.g. ORD-2024-001" className={inputCls} />
            </Field>
            <Field label="Billing Number">
              <input type="text" value={billingNumber} onChange={(e) => setBillingNumber(e.target.value)} placeholder="e.g. BILL-2024-001" className={inputCls} />
            </Field>
          </div>
        </div>

        {/* Buyer Details */}
        <div className="bg-gray-50 rounded-xl p-4">
          <SectionTitle>Buyer Details</SectionTitle>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Buyer Name" required>
              <input type="text" value={buyerName} onChange={(e) => setBuyerName(e.target.value)} required placeholder="Auto-filled from booking" className={inputCls} />
            </Field>
            <Field label="Buyer Phone" required>
              <input
                type="tel" value={buyerPhone}
                onChange={(e) => setBuyerPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                required pattern="[6-9][0-9]{9}" maxLength={10}
                placeholder="10-digit mobile" className={inputCls}
              />
            </Field>
            <Field label="Buyer Address">
              <input type="text" value={buyerAddress} onChange={(e) => setBuyerAddress(e.target.value)} placeholder="Full address" className={inputCls} />
            </Field>
          </div>
        </div>

        {/* Payment Details */}
        <div className="bg-gray-50 rounded-xl p-4">
          <SectionTitle>Payment Details</SectionTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Payment Method" required>
              <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)} className={inputCls}>
                {PAYMENT_METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </Field>
            <Field label="Total Amount (₹)" required>
              <input type="number" value={amountInNumbers} onChange={(e) => setAmountInNumbers(e.target.value)} required min="1" placeholder="0" className={inputCls} />
            </Field>
            <Field label="Total Received (₹)" required>
              <input type="number" value={totalReceived} onChange={(e) => setTotalReceived(e.target.value)} required min="0" placeholder="0" className={inputCls} />
            </Field>
            <Field label="Balance Amount (₹)">
              <input type="number" value={totalBalance} readOnly placeholder="Auto-calculated" className={`${inputCls} bg-gray-100 cursor-not-allowed`} />
            </Field>
          </div>
        </div>

        {/* Notes & Terms */}
        <div className="bg-gray-50 rounded-xl p-4">
          <SectionTitle>Notes &amp; Terms</SectionTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Operational Notes">
              <textarea value={operationalNotes} onChange={(e) => setOperationalNotes(e.target.value)} rows={3} placeholder="Internal operational notes..." className={`${inputCls} resize-none`} />
            </Field>
            <Field label="Settlement Notes">
              <textarea value={settlementNotes} onChange={(e) => setSettlementNotes(e.target.value)} rows={3} placeholder="Settlement remarks..." className={`${inputCls} resize-none`} />
            </Field>
            <div className="md:col-span-2">
              <Field label="Terms & Conditions">
                <textarea value={termsConditions} onChange={(e) => setTermsConditions(e.target.value)} rows={2} placeholder="e.g. Payment is non-refundable." className={`${inputCls} resize-none`} />
              </Field>
            </div>
            <div className="md:col-span-2">
              <Field label="Signature URL">
                <input type="url" value={signatureUrl} onChange={(e) => setSignatureUrl(e.target.value)} placeholder="https://..." className={inputCls} />
              </Field>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2 border-t border-gray-200">
          <button type="button" onClick={onClose} className="px-5 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 font-medium">
            Cancel
          </button>
          <button type="submit" disabled={create.isPending} className="px-5 py-2 bg-gold text-navy text-sm font-semibold rounded-lg hover:bg-gold/90 disabled:opacity-50">
            {create.isPending ? 'Saving...' : 'Create Billing'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function BillingDetailModal({ billing, onClose }: { billing: Billing; onClose: () => void }) {
  const { data: detail } = useBilling(billing.id);
  const updateStatus = useUpdateBillingStatus();
  const b = detail ?? billing;
  const [dlPdf, setDlPdf] = useState(false);
  const [dlEst, setDlEst] = useState(false);

  async function handlePdf() {
    setDlPdf(true);
    try { await billingApi.downloadPdf(b.id); } finally { setDlPdf(false); }
  }

  async function handleEstimate() {
    setDlEst(true);
    try { await billingApi.downloadEstimate(b.id); } finally { setDlEst(false); }
  }

  const nextStatuses: BillingStatus[] =
    b.status === 'PENDING' ? ['PARTIAL_PAYMENT', 'PAID'] :
    b.status === 'PARTIAL_PAYMENT' ? ['PAID', 'FINAL_SETTLEMENT'] :
    b.status === 'PAID' ? ['FINAL_SETTLEMENT', 'COMPLETED'] :
    b.status === 'FINAL_SETTLEMENT' ? ['COMPLETED'] : [];

  return (
    <Modal open onClose={onClose} title="Billing Details" size="xl">
      <div className="space-y-6">
        <div className="flex items-center justify-between bg-navy/5 rounded-xl p-4">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-0.5">Billing ID</p>
            <p className="text-lg font-bold text-navy font-mono">{b.billingId}</p>
          </div>
          <StatusBadge status={b.status} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            {[
              ['Buyer Name', b.buyerName],
              ['Buyer Phone', b.buyerPhone],
              ['Payment Method', b.paymentMethod],
              ['Billing Date', new Date(b.billingDate).toLocaleDateString('en-IN')],
              ['Amount in Words', b.amountInWords],
            ].map(([label, val]) => val ? (
              <div key={label as string}>
                <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">{label}</p>
                <p className="text-sm text-gray-900 mt-0.5 font-medium">{val}</p>
              </div>
            ) : null)}
          </div>

          <div className="space-y-4">
            <div className="bg-navy/5 border border-navy/10 rounded-xl p-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 font-medium">Total Amount</span>
                <span className="font-bold text-gray-900">₹{b.amountInNumbers.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Received</span>
                <span className="font-bold text-green-700">₹{b.totalReceived.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-sm border-t border-navy/10 pt-3">
                <span className="font-semibold text-gray-700">Balance</span>
                <span className={`font-bold ${b.totalBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  ₹{b.totalBalance.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {nextStatuses.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Update Status</p>
                <div className="flex gap-2 flex-wrap">
                  {nextStatuses.map((s) => (
                    <button
                      key={s}
                      onClick={() => updateStatus.mutate({ id: b.id, status: s }, { onSuccess: onClose })}
                      disabled={updateStatus.isPending}
                      className="px-3 py-1.5 text-xs bg-navy text-white rounded-lg hover:bg-navy/90 disabled:opacity-50 font-medium"
                    >
                      {STATUS_LABELS[s]}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <button onClick={handlePdf} disabled={dlPdf} className="flex-1 px-3 py-2 bg-gold text-navy text-sm font-semibold rounded-lg hover:bg-gold/90 disabled:opacity-50">
                {dlPdf ? '...' : 'Receipt PDF'}
              </button>
              <button onClick={handleEstimate} disabled={dlEst} className="flex-1 px-3 py-2 bg-navy text-white text-sm font-medium rounded-lg hover:bg-navy/90 disabled:opacity-50">
                {dlEst ? '...' : 'Estimate PDF'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

const AdminBillingPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<BillingStatus | ''>('');
  const [selected, setSelected] = useState<Billing | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const { data, isLoading } = useBillings({
    page, limit: 20,
    search: search || undefined,
    status: status || undefined,
  });

  const billings = data?.data ?? [];
  const totalAmt = billings.reduce((s, b) => s + b.amountInNumbers, 0);
  const totalReceived = billings.reduce((s, b) => s + b.totalReceived, 0);
  const totalBalance = billings.reduce((s, b) => s + b.totalBalance, 0);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-navy">Billing</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage billing records for your branch</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="px-4 py-2 bg-gold text-navy text-sm font-semibold rounded-lg hover:bg-gold/90">
          + New Billing
        </button>
      </div>

      {!isLoading && billings.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Total Amount', value: totalAmt, color: 'text-navy' },
            { label: 'Total Received', value: totalReceived, color: 'text-green-700' },
            { label: 'Total Balance', value: totalBalance, color: 'text-red-600' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">{label}</p>
              <p className={`text-xl font-bold ${color}`}>₹{value.toLocaleString('en-IN')}</p>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-4 border-b border-gray-200 flex flex-wrap gap-3">
          <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search by buyer name..." className="w-64" />
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value as BillingStatus | ''); setPage(1); }}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold/40"
          >
            <option value="">All Statuses</option>
            {Object.entries(STATUS_LABELS).map(([val, lbl]) => (
              <option key={val} value={val}>{lbl}</option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Billing ID</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Buyer</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Method</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Amount</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Received</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Balance</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">Loading...</td></tr>
              ) : !billings.length ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">No billing records found</td></tr>
              ) : (
                billings.map((b) => (
                  <tr key={b.id} className="hover:bg-gold/5 cursor-pointer transition-colors" onClick={() => setSelected(b)}>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{b.billingId}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{b.buyerName}</td>
                    <td className="px-4 py-3 text-gray-600">{b.paymentMethod}</td>
                    <td className="px-4 py-3 font-medium text-gray-900 text-right">₹{b.amountInNumbers.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 text-green-700 font-medium text-right">₹{b.totalReceived.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 font-medium text-right" style={{ color: b.totalBalance > 0 ? '#dc2626' : '#16a34a' }}>
                      ₹{b.totalBalance.toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={b.status} /></td>
                    <td className="px-4 py-3 text-gray-500">{new Date(b.billingDate).toLocaleDateString('en-IN')}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {data && <Pagination page={page} total={data.total} limit={data.limit} onPageChange={setPage} />}
      </div>

      {showAdd && <AddBillingModal onClose={() => setShowAdd(false)} />}
      {selected && <BillingDetailModal billing={selected} onClose={() => setSelected(null)} />}
    </div>
  );
};

export default AdminBillingPage;
