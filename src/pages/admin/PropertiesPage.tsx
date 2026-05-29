import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  ExternalLink,
  FileText,
  GitBranch,
  Home,
  MapPin,
  RefreshCw,
  Send,
  ShieldCheck,
  X,
} from 'lucide-react';
import { useProperties } from '../../hooks/useProperties';
import { Pagination } from '../../components/ui/Pagination';
import type { Property, PropertyType, WorkflowStatus } from '../../types';

type PropertyDisplayStatus = 'Active' | 'Sold' | 'Under Verification';

const fallbackCounts = {
  activeProperties: 142,
  soldProperties: 86,
  advancePaid: 24,
  finalSettlementPending: 12,
  settlementCompleted: 74,
};

const workflowLabels: Record<WorkflowStatus, string> = {
  AVAILABLE: 'Active',
  BOOKING_INITIATED: 'Booking Initiated',
  TOKEN_RECEIVED: 'Token',
  ADVANCE_PAYMENT: 'Advance Paid',
  REGISTRATION_PENDING: 'Registration',
  FINAL_SETTLEMENT_PENDING: 'Final Settlement Pending',
  COMPLETED: 'Settlement Completed',
};

const propertyImages = [
  'linear-gradient(90deg, rgba(15,20,25,.35), rgba(15,20,25,.02)), url("https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80")',
  'linear-gradient(90deg, rgba(15,20,25,.28), rgba(15,20,25,.03)), url("https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80")',
  'linear-gradient(90deg, rgba(15,20,25,.28), rgba(15,20,25,.03)), url("https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80")',
];

const fallbackProperties: Property[] = [
  {
    id: 'fallback-green-valley',
    propertyId: 'STH-2941',
    propertyName: 'Green Valley Residency',
    projectName: 'Green Valley Residency',
    plotNumber: 'A-104',
    propertyType: 'RESIDENTIAL',
    workflowStatus: 'FINAL_SETTLEMENT_PENDING',
    city: 'East Tambaram',
    state: 'Chennai',
    createdAt: '2023-10-12T00:00:00.000Z',
  },
  {
    id: 'fallback-thangam-heights',
    propertyId: 'STH-2848',
    propertyName: 'Thangam Heights III',
    projectName: 'Thangam Heights III',
    plotNumber: 'P-118',
    propertyType: 'PLOT',
    workflowStatus: 'COMPLETED',
    city: 'Oyalur Village',
    state: 'Kanchipuram',
    createdAt: '2023-09-15T00:00:00.000Z',
  },
  {
    id: 'fallback-platinum-plaza',
    propertyId: 'STH-3012',
    propertyName: 'Sri Platinum Plaza',
    projectName: 'Sri Platinum Plaza',
    plotNumber: 'C-22',
    propertyType: 'COMMERCIAL',
    workflowStatus: 'REGISTRATION_PENDING',
    city: 'G.S.T Road',
    state: 'Chrompet',
    createdAt: '2024-01-08T00:00:00.000Z',
  },
];

function propertyImage(index: number) {
  return propertyImages[index % propertyImages.length];
}

function locationFor(property: Property) {
  return [property.city, property.state].filter(Boolean).join(', ') || 'East Tambaram, Chennai';
}

function displayName(property: Property) {
  return property.propertyName || property.projectName || 'The Emerald Grand Estate';
}

function statusKind(status: WorkflowStatus) {
  if (status === 'COMPLETED') return 'complete';
  if (status === 'FINAL_SETTLEMENT_PENDING') return 'danger';
  if (status === 'AVAILABLE') return 'active';
  return 'progress';
}

