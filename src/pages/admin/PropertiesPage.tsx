import React, { useState } from 'react';
import {
  Check,
  ClipboardCheck,
  Download,
  ExternalLink,
  FileText,
  GitBranch,
  Home,
  MapPin,
  RefreshCw,
  X,
} from 'lucide-react';
import { useProperties, useProperty, usePropertyDocuments, usePropertyWorkflow } from '../../hooks/useProperties';
import { Pagination } from '../../components/ui/Pagination';
import { resolveFileUrl } from '../../lib/file-url';
import type { WorkflowDocument, WorkflowHistoryEntry } from '../../api/properties.api';
import type { Property, PropertyType, WorkflowStatus } from '../../types';

type PropertyDisplayStatus = 'Available' | 'In Progress' | 'Completed';

const workflowLabels: Record<WorkflowStatus, string> = {
  AVAILABLE: 'Available',
  BOOKING_INITIATED: 'Booking Initiated',
  TOKEN_RECEIVED: 'Token Received',
  ADVANCE_PAYMENT: 'Advance Payment',
  REGISTRATION_PENDING: 'Registration Pending',
  FINAL_SETTLEMENT_PENDING: 'Final Settlement Pending',
  COMPLETED: 'Completed',
};

function stringField(value: unknown) {
  return typeof value === 'string' ? value : '';
}

function firstPropertyImageUrl(property: Property) {
  const extra = property as Property & Record<string, unknown>;
  const image = property.images?.[0] as ({ url?: string } & Record<string, unknown>) | undefined;

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

function locationFor(property: Property) {
  return [property.address, property.city, property.district, property.state, property.pincode].filter(Boolean).join(', ') || '-';
}

function displayName(property: Property) {
  return property.propertyName || property.projectName || '-';
}

function statusKind(status: WorkflowStatus) {
  if (status === 'COMPLETED') return 'complete';
  if (status === 'FINAL_SETTLEMENT_PENDING') return 'danger';
  if (status === 'AVAILABLE') return 'active';
  return 'progress';
}

function displayStatus(property: Property): PropertyDisplayStatus {
  if (property.workflowStatus === 'COMPLETED') return 'Completed';
  if (property.workflowStatus === 'AVAILABLE') return 'Available';
  return 'In Progress';
}

function typeLabel(type: PropertyType) {
  if (type === 'PLOT') return 'Plots';
  return type.charAt(0) + type.slice(1).toLowerCase();
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number | string;
  accent: string;
}) {
  return (
    <div className={`rounded-sm border border-gray-100 bg-amber-50/30 p-5 shadow-sm ${accent}`}>
      <p className="text-xs font-bold text-gray-700">{label}</p>
      <p className="mt-3 text-3xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

function Pill({ children, tone }: { children: React.ReactNode; tone: 'green' | 'gold' | 'red' | 'muted' }) {
  const toneClass = {
    green: 'bg-teal-50 text-teal-700',
    gold: 'bg-amber-100 text-gold',
    red: 'bg-red-50 text-red-700',
    muted: 'bg-gray-100 text-gray-600',
  }[tone];

  return <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${toneClass}`}>{children}</span>;
}

function PropertyCard({
  property,
  onDetails,
}: {
  property: Property;
  onDetails: () => void;
}) {
  const kind = statusKind(property.workflowStatus);
  const [imageFailed, setImageFailed] = useState(false);
  const imageUrl = imageFailed ? '' : firstPropertyImageUrl(property);

  return (
    <article className="overflow-hidden border border-gray-200 bg-white shadow-sm">
      <div className="relative h-40 overflow-hidden bg-gradient-to-br from-teal-900 via-gray-800 to-gold/70">
        {imageUrl && (
          <img
            src={imageUrl}
            alt={displayName(property)}
            onError={() => setImageFailed(true)}
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-black/10" />
        <div className="absolute left-4 top-4 flex gap-2">
          <Pill tone={kind === 'active' ? 'green' : kind === 'danger' ? 'red' : 'gold'}>
            {workflowLabels[property.workflowStatus]}
          </Pill>
          <Pill tone="gold">{typeLabel(property.propertyType)}</Pill>
        </div>
      </div>
      <div className="space-y-3 p-5">
        <div>
          <h2 className="text-lg font-bold text-gray-900">{displayName(property)}</h2>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-gray-600">
            <MapPin className="h-4 w-4 text-gold" />
            {locationFor(property)}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <GitBranch className="h-4 w-4 text-gold" />
            <span className="font-semibold text-gray-800">{workflowLabels[property.workflowStatus]}</span>
          </div>
          <div className="flex items-center gap-2">
            <Home className="h-4 w-4 text-teal-700" />
            <span className="font-semibold text-gray-800">Plot: {property.plotNumber || '-'}</span>
          </div>
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-gold" />
            <span className="font-semibold text-gray-800">Property ID: {property.propertyId || '-'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Pill tone={kind === 'complete' ? 'green' : kind === 'danger' ? 'red' : 'gold'}>
              {workflowLabels[property.workflowStatus]}
            </Pill>
          </div>
        </div>

        <button
          type="button"
          onClick={onDetails}
          className="mt-2 w-full bg-gold px-4 py-3 text-sm font-bold text-white transition hover:bg-gold-light hover:text-navy"
        >
          View Details
        </button>
      </div>
    </article>
  );
}

function LifecycleStep({
  label,
  state,
}: {
  label: string;
  state: 'done' | 'current' | 'pending';
}) {
  const iconClass =
    state === 'done'
      ? 'bg-teal-700 text-white'
      : state === 'current'
        ? 'bg-gold text-navy ring-4 ring-gold/20'
        : 'bg-stone-200 text-stone-500';

  return (
    <div className="flex flex-col items-center gap-2">
      <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${iconClass}`}>
        {state === 'done' ? <Check className="h-5 w-5" /> : state === 'current' ? <GitBranch className="h-5 w-5" /> : <Home className="h-5 w-5" />}
      </span>
      <span className={`text-xs font-bold ${state === 'current' ? 'text-gold' : 'text-gray-600'}`}>{label}</span>
    </div>
  );
}

