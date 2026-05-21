import React, { useState } from 'react';
import {
  useProperties,
  useCreateProperty,
  useUpdateProperty,
} from '../../hooks/useProperties';
import { useBranches } from '../../hooks/useBranches';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Pagination } from '../../components/ui/Pagination';
import { SearchInput } from '../../components/ui/SearchInput';
import { Modal } from '../../components/ui/Modal';
import type { Property, PropertyType, WorkflowStatus } from '../../types';
import type { CreatePropertyData, UpdatePropertyData } from '../../api/properties.api';

// ─── Constants ───────────────────────────────────────────────────────────────

const PROPERTY_TYPES: PropertyType[] = ['RESIDENTIAL', 'COMMERCIAL', 'VILLA', 'APARTMENT', 'PLOT'];

const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  RESIDENTIAL: 'Residential Plot',
  COMMERCIAL: 'Commercial Land',
  VILLA: 'Premium Villa',
  APARTMENT: 'Apartment',
  PLOT: 'Agricultural Land',
};

const WORKFLOW_STEPS: { key: WorkflowStatus | string; label: string }[] = [
  { key: 'TOKEN_RECEIVED', label: 'Token' },
  { key: 'ADVANCE_PAYMENT', label: 'Advance' },
  { key: 'REGISTRATION_PENDING', label: 'Registration' },
  { key: 'FINAL_SETTLEMENT_PENDING', label: 'Final Settlement' },
];

