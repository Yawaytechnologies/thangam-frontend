import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, CheckCircle2, ClipboardCheck, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { customerReferralsApi } from '../../api/customer-referrals.api';
import { getApiError } from '../../lib/api-error';

const statusLabels: Record<string, string> = {
  WITH_ADMIN: 'Awaiting your availability check',
  BOOKED: 'Booking created',
};

export default function AdminReferralsPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const referrals = useQuery({
    queryKey: ['customer-referrals', page],
    queryFn: () => customerReferralsApi.list(page),
    refetchInterval: 30_000,
  });
  const detail = useQuery({
    queryKey: ['customer-referrals', 'detail', selectedId],
    queryFn: () => customerReferralsApi.detail(selectedId!),
    enabled: !!selectedId,
  });
  const pageCount = Math.ceil((referrals.data?.total ?? 0) / (referrals.data?.limit ?? 20));

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Approved Customer Referrals</h1>
          <p className="mt-1 text-sm text-gray-600">
            Check availability for Director-approved referrals and create branch bookings.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void referrals.refetch()}
          disabled={referrals.isFetching}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw size={16} className={referrals.isFetching ? 'animate-spin' : ''} />
          Refresh
        </button>
      </header>

      {referrals.isError && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          Unable to load referrals: {getApiError(referrals.error)}
        </div>
      )}

      {referrals.isLoading ? (
        <p className="rounded-lg border border-gray-200 bg-white p-6 text-sm text-gray-600">Loading referrals…</p>
      ) : referrals.data?.data.length ? (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <section className="space-y-3" aria-label="Referral list">
            {referrals.data.data.map((referral) => (
              <button
                type="button"
                key={referral.id}
                onClick={() => {
                  setSelectedId(referral.id);
                }}
                className={`w-full rounded-xl border p-4 text-left shadow-sm transition hover:border-amber-400 ${
                  selectedId === referral.id ? 'border-amber-500 bg-amber-50' : 'border-gray-200 bg-white'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-gray-900">{referral.customerName}</p>
                    <p className="mt-1 text-sm text-gray-600">{referral.customerPhone}</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                    referral.status === 'BOOKED' ? 'bg-teal-100 text-teal-800' : 'bg-amber-100 text-amber-900'
                  }`}>
                    {statusLabels[referral.status] ?? referral.status}
                  </span>
                </div>
              </button>
            ))}
            {pageCount > 1 && (
              <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3">
                <button
                  type="button"
                  disabled={page === 1 || referrals.isFetching}
                  onClick={() => setPage((current) => current - 1)}
                  className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 disabled:opacity-40"
                >
                  Previous
                </button>
                <span className="text-xs text-gray-600">Page {page} of {pageCount}</span>
                <button
                  type="button"
                  disabled={page >= pageCount || referrals.isFetching}
                  onClick={() => setPage((current) => current + 1)}
                  className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            )}
          </section>

          <section className="min-w-0">
            {!selectedId ? (
              <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">
                Select an approved referral to review its property and availability.
              </div>
            ) : detail.isLoading ? (
              <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-600">Loading referral details…</div>
            ) : detail.isError ? (
              <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                Unable to load referral: {getApiError(detail.error)}
              </div>
            ) : detail.data ? (
              <article className="space-y-5 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <div>
                  <div className="flex items-center gap-2">
                    <ClipboardCheck size={20} className="text-amber-700" />
                    <h2 className="text-lg font-bold text-gray-900">{detail.data.customerName}</h2>
                  </div>
                  <p className="mt-2 text-sm text-gray-600">{detail.data.customerPhone}</p>
                </div>
                <div className="rounded-lg bg-gray-50 p-4 text-sm">
                  <p className="font-semibold text-gray-800">Referral property</p>
                  <p className="mt-1 text-gray-700">
                    {detail.data.property?.propertyName ?? 'Property unavailable'} / Plot {detail.data.property?.plotNumber ?? '-'}
                  </p>
                  <p className="mt-1 text-gray-600">
                    Availability: <strong>{detail.data.property?.workflowStatus ?? 'Unknown'}</strong>
                  </p>
                  <p className="mt-2 text-gray-600">
                    Assigned Agent: {detail.data.assignedAgent?.fullName ?? 'Unavailable'}
                  </p>
                  {detail.data.notes && <p className="mt-2 whitespace-pre-wrap text-gray-600">Referral notes: {detail.data.notes}</p>}
                </div>
                {detail.data.status === 'BOOKED' || detail.data.booking ? (
                  <div className="rounded-lg border border-teal-200 bg-teal-50 p-4 text-sm text-teal-900">
                    <p className="flex items-center gap-2 font-semibold"><CheckCircle2 size={18} /> Booking created</p>
                    <p className="mt-1">Booking ID: {detail.data.booking?.bookingId ?? detail.data.bookingId ?? 'Created'}</p>
                  </div>
                ) : detail.data.status !== 'WITH_ADMIN' ? (
                  <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                    This referral is no longer assigned to your Admin account.
                  </p>
                ) : detail.data.property?.workflowStatus !== 'AVAILABLE' ? (
                  <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                    This property is no longer available. No booking can be created from this referral.
                  </p>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600">
                      Once you confirm the property is still available, continue to the existing Book Property form. Customer and property details will be prefilled.
                    </p>
                    <button
                      type="button"
                      onClick={() => navigate('/admin/bookings', { state: { referral: detail.data } })}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-navy px-4 py-3 text-sm font-semibold text-white hover:bg-gray-800"
                    >
                      Continue in Book Property <ArrowRight size={16} />
                    </button>
                  </div>
                )}
              </article>
            ) : null}
          </section>
        </div>
      ) : !referrals.isError ? (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-600">
          No approved referrals are currently assigned to your branch Admin account.
        </div>
      ) : null}
    </div>
  );
}