const workflowOrder: WorkflowStatus[] = [
  'AVAILABLE',
  'BOOKING_INITIATED',
  'TOKEN_RECEIVED',
  'ADVANCE_PAYMENT',
  'REGISTRATION_PENDING',
  'FINAL_SETTLEMENT_PENDING',
  'COMPLETED',
];

function lifecycleState(status: WorkflowStatus, requiredStatus: WorkflowStatus): 'done' | 'current' | 'pending' {
  const currentIndex = workflowOrder.indexOf(status);
  const requiredIndex = workflowOrder.indexOf(requiredStatus);
  if (currentIndex < requiredIndex) return 'pending';
  if (currentIndex === requiredIndex && status !== 'COMPLETED') return 'current';
  return 'done';
}

function formatWorkflowDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function readableEnum(value: string) {
  const labels: Record<string, string> = {
    PROPERTY_IMAGE: 'Property Image',
    LAYOUT_DOCUMENT: 'Layout Document',
    SALE_DEED: 'Sale Deed',
    APPROVAL_DOCUMENT: 'Approval Document',
    OTHER: 'Other Document',
  };
  return labels[value] ?? value.toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function isTechnicalUserId(value: string) {
  return (
    /^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(value) ||
    /^[0-9a-f]{8,}$/i.test(value) ||
    /^user\s+[0-9a-f]{8}(?:[0-9a-f-]*)$/i.test(value)
  );
}

function workflowActor(entry: WorkflowHistoryEntry) {
  const extra = entry as unknown as {
    updatedByUser?: { name?: string; fullName?: string; email?: string };
    createdByUser?: { name?: string; fullName?: string; email?: string };
    performedByUser?: { name?: string; fullName?: string; email?: string };
    performedBy?: string | { name?: string; fullName?: string; email?: string; id?: string };
  };
  const performedByObject = typeof extra.performedBy === 'object' ? extra.performedBy : undefined;
  const user = extra.updatedByUser ?? extra.createdByUser ?? extra.performedByUser ?? performedByObject;
  const userLabel = user?.fullName || user?.name || user?.email;
  if (userLabel) return isTechnicalUserId(userLabel) ? 'Admin' : userLabel;

  const actor =
    typeof extra.performedBy === 'string'
      ? extra.performedBy.trim()
      : performedByObject?.id?.trim();
  if (!actor) return 'System';
  if (/^system$/i.test(actor)) return 'System';
  if (/admin/i.test(actor)) return 'Admin';
  if (isTechnicalUserId(actor)) return 'Admin';
  return actor;
}

function workflowDescription(entry: WorkflowHistoryEntry) {
  const defaultDescription = `Property workflow updated to ${workflowLabels[entry.toStatus]}.`;
  const remarks = entry.remarks?.trim();
  if (!remarks) return defaultDescription;

  if (/property workflow updated due to booking status change/i.test(remarks)) {
    return defaultDescription;
  }

  let description = remarks;
  Object.entries(workflowLabels).forEach(([status, label]) => {
    description = description.replace(new RegExp(`\\b${status}\\b`, 'gi'), label);
  });
  description = description.replace(
    /\b[0-9a-f]{8}-[0-9a-f-]{27}\b/gi,
    'Admin',
  );

  return /[.!?]$/.test(description) ? description : `${description}.`;
}

function cleanWorkflowHistory(entries: WorkflowHistoryEntry[]) {
  const sorted = [...entries].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return sorted.filter((entry, index) => {
    const previous = sorted[index - 1];
    if (!previous) return true;
    const sameContent =
      entry.toStatus === previous.toStatus &&
      workflowDescription(entry).toLowerCase() === workflowDescription(previous).toLowerCase();
    const timeDifference = Math.abs(new Date(previous.createdAt).getTime() - new Date(entry.createdAt).getTime());
    return !sameContent || timeDifference > 5 * 60 * 1000;
  });
}

function documentUrl(document: WorkflowDocument) {
  const extra = document as WorkflowDocument & {
    url?: string;
    fileUrl?: string;
    signedUrl?: string;
  };
  const path = extra.signedUrl || extra.fileUrl || extra.url || document.documentUrl;
  if (!path || ['-', 'null', 'undefined'].includes(path.trim().toLowerCase())) return '';
  return resolveFileUrl(path);
}

function documentFileName(document: WorkflowDocument) {
  const extra = document as WorkflowDocument & { fileName?: string; originalName?: string; name?: string };
  const explicitName = extra.originalName || extra.fileName || extra.name;
  if (explicitName) return explicitName;

  const path = document.documentUrl?.split('?')[0];
  const finalSegment = path?.split('/').filter(Boolean).at(-1);
  if (!finalSegment) return 'Uploaded';
  try {
    return decodeURIComponent(finalSegment);
  } catch {
    return finalSegment;
  }
}

function PropertyDetailModal({ property, onClose }: { property: Property; onClose: () => void }) {
  const { data: latestProperty, isLoading: isPropertyLoading } = useProperty(property.id);
  const { data: workflowHistory = [], isLoading: isWorkflowLoading } = usePropertyWorkflow(property.id);
  const { data: documents = [], isLoading: isDocumentsLoading } = usePropertyDocuments(property.id);
  const detailedProperty = latestProperty ?? property;
  const visibleWorkflowHistory = cleanWorkflowHistory(workflowHistory);
  const [imageFailed, setImageFailed] = useState(false);
  const imageUrl = imageFailed ? '' : firstPropertyImageUrl(detailedProperty);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-[1px]">
      <div className="max-h-[90vh] w-full max-w-6xl overflow-hidden rounded-md bg-white shadow-2xl">
        <div className="max-h-[90vh] overflow-y-auto">
          <div className="relative h-64 overflow-hidden bg-gradient-to-br from-teal-900 via-gray-800 to-gold/70">
            {imageUrl && (
              <img
                src={imageUrl}
                alt={displayName(detailedProperty)}
                onError={() => setImageFailed(true)}
                className="absolute inset-0 h-full w-full object-cover"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/10" />
            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 rounded-full bg-black/35 p-2 text-white transition hover:bg-black/55"
              aria-label="Close details"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="absolute bottom-6 left-6 right-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <Pill tone="gold">{typeLabel(detailedProperty.propertyType)}</Pill>
                <h2 className="mt-4 text-3xl font-bold text-white drop-shadow">{displayName(detailedProperty)}</h2>
                <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-white">
                  <MapPin className="h-4 w-4" />
                  {locationFor(detailedProperty)}
                </p>
              </div>
              <div className="grid w-full max-w-md grid-cols-1 gap-2 sm:grid-cols-2">
                <div className="rounded-sm border border-white/80 bg-white px-4 py-3 text-gray-900 shadow-lg">
                  <p className="text-[10px] font-black uppercase tracking-wide text-teal-700">Workflow Status</p>
                  <p className="mt-1 text-base font-black uppercase">
                    {workflowLabels[detailedProperty.workflowStatus]}
                  </p>
                </div>
                <div className="rounded-sm border border-gold bg-white px-4 py-3 text-gray-900 shadow-lg">
                  <p className="text-[10px] font-black uppercase tracking-wide text-gold">Property ID</p>
                  <p className="mt-1 break-all font-mono text-base font-black">#{detailedProperty.propertyId}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-6 bg-amber-50/40 p-6 lg:grid-cols-[2fr_1fr]">
            <div className="space-y-5">
              <section className="rounded-lg border border-gray-200 border-t-gold border-t-2 bg-white p-5 shadow-sm">
                <div className="mb-5 flex items-center gap-2">
                  <GitBranch className="h-5 w-5 text-gold" />
                  <h3 className="text-lg font-bold text-gray-900">Property Lifecycle</h3>
                </div>
                <p className="mb-5 text-sm font-semibold text-gray-700">
                  Current status: {workflowLabels[detailedProperty.workflowStatus]}
                </p>
                <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr] items-center gap-3">
                  <LifecycleStep label="Token" state={lifecycleState(detailedProperty.workflowStatus, 'TOKEN_RECEIVED')} />
                  <div className="h-px bg-stone-200" />
                  <LifecycleStep label="Advance" state={lifecycleState(detailedProperty.workflowStatus, 'ADVANCE_PAYMENT')} />
                  <div className="h-px bg-stone-200" />
                  <LifecycleStep label="Registration" state={lifecycleState(detailedProperty.workflowStatus, 'REGISTRATION_PENDING')} />
                  <div className="h-px bg-stone-200" />
                  <LifecycleStep label="Final Settlement" state={lifecycleState(detailedProperty.workflowStatus, 'FINAL_SETTLEMENT_PENDING')} />
                </div>
              </section>

              <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                <h3 className="mb-4 text-lg font-bold text-gray-900">Property Details</h3>
                <div className="grid gap-4 text-sm sm:grid-cols-2">
                  {[
                    ['Project', detailedProperty.projectName],
                    ['Plot Number', detailedProperty.plotNumber],
                    ['Property Type', typeLabel(detailedProperty.propertyType)],
                    ['Square Feet', detailedProperty.squareFeet ? String(detailedProperty.squareFeet) : '-'],
                    ['Approval Status', detailedProperty.approvalStatus || '-'],
                    ['Map Location', detailedProperty.mapLocation || '-'],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <p className="text-xs font-bold uppercase text-gray-500">{label}</p>
                      <p className="mt-1 font-semibold text-gray-900">{value}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-gold" />
                  <h3 className="text-lg font-bold text-gray-900">Property Documents</h3>
                </div>
                {isDocumentsLoading ? (
                  <p className="text-sm text-gray-500">Loading documents...</p>
                ) : documents.length ? (
                  <div className="overflow-hidden rounded border border-gray-100">
                    <div className="grid grid-cols-[1.1fr_1.4fr_auto] gap-3 bg-stone-50 px-4 py-2 text-xs font-bold uppercase text-gray-500">
                      <span>Document Type</span>
                      <span>File / Status</span>
                      <span>Action</span>
                    </div>
                    {documents.map((document) => {
                      const fileUrl = documentUrl(document);
                      return (
                        <div
                          key={document.id}
                          className="grid grid-cols-[1.1fr_1.4fr_auto] items-center gap-3 border-t border-gray-100 px-4 py-3"
                        >
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 shrink-0 text-teal-700" />
                            <p className="text-sm font-bold text-gray-900">{readableEnum(document.documentType)}</p>
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-gray-800">
                              {fileUrl ? documentFileName(document) : 'Not uploaded'}
                            </p>
                            {fileUrl && (
                              <p className="text-xs text-gray-500">Uploaded {formatWorkflowDate(document.uploadedAt)}</p>
                            )}
                          </div>
                          {fileUrl ? (
                            <div className="flex items-center gap-2">
                              <a
                                href={fileUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-xs font-bold text-gold hover:underline"
                              >
                                View <ExternalLink className="h-3.5 w-3.5" />
                              </a>
                              <a
                                href={fileUrl}
                                download
                                className="inline-flex items-center gap-1 text-xs font-bold text-teal-700 hover:underline"
                              >
                                Download <Download className="h-3.5 w-3.5" />
                              </a>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="grid grid-cols-[1.1fr_1.4fr_auto] items-center gap-3 rounded border border-gray-100 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-gray-400" />
                      <p className="text-sm font-bold text-gray-900">Property Documents</p>
                    </div>
                    <p className="text-sm font-semibold text-gray-500">Not uploaded</p>
                    <span className="text-sm text-gray-400">-</span>
                  </div>
                )}
              </section>
            </div>

            <aside>
              <section>
                <h3 className="mb-4 text-lg font-bold text-gray-900">Workflow History</h3>
                {isPropertyLoading || isWorkflowLoading ? (
                  <p className="text-sm text-gray-500">Loading workflow...</p>
                ) : visibleWorkflowHistory.length ? (
                  <div className="space-y-3">
                    {visibleWorkflowHistory.map((entry) => (
                      <div key={entry.id} className="flex gap-3 rounded-lg border border-gray-100 bg-white p-3 shadow-sm">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-700 text-white">
                          <ClipboardCheck className="h-4 w-4" />
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-gray-900">{workflowLabels[entry.toStatus]}</p>
                          <p className="mt-0.5 text-xs font-semibold text-gray-500">
                            {formatWorkflowDate(entry.createdAt)}
                          </p>
                          <p className="mt-2 text-xs leading-5 text-gray-700">{workflowDescription(entry)}</p>
                          <p className="mt-1 text-xs text-gray-500">Updated by: {workflowActor(entry)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No workflow history available.</p>
                )}
              </section>
            </aside>
          </div>

          <div className="flex justify-end border-t border-gray-100 bg-white px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              className="border border-gold bg-white px-8 py-3 text-sm font-bold text-gold transition hover:bg-amber-50"
            >
              CLOSE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const AdminPropertiesPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<PropertyDisplayStatus | ''>('');
  const [workflowStatus, setWorkflowStatus] = useState<WorkflowStatus | ''>('');
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

  const { data, isLoading } = useProperties({
    page,
    limit: 24,
    workflowStatus: workflowStatus || undefined,
  });
  const {
    data: availableProperties,
    isLoading: isAvailableCountLoading,
    isError: isAvailableCountError,
  } = useProperties({ limit: 1, workflowStatus: 'AVAILABLE' });
  const {
    data: completedProperties,
    isLoading: isCompletedCountLoading,
    isError: isCompletedCountError,
  } = useProperties({ limit: 1, workflowStatus: 'COMPLETED' });
  const {
    data: advancePaidProperties,
    isLoading: isAdvancePaidCountLoading,
    isError: isAdvancePaidCountError,
  } = useProperties({ limit: 1, workflowStatus: 'ADVANCE_PAYMENT' });
  const {
    data: finalSettlementPendingProperties,
    isLoading: isFinalSettlementPendingCountLoading,
    isError: isFinalSettlementPendingCountError,
  } = useProperties({ limit: 1, workflowStatus: 'FINAL_SETTLEMENT_PENDING' });

  const apiProperties = data?.data ?? [];
  const properties = apiProperties;
  const filteredProperties = properties.filter((property) => {
    if (statusFilter && displayStatus(property) !== statusFilter) return false;
    if (workflowStatus && property.workflowStatus !== workflowStatus) return false;
    return true;
  });
  const counts = {
    activeProperties: availableProperties?.total ?? 0,
    soldProperties: completedProperties?.total ?? 0,
    advancePaid: advancePaidProperties?.total ?? 0,
    finalSettlementPending: finalSettlementPendingProperties?.total ?? 0,
    settlementCompleted: completedProperties?.total ?? 0,
  };
  const isStatsLoading =
    isAvailableCountLoading ||
    isCompletedCountLoading ||
    isAdvancePaidCountLoading ||
    isFinalSettlementPendingCountLoading;
  const hasStatsError =
    isAvailableCountError ||
    isCompletedCountError ||
    isAdvancePaidCountError ||
    isFinalSettlementPendingCountError;
  const statValue = (value: number) => (isStatsLoading ? '-' : value);

  const resetFilters = () => {
    setStatusFilter('');
    setWorkflowStatus('');
    setPage(1);
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Properties</h1>
        <p className="mt-1 text-sm text-gray-600">Super admin created properties should be displayed on admin side</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Active Properties" value={statValue(counts.activeProperties)} accent="border-t-2 border-t-gold" />
        <StatCard label="Sold Properties" value={statValue(counts.soldProperties)} accent="border-t-2 border-t-teal-700" />
        <StatCard label="Advance Paid" value={statValue(counts.advancePaid)} accent="border-t-2 border-t-gold-light" />
        <StatCard label="Final Settlement Pending" value={statValue(counts.finalSettlementPending)} accent="border-t-2 border-t-red-600" />
        <StatCard label="Settlement Completed" value={statValue(counts.settlementCompleted)} accent="border-t-2 border-t-teal-300" />
      </div>
      {hasStatsError && (
        <p className="text-sm font-semibold text-red-600">Unable to load some property statistics. Unavailable counts are shown as 0.</p>
      )}

      <div className="flex flex-col gap-3 border border-gray-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row">
          <select
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value as PropertyDisplayStatus | '');
              setPage(1);
            }}
            className="h-10 rounded-sm border border-gray-200 bg-amber-50/60 px-4 text-sm font-semibold text-gray-700 outline-none focus:border-gold"
          >
            <option value="">Status: All</option>
            <option value="Available">Available</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>
          <select
            value={workflowStatus}
            onChange={(event) => {
              setWorkflowStatus(event.target.value as WorkflowStatus | '');
              setPage(1);
            }}
            className="h-10 rounded-sm border border-gray-200 bg-amber-50/60 px-4 text-sm font-semibold text-gray-700 outline-none focus:border-gold"
          >
            <option value="">Workflow Stage: All</option>
            {Object.entries(workflowLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={resetFilters}
          className="inline-flex items-center gap-2 text-sm font-semibold text-gold"
        >
          <RefreshCw className="h-4 w-4" />
          Reset filters
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-80 animate-pulse bg-white shadow-sm" />
          ))}
        </div>
      ) : !filteredProperties.length ? (
        <div className="border border-gray-200 bg-white p-12 text-center text-gray-500">No properties found</div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {filteredProperties.map((property) => (
            <PropertyCard
              key={property.id}
              property={property}
              onDetails={() => setSelectedProperty(property)}
            />
          ))}
        </div>
      )}

      {data && apiProperties.length > 0 && (
        <div className="mt-6 overflow-hidden rounded-lg border border-gray-200 bg-white">
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
