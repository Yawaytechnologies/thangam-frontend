import React, { useState } from 'react';
import { useBillings, useBilling, useCreateBilling, useUpdateBillingStatus } from '../../hooks/useBilling';
import { useBookings } from '../../hooks/useBookings';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Pagination } from '../../components/ui/Pagination';
import { SearchInput } from '../../components/ui/SearchInput';
import { Modal } from '../../components/ui/Modal';
import { billingApi } from '../../api/billing.api';
import type { BillingStatus, PaymentMethod, Billing } from '../../types';

const PAYMENT_METHODS: PaymentMethod[] = ['CASH', 'CHEQUE', 'BANK_TRANSFER', 'GPAY', 'UPI'];

function AddBillingModal({ onClose }: { onClose: () => void }) {
  const { data: bookingsData } = useBookings({ limit: 100 });
  const create = useCreateBilling();
  const [form, setForm] = useState({
    bookingId: '',
    buyerName: '',
    buyerPhone: '',
    paymentMethod: 'CASH' as PaymentMethod,
    amountInNumbers: '',
    amountInWords: '',
    billingDate: new Date().toISOString().split('T')[0],
  });

  const bookings = bookingsData?.data ?? [];

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.bookingId || !form.buyerName || !form.buyerPhone || !form.amountInNumbers) return;
    create.mutate(
      {
        bookingId: form.bookingId,
        buyerName: form.buyerName,
        buyerPhone: form.buyerPhone,
        paymentMethod: form.paymentMethod,
        amountInNumbers: Number(form.amountInNumbers),
        amountInWords: form.amountInWords,
        billingDate: form.billingDate,
      },
      { onSuccess: onClose },
    );
  }

  return (
    <Modal open onClose={onClose} title="New Billing Record" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Booking</label>
          <select
            value={form.bookingId}
            onChange={(e) => setForm((f) => ({ ...f, bookingId: e.target.value }))}
            required
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select a booking</option>
            {bookings.map((b) => (
              <option key={b.id} value={b.id}>{b.bookingId} — {b.applicantName}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Buyer Name</label>
            <input
              type="text"
              value={form.buyerName}
              onChange={(e) => setForm((f) => ({ ...f, buyerName: e.target.value }))}
              required
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Buyer Phone</label>
            <input
              type="tel"
              value={form.buyerPhone}
              onChange={(e) => setForm((f) => ({ ...f, buyerPhone: e.target.value }))}
              required
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
            <select
              value={form.paymentMethod}
              onChange={(e) => setForm((f) => ({ ...f, paymentMethod: e.target.value as PaymentMethod }))}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Billing Date</label>
            <input
              type="date"
              value={form.billingDate}
              onChange={(e) => setForm((f) => ({ ...f, billingDate: e.target.value }))}
              required
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹)</label>
            <input
              type="number"
              value={form.amountInNumbers}
              onChange={(e) => setForm((f) => ({ ...f, amountInNumbers: e.target.value }))}
              required
              min="1"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount in Words</label>
            <input
              type="text"
              value={form.amountInWords}
              onChange={(e) => setForm((f) => ({ ...f, amountInWords: e.target.value }))}
              placeholder="e.g. Five Lakh Rupees"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
            Cancel
          </button>
          <button
            type="submit"
            disabled={create.isPending}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
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

  const nextStatuses: BillingStatus[] = b.status === 'PENDING' ? ['PARTIAL_PAYMENT', 'PAID'] :
    b.status === 'PARTIAL_PAYMENT' ? ['PAID', 'FINAL_SETTLEMENT'] :
    b.status === 'PAID' ? ['FINAL_SETTLEMENT', 'COMPLETED'] :
    b.status === 'FINAL_SETTLEMENT' ? ['COMPLETED'] : [];

  return (
    <Modal open onClose={onClose} title="Billing Details" size="xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          {[
            ['Billing ID', b.billingId],
            ['Buyer Name', b.buyerName],
            ['Buyer Phone', b.buyerPhone],
            ['Payment Method', b.paymentMethod],
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
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Amount</span>
              <span className="font-bold text-gray-900">₹{b.amountInNumbers.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Total Received</span>
              <span className="font-bold text-green-700">₹{b.totalReceived.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-sm border-t border-blue-200 pt-2">
              <span className="font-medium text-gray-700">Balance</span>
              <span className={`font-bold ${b.totalBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                ₹{b.totalBalance.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
          {nextStatuses.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Update Status</p>
              <div className="flex gap-2 flex-wrap">
                {nextStatuses.map((s) => (
                  <button
                    key={s}
                    onClick={() => updateStatus.mutate({ id: b.id, status: s }, { onSuccess: onClose })}
                    disabled={updateStatus.isPending}
                    className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {s.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="flex gap-2">
            <button onClick={handlePdf} disabled={dlPdf} className="flex-1 px-3 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-50">
              {dlPdf ? '...' : 'Receipt PDF'}
            </button>
            <button onClick={handleEstimate} disabled={dlEst} className="flex-1 px-3 py-2 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700 disabled:opacity-50">
              {dlEst ? '...' : 'Estimate PDF'}
            </button>
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
    page,
    limit: 20,
    search: search || undefined,
    status: status || undefined,
  });

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Billing</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage branch billing records</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
        >
          + New Billing
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-4 border-b border-gray-200 flex flex-wrap gap-3">
          <SearchInput
            value={search}
            onChange={(v) => { setSearch(v); setPage(1); }}
            placeholder="Search by buyer name..."
            className="w-64"
          />
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value as BillingStatus | ''); setPage(1); }}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="PARTIAL_PAYMENT">Partial Payment</option>
            <option value="PAID">Paid</option>
            <option value="FINAL_SETTLEMENT">Final Settlement</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Billing ID</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Buyer</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Method</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Amount</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Balance</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">Loading...</td></tr>
              ) : !data?.data?.length ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No billing records found</td></tr>
              ) : (
                data.data.map((b) => (
                  <tr
                    key={b.id}
                    className="hover:bg-blue-50 cursor-pointer transition-colors"
                    onClick={() => setSelected(b)}
                  >
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{b.billingId}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{b.buyerName}</td>
                    <td className="px-4 py-3 text-gray-600">{b.paymentMethod}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">₹{b.amountInNumbers.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 font-medium" style={{ color: b.totalBalance > 0 ? '#dc2626' : '#16a34a' }}>
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
