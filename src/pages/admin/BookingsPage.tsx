import React, { useState } from 'react';
import { useBookings, useBooking, useUpdateBookingStatus, useCreateBooking } from '../../hooks/useBookings';
import { useProperties } from '../../hooks/useProperties';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Pagination } from '../../components/ui/Pagination';
import { SearchInput } from '../../components/ui/SearchInput';
import { Modal } from '../../components/ui/Modal';
import { bookingsApi } from '../../api/bookings.api';
import type { BookingStatus, Booking, Property } from '../../types';
import type { CreateBookingData } from '../../api/bookings.api';

function CreateBookingModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const create = useCreateBooking();
  const { data: propertiesData } = useProperties({ limit: 100, workflowStatus: 'AVAILABLE' });
  const properties: Property[] = propertiesData?.data ?? [];

  const [form, setForm] = useState<CreateBookingData>({
    propertyId: '',
    applicantName: '',
    cellNumber: '',
    projectName: '',
    plotNumber: '',
    bookingDate: new Date().toISOString().split('T')[0],
  });

  function handlePropertyChange(propertyId: string) {
    const prop = properties.find((p) => p.id === propertyId);
    setForm((f) => ({
      ...f,
      propertyId,
      projectName: prop?.projectName ?? f.projectName,
      plotNumber: prop?.plotNumber ?? f.plotNumber,
    }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    create.mutate(form, {
      onSuccess: () => {
        onClose();
        setForm({ propertyId: '', applicantName: '', cellNumber: '', projectName: '', plotNumber: '', bookingDate: new Date().toISOString().split('T')[0] });
      },
    });
  }

  return (
    <Modal open={open} onClose={onClose} title="Create Booking" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Property *</label>
          <select
            required
            value={form.propertyId}
            onChange={(e) => handlePropertyChange(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select available property</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.projectName} — Plot {p.plotNumber} ({p.propertyType})
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Project Name *</label>
            <input
              type="text"
              required
              value={form.projectName}
              onChange={(e) => setForm((f) => ({ ...f, projectName: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Plot Number *</label>
            <input
              type="text"
              required
              value={form.plotNumber}
              onChange={(e) => setForm((f) => ({ ...f, plotNumber: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Applicant Name *</label>
            <input
              type="text"
              required
              value={form.applicantName}
              onChange={(e) => setForm((f) => ({ ...f, applicantName: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Cell Number *</label>
            <input
              type="tel"
              required
              value={form.cellNumber}
              onChange={(e) => setForm((f) => ({ ...f, cellNumber: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-700 mb-1">Booking Date *</label>
            <input
              type="date"
              required
              value={form.bookingDate}
              onChange={(e) => setForm((f) => ({ ...f, bookingDate: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={create.isPending}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {create.isPending ? 'Creating...' : 'Create Booking'}
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
        <div className="space-y-4">
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
            <div className="bg-indigo-50 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-700 mb-3">Advance to Next Stage</p>
              <button
                onClick={() => updateStatus.mutate({ id: b.id, status: nextStatus }, { onSuccess: onClose })}
                disabled={updateStatus.isPending}
                className="w-full px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {updateStatus.isPending ? 'Updating...' : `Move to ${nextStatus.replace(/_/g, ' ')}`}
              </button>
            </div>
          )}
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="w-full px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 disabled:opacity-50"
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
          <h1 className="text-2xl font-bold text-gray-900">Bookings</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage branch bookings and workflow</p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          + New Booking
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-4 border-b border-gray-200 flex flex-wrap gap-3">
          <SearchInput
            value={search}
            onChange={(v) => { setSearch(v); setPage(1); }}
            placeholder="Search by applicant, project, plot..."
            className="w-64"
          />
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value as BookingStatus | ''); setPage(1); }}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="BOOKING_INITIATED">Booking Initiated</option>
            <option value="TOKEN_RECEIVED">Token Received</option>
            <option value="ADVANCE_PAYMENT">Advance Payment</option>
            <option value="REGISTRATION_PENDING">Registration Pending</option>
            <option value="FINAL_SETTLEMENT_PENDING">Final Settlement Pending</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Booking ID</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Applicant</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Project / Plot</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Loading...</td></tr>
              ) : !data?.data?.length ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No bookings found</td></tr>
              ) : (
                data.data.map((b) => (
                  <tr
                    key={b.id}
                    className="hover:bg-blue-50 cursor-pointer transition-colors"
                    onClick={() => setSelected(b)}
                  >
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{b.bookingId}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{b.applicantName}</td>
                    <td className="px-4 py-3 text-gray-600">{b.projectName} / {b.plotNumber}</td>
                    <td className="px-4 py-3"><StatusBadge status={b.status} /></td>
                    <td className="px-4 py-3 text-gray-500">{new Date(b.bookingDate).toLocaleDateString('en-IN')}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {data && <Pagination page={page} total={data.total} limit={data.limit} onPageChange={setPage} />}
      </div>

      <CreateBookingModal open={createOpen} onClose={() => setCreateOpen(false)} />
      {selected && <BookingDetailModal booking={selected} onClose={() => setSelected(null)} />}
    </div>
  );
};

export default AdminBookingsPage;
