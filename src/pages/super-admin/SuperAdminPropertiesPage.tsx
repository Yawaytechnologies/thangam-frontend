import React, { useState } from 'react';
import { useProperties, useCreateProperty } from '../../hooks/useProperties';
import { useBranches } from '../../hooks/useBranches';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Pagination } from '../../components/ui/Pagination';
import { SearchInput } from '../../components/ui/SearchInput';
import { Modal } from '../../components/ui/Modal';
import type { PropertyType, WorkflowStatus } from '../../types';
import type { CreatePropertyData } from '../../api/properties.api';

const PROPERTY_TYPES: PropertyType[] = ['RESIDENTIAL', 'COMMERCIAL', 'VILLA', 'APARTMENT', 'PLOT'];

function CreatePropertyModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const create = useCreateProperty();
  const { data: branches = [] } = useBranches();
  const [form, setForm] = useState<CreatePropertyData>({
    propertyName: '',
    projectName: '',
    plotNumber: '',
    propertyType: 'RESIDENTIAL',
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    create.mutate(form, {
      onSuccess: () => {
        onClose();
        setForm({ propertyName: '', projectName: '', plotNumber: '', propertyType: 'RESIDENTIAL' });
      },
    });
  }

  return (
    <Modal open={open} onClose={onClose} title="Add Property" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Property Name *</label>
            <input
              type="text"
              required
              value={form.propertyName}
              onChange={(e) => setForm((f) => ({ ...f, propertyName: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
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
            <label className="block text-xs font-medium text-gray-700 mb-1">Property Type *</label>
            <select
              required
              value={form.propertyType}
              onChange={(e) => setForm((f) => ({ ...f, propertyType: e.target.value as PropertyType }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {PROPERTY_TYPES.map((t) => (
                <option key={t} value={t}>{t.charAt(0) + t.slice(1).toLowerCase()}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Square Feet</label>
            <input
              type="number"
              value={form.squareFeet ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, squareFeet: e.target.value ? Number(e.target.value) : undefined }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">City</label>
            <input
              type="text"
              value={form.city ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, city: e.target.value || undefined }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">State</label>
            <input
              type="text"
              value={form.state ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, state: e.target.value || undefined }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Branch</label>
            <select
              value={form.branchId ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, branchId: e.target.value || undefined }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select branch</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
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
            {create.isPending ? 'Creating...' : 'Add Property'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

const SuperAdminPropertiesPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [propertyType, setPropertyType] = useState<PropertyType | ''>('');
  const [workflowStatus, setWorkflowStatus] = useState<WorkflowStatus | ''>('');
  const [createOpen, setCreateOpen] = useState(false);

  const { data, isLoading } = useProperties({
    page,
    limit: 20,
    search: search || undefined,
    propertyType: propertyType || undefined,
    workflowStatus: workflowStatus || undefined,
  });

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Properties</h1>
        <button
          onClick={() => setCreateOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Add Property
        </button>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-4 border-b border-gray-200 flex flex-wrap gap-3">
          <SearchInput
            value={search}
            onChange={(v) => { setSearch(v); setPage(1); }}
            placeholder="Search properties..."
            className="w-64"
          />
          <select
            value={propertyType}
            onChange={(e) => { setPropertyType(e.target.value as PropertyType | ''); setPage(1); }}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Types</option>
            <option value="RESIDENTIAL">Residential</option>
            <option value="COMMERCIAL">Commercial</option>
            <option value="VILLA">Villa</option>
            <option value="APARTMENT">Apartment</option>
            <option value="PLOT">Plot</option>
          </select>
          <select
            value={workflowStatus}
            onChange={(e) => { setWorkflowStatus(e.target.value as WorkflowStatus | ''); setPage(1); }}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="AVAILABLE">Available</option>
            <option value="BOOKING_INITIATED">Booking Initiated</option>
            <option value="TOKEN_RECEIVED">Token Received</option>
            <option value="ADVANCE_PAYMENT">Advance Payment</option>
            <option value="REGISTRATION_PENDING">Registration Pending</option>
            <option value="FINAL_SETTLEMENT_PENDING">Final Settlement Pending</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Property ID</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Project Name</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Plot No.</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Type</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Sq.Ft</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Workflow</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">Loading...</td></tr>
              ) : !data?.data?.length ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No properties found</td></tr>
              ) : (
                data.data.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">{p.propertyId}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{p.projectName}</td>
                    <td className="px-4 py-3 text-gray-600">{p.plotNumber}</td>
                    <td className="px-4 py-3 text-gray-600">{p.propertyType}</td>
                    <td className="px-4 py-3 text-gray-600">{p.squareFeet ?? '—'}</td>
                    <td className="px-4 py-3"><StatusBadge status={p.workflowStatus} /></td>
                    <td className="px-4 py-3 text-gray-500">{new Date(p.createdAt).toLocaleDateString('en-IN')}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {data && <Pagination page={page} total={data.total} limit={data.limit} onPageChange={setPage} />}
      </div>
      <CreatePropertyModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
};

export default SuperAdminPropertiesPage;
