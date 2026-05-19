import React, { useState } from 'react';
import { useProperties, useProperty, usePropertyWorkflow } from '../../hooks/useProperties';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Pagination } from '../../components/ui/Pagination';
import { SearchInput } from '../../components/ui/SearchInput';
import { Modal } from '../../components/ui/Modal';
import type { PropertyType, WorkflowStatus, Property } from '../../types';

// ─── Workflow Timeline Stepper ────────────────────────────────────────────────
const WORKFLOW_STEPS: WorkflowStatus[] = [
  'AVAILABLE',
  'BOOKING_INITIATED',
  'TOKEN_RECEIVED',
  'ADVANCE_PAYMENT',
  'REGISTRATION_PENDING',
  'FINAL_SETTLEMENT_PENDING',
  'COMPLETED',
];

const STEP_LABELS: Record<WorkflowStatus, string> = {
  AVAILABLE: 'Available',
  BOOKING_INITIATED: 'Booking Initiated',
  TOKEN_RECEIVED: 'Token Received',
  ADVANCE_PAYMENT: 'Advance Payment',
  REGISTRATION_PENDING: 'Registration Pending',
  FINAL_SETTLEMENT_PENDING: 'Final Settlement',
  COMPLETED: 'Completed',
};

const WorkflowStepper: React.FC<{ currentStatus: WorkflowStatus }> = ({ currentStatus }) => {
  const currentIndex = WORKFLOW_STEPS.indexOf(currentStatus);
  return (
    <div className="relative py-2">
      {WORKFLOW_STEPS.map((step, idx) => {
        const done = idx <= currentIndex;
        const current = idx === currentIndex;
        return (
          <div key={step} className="flex items-start gap-4 relative">
            {/* Connector line */}
            {idx < WORKFLOW_STEPS.length - 1 && (
              <div
                className={`absolute left-4 top-8 w-0.5 h-8 ${
                  idx < currentIndex ? 'bg-green-400' : 'bg-gray-200'
                }`}
              />
            )}
            {/* Circle */}
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10 ${
                current
                  ? 'bg-blue-600 ring-4 ring-blue-100'
                  : done
                  ? 'bg-green-500'
                  : 'bg-gray-200'
              }`}
            >
              {done && !current ? (
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <span className={`text-xs font-bold ${current ? 'text-white' : 'text-gray-400'}`}>
                  {idx + 1}
                </span>
              )}
            </div>
            {/* Label */}
            <div className="pb-8">
              <p
                className={`text-sm font-medium ${
                  current ? 'text-blue-700' : done ? 'text-green-700' : 'text-gray-400'
                }`}
              >
                {STEP_LABELS[step]}
              </p>
              {current && (
                <p className="text-xs text-blue-500 mt-0.5">Current status</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ─── Property Detail Modal ────────────────────────────────────────────────────
const PropertyDetailModal: React.FC<{
  property: Property;
  onClose: () => void;
}> = ({ property, onClose }) => {
  const { data: workflow } = usePropertyWorkflow(property.id);

  return (
    <Modal open onClose={onClose} title="Property Details" size="xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: Property Info */}
        <div className="space-y-4">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Property ID</p>
            <p className="font-mono text-sm text-gray-800 mt-0.5">{property.propertyId}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Project Name</p>
            <p className="text-sm font-semibold text-gray-900 mt-0.5">{property.projectName}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Plot Number</p>
            <p className="text-sm text-gray-800 mt-0.5">{property.plotNumber}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Property Type</p>
            <p className="text-sm text-gray-800 mt-0.5">{property.propertyType}</p>
          </div>
          {property.squareFeet && (
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Area</p>
              <p className="text-sm text-gray-800 mt-0.5">{property.squareFeet} sq.ft</p>
            </div>
          )}
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Location</p>
            <p className="text-sm text-gray-800 mt-0.5">
              {[property.city, property.state].filter(Boolean).join(', ') || '—'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Workflow Status</p>
            <div className="mt-1">
              <StatusBadge status={property.workflowStatus} />
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Created Date</p>
            <p className="text-sm text-gray-800 mt-0.5">
              {new Date(property.createdAt).toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })}
            </p>
          </div>
        </div>

        {/* Right: Workflow Timeline */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Workflow Timeline</h3>
          {workflow ? (
            <WorkflowStepper currentStatus={workflow.status} />
          ) : (
            <WorkflowStepper currentStatus={property.workflowStatus} />
          )}
        </div>
      </div>
    </Modal>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const AdminPropertiesPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [propertyType, setPropertyType] = useState<PropertyType | ''>('');
  const [workflowStatus, setWorkflowStatus] = useState<WorkflowStatus | ''>('');
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

  const { data, isLoading } = useProperties({
    page,
    limit: 20,
    search: search || undefined,
    propertyType: propertyType || undefined,
    workflowStatus: workflowStatus || undefined,
  });

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Properties</h1>
        <p className="text-sm text-gray-500 mt-0.5">View-only branch property directory</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        {/* Filters */}
        <div className="p-4 border-b border-gray-200 flex flex-wrap gap-3">
          <SearchInput
            value={search}
            onChange={(v) => { setSearch(v); setPage(1); }}
            placeholder="Search by name, plot, ID..."
            className="w-64"
          />
          <select
            value={propertyType}
            onChange={(e) => { setPropertyType(e.target.value as PropertyType | ''); setPage(1); }}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Property ID</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Project Name</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Plot No.</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Type</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Sq.Ft</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Workflow Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Created Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center">
                    <div className="flex items-center justify-center gap-2 text-gray-400">
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      <span>Loading properties...</span>
                    </div>
                  </td>
                </tr>
              ) : !data?.data?.length ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-gray-400">No properties found</td>
                </tr>
              ) : (
                data.data.map((p) => (
                  <tr
                    key={p.id}
                    className="hover:bg-blue-50 cursor-pointer transition-colors"
                    onClick={() => setSelectedProperty(p)}
                  >
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{p.propertyId}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{p.projectName}</td>
                    <td className="px-4 py-3 text-gray-600">{p.plotNumber}</td>
                    <td className="px-4 py-3 text-gray-600">{p.propertyType}</td>
                    <td className="px-4 py-3 text-gray-600">{p.squareFeet ?? '—'}</td>
                    <td className="px-4 py-3"><StatusBadge status={p.workflowStatus} /></td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(p.createdAt).toLocaleDateString('en-IN')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {data && (
          <Pagination page={page} total={data.total} limit={data.limit} onPageChange={setPage} />
        )}
      </div>

      {/* Property Detail Modal */}
      {selectedProperty && (
        <PropertyDetailModal
          property={selectedProperty}
          onClose={() => setSelectedProperty(null)}
        />
      )}
    </div>
  );
};

export default AdminPropertiesPage;
