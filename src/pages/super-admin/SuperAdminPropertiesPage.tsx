import React, { useState } from 'react';
import { useProperties } from '../../hooks/useProperties';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Pagination } from '../../components/ui/Pagination';
import { SearchInput } from '../../components/ui/SearchInput';
import type { PropertyType, WorkflowStatus } from '../../types';

const SuperAdminPropertiesPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [propertyType, setPropertyType] = useState<PropertyType | ''>('');
  const [workflowStatus, setWorkflowStatus] = useState<WorkflowStatus | ''>('');

  const { data, isLoading } = useProperties({
    page,
    limit: 20,
    search: search || undefined,
    propertyType: propertyType || undefined,
    workflowStatus: workflowStatus || undefined,
  });

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Properties</h1>
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
    </div>
  );
};

export default SuperAdminPropertiesPage;
