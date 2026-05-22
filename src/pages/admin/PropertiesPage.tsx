import React, { useState } from 'react';
import { useProperties, usePropertyWorkflow } from '../../hooks/useProperties';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Pagination } from '../../components/ui/Pagination';
import { SearchInput } from '../../components/ui/SearchInput';
import { Modal } from '../../components/ui/Modal';
import type { PropertyType, WorkflowStatus, Property } from '../../types';

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

const STATUS_COLOR: Record<WorkflowStatus, string> = {
  AVAILABLE: 'bg-green-100 text-green-800 border-green-200',
  BOOKING_INITIATED: 'bg-blue-100 text-blue-800 border-blue-200',
  TOKEN_RECEIVED: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  ADVANCE_PAYMENT: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  REGISTRATION_PENDING: 'bg-orange-100 text-orange-800 border-orange-200',
  FINAL_SETTLEMENT_PENDING: 'bg-purple-100 text-purple-800 border-purple-200',
  COMPLETED: 'bg-gray-100 text-gray-700 border-gray-200',
};

const TYPE_ICONS: Record<PropertyType, string> = {
  RESIDENTIAL: '🏠',
  COMMERCIAL: '🏢',
  VILLA: '🏡',
  APARTMENT: '🏗️',
  PLOT: '📐',
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
            {idx < WORKFLOW_STEPS.length - 1 && (
              <div className={`absolute left-4 top-8 w-0.5 h-8 ${idx < currentIndex ? 'bg-gold' : 'bg-gray-200'}`} />
            )}
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10 ${
                current ? 'bg-gold ring-4 ring-gold/20' : done ? 'bg-green-500' : 'bg-gray-200'
              }`}
            >
              {done && !current ? (
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <span className={`text-xs font-bold ${current ? 'text-navy' : 'text-gray-400'}`}>{idx + 1}</span>
              )}
            </div>
            <div className="pb-8">
              <p className={`text-sm font-medium ${current ? 'text-navy' : done ? 'text-green-700' : 'text-gray-400'}`}>
                {STEP_LABELS[step]}
              </p>
              {current && <p className="text-xs text-gold mt-0.5">Current status</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const PropertyDetailModal: React.FC<{ property: Property; onClose: () => void }> = ({ property, onClose }) => {
  const { data: workflow } = usePropertyWorkflow(property.id);

  return (
    <Modal open onClose={onClose} title="Property Details" size="xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          {([
            { label: 'Property ID', value: property.propertyId, cls: 'font-mono text-xs' },
            { label: 'Project Name', value: property.projectName, cls: 'font-semibold' },
            { label: 'Plot Number', value: property.plotNumber, cls: '' },
            { label: 'Property Type', value: property.propertyType, cls: '' },
            ...(property.squareFeet ? [{ label: 'Area', value: `${property.squareFeet} sq.ft`, cls: '' }] : []),
            { label: 'Location', value: [property.city, property.state].filter((v): v is string => !!v).join(', ') || '—', cls: '' },
            { label: 'Created', value: new Date(property.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }), cls: '' },
          ] as { label: string; value: string; cls: string }[]).map(({ label, value, cls }) => (
            <div key={label}>
              <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">{label}</p>
              <p className={`text-sm text-gray-900 mt-0.5 ${cls}`}>{value}</p>
            </div>
          ))}
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Workflow Status</p>
            <div className="mt-1"><StatusBadge status={property.workflowStatus} /></div>
          </div>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-navy mb-4">Workflow Timeline</h3>
          <WorkflowStepper currentStatus={workflow?.workflowStatus ?? property.workflowStatus} />
        </div>
      </div>
    </Modal>
  );
};

function PropertyCard({ property, onClick }: { property: Property; onClick: () => void }) {
  const progress = (WORKFLOW_STEPS.indexOf(property.workflowStatus) / (WORKFLOW_STEPS.length - 1)) * 100;

  return (
    <div
      className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-gold/40 transition-all cursor-pointer p-4 flex flex-col gap-3"
      onClick={onClick}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">{TYPE_ICONS[property.propertyType] ?? '🏠'}</span>
          <div>
            <p className="text-sm font-semibold text-gray-900 leading-tight">{property.projectName}</p>
            <p className="text-xs text-gray-500 font-mono">{property.propertyId}</p>
          </div>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${STATUS_COLOR[property.workflowStatus]}`}>
          {STEP_LABELS[property.workflowStatus]}
        </span>
      </div>

      {/* Details row */}
      <div className="flex items-center gap-4 text-xs text-gray-600">
        <span>Plot <strong className="text-gray-900">{property.plotNumber}</strong></span>
        {property.squareFeet && <span><strong className="text-gray-900">{property.squareFeet}</strong> sq.ft</span>}
        {property.city && <span>{property.city}</span>}
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span>Progress</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gold rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-1 border-t border-gray-100">
        <span className="text-xs text-gray-400">{property.propertyType}</span>
        <span className="text-xs text-gray-400">{new Date(property.createdAt).toLocaleDateString('en-IN')}</span>
      </div>
    </div>
  );
}

const AdminPropertiesPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [propertyType, setPropertyType] = useState<PropertyType | ''>('');
  const [workflowStatus, setWorkflowStatus] = useState<WorkflowStatus | ''>('');
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

  const { data, isLoading } = useProperties({
    page,
    limit: 24,
    search: search || undefined,
    propertyType: propertyType || undefined,
    workflowStatus: workflowStatus || undefined,
  });

  const properties = data?.data ?? [];

  // Summary counts from current page data
  const available = properties.filter((p) => p.workflowStatus === 'AVAILABLE').length;
  const booked = properties.filter((p) => !['AVAILABLE', 'COMPLETED'].includes(p.workflowStatus)).length;
  const completed = properties.filter((p) => p.workflowStatus === 'COMPLETED').length;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-navy">Properties</h1>
        <p className="text-sm text-gray-500 mt-0.5">Branch property directory</p>
      </div>

      {/* Stats row */}
      {!isLoading && properties.length > 0 && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total (Page)', value: properties.length, color: 'text-navy' },
            { label: 'Available', value: available, color: 'text-green-700' },
            { label: 'In Progress', value: booked, color: 'text-yellow-700' },
            { label: 'Completed', value: completed, color: 'text-gray-700' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">{label}</p>
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <SearchInput
          value={search}
          onChange={(v) => { setSearch(v); setPage(1); }}
          placeholder="Search by name, plot, ID..."
          className="w-64"
        />
        <select
          value={propertyType}
          onChange={(e) => { setPropertyType(e.target.value as PropertyType | ''); setPage(1); }}
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-gold/40"
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
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-gold/40"
        >
          <option value="">All Statuses</option>
          {WORKFLOW_STEPS.map((s) => (
            <option key={s} value={s}>{STEP_LABELS[s]}</option>
          ))}
        </select>
      </div>

      {/* Card grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 h-40 animate-pulse" />
          ))}
        </div>
      ) : !properties.length ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
          No properties found
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {properties.map((p) => (
            <PropertyCard key={p.id} property={p} onClick={() => setSelectedProperty(p)} />
          ))}
        </div>
      )}

      {data && (
        <div className="mt-6">
          <Pagination page={page} total={data.total} limit={data.limit} onPageChange={setPage} />
        </div>
      )}

      {selectedProperty && (
        <PropertyDetailModal property={selectedProperty} onClose={() => setSelectedProperty(null)} />
      )}
    </div>
  );
};

export default AdminPropertiesPage;