const WORKFLOW_ORDER: WorkflowStatus[] = [
  'AVAILABLE',
  'BOOKING_INITIATED',
  'TOKEN_RECEIVED',
  'ADVANCE_PAYMENT',
  'REGISTRATION_PENDING',
  'FINAL_SETTLEMENT_PENDING',
  'COMPLETED',
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function workflowStepIndex(status: WorkflowStatus): number {
  return WORKFLOW_ORDER.indexOf(status);
}

function stepState(
  stepKey: string,
  currentStatus: WorkflowStatus,
): 'completed' | 'current' | 'future' {
  const stepWorkflow = stepKey as WorkflowStatus;
  const currentIdx = workflowStepIndex(currentStatus);
  const stepIdx = workflowStepIndex(stepWorkflow);
  if (currentIdx > stepIdx) return 'completed';
  if (currentIdx === stepIdx) return 'current';
  return 'future';
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ─── SVG Icons ───────────────────────────────────────────────────────────────

function PinIcon({ className = 'w-3 h-3' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
    </svg>
  );
}

function DotsIcon() {
  return (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 5a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm0 7a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm0 7a1.5 1.5 0 110-3 1.5 1.5 0 010 3z" />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
    </svg>
  );
}

function CheckIcon({ className = 'w-3 h-3' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
    </svg>
  );
}

// ─── Workflow Progress Bar ────────────────────────────────────────────────────

function WorkflowProgressBar({ status }: { status: WorkflowStatus }) {
  return (
    <div className="flex items-center gap-0 mt-3">
      {WORKFLOW_STEPS.map((step, idx) => {
        const state = stepState(step.key, status);
        return (
          <React.Fragment key={step.key}>
            <div className="flex flex-col items-center">
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${
                  state === 'completed'
                    ? 'bg-gold border-gold text-navy'
                    : state === 'current'
                    ? 'bg-white border-gold text-gold'
                    : 'bg-gray-100 border-gray-300 text-gray-400'
                }`}
              >
                {state === 'completed' ? <CheckIcon /> : null}
              </div>
              <span className={`text-[9px] mt-1 whitespace-nowrap ${state === 'future' ? 'text-gray-400' : 'text-gold'}`}>
                {step.label}
              </span>
            </div>
            {idx < WORKFLOW_STEPS.length - 1 && (
              <div
                className={`flex-1 h-0.5 mb-4 mx-0.5 ${
                  stepState(WORKFLOW_STEPS[idx + 1].key, status) !== 'future' || state === 'completed'
                    ? 'bg-gold'
                    : 'bg-gray-200'
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ─── Property Card ────────────────────────────────────────────────────────────

function PropertyCard({
  property,
  onView,
  onEdit,
}: {
  property: Property;
  onView: (p: Property) => void;
  onEdit: (p: Property) => void;
}) {
  const isSold = property.workflowStatus === 'COMPLETED';
  const location = [property.city, property.state].filter(Boolean).join(', ') || 'Location not set';

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
      {/* Image area */}
      <div className="h-44 relative bg-gradient-to-br from-navy-mid to-navy flex items-end overflow-hidden">
        {/* Placeholder gradient as background */}
        <div className="absolute inset-0 bg-gradient-to-br from-navy via-navy-mid to-gray-800 opacity-90" />
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 30% 50%, #c9a227 0%, transparent 60%)' }} />

        {/* Status badge top-left */}
        <div className="absolute top-3 left-3">
          <span
            className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
              isSold ? 'bg-green-500 text-white' : 'bg-gold text-navy'
            }`}
          >
            {isSold ? 'Sold' : 'Active'}
          </span>
        </div>

        {/* 3-dot menu top-right */}
        <div className="absolute top-3 right-3">
          <button className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/40 text-white flex items-center justify-center transition-colors">
            <DotsIcon />
          </button>
        </div>

        {/* Property type badge bottom */}
        <div className="relative z-10 px-3 pb-3 w-full">
          <span className="text-xs font-medium text-white/70 uppercase tracking-widest">
            {PROPERTY_TYPE_LABELS[property.propertyType] ?? property.propertyType}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 flex-1 flex flex-col">
        <p className="text-sm font-bold text-gray-900 leading-snug">{property.propertyName}</p>
        <p className="text-xs text-gray-500 font-medium mt-0.5">{property.projectName} · Plot {property.plotNumber}</p>

        <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
          <PinIcon />
          <span>{location}</span>
        </div>

        {/* Square feet */}
        {property.squareFeet && (
          <p className="text-xs text-gray-400 mt-1">{property.squareFeet.toLocaleString()} sq.ft</p>
        )}

        {/* Workflow progress bar */}
        <WorkflowProgressBar status={property.workflowStatus} />

        {/* Payment status tags */}
        <div className="mt-3 flex flex-wrap gap-1">
          <StatusBadge status={property.workflowStatus} />
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-100 px-4 pt-3 pb-4 flex gap-2 mt-auto">
        <button
          onClick={() => onView(property)}
          className="text-xs text-gold font-semibold hover:underline"
        >
          View Details
        </button>
        <button
          onClick={() => onEdit(property)}
          className="text-xs border border-gray-300 text-gray-700 px-3 py-1 rounded-lg hover:bg-gray-50 ml-auto"
        >
          Edit
        </button>
      </div>
    </div>
  );
}

// ─── Create Property Modal ────────────────────────────────────────────────────

function CreatePropertyModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const create = useCreateProperty();
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

  const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold bg-white';
  const labelCls = 'block text-xs font-medium text-gray-600 mb-1';

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create New Property"
      subtitle="Add and manage property workflow details"
      size="xl"
    >
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-5">
          {/* Left column */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-gold text-xs font-semibold uppercase tracking-wide mb-3">
              <span>Property Details</span>
            </div>

            <div>
              <label className={labelCls}>Property Name *</label>
              <input
                type="text"
                required
                value={form.propertyName}
                onChange={(e) => setForm((f) => ({ ...f, propertyName: e.target.value }))}
                className={inputCls}
                placeholder="e.g. Green Valley Plots"
              />
            </div>

            <div>
              <label className={labelCls}>Project Name *</label>
              <input
                type="text"
                required
                value={form.projectName}
                onChange={(e) => setForm((f) => ({ ...f, projectName: e.target.value }))}
                className={inputCls}
                placeholder="e.g. Sri Thangam Phase 1"
              />
            </div>

            <div>
              <label className={labelCls}>Plot Number *</label>
              <input
                type="text"
                required
                value={form.plotNumber}
                onChange={(e) => setForm((f) => ({ ...f, plotNumber: e.target.value }))}
                className={inputCls}
                placeholder="e.g. P-101"
              />
            </div>

            <div>
              <label className={labelCls}>Property Type *</label>
              <select
                required
                value={form.propertyType}
                onChange={(e) => setForm((f) => ({ ...f, propertyType: e.target.value as PropertyType }))}
                className={inputCls}
              >
                {PROPERTY_TYPES.map((t) => (
                  <option key={t} value={t}>{PROPERTY_TYPE_LABELS[t]}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelCls}>Property Location</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                  <PinIcon className="w-3.5 h-3.5" />
                </span>
                <input
                  type="text"
                  value={form.city ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, city: e.target.value || undefined }))}
                  className={`${inputCls} pl-8`}
                  placeholder="City"
                />
              </div>
            </div>

            <div>
              <label className={labelCls}>State</label>
              <input
                type="text"
                value={form.state ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, state: e.target.value || undefined }))}
                className={inputCls}
                placeholder="e.g. Tamil Nadu"
              />
            </div>

            <div>
              <label className={labelCls}>Square Feet</label>
              <input
                type="number"
                min={0}
                value={form.squareFeet ?? ''}
                onChange={(e) =>
                  setForm((f) => ({ ...f, squareFeet: e.target.value ? Number(e.target.value) : undefined }))
                }
                className={inputCls}
                placeholder="e.g. 1200"
              />
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-gold text-xs font-semibold uppercase tracking-wide mb-3">
              <span>Media &amp; Notes</span>
            </div>

            {/* Upload box */}
            <div>
              <label className={labelCls}>Upload Property Images</label>
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center bg-gray-50 hover:border-gold/60 hover:bg-gold/5 transition-colors cursor-pointer">
                <UploadIcon />
                <p className="text-xs font-medium text-gray-600 mb-1">Click to upload or drag &amp; drop</p>
                <p className="text-xs text-gray-400">Max size 10MB per image (PNG, JPG)</p>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className={labelCls}>Property Description</label>
              <textarea
                rows={6}
                className={`${inputCls} resize-none`}
                placeholder="Describe the property — highlights, amenities, nearby landmarks…"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 pt-5 mt-2 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 text-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={create.isPending}
            className="bg-gold text-navy font-semibold px-4 py-2 rounded-lg hover:opacity-90 disabled:opacity-50 text-sm"
          >
            {create.isPending ? 'Creating…' : '+ Create Property'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Property Detail Modal ────────────────────────────────────────────────────

function PropertyDetailModal({
  property,
  open,
  onClose,
  onEdit,
}: {
  property: Property | null;
  open: boolean;
  onClose: () => void;
  onEdit: (p: Property) => void;
}) {
  if (!property) return null;

  const location = [property.city, property.state].filter(Boolean).join(', ') || 'Location not set';

  const specs: { label: string; value: string }[] = [
    { label: 'Property ID', value: property.propertyId },
    { label: 'Property Name', value: property.propertyName },
    { label: 'Project Name', value: property.projectName },
    { label: 'Plot Number', value: property.plotNumber },
    { label: 'Property Type', value: PROPERTY_TYPE_LABELS[property.propertyType] ?? property.propertyType },
    { label: 'Square Feet', value: property.squareFeet ? `${property.squareFeet.toLocaleString()} sq.ft` : '—' },
    { label: 'Location Zone', value: location },
    { label: 'Created Date', value: formatDate(property.createdAt) },
  ];

  const lifecycleSteps = [
    { label: 'Token', key: 'TOKEN_RECEIVED' as WorkflowStatus },
    { label: 'Advance', key: 'ADVANCE_PAYMENT' as WorkflowStatus },
    { label: 'Registration', key: 'REGISTRATION_PENDING' as WorkflowStatus },
    { label: 'Final Settlement', key: 'FINAL_SETTLEMENT_PENDING' as WorkflowStatus },
  ];

  return (
    <Modal open={open} onClose={onClose} title="" size="2xl">
      {/* Hero */}
      <div className="h-56 rounded-xl relative overflow-hidden mb-6 -mx-0">
        <div className="absolute inset-0 bg-gradient-to-br from-navy via-navy-mid to-gray-800" />
        <div
          className="absolute inset-0 opacity-20"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 60%, #c9a227 0%, transparent 55%)' }}
        />
        {/* Overlay content */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Edit button top-right */}
        <div className="absolute top-4 right-4">
          <button
            onClick={() => { onClose(); onEdit(property); }}
            className="text-xs border border-white/50 text-white px-3 py-1.5 rounded-lg hover:bg-white/20 transition-colors"
          >
            Edit Details
          </button>
        </div>

        {/* Bottom info */}
        <div className="absolute bottom-4 left-4">
          <p className="text-white text-xl font-bold leading-snug">{property.propertyName}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-gold font-semibold uppercase tracking-widest">
              {PROPERTY_TYPE_LABELS[property.propertyType] ?? property.propertyType}
            </span>
            <StatusBadge status={property.workflowStatus} />
          </div>
        </div>
      </div>

      {/* 2-column content */}
      <div className="grid grid-cols-2 gap-6">
        {/* Left: Specifications */}
        <div>
          <div className="flex items-center gap-2 text-gold text-xs font-semibold uppercase tracking-wide mb-3">
            <span>Property Specification</span>
          </div>
          <dl className="space-y-3">
            {specs.map((s) => (
              <div key={s.label} className="flex justify-between border-b border-gray-50 pb-2">
                <dt className="text-xs text-gray-500">{s.label}</dt>
                <dd className="text-xs font-medium text-gray-900 text-right">{s.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Right: Timeline + Documentation */}
        <div className="space-y-5">
          {/* Timeline */}
          <div>
            <div className="flex items-center gap-2 text-gold text-xs font-semibold uppercase tracking-wide mb-3">
              <span>Timeline</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />
                <div>
                  <p className="text-xs font-medium text-gray-800">Property Created</p>
                  <p className="text-xs text-gray-400">{formatDate(property.createdAt)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div
                  className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    property.workflowStatus !== 'AVAILABLE' ? 'bg-gold' : 'bg-gray-200'
                  }`}
                />
                <div>
                  <p className="text-xs font-medium text-gray-800">Booking Initiated</p>
                  <p className="text-xs text-gray-400">
                    {property.workflowStatus !== 'AVAILABLE' ? 'In progress' : 'Pending'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Documentation panel */}
          <div>
            <div className="flex items-center gap-2 text-gold text-xs font-semibold uppercase tracking-wide mb-3">
              <span>Documentation</span>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 space-y-3 border border-gray-100">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Registry Documents</span>
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    property.workflowStatus === 'COMPLETED'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}
                >
                  {property.workflowStatus === 'COMPLETED' ? 'Verified' : 'Pending'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Final Verification</span>
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    property.workflowStatus === 'COMPLETED'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {property.workflowStatus === 'COMPLETED' ? 'Done' : 'In Queue'}
                </span>
              </div>
              <button className="w-full text-xs border border-gold text-gold px-3 py-1.5 rounded-lg hover:bg-gold/10 transition-colors mt-1">
                View Documents
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction Lifecycle Stepper */}
      <div className="mt-6 pt-4 border-t border-gray-100">
        <div className="flex items-center gap-2 text-gold text-xs font-semibold uppercase tracking-wide mb-4">
          <span>Transaction Lifecycle</span>
        </div>
        <div className="flex items-start justify-between">
          {lifecycleSteps.map((step, idx) => {
            const state = stepState(step.key, property.workflowStatus);
            return (
              <React.Fragment key={step.key}>
                <div className="flex flex-col items-center gap-2 flex-1">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center border-2 font-bold text-xs ${
                      state === 'completed'
                        ? 'bg-gold border-gold text-navy'
                        : state === 'current'
                        ? 'bg-white border-gold text-gold'
                        : 'bg-gray-100 border-gray-200 text-gray-400'
                    }`}
                  >
                    {state === 'completed' ? <CheckIcon className="w-4 h-4" /> : idx + 1}
                  </div>
                  <p className="text-xs font-medium text-gray-700 text-center">{step.label}</p>
                  <span
                    className={`text-[10px] font-semibold uppercase ${
                      state === 'completed'
                        ? 'text-green-600'
                        : state === 'current'
                        ? 'text-gold'
                        : 'text-gray-400'
                    }`}
                  >
                    {state === 'completed' ? 'COMPLETED' : state === 'current' ? 'IN PROGRESS' : 'PENDING'}
                  </span>
                </div>
                {idx < lifecycleSteps.length - 1 && (
                  <div
                    className={`h-0.5 flex-1 mt-4 mx-1 ${
                      state === 'completed' ? 'bg-gold' : 'bg-gray-200'
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-end gap-2 pt-5 mt-4 border-t border-gray-100">
        <button
          onClick={onClose}
          className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 text-sm"
        >
          Close
        </button>
        <button className="bg-gold text-navy font-semibold px-4 py-2 rounded-lg hover:opacity-90 text-sm">
          Open Full Property Workspace →
        </button>
      </div>
    </Modal>
  );
}

// ─── Edit Property Modal ──────────────────────────────────────────────────────

function EditPropertyModal({
  property,
  open,
  onClose,
}: {
  property: Property | null;
  open: boolean;
  onClose: () => void;
}) {
  const update = useUpdateProperty();
  const branchesQuery = useBranches();
  const branches = branchesQuery.data?.data ?? [];

  const [form, setForm] = useState<UpdatePropertyData>(() =>
    property
      ? {
          propertyName: property.propertyName,
          projectName: property.projectName,
          plotNumber: property.plotNumber,
          propertyType: property.propertyType,
          city: property.city,
          state: property.state,
          squareFeet: property.squareFeet,
        }
      : {}
  );
  const [toast, setToast] = useState(false);

  if (!property) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    update.mutate(
      { id: property!.id, data: form },
      {
        onSuccess: () => {
          setToast(true);
          setTimeout(() => {
            setToast(false);
            onClose();
          }, 1500);
        },
      },
    );
  }

  const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold bg-white';
  const labelCls = 'block text-xs font-medium text-gray-600 mb-1';

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit Property"
      subtitle="Update property details and workflow information"
      size="xl"
    >
      {toast && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-800 text-sm rounded-lg px-4 py-2 flex items-center gap-2">
          <CheckIcon className="w-4 h-4" />
          Property updated successfully!
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Property details section */}
        <div className="flex items-center gap-2 text-gold text-xs font-semibold uppercase tracking-wide mb-3">
          <span>Property Details</span>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-5">
          <div>
            <label className={labelCls}>Property Name</label>
            <input
              type="text"
              value={form.propertyName ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, propertyName: e.target.value }))}
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls}>Property Type</label>
            <select
              value={form.propertyType ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, propertyType: e.target.value as PropertyType }))}
              className={inputCls}
            >
              {PROPERTY_TYPES.map((t) => (
                <option key={t} value={t}>{PROPERTY_TYPE_LABELS[t]}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelCls}>Project Name</label>
            <input
              type="text"
              value={form.projectName ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, projectName: e.target.value }))}
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls}>Plot Number</label>
            <input
              type="text"
              value={form.plotNumber ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, plotNumber: e.target.value }))}
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls}>City</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                <PinIcon className="w-3.5 h-3.5" />
              </span>
              <input
                type="text"
                value={form.city ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, city: e.target.value || undefined }))}
                className={`${inputCls} pl-8`}
              />
            </div>
          </div>

          <div>
            <label className={labelCls}>State</label>
            <input
              type="text"
              value={form.state ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, state: e.target.value || undefined }))}
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls}>Square Feet</label>
            <input
              type="number"
              min={0}
              value={form.squareFeet ?? ''}
              onChange={(e) =>
                setForm((f) => ({ ...f, squareFeet: e.target.value ? Number(e.target.value) : undefined }))
              }
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls}>Branch</label>
            <select
              value={form.branchId ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, branchId: e.target.value || undefined }))}
              className={inputCls}
            >
              <option value="">Select branch</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Description */}
        <div className="mb-5">
          <label className={labelCls}>Description</label>
          <textarea
            rows={3}
            className={`${inputCls} resize-none`}
            placeholder="Describe the property…"
          />
        </div>

        {/* Workflow section */}
        <div className="flex items-center gap-2 text-gold text-xs font-semibold uppercase tracking-wide mb-3">
          <span>Workflow Status</span>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-5">
          <div>
            <label className={labelCls}>Workflow Status</label>
            <select className={inputCls} defaultValue={property.workflowStatus}>
              <option value="AVAILABLE">Available</option>
              <option value="BOOKING_INITIATED">Booking Initiated</option>
              <option value="TOKEN_RECEIVED">Token Received</option>
              <option value="ADVANCE_PAYMENT">Advance Payment</option>
              <option value="REGISTRATION_PENDING">Registration Pending</option>
              <option value="FINAL_SETTLEMENT_PENDING">Final Settlement Pending</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>

          <div>
            <label className={labelCls}>Advance Status</label>
            <select className={inputCls} defaultValue="">
              <option value="">Select status</option>
              <option value="PENDING">Pending</option>
              <option value="PARTIAL">Partial</option>
              <option value="COMPLETE">Complete</option>
            </select>
          </div>

          <div>
            <label className={labelCls}>Settlement Status</label>
            <select className={inputCls} defaultValue="">
              <option value="">Select status</option>
              <option value="PENDING">Pending</option>
              <option value="PARTIAL">Partial</option>
              <option value="COMPLETE">Complete</option>
            </select>
          </div>

          <div>
            <label className={labelCls}>Doc Status</label>
            <select className={inputCls} defaultValue="">
              <option value="">Select status</option>
              <option value="PENDING">Pending</option>
              <option value="IN_REVIEW">In Review</option>
              <option value="VERIFIED">Verified</option>
            </select>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 text-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={update.isPending}
            className="bg-gold text-navy font-semibold px-4 py-2 rounded-lg hover:opacity-90 disabled:opacity-50 text-sm"
          >
            {update.isPending ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ─── KPI Bar ──────────────────────────────────────────────────────────────────

interface KPICardProps {
  label: string;
  value: number | string;
  note: string;
  noteColor: string;
}

function KPICard({ label, value, note, noteColor }: KPICardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 px-5 py-4">
      <p className="text-xs text-gray-500 font-medium mb-1">{label}</p>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
      <p className={`text-xs mt-1 ${noteColor}`}>{note}</p>
    </div>
  );
}