function displayStatus(property: Property): PropertyDisplayStatus {
  if (property.workflowStatus === 'COMPLETED') return 'Sold';
  if (property.workflowStatus === 'AVAILABLE' || property.workflowStatus === 'FINAL_SETTLEMENT_PENDING') return 'Active';
  return 'Under Verification';
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
  value: number;
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
  index,
  onDetails,
}: {
  property: Property;
  index: number;
  onDetails: () => void;
}) {
  const kind = statusKind(property.workflowStatus);
  const advanceDone = ['ADVANCE_PAYMENT', 'REGISTRATION_PENDING', 'FINAL_SETTLEMENT_PENDING', 'COMPLETED'].includes(
    property.workflowStatus,
  );
  const finalPending = property.workflowStatus === 'FINAL_SETTLEMENT_PENDING';

  return (
    <article className="overflow-hidden border border-gray-200 bg-white shadow-sm">
      <div
        className="relative h-40 bg-cover bg-center"
        style={{ backgroundImage: property.images?.[0]?.url ? `url("${property.images[0].url}")` : propertyImage(index) }}
      >
        <div className="absolute left-4 top-4 flex gap-2">
          <Pill tone={kind === 'active' ? 'green' : kind === 'danger' ? 'red' : 'gold'}>
            {displayStatus(property)}
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
            {advanceDone ? <CheckCircle2 className="h-4 w-4 text-teal-700" /> : <span className="h-4 w-4 rounded-full border border-gray-400" />}
            <span className={advanceDone ? 'font-semibold text-gray-800' : 'text-gray-400'}>Advance Status</span>
          </div>
          <div className="flex items-center gap-2">
            {finalPending ? <AlertTriangle className="h-4 w-4 text-red-600" /> : <CheckCircle2 className="h-4 w-4 text-teal-700" />}
            <span className="font-semibold text-gray-800">Final Settlement</span>
          </div>
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-gold" />
            <span className="font-semibold text-gray-800">
              Documents: {kind === 'complete' ? 'Archived' : finalPending ? 'Verified' : 'Pending Legal'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Clock3 className="h-4 w-4 text-red-600" />
            <Pill tone={finalPending ? 'red' : 'green'}>
              {finalPending ? 'Due in 3 days' : kind === 'complete' ? 'Process Complete' : 'Due in 12 days'}
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

function PropertyDetailModal({ property, onClose }: { property: Property; onClose: () => void }) {
  const finalPending = property.workflowStatus === 'FINAL_SETTLEMENT_PENDING';
  const completed = property.workflowStatus === 'COMPLETED';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-[1px]">
      <div className="max-h-[90vh] w-full max-w-6xl overflow-hidden rounded-md bg-white shadow-2xl">
        <div className="max-h-[90vh] overflow-y-auto">
          <div
            className="relative h-64 bg-cover bg-center"
            style={{ backgroundImage: property.images?.[0]?.url ? `linear-gradient(90deg, rgba(0,0,0,.55), rgba(0,0,0,.08)), url("${property.images[0].url}")` : propertyImage(0) }}
          >
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
                <Pill tone="gold">{property.propertyType === 'VILLA' ? 'Luxury Villa' : property.propertyType.replace(/_/g, ' ')}</Pill>
                <h2 className="mt-4 text-3xl font-bold text-white drop-shadow">{displayName(property)}</h2>
                <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-white">
                  <MapPin className="h-4 w-4" />
                  {locationFor(property)}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 rounded-sm bg-white/15 p-4 text-white backdrop-blur">
                <div>
                  <p className="text-[10px] font-bold uppercase opacity-75">Status</p>
                  <p className="text-sm font-bold">{completed ? 'Final Settlement' : workflowLabels[property.workflowStatus]}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase opacity-75">ID</p>
                  <p className="text-sm font-bold">#{property.propertyId}</p>
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
                <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr] items-center gap-3">
                  <LifecycleStep label="Token" state="done" />
                  <div className="h-px bg-teal-700" />
                  <LifecycleStep label="Advance" state="done" />
                  <div className="h-px bg-gold" />
                  <LifecycleStep label="Registration" state={completed ? 'done' : 'current'} />
                  <div className="h-px bg-stone-200" />
                  <LifecycleStep label="Settlement" state={completed ? 'done' : 'pending'} />
                </div>
              </section>

              <div className="grid gap-4 md:grid-cols-2">
                <section className="rounded-lg border border-teal-100 bg-teal-50/40 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold uppercase text-teal-700">Advance Payment</p>
                      <p className="mt-1 text-sm font-bold text-teal-800">Status: Paid</p>
                    </div>
                    <ShieldCheck className="h-5 w-5 text-teal-700" />
                  </div>
                  <p className="mt-4 text-sm text-gray-700">Date: Oct 12, 2023</p>
                  <p className="mt-1 text-xs font-semibold italic text-gray-500">Updated by Rajesh Kumar</p>
                </section>

                <section className="rounded-lg border border-red-100 bg-red-50/50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold uppercase text-red-700">Final Settlement</p>
                      <p className="mt-1 text-sm font-bold text-red-800">
                        {finalPending ? 'Pending Final Settlement' : 'Final Settlement Complete'}
                      </p>
                    </div>
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                  </div>
                  <div className="mt-4 inline-flex rounded bg-red-100 px-3 py-1 text-sm font-bold text-red-700">
                    {finalPending ? 'Due in 5 Days' : 'Process Complete'}
                  </div>
                  <p className="mt-3 flex items-center gap-2 text-sm text-gray-600">
                    <Clock3 className="h-4 w-4" />
                    Awaiting Final Verification
                  </p>
                </section>
              </div>

              <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                <div className="mb-5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-gold" />
                    <h3 className="text-lg font-bold text-gray-900">Verified Documents</h3>
                  </div>
                  <button className="inline-flex items-center gap-1 text-xs font-bold text-gold">
                    View All
                    <ExternalLink className="h-3.5 w-3.5" />
                  </button>
                </div>
                {['Property Sale Deed', 'Approved Layout Plan'].map((doc, index) => (
                  <div key={doc} className="flex items-center justify-between gap-4 py-3">
                    <div className="flex items-center gap-4">
                      <span className="flex h-10 w-10 items-center justify-center rounded bg-teal-50 text-teal-700">
                        <FileText className="h-5 w-5" />
                      </span>
                      <div>
                        <p className="text-sm font-bold text-gray-900">{doc}</p>
                        <p className="text-xs text-gray-500">Verified on Sep {28 + index}, 2023</p>
                      </div>
                    </div>
                    <CheckCircle2 className="h-5 w-5 text-teal-700" />
                  </div>
                ))}
              </section>
            </div>

            <aside className="space-y-6">
              <section className="rounded-lg bg-stone-100 p-5">
                <h3 className="text-xs font-bold uppercase tracking-wide text-gray-600">Network Hierarchy</h3>
                {[
                  ['Regional Director', 'Arjun V. Raman'],
                  ['Branch Admin', 'Priya Sundaram'],
                  ['Branch Location', 'OMR - Navalur Branch'],
                ].map(([label, value]) => (
                  <div key={label} className="mt-4 flex gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-gold">
                      <ShieldCheck className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-xs font-bold text-gray-500">{label}</p>
                      <p className="text-sm font-bold text-gray-900">{value}</p>
                    </div>
                  </div>
                ))}
                <p className="mt-5 flex items-center gap-2 border-t border-stone-200 pt-4 text-sm font-bold text-gold">
                  <ShieldCheck className="h-4 w-4" />
                  Created by Super Admin
                </p>
              </section>

              <section>
                <h3 className="mb-4 text-lg font-bold text-gray-900">Activity Timeline</h3>
                {[
                  ['Property Created', 'Sep 15, 2023 - Super Admin'],
                  ['Token Completed', 'Sep 25, 2023 - Priya S.'],
                  ['Advance Paid', 'Oct 12, 2023 - Rajesh K.'],
                  ['Settlement Reminder Sent', '2 hours ago - System'],
                ].map(([title, meta], index) => (
                  <div key={title} className="mb-4 flex gap-3">
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${index === 3 ? 'bg-gold text-navy' : 'bg-teal-700 text-white'}`}>
                      {index === 3 ? <AlertTriangle className="h-4 w-4" /> : <ClipboardCheck className="h-4 w-4" />}
                    </span>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{title}</p>
                      <p className="text-xs text-gray-500">{meta}</p>
                    </div>
                  </div>
                ))}
              </section>
            </aside>
          </div>

          <div className="flex flex-col gap-3 border-t border-gray-100 bg-white px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs italic text-gray-500">All document verifications are logged under administrative oversight.</p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="border border-gold bg-white px-8 py-3 text-sm font-bold text-gold transition hover:bg-amber-50"
              >
                CLOSE
              </button>
              <button className="inline-flex items-center gap-2 bg-gold px-8 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-gold-light hover:text-navy">
                <Send className="h-4 w-4" />
                SEND REMINDER
              </button>
            </div>
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

  const apiProperties = data?.data ?? [];
  const properties = apiProperties.length ? apiProperties : fallbackProperties;
  const filteredProperties = properties.filter((property) => {
    if (statusFilter && displayStatus(property) !== statusFilter) return false;
    if (workflowStatus && property.workflowStatus !== workflowStatus) return false;
    return true;
  });
  const counts = useMemo(() => {
    if (!properties.length) return fallbackCounts;

    return {
      activeProperties: properties.filter((property) => property.workflowStatus === 'AVAILABLE').length || fallbackCounts.activeProperties,
      soldProperties: properties.filter((property) => property.workflowStatus === 'COMPLETED').length || fallbackCounts.soldProperties,
      advancePaid: properties.filter((property) => property.workflowStatus === 'ADVANCE_PAYMENT').length || fallbackCounts.advancePaid,
      finalSettlementPending:
        properties.filter((property) => property.workflowStatus === 'FINAL_SETTLEMENT_PENDING').length ||
        fallbackCounts.finalSettlementPending,
      settlementCompleted: properties.filter((property) => property.workflowStatus === 'COMPLETED').length || fallbackCounts.settlementCompleted,
    };
  }, [properties]);

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
        <StatCard label="Active Properties" value={counts.activeProperties} accent="border-t-2 border-t-gold" />
        <StatCard label="Sold Properties" value={counts.soldProperties} accent="border-t-2 border-t-teal-700" />
        <StatCard label="Advance Paid" value={counts.advancePaid} accent="border-t-2 border-t-gold-light" />
        <StatCard label="Final Settlement Pending" value={counts.finalSettlementPending} accent="border-t-2 border-t-red-600" />
        <StatCard label="Settlement Completed" value={counts.settlementCompleted} accent="border-t-2 border-t-teal-300" />
      </div>

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
            <option value="Active">Active</option>
            <option value="Sold">Sold</option>
            <option value="Under Verification">Under Verification</option>
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
          {filteredProperties.map((property, index) => (
            <PropertyCard
              key={property.id}
              property={property}
              index={index}
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
