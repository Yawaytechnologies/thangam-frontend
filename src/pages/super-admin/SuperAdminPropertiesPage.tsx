import React, { useEffect, useState } from 'react';
import {
  useProperties,
  useCreateProperty,
  useProperty,
  useUpdateProperty,
  useUpdatePropertyWorkflow,
  useUploadPropertyImages,
  usePropertyDocuments,
} from '../../hooks/useProperties';
import { useDocumentUrl, useUploadDocument } from '../../hooks/useDocuments';
import { resolveFileUrl } from '../../lib/file-url';
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

function stringField(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function mapPropertyToEditForm(property: Property): UpdatePropertyData {
  return {
    propertyName: property.propertyName,
    propertyCode: property.propertyId,
    projectName: property.projectName,
    plotNumber: property.plotNumber,
    propertyType: property.propertyType,
    squareFeet: property.squareFeet,
    address: property.address ?? '',
    city: property.city ?? '',
    district: property.district ?? '',
    state: property.state ?? '',
    pincode: property.pincode ?? '',
    mapLocation: property.mapLocation ?? '',
  };
}

function firstPropertyImageUrl(property: Property) {
  const extra = property as Property & Record<string, unknown>;
  const first = property.images?.[0];

  if (typeof first === 'string') return resolveFileUrl(first);

  const image = first as ({ url?: string; imageUrl?: string; documentUrl?: string } & Record<string, unknown>) | undefined;

  return resolveFileUrl(
    image?.url ||
      stringField(image?.imageUrl) ||
      stringField(image?.image_url) ||
      stringField(image?.documentUrl) ||
      stringField(extra.propertyImageUrl) ||
      stringField(extra.property_image_url) ||
      stringField(extra.imageUrl) ||
      stringField(extra.image_url) ||
      stringField(extra.thumbnail) ||
      stringField(extra.thumbnailUrl),
  );
}

function propertyImageUrls(property: Property): string[] {
  const extra = property as Property & Record<string, unknown>;
  const list = Array.isArray(property.images) ? property.images : [];

  return Array.from(
    new Set(
      list
        .map((item) => {
          if (typeof item === 'string') return resolveFileUrl(item);
          const image = item as { url?: string; imageUrl?: string; documentUrl?: string } & Record<string, unknown>;
          return resolveFileUrl(
            image?.url ||
              stringField(image?.imageUrl) ||
              stringField(image?.image_url) ||
              stringField(image?.documentUrl) ||
              stringField(extra.propertyImageUrl) ||
              stringField(extra.property_image_url) ||
              stringField(extra.imageUrl) ||
              stringField(extra.image_url),
          );
        })
        .filter(Boolean),
    ),
  );
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

function ImagePreviewModal({
  open,
  onClose,
  imageUrl,
  title,
}: {
  open: boolean;
  onClose: () => void;
  imageUrl: string;
  title: string;
}) {
  if (!open || !imageUrl) return null;

  return (
    <Modal open={open} onClose={onClose} title={title} size="3xl">
      <div className="p-2">
        <img src={imageUrl} alt={title} className="max-h-[70vh] w-full rounded-xl object-contain bg-gray-100" />
      </div>
    </Modal>
  );
}

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
  const [imageFailed, setImageFailed] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const imageUrl = imageFailed ? '' : firstPropertyImageUrl(property);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
      {/* Image area */}
      <div className="h-44 relative bg-gradient-to-br from-navy-mid to-navy flex items-end overflow-hidden">
        {imageUrl ? (
          <button
            type="button"
            onClick={() => setPreviewOpen(true)}
            className="absolute inset-0 block h-full w-full cursor-zoom-in"
            aria-label={`View image for ${property.propertyName}`}
          >
            <img
              src={imageUrl}
              alt={property.propertyName}
              className="h-full w-full object-cover"
              onError={() => setImageFailed(true)}
            />
          </button>
        ) : (
          <>
            <div className="absolute inset-0 bg-gradient-to-br from-navy via-navy-mid to-gray-800 opacity-90" />
            <div className="absolute inset-0 opacity-10"
              style={{ backgroundImage: 'radial-gradient(circle at 30% 50%, #c9a227 0%, transparent 60%)' }} />
          </>
        )}
        {imageUrl && <div className="absolute inset-0 bg-black/20" />}

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

      <ImagePreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        imageUrl={imageUrl}
        title={property.propertyName}
      />

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
  const uploadPropertyImages = useUploadPropertyImages();
  const uploadDocument = useUploadDocument();
  const [form, setForm] = useState<CreatePropertyData>({
    propertyName: '',
    propertyCode: '',
    projectName: '',
    plotNumber: '',
    propertyType: 'RESIDENTIAL',
    squareFeet: 0,
    address: '',
    city: '',
    district: '',
    state: '',
    pincode: '',
    mapLocation: '',
  });
  const [propertyImageFiles, setPropertyImageFiles] = useState<File[]>([]);
  const [propertyDocumentFiles, setPropertyDocumentFiles] = useState<File[]>([]);
  const [submitError, setSubmitError] = useState('');

  function handleClose() {
    setForm({
      propertyName: '',
      propertyCode: '',
      projectName: '',
      plotNumber: '',
      propertyType: 'RESIDENTIAL',
      squareFeet: 0,
      address: '',
      city: '',
      district: '',
      state: '',
      pincode: '',
      mapLocation: '',
    });
    setPropertyImageFiles([]);
    setPropertyDocumentFiles([]);
    setSubmitError('');
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError('');

    try {
      const newProperty = await create.mutateAsync({
        ...form,
        squareFeet: Number(form.squareFeet) || undefined,
      });

      if (!newProperty?.id) {
        throw new Error('Property created but no ID was returned.');
      }

      await Promise.all([
        propertyImageFiles.length > 0
          ? uploadPropertyImages.mutateAsync({ id: newProperty.id, files: propertyImageFiles })
          : Promise.resolve(),
        ...propertyDocumentFiles.map((file) =>
          uploadDocument.mutateAsync({
            entityType: 'property',
            entityId: newProperty.id,
            documentType: 'LAYOUT_DOCUMENT',
            file,
          }),
        ),
      ]);

      handleClose();
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : 'Property creation failed. Please try again.';
      setSubmitError(message);
    }
  }

  const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold bg-white';
  const labelCls = 'block text-xs font-medium text-gray-600 mb-1';

  return (
    <Modal
      open={open}
      onClose={handleClose}
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
              <label className={labelCls}>Property Code</label>
              <input
                type="text"
                value={form.propertyCode ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, propertyCode: e.target.value || undefined }))}
                className={inputCls}
                placeholder="e.g. PROP-001"
              />
            </div>

            <div>
              <label className={labelCls}>Project Name</label>
              <input
                type="text"
                value={form.projectName}
                onChange={(e) => setForm((f) => ({ ...f, projectName: e.target.value }))}
                className={inputCls}
                placeholder="e.g. Sri Thangam Project"
              />
            </div>

            <div>
              <label className={labelCls}>Plot Number</label>
              <input
                type="text"
                value={form.plotNumber}
                onChange={(e) => setForm((f) => ({ ...f, plotNumber: e.target.value }))}
                className={inputCls}
                placeholder="e.g. 12A"
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
              <label className={labelCls}>Square Feet</label>
              <input
                type="number"
                min="0"
                value={form.squareFeet ?? 0}
                onChange={(e) => setForm((f) => ({ ...f, squareFeet: Number(e.target.value) || 0 }))}
                className={inputCls}
                placeholder="0"
              />
            </div>

            <div>
              <label className={labelCls}>Address</label>
              <input
                type="text"
                value={form.address ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value || undefined }))}
                className={inputCls}
                placeholder="Street / Area"
              />
            </div>

            <div>
              <label className={labelCls}>City</label>
              <input
                type="text"
                value={form.city ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, city: e.target.value || undefined }))}
                className={inputCls}
                placeholder="City"
              />
            </div>

            <div>
              <label className={labelCls}>District</label>
              <input
                type="text"
                value={form.district ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, district: e.target.value || undefined }))}
                className={inputCls}
                placeholder="District"
              />
            </div>

            <div>
              <label className={labelCls}>State</label>
              <input
                type="text"
                value={form.state ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, state: e.target.value || undefined }))}
                className={inputCls}
                placeholder="Tamil Nadu"
              />
            </div>

            <div>
              <label className={labelCls}>Pincode</label>
              <input
                type="text"
                value={form.pincode ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, pincode: e.target.value || undefined }))}
                className={inputCls}
                placeholder="600001"
              />
            </div>

            <div>
              <label className={labelCls}>Map Location</label>
              <input
                type="text"
                value={form.mapLocation ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, mapLocation: e.target.value || undefined }))}
                className={inputCls}
                placeholder="Google Maps / URL"
              />
            </div>

          </div>

          {/* Right column */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-gold text-xs font-semibold uppercase tracking-wide mb-3">
              <span>Media &amp; Notes</span>
            </div>

            {/* Upload boxes */}
            <div>
              <label className={labelCls}>Upload Property Images</label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => setPropertyImageFiles(Array.from(e.target.files ?? []))}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gold-50 file:text-gold-700 hover:file:bg-gold-100"
              />
            </div>

            <div>
              <label className={labelCls}>Upload Property Documents</label>
              <input
                type="file"
                accept=".pdf,.doc,.docx,image/*"
                multiple
                onChange={(e) => setPropertyDocumentFiles(Array.from(e.target.files ?? []))}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gold-50 file:text-gold-700 hover:file:bg-gold-100"
              />
            </div>

            {submitError ? (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{submitError}</p>
            ) : null}

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
            onClick={handleClose}
            className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 text-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={create.isPending || uploadPropertyImages.isPending || uploadDocument.isPending}
            className="bg-gold text-navy font-semibold px-4 py-2 rounded-lg hover:opacity-90 disabled:opacity-50 text-sm"
          >
            {create.isPending || uploadPropertyImages.isPending || uploadDocument.isPending
              ? 'Creating & Uploading…'
              : '+ Create Property'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Property Detail Modal ────────────────────────────────────────────────────

function DocumentPreviewButton({ doc }: { doc: { id: string; documentType: string; documentUrl: string } }) {
  const { data } = useDocumentUrl(doc.id);
  const fileUrl = data?.signedUrl || doc.documentUrl;

  return (
    <button
      type="button"
      onClick={() => window.open(resolveFileUrl(fileUrl), '_blank', 'noopener,noreferrer')}
      className="flex w-full items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700 hover:bg-gray-50"
    >
      <span className="truncate pr-2">{doc.documentType}</span>
      <span className="text-gold font-semibold">View</span>
    </button>
  );
}

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

  const docs = usePropertyDocuments(property.id);
  const imageUrls = propertyImageUrls(property);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState('');
  const [imagePage, setImagePage] = useState(1);
  const [docPage, setDocPage] = useState(1);
  const location = [property.city, property.state].filter(Boolean).join(', ') || 'Location not set';

  useEffect(() => {
    setImagePage(1);
    setDocPage(1);
  }, [property.id]);

  const imagePageSize = 4;
  const docPageSize = 5;
  const pagedImageUrls = imageUrls.slice((imagePage - 1) * imagePageSize, imagePage * imagePageSize);
  const pagedDocuments = (docs.data ?? []).slice((docPage - 1) * docPageSize, docPage * docPageSize);

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
        {imageUrls[0] ? (
          <button
            type="button"
            onClick={() => { setPreviewImageUrl(imageUrls[0]); setPreviewOpen(true); }}
            className="absolute inset-0 block h-full w-full cursor-zoom-in"
            aria-label={`View main image for ${property.propertyName}`}
          >
            <img src={imageUrls[0]} alt={property.propertyName} className="h-full w-full object-cover" />
          </button>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-navy via-navy-mid to-gray-800" />
        )}
        {imageUrls[0] && <div className="absolute inset-0 bg-black/25" />}
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

      {imageUrls.length > 1 && (
        <>
          <div className="grid grid-cols-4 gap-3 mb-3">
            {pagedImageUrls.map((url, index) => {
              const globalIndex = (imagePage - 1) * imagePageSize + index;
              return (
                <button
                  key={`${url}-${globalIndex}`}
                  type="button"
                  onClick={() => { setPreviewImageUrl(url); setPreviewOpen(true); }}
                  className="h-20 w-full overflow-hidden rounded-xl border border-gray-200 cursor-zoom-in"
                  aria-label={`View image ${globalIndex + 1} for ${property.propertyName}`}
                >
                  <img
                    src={url}
                    alt={`${property.propertyName} image ${globalIndex + 1}`}
                    className="h-full w-full object-cover"
                  />
                </button>
              );
            })}
          </div>
          {imageUrls.length > imagePageSize && (
            <div className="mb-6">
              <Pagination
                page={imagePage}
                total={imageUrls.length}
                limit={imagePageSize}
                onPageChange={setImagePage}
              />
            </div>
          )}
        </>
      )}

      <ImagePreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        imageUrl={previewImageUrl}
        title={property.propertyName}
      />

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
              {docs.data?.length ? (
                <div className="space-y-2">
                  {pagedDocuments.map((doc) => (
                    <DocumentPreviewButton key={doc.id} doc={doc} />
                  ))}
                  {docs.data.length > docPageSize && (
                    <div className="pt-1">
                      <Pagination
                        page={docPage}
                        total={docs.data.length}
                        limit={docPageSize}
                        onPageChange={setDocPage}
                      />
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-gray-500">No documents uploaded yet.</p>
              )}
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
          className="border bg-gold border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 text-sm"
        >
          Close
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
  if (!property) return null;

  const update = useUpdateProperty();
  const updateWorkflow = useUpdatePropertyWorkflow();
  const uploadPropertyImages = useUploadPropertyImages();
  const uploadDocument = useUploadDocument();
  const propertyDetails = useProperty(property.id);
  const docs = usePropertyDocuments(property.id);
  const fullProperty = propertyDetails.data ?? property;

  const [form, setForm] = useState<UpdatePropertyData>(() => mapPropertyToEditForm(fullProperty));
  const [workflowStatus, setWorkflowStatus] = useState<WorkflowStatus>(
    property?.workflowStatus ?? 'AVAILABLE'
  );
  const [toast, setToast] = useState(false);
  const [editImageFiles, setEditImageFiles] = useState<File[]>([]);
  const [editDocumentFiles, setEditDocumentFiles] = useState<File[]>([]);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    setForm(mapPropertyToEditForm(fullProperty));
    setWorkflowStatus(fullProperty.workflowStatus ?? 'AVAILABLE');
  }, [fullProperty]);

  function handleClose() {
    setEditImageFiles([]);
    setEditDocumentFiles([]);
    setSubmitError('');
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError('');

    try {
      const workflowChanged = workflowStatus !== property!.workflowStatus;

      await update.mutateAsync({ id: property!.id, data: form });

      await Promise.all([
        editImageFiles.length > 0
          ? uploadPropertyImages.mutateAsync({ id: property!.id, files: editImageFiles })
          : Promise.resolve(),
        ...editDocumentFiles.map((file) =>
          uploadDocument.mutateAsync({
            entityType: 'property',
            entityId: property!.id,
            documentType: 'LAYOUT_DOCUMENT',
            file,
          }),
        ),
      ]);

      if (workflowChanged) {
        await updateWorkflow.mutateAsync({ id: property!.id, data: { workflowStatus } });
      }

      setToast(true);
      setTimeout(() => { setToast(false); handleClose(); }, 1500);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to update property. Please try again.');
    }
  }

  const isPending = update.isPending || updateWorkflow.isPending || uploadPropertyImages.isPending || uploadDocument.isPending;

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
            <label className={labelCls}>Property Code</label>
            <input
              type="text"
              value={form.propertyCode ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, propertyCode: e.target.value || undefined }))}
              className={inputCls}
            />
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
            <label className={labelCls}>Square Feet</label>
            <input
              type="number"
              min="0"
              value={form.squareFeet ?? 0}
              onChange={(e) => setForm((f) => ({ ...f, squareFeet: Number(e.target.value) || 0 }))}
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls}>Address</label>
            <input
              type="text"
              value={form.address ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value || undefined }))}
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
            <label className={labelCls}>District</label>
            <input
              type="text"
              value={form.district ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, district: e.target.value || undefined }))}
              className={inputCls}
            />
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
            <label className={labelCls}>Pincode</label>
            <input
              type="text"
              value={form.pincode ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, pincode: e.target.value || undefined }))}
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls}>Map Location</label>
            <input
              type="text"
              value={form.mapLocation ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, mapLocation: e.target.value || undefined }))}
              className={inputCls}
            />
          </div>
        </div>

        {/* Existing property media */}
        <div className="flex items-center gap-2 text-gold text-xs font-semibold uppercase tracking-wide mb-3">
          <span>Existing Property Images</span>
        </div>
        <div className="mb-4 grid grid-cols-4 gap-3">
          {propertyImageUrls(property).slice(0, 8).map((url, index) => (
            <img
              key={`${property.id}-${index}`}
              src={url}
              alt={`${property.propertyName} existing image ${index + 1}`}
              className="h-20 w-full rounded-xl border border-gray-200 object-cover"
            />
          ))}
          {!propertyImageUrls(property).length && <p className="text-xs text-gray-500 col-span-4">No uploaded images yet.</p>}
        </div>

        <div className="mb-5">
          <label className={labelCls}>Upload More Property Images</label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => setEditImageFiles(Array.from(e.target.files ?? []))}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gold-50 file:text-gold-700 hover:file:bg-gold-100"
          />
        </div>

        <div className="flex items-center gap-2 text-gold text-xs font-semibold uppercase tracking-wide mb-3">
          <span>Existing Property Documents</span>
        </div>
        <div className="mb-4 space-y-2 rounded-xl border border-gray-100 bg-gray-50 p-3">
          {docs.data?.length ? docs.data.map((doc) => (
            <DocumentPreviewButton key={doc.id} doc={doc} />
          )) : <p className="text-xs text-gray-500">No uploaded documents yet.</p>}
        </div>

        <div className="mb-5">
          <label className={labelCls}>Upload More Property Documents</label>
          <input
            type="file"
            accept=".pdf,.doc,.docx,image/*"
            multiple
            onChange={(e) => setEditDocumentFiles(Array.from(e.target.files ?? []))}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gold-50 file:text-gold-700 hover:file:bg-gold-100"
          />
        </div>

        {submitError ? <p className="mb-4 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{submitError}</p> : null}

        {/* Workflow section */}
        <div className="flex items-center gap-2 text-gold text-xs font-semibold uppercase tracking-wide mb-3">
          <span>Workflow Status</span>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-5">
          <div>
            <label className={labelCls}>Workflow Status</label>
            <select
              value={workflowStatus}
              onChange={(e) => setWorkflowStatus(e.target.value as WorkflowStatus)}
              className={inputCls}
            >
              <option value="AVAILABLE">Available</option>
              <option value="BOOKING_INITIATED">Booking Initiated</option>
              <option value="TOKEN_RECEIVED">Token Received</option>
              <option value="ADVANCE_PAYMENT">Advance Payment</option>
              <option value="REGISTRATION_PENDING">Registration Pending</option>
              <option value="FINAL_SETTLEMENT_PENDING">Final Settlement Pending</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={handleClose}
            className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 text-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="bg-gold text-navy font-semibold px-4 py-2 rounded-lg hover:opacity-90 disabled:opacity-50 text-sm"
          >
            {isPending ? 'Saving…' : 'Done'}
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

  const kpiAdvance = useProperties({ workflowStatus: 'ADVANCE_PAYMENT', limit: 1 });
  const kpiSold = useProperties({ workflowStatus: 'COMPLETED', limit: 1 });
  const kpiDocQueue = useProperties({ workflowStatus: 'REGISTRATION_PENDING', limit: 1 });
  const kpiDocQueue2 = useProperties({ workflowStatus: 'FINAL_SETTLEMENT_PENDING', limit: 1 });
  const kpiAll = useProperties({ limit: 1 });

  const properties = data?.data ?? [];

  // KPI totals from dedicated count queries
  const totalAll = kpiAll.data?.total ?? 0;
  const soldCount = kpiSold.data?.total ?? 0;
  const activeCount = totalAll - soldCount;
  const advancePendingCount = kpiAdvance.data?.total ?? 0;
  const docQueueCount = (kpiDocQueue.data?.total ?? 0) + (kpiDocQueue2.data?.total ?? 0);

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