// ─── Filter Panel ─────────────────────────────────────────────────────────────

function FilterPanel({
  search,
  onSearch,
  propertyType,
  onPropertyType,
  workflowStatus,
  onWorkflowStatus,
  onReset,
}: {
  search: string;
  onSearch: (v: string) => void;
  propertyType: PropertyType | '';
  onPropertyType: (v: PropertyType | '') => void;
  workflowStatus: WorkflowStatus | '';
  onWorkflowStatus: (v: WorkflowStatus | '') => void;
  onReset: () => void;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-6">
      <div className="flex items-center gap-2 text-gold text-xs font-semibold uppercase tracking-wide mb-4">
        <FilterIcon />
        <span>Filter Workflow</span>
      </div>
      <div className="flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-48">
          <label className="block text-xs font-medium text-gray-600 mb-1">Search</label>
          <SearchInput
            value={search}
            onChange={onSearch}
            placeholder="Search properties, plots, projects…"
            className="w-full"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Property Type</label>
          <select
            value={propertyType}
            onChange={(e) => onPropertyType(e.target.value as PropertyType | '')}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold bg-white"
          >
            <option value="">All Types</option>
            {PROPERTY_TYPES.map((t) => (
              <option key={t} value={t}>{PROPERTY_TYPE_LABELS[t]}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Workflow Status</label>
          <select
            value={workflowStatus}
            onChange={(e) => onWorkflowStatus(e.target.value as WorkflowStatus | '')}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold bg-white"
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
        <button
          onClick={onReset}
          className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 text-sm"
        >
          Reset
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const SuperAdminPropertiesPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [propertyType, setPropertyType] = useState<PropertyType | ''>('');
  const [workflowStatus, setWorkflowStatus] = useState<WorkflowStatus | ''>('');
  const [createOpen, setCreateOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const { data, isLoading } = useProperties({
    page,
    limit: 12,
    search: search || undefined,
    propertyType: propertyType || undefined,
    workflowStatus: workflowStatus || undefined,
  });

  const properties = data?.data ?? [];

  // KPI computations
  const activeCount = properties.filter(
    (p) => p.workflowStatus !== 'COMPLETED',
  ).length;
  const advancePendingCount = properties.filter(
    (p) => p.workflowStatus === 'ADVANCE_PAYMENT',
  ).length;
  const soldCount = properties.filter(
    (p) => p.workflowStatus === 'COMPLETED',
  ).length;
  const docQueueCount = properties.filter(
    (p) =>
      p.workflowStatus === 'REGISTRATION_PENDING' ||
      p.workflowStatus === 'FINAL_SETTLEMENT_PENDING',
  ).length;

  function handleView(p: Property) {
    setSelectedProperty(p);
    setDetailOpen(true);
  }

  function handleEdit(p: Property) {
    setSelectedProperty(p);
    setEditOpen(true);
  }

  function handleReset() {
    setSearch('');
    setPropertyType('');
    setWorkflowStatus('');
    setPage(1);
  }

  return (
    <div className="p-6">
      {/* Page Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Property Portfolio</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage inventory workflow, assignments, and transaction milestones.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterOpen((v) => !v)}
            className="flex items-center gap-2 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 text-sm"
          >
            <FilterIcon />
            Filter Workflow
          </button>
          <button
            onClick={() => setCreateOpen(true)}
            className="bg-gold text-navy font-semibold px-4 py-2 rounded-lg hover:opacity-90 text-sm"
          >
            + Create Property
          </button>
        </div>
      </div>

      {/* KPI Bar */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <KPICard
          label="Active Inventory"
          value={isLoading ? '—' : activeCount}
          note="↑ +12%"
          noteColor="text-green-600"
        />
        <KPICard
          label="Advance Pending"
          value={isLoading ? '—' : advancePendingCount}
          note="Requires Action"
          noteColor="text-red-500"
        />
        <KPICard
          label="Sold Units"
          value={isLoading ? '—' : soldCount}
          note="Exceeding Target"
          noteColor="text-green-600"
        />
        <KPICard
          label="Doc Verification"
          value={isLoading ? '—' : docQueueCount}
          note="In Queue"
          noteColor="text-gray-500"
        />
      </div>

      {/* Filter Panel */}
      {filterOpen && (
        <FilterPanel
          search={search}
          onSearch={(v) => { setSearch(v); setPage(1); }}
          propertyType={propertyType}
          onPropertyType={(v) => { setPropertyType(v); setPage(1); }}
          workflowStatus={workflowStatus}
          onWorkflowStatus={(v) => { setWorkflowStatus(v); setPage(1); }}
          onReset={handleReset}
        />
      )}

      {/* Property Card Grid */}
      {isLoading ? (
        <div className="grid grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 shadow-sm h-72 animate-pulse" />
          ))}
        </div>
      ) : !properties.length ? (
        <div className="bg-white rounded-xl border border-gray-200 py-20 text-center">
          <p className="text-gray-400 text-sm">No properties found</p>
          <button
            onClick={() => setCreateOpen(true)}
            className="mt-4 bg-gold text-navy font-semibold px-4 py-2 rounded-lg hover:opacity-90 text-sm"
          >
            + Create Property
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {properties.map((p) => (
              <PropertyCard
                key={p.id}
                property={p}
                onView={handleView}
                onEdit={handleEdit}
              />
            ))}
          </div>
          {data && (
            <div className="mt-6">
              <Pagination
                page={page}
                total={data.total}
                limit={data.limit}
                onPageChange={setPage}
              />
            </div>
          )}
        </>
      )}

      {/* Modals */}
      <CreatePropertyModal open={createOpen} onClose={() => setCreateOpen(false)} />
      <PropertyDetailModal
        property={selectedProperty}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        onEdit={(p) => {
          setDetailOpen(false);
          setSelectedProperty(p);
          setEditOpen(true);
        }}
      />
      <EditPropertyModal
        property={selectedProperty}
        open={editOpen}
        onClose={() => setEditOpen(false)}
      />
    </div>
  );
};

export default SuperAdminPropertiesPage;
