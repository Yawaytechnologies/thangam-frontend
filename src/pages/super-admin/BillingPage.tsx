import React, { useState } from 'react';
import { useBillings, useBilling } from '../../hooks/useBilling';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Pagination } from '../../components/ui/Pagination';
import { SearchInput } from '../../components/ui/SearchInput';
import { Modal } from '../../components/ui/Modal';
import { billingApi } from '../../api/billing.api';
import type { BillingStatus, Billing } from '../../types';

const STATUS_OPTIONS: BillingStatus[] = [
  'PENDING', 'PARTIAL_PAYMENT', 'PAID', 'FINAL_SETTLEMENT', 'COMPLETED',
];

function BillingDetailModal({ billing, onClose }: { billing: Billing; onClose: () => void }) {
  const { data: detail } = useBilling(billing.id);
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

  return (
    <Modal open onClose={onClose} title="Billing Details" size="xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          {[
            ['Billing ID', b.billingId],
            ['Buyer Name', b.buyerName],
            ['Buyer Phone', b.buyerPhone],
            ['Payment Method', b.paymentMethod],
            ['Billing Date', new Date(b.billingDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })],
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
          <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Amount (Numbers)</span>
              <span className="font-bold text-gray-900">₹{b.amountInNumbers.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Total Received</span>
              <span className="font-bold text-green-700">₹{b.totalReceived.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-sm border-t border-indigo-200 pt-3">
              <span className="text-gray-600 font-medium">Balance</span>
              <span className={`font-bold ${b.totalBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                ₹{b.totalBalance.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">Amount in Words</p>
            <p className="text-sm text-gray-700 italic">{b.amountInWords}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handlePdf}
              disabled={dlPdf}
              className="flex-1 px-3 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {dlPdf ? 'Downloading...' : 'Receipt PDF'}
            </button>
            <button
              onClick={handleEstimate}
              disabled={dlEst}
              className="flex-1 px-3 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 disabled:opacity-50"
            >
              {dlEst ? 'Downloading...' : 'Estimate PDF'}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

const SuperAdminBillingPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<BillingStatus | ''>('');
  const [selected, setSelected] = useState<Billing | null>(null);

  const { data, isLoading } = useBillings({
    page,
    limit: 20,
    search: search || undefined,
    status: status || undefined,
  });

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Billing</h1>

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
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
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
                <th className="text-left px-4 py-3 font-medium text-gray-600">Amount</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Received</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Balance</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">Loading...</td></tr>
              ) : !data?.data?.length ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">No billing records found</td></tr>
              ) : (
                data.data.map((b) => (
                  <tr
                    key={b.id}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => setSelected(b)}
                  >
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{b.billingId}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{b.buyerName}</td>
                    <td className="px-4 py-3 text-gray-600">{b.paymentMethod}</td>
                    <td className="px-4 py-3 text-gray-900 font-medium">₹{b.amountInNumbers.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 text-green-700 font-medium">₹{b.totalReceived.toLocaleString('en-IN')}</td>
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

      {selected && <BillingDetailModal billing={selected} onClose={() => setSelected(null)} />}
    </div>
  );
};

export default SuperAdminBillingPage;
