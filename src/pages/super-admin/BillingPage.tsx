import React, { useMemo, useState } from "react";

type BillingStatus =
  | "PENDING"
  | "PARTIAL_PAYMENT"
  | "PAID"
  | "FINAL_SETTLEMENT"
  | "COMPLETED";

type PaymentStatus = "PENDING" | "PAID" | "PARTIAL_PAID";
type SettlementStatus = "PENDING" | "COMPLETED";
type PaymentMethod = "BANK_TRANSFER" | "CHEQUE" | "CASH" | "UPI" | "GPAY";

interface BillingRecord {
  id: number;
  billingId: string;
  receiptNumber: string;
  buyerName: string;
  buyerPhone: string;
  buyerEmail: string;
  buyerAddress: string;
  city: string;
  state: string;
  pincode: string;
  projectName: string;
  plotNumber: string;
  plotArea: string;
  propertyType: string;
  branchName: string;
  paymentMethod: PaymentMethod;
  bankName: string;
  referenceNumber: string;
  amountReceived: string;
  amountInWords: string;
  billingStatus: BillingStatus;
  paymentStatus: PaymentStatus;
  settlementStatus: SettlementStatus;
  transactionDate: string;
  createdAt: string;
  dueDate: string;
  internalNotes: string;
  documentName: string;
  uploadedAt: string;
}

const dummyBilling: BillingRecord = {
  id: 1,
  billingId: "BIL-1001",
  receiptNumber: "RCPT-2023-456",
  buyerName: "Arun Prasath",
  buyerPhone: "+91 98765 43210",
  buyerEmail: "arun@example.com",
  buyerAddress: "123 Heritage Lane, OMR Road",
  city: "Chennai",
  state: "Tamil Nadu",
  pincode: "600119",
  projectName: "Sri Golden Meadows",
  plotNumber: "42A",
  plotArea: "1,200",
  propertyType: "Residential Plot",
  branchName: "Chennai Central Hub",
  paymentMethod: "BANK_TRANSFER",
  bankName: "HDFC Bank",
  referenceNumber: "TXN987654321",
  amountReceived: "450000",
  amountInWords: "Four Lakh Fifty Thousand Rupees Only",
  billingStatus: "PAID",
  paymentStatus: "PAID",
  settlementStatus: "COMPLETED",
  transactionDate: "2023-10-24",
  createdAt: "2023-10-24",
  dueDate: "2023-11-15",
  internalNotes: "Final payment received via wire transfer.",
  documentName: "Receipt_42A.pdf",
  uploadedAt: "2023-10-24",
};

const STATUS_OPTIONS: BillingStatus[] = [
  "PENDING",
  "PARTIAL_PAYMENT",
  "PAID",
  "FINAL_SETTLEMENT",
  "COMPLETED",
];

const PAYMENT_STATUS_OPTIONS: PaymentStatus[] = ["PENDING", "PAID", "PARTIAL_PAID"];
const SETTLEMENT_STATUS_OPTIONS: SettlementStatus[] = ["PENDING", "COMPLETED"];

const PAYMENT_METHOD_OPTIONS: { value: PaymentMethod; label: string }[] = [
  { value: "BANK_TRANSFER", label: "NEFT / Bank Transfer" },
  { value: "CHEQUE", label: "Cheque" },
  { value: "CASH", label: "Cash" },
  { value: "UPI", label: "UPI" },
  { value: "GPAY", label: "GPay" },
];

const inputClass =
  "h-9 w-full rounded-md border border-[#ded8ca] bg-[#fbfbfc] px-2.5 text-[12px] font-medium text-gray-700 outline-none transition focus:border-gold focus:bg-white focus:ring-2 focus:ring-gold/20";

const textareaClass =
  "w-full rounded-md border border-[#ded8ca] bg-[#fbfbfc] px-2.5 py-2 text-[12px] font-medium text-gray-700 outline-none transition focus:border-gold focus:bg-white focus:ring-2 focus:ring-gold/20";

const labelClass = "mb-1 block text-[10px] font-bold text-gray-500";

function formatCurrency(value: string | number) {
  const number = typeof value === "number" ? value : Number(value || 0);

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(number);
}

function formatDate(value: string) {
  if (!value) return "N/A";

  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function readableStatus(value: string) {
  return value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function paymentMethodLabel(value: PaymentMethod) {
  return PAYMENT_METHOD_OPTIONS.find((item) => item.value === value)?.label ?? value;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((item) => item[0])
    .join("")
    .toUpperCase();
}

function statusBadgeClass(status: BillingStatus | PaymentStatus | SettlementStatus) {
  switch (status) {
    case "PAID":
    case "COMPLETED":
      return "bg-emerald-50 text-emerald-700 border-emerald-100";
    case "PARTIAL_PAYMENT":
    case "PARTIAL_PAID":
      return "bg-red-50 text-red-600 border-red-100";
    case "FINAL_SETTLEMENT":
      return "bg-blue-50 text-blue-700 border-blue-100";
    default:
      return "bg-amber-50 text-amber-700 border-amber-100";
  }
}

function paymentBadgeClass(method: PaymentMethod) {
  switch (method) {
    case "BANK_TRANSFER":
      return "bg-gray-200 text-gray-700";
    case "CHEQUE":
      return "bg-purple-100 text-purple-700";
    case "CASH":
      return "bg-gray-200 text-gray-700";
    case "UPI":
      return "bg-orange-100 text-orange-700";
    case "GPAY":
      return "bg-blue-100 text-blue-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

function StatusBadge({
  status,
}: {
  status: BillingStatus | PaymentStatus | SettlementStatus;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${statusBadgeClass(
        status,
      )}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {readableStatus(status)}
    </span>
  );
}

function IconSearch() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="m21 21-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z"
      />
    </svg>
  );
}

function IconEye() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M2.25 12s3.75-6.75 9.75-6.75S21.75 12 21.75 12 18 18.75 12 18.75 2.25 12 2.25 12Z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
      />
    </svg>
  );
}

function IconEdit() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M16.862 4.487 19.5 7.125m-1.5-4.5a2.121 2.121 0 0 1 3 3L7.5 19.125 3 20.25l1.125-4.5L18 2.625Z"
      />
    </svg>
  );
}

function IconTrash() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M6 7.5h12M9 7.5V6a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 6v1.5m2.25 0-.75 12A1.5 1.5 0 0 1 15 21H9a1.5 1.5 0 0 1-1.5-1.5l-.75-12"
      />
    </svg>
  );
}

function IconDownload() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v12m0 0 4-4m-4 4-4-4M4 21h16" />
    </svg>
  );
}

function IconPrint() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M6 9V3h12v6M6 17H4.5A1.5 1.5 0 0 1 3 15.5v-5A1.5 1.5 0 0 1 4.5 9h15a1.5 1.5 0 0 1 1.5 1.5v5a1.5 1.5 0 0 1-1.5 1.5H18m-12-3h12v7H6v-7Z"
      />
    </svg>
  );
}

function IconUpload() {
  return (
    <svg className="h-8 w-8 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d="M12 16V8m0 0-3 3m3-3 3 3M6 16.5A4.5 4.5 0 0 1 7.25 7.68 5.5 5.5 0 0 1 18.75 9 4 4 0 0 1 18 17H6Z"
      />
    </svg>
  );
}

function IconFile() {
  return (
    <svg className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M7.5 3.75h6L19.5 9.75v10.5H7.5V3.75Z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.5 3.75v6h6M9.75 14.25h4.5M9.75 17.25h3" />
    </svg>
  );
}

function SectionTitle({ title, icon }: { title: string; icon: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#a38422]">
      <span className="text-[#a38422]">{icon}</span>
      {title}
    </div>
  );
}

function InputField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  className = "",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className={labelClass}>{label}</label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className={inputClass}
      />
    </div>
  );
}

function SelectField<T extends string>({
  label,
  value,
  onChange,
  options,
  className = "",
}: {
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
  className?: string;
}) {
  return (
    <div className={className}>
      <label className={labelClass}>{label}</label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
        className={inputClass}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function CloseButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full border border-dashed border-blue-400 bg-white text-lg leading-none text-gray-600 transition hover:bg-gray-50"
      aria-label="Close modal"
    >
      ×
    </button>
  );
}

function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  width = "max-w-[720px]",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  width?: string;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3 backdrop-blur-[2px]">
      <div
        className={`relative flex max-h-[calc(100vh-24px)] w-full ${width} flex-col overflow-hidden rounded-lg bg-white shadow-2xl`}
      >
        <div className="shrink-0 border-b border-gray-100 bg-white px-5 py-4 pr-16 sm:px-6">
          <h2 className="text-[21px] font-extrabold leading-tight text-gray-900">{title}</h2>
          <p className="mt-0.5 text-[12px] font-medium text-gray-500">{subtitle}</p>
          <CloseButton onClick={onClose} />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

function Toast({
  variant,
  title,
  message,
  onClose,
}: {
  variant: "dark" | "light";
  title: string;
  message: string;
  onClose: () => void;
}) {
  if (variant === "dark") {
    return (
      <div className="absolute left-1/2 top-2 z-30 flex w-[90%] max-w-[390px] -translate-x-1/2 items-center gap-3 rounded-lg bg-[#171b1f] px-4 py-3 text-white shadow-2xl">
        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-gold text-[10px] font-black text-white">
          ✓
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[12px] font-extrabold">{title}</p>
          <p className="text-[10px] font-medium text-white/75">{message}</p>
        </div>
        <button type="button" onClick={onClose} className="text-lg leading-none text-white/50 hover:text-white">
          ×
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-8 right-4 z-[60] flex w-[calc(100%-32px)] max-w-[330px] items-center gap-3 rounded-lg border-l-4 border-emerald-700 bg-white px-4 py-3 shadow-2xl sm:right-10">
      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-emerald-100 text-xs font-black text-emerald-700">
        ✓
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[12px] font-bold text-gray-900">{title}</p>
        <p className="text-[11px] font-medium text-gray-600">{message}</p>
      </div>
      <button type="button" onClick={onClose} className="text-lg leading-none text-gray-400 hover:text-gray-700">
        ×
      </button>
    </div>
  );
}

function UploadBox({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-lg border border-dashed border-[#d7c9a3] bg-[#f8f8fa] px-4 text-center ${
        compact ? "min-h-[118px] py-4" : "min-h-[165px] py-6"
      }`}
    >
      <IconUpload />
      <p className="mt-2 text-[12px] font-extrabold text-gray-700">Drag and drop file here</p>
      <p className="mt-0.5 text-[11px] font-semibold text-gray-500">Supported: PDF, JPG, PNG (Max 5MB)</p>
      <button
        type="button"
        className="mt-4 rounded-md border border-[#ded8ca] bg-white px-4 py-1.5 text-[11px] font-bold text-gray-700 shadow-sm hover:bg-gray-50"
      >
        Browse Files
      </button>
    </div>
  );
}

function ExistingDocumentCard({ billing }: { billing: BillingRecord }) {
  return (
    <div className="flex min-h-[118px] flex-col justify-between rounded-lg bg-[#e7e7ea] p-4">
      <div className="flex items-start gap-3">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-red-100">
          <IconFile />
        </span>
        <div className="min-w-0">
          <p className="truncate text-[12px] font-extrabold text-gray-800">{billing.documentName}</p>
          <p className="mt-0.5 text-[10px] font-bold text-gray-500">Uploaded on {formatDate(billing.uploadedAt)}</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          type="button"
          className="rounded-md bg-white px-3 py-1.5 text-[11px] font-bold text-gray-700 shadow-sm hover:bg-gray-50"
        >
          View
        </button>
        <button
          type="button"
          className="rounded-md bg-white px-3 py-1.5 text-[11px] font-bold text-gray-700 shadow-sm hover:bg-gray-50"
        >
          Remove
        </button>
      </div>
    </div>
  );
}

function AddBillingModal({
  open,
  onClose,
  onSave,
  seed,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (billing: BillingRecord) => void;
  seed: BillingRecord;
}) {
  const [form, setForm] = useState<BillingRecord>(seed);
  const [toast, setToast] = useState(false);

  function update<K extends keyof BillingRecord>(key: K, value: BillingRecord[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    onSave({ ...form, id: 1, billingId: form.billingId || "BIL-1001" });
    setToast(true);
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add Billing Record"
      subtitle="Capture new payment and settlement details for property bookings."
      width="max-w-[720px]"
    >
      {toast && (
        <Toast
          variant="light"
          title="Success"
          message="Billing record created successfully"
          onClose={() => setToast(false)}
        />
      )}

      <form onSubmit={handleSubmit}>
        <div className="space-y-7 p-5 sm:p-6">
          <section>
            <SectionTitle
              title="Applicant Details"
              icon={
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8a7 7 0 0 1 14 0" />
                </svg>
              }
            />

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <InputField label="Full Name" value={form.buyerName} onChange={(value) => update("buyerName", value)} placeholder="e.g. Rahul Sharma" />
              <InputField label="Phone Number" value={form.buyerPhone} onChange={(value) => update("buyerPhone", value)} placeholder="+91 98765 43210" />
              <InputField label="Email Address" value={form.buyerEmail} onChange={(value) => update("buyerEmail", value)} placeholder="rahul@example.com" />
              <div className="md:col-span-3">
                <label className={labelClass}>Address</label>
                <textarea
                  rows={3}
                  value={form.buyerAddress}
                  onChange={(event) => update("buyerAddress", event.target.value)}
                  placeholder="Enter complete correspondence address"
                  className={textareaClass}
                />
              </div>
            </div>
          </section>

          <div className="border-t border-gray-100" />

          <section>
            <SectionTitle
              title="Property Details"
              icon={
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21h18M6 21V9l6-4 6 4v12M9 21v-6h6v6" />
                </svg>
              }
            />

            <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
              <InputField label="Select Project" value={form.projectName} onChange={(value) => update("projectName", value)} />
              <InputField label="Plot / Unit Number" value={form.plotNumber} onChange={(value) => update("plotNumber", value)} />
              <InputField label="Plot Area (Sq.Ft)" value={form.plotArea} onChange={(value) => update("plotArea", value)} />
              <InputField label="Branch" value={form.branchName} onChange={(value) => update("branchName", value)} />
            </div>
          </section>

          <div className="border-t border-gray-100" />

          <section>
            <SectionTitle
              title="Payment Details"
              icon={
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8h18M5 8v10h14V8M7 14h5" />
                </svg>
              }
            />

            <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
              <SelectField
                label="Payment Method"
                value={form.paymentMethod}
                onChange={(value) => update("paymentMethod", value)}
                options={PAYMENT_METHOD_OPTIONS}
              />
              <InputField label="Bank Name" value={form.bankName} onChange={(value) => update("bankName", value)} />
              <InputField label="Reference Number" value={form.referenceNumber} onChange={(value) => update("referenceNumber", value)} />
              <InputField label="Amount Received" value={form.amountReceived} onChange={(value) => update("amountReceived", value)} />

              <SelectField
                label="Billing Status"
                value={form.billingStatus}
                onChange={(value) => update("billingStatus", value)}
                options={STATUS_OPTIONS.map((item) => ({ value: item, label: readableStatus(item) }))}
                className="md:col-span-2"
              />

              <InputField
                label="Transaction Date"
                type="date"
                value={form.transactionDate}
                onChange={(value) => update("transactionDate", value)}
                className="md:col-span-2"
              />
            </div>

            <div className="mt-4">
              <label className={labelClass}>Payment Receipt / Proof</label>
              <UploadBox />
            </div>

            <div className="mt-4">
              <label className={labelClass}>Remarks / Internal Notes</label>
              <textarea
                rows={3}
                value={form.internalNotes}
                onChange={(event) => update("internalNotes", event.target.value)}
                placeholder="Enter any specific transaction notes or special instructions..."
                className={textareaClass}
              />
            </div>
          </section>
        </div>

        <div className="sticky bottom-0 z-10 flex items-center justify-between gap-3 border-t border-gray-100 bg-[#f8f8fa] px-5 py-3 sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="min-w-[130px] rounded-md border border-dashed border-blue-400 bg-white px-4 py-2.5 text-[12px] font-bold text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="min-w-[150px] rounded-md bg-gold px-4 py-2.5 text-[12px] font-extrabold text-white shadow-md shadow-gold/20 hover:opacity-90"
          >
            Save Billing
          </button>
        </div>
      </form>
    </Modal>
  );
}

function EditBillingModal({
  open,
  onClose,
  billing,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  billing: BillingRecord;
  onSave: (billing: BillingRecord) => void;
}) {
  const [form, setForm] = useState<BillingRecord>(billing);
  const [toast, setToast] = useState(false);

  function update<K extends keyof BillingRecord>(key: K, value: BillingRecord[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    onSave(form);
    setToast(true);
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit Billing"
      subtitle="Update payment, settlement, and documentation details."
      width="max-w-[720px]"
    >
      {toast && (
        <Toast
          variant="dark"
          title="Billing record updated successfully"
          message="The system has synchronized all financial logs."
          onClose={() => setToast(false)}
        />
      )}

      <form onSubmit={handleSubmit}>
        <div className="space-y-7 p-5 sm:p-6">
          <section>
            <SectionTitle
              title="Applicant Details"
              icon={
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8a7 7 0 0 1 14 0" />
                </svg>
              }
            />

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <InputField label="Name" value={form.buyerName} onChange={(value) => update("buyerName", value)} />
              <InputField label="Phone" value={form.buyerPhone} onChange={(value) => update("buyerPhone", value)} />
              <InputField label="Address" value={form.buyerAddress} onChange={(value) => update("buyerAddress", value)} />
              <InputField label="City" value={form.city} onChange={(value) => update("city", value)} />
              <InputField label="State" value={form.state} onChange={(value) => update("state", value)} />
              <InputField label="Pincode" value={form.pincode} onChange={(value) => update("pincode", value)} />
            </div>
          </section>

          <section>
            <SectionTitle
              title="Property Details"
              icon={
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21h18M6 21V9l6-4 6 4v12M9 21v-6h6v6" />
                </svg>
              }
            />

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <InputField label="Project" value={form.projectName} onChange={(value) => update("projectName", value)} />
              <InputField label="Plot" value={form.plotNumber} onChange={(value) => update("plotNumber", value)} />
              <InputField label="Sq.Ft" value={form.plotArea} onChange={(value) => update("plotArea", value)} />
              <InputField label="Type" value={form.propertyType} onChange={(value) => update("propertyType", value)} />
              <InputField label="Branch" value={form.branchName} onChange={(value) => update("branchName", value)} className="md:col-span-2" />
            </div>
          </section>

          <section>
            <SectionTitle
              title="Payment Details"
              icon={
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8h18M5 8v10h14V8M7 14h5" />
                </svg>
              }
            />

            <div className="rounded-lg bg-[#f2f2f4] p-4">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <SelectField
                  label="Method"
                  value={form.paymentMethod}
                  onChange={(value) => update("paymentMethod", value)}
                  options={PAYMENT_METHOD_OPTIONS}
                />
                <InputField label="Bank" value={form.bankName} onChange={(value) => update("bankName", value)} />
                <InputField label="Ref Number" value={form.referenceNumber} onChange={(value) => update("referenceNumber", value)} />
                <InputField label="Amount" value={form.amountReceived} onChange={(value) => update("amountReceived", value)} />
                <InputField
                  label="Amount in Words"
                  value={form.amountInWords}
                  onChange={(value) => update("amountInWords", value)}
                  className="md:col-span-2"
                />
              </div>
            </div>
          </section>

          <section>
            <SectionTitle
              title="Status Update"
              icon={
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6l4 2m5-2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              }
            />

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <SelectField
                label="Billing Status"
                value={form.billingStatus}
                onChange={(value) => update("billingStatus", value)}
                options={STATUS_OPTIONS.map((item) => ({ value: item, label: readableStatus(item) }))}
              />
              <SelectField
                label="Payment Status"
                value={form.paymentStatus}
                onChange={(value) => update("paymentStatus", value)}
                options={PAYMENT_STATUS_OPTIONS.map((item) => ({ value: item, label: readableStatus(item) }))}
              />
              <SelectField
                label="Settlement Status"
                value={form.settlementStatus}
                onChange={(value) => update("settlementStatus", value)}
                options={SETTLEMENT_STATUS_OPTIONS.map((item) => ({ value: item, label: readableStatus(item) }))}
              />
            </div>
          </section>

          <section>
            <SectionTitle
              title="Document Upload"
              icon={
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 3h7l5 5v13H7V3Zm7 0v5h5" />
                </svg>
              }
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <UploadBox compact />
              <ExistingDocumentCard billing={form} />
            </div>
          </section>

          <section>
            <SectionTitle
              title="Additional Information"
              icon={
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3M4 11h16M5 5h14v16H5V5Z" />
                </svg>
              }
            />

            <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_190px]">
              <div>
                <label className={labelClass}>Internal Notes</label>
                <textarea
                  rows={3}
                  value={form.internalNotes}
                  onChange={(event) => update("internalNotes", event.target.value)}
                  placeholder="Enter any specific observations or internal comments regarding this settlement..."
                  className={textareaClass}
                />
              </div>

              <div>
                <InputField label="Due Date" type="date" value={form.dueDate} onChange={(value) => update("dueDate", value)} />
                <div className="mt-2 rounded-md border border-red-100 bg-red-50 px-3 py-2 text-[10px] font-bold text-red-500">
                  Next follow-up scheduled for settlement.
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="sticky bottom-0 z-10 flex items-center justify-end gap-3 border-t border-gray-100 bg-[#f8f8fa] px-5 py-3 sm:px-6">
          <button type="button" onClick={onClose} className="px-5 py-2.5 text-[12px] font-extrabold text-gray-700">
            Cancel
          </button>
          <button
            type="submit"
            className="min-w-[160px] rounded-md bg-gold px-5 py-2.5 text-[12px] font-extrabold text-white shadow-md shadow-gold/20 hover:opacity-90"
          >
            Save Changes
          </button>
        </div>
      </form>
    </Modal>
  );
}

function ViewBillingModal({
  open,
  onClose,
  billing,
  onEdit,
}: {
  open: boolean;
  onClose: () => void;
  billing: BillingRecord;
  onEdit: () => void;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Billing Details"
      subtitle="View applicant, property, payment, and settlement information."
      width="max-w-[790px]"
    >
      <div className="space-y-5 p-5 pb-0 sm:p-6 sm:pb-0">
        <div className="rounded-lg bg-[#f7f7f9] px-4 py-3">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wide text-gray-500">Billing ID</p>
              <p className="mt-0.5 text-[18px] font-black text-[#8f6e07]">#{billing.billingId}</p>
            </div>

            <div>
              <p className="text-[10px] font-black uppercase tracking-wide text-gray-500">Receipt Number</p>
              <p className="mt-1.5 text-[12px] font-extrabold text-gray-800">{billing.receiptNumber}</p>
            </div>

            <div>
              <p className="text-[10px] font-black uppercase tracking-wide text-gray-500">Created Date</p>
              <p className="mt-1.5 text-[12px] font-extrabold text-gray-800">{formatDate(billing.createdAt)}</p>
            </div>

            <div className="flex items-center md:justify-end">
              <StatusBadge status={billing.billingStatus} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-gray-100">
            <h3 className="mb-4 flex items-center gap-2 border-b border-gray-100 pb-3 text-[17px] font-black text-gray-800">
              <span className="text-gold">♙</span> Applicant Details
            </h3>

            <div className="space-y-2.5">
              {[
                ["Name", billing.buyerName],
                ["Phone", billing.buyerPhone],
                ["Address", `${billing.buyerAddress}, ${billing.city}`],
                ["Location", `${billing.state}, ${billing.pincode}`],
              ].map(([label, value]) => (
                <div key={label} className="grid grid-cols-[78px_1fr] gap-3 text-[12px]">
                  <p className="font-extrabold text-gray-500">{label}</p>
                  <p className="font-bold text-gray-800">{value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-gray-100">
            <h3 className="mb-4 flex items-center gap-2 border-b border-gray-100 pb-3 text-[17px] font-black text-gray-800">
              <span className="text-gold">⌂</span> Property Details
            </h3>

            <div className="space-y-2.5">
              {[
                ["Project", billing.projectName],
                ["Plot No.", billing.plotNumber],
                ["Sq. Feet", `${billing.plotArea} sq.ft`],
                ["Branch", billing.branchName],
              ].map(([label, value]) => (
                <div key={label} className="grid grid-cols-[78px_1fr] gap-3 text-[12px]">
                  <p className="font-extrabold text-gray-500">{label}</p>
                  <p className="font-bold text-gray-800">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-gray-100">
          <h3 className="mb-4 flex items-center gap-2 border-b border-gray-100 pb-3 text-[17px] font-black text-gray-800">
            <span className="text-gold">▣</span> Payment Details
          </h3>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_250px]">
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {[
                ["Method", paymentMethodLabel(billing.paymentMethod)],
                ["Bank Name", billing.bankName],
                ["Ref. Number", billing.referenceNumber],
              ].map(([label, value]) => (
                <div key={label} className="grid grid-cols-[105px_1fr] gap-3 text-[12px]">
                  <p className="font-extrabold text-gray-500">{label}</p>
                  <p className="font-black text-gray-800">{value}</p>
                </div>
              ))}
            </div>

            <div className="rounded-lg bg-[#ededf0] p-3">
              <p className="text-[11px] font-black text-gray-600">Amount Received</p>
              <p className="mt-0.5 text-[24px] font-black leading-tight text-[#8f6e07]">
                {formatCurrency(billing.amountReceived)}
              </p>
              <p className="mt-0.5 text-[9px] font-bold italic text-gray-500">"{billing.amountInWords}"</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_220px]">
          <div className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-gray-100">
            <h3 className="mb-4 flex items-center gap-2 border-b border-gray-100 pb-3 text-[17px] font-black text-gray-800">
              <span className="text-gold">▣</span> Settlement Status
            </h3>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <p className="text-[11px] font-black text-gray-500">Balance Status</p>
                <p className="mt-0.5 text-[13px] font-black text-emerald-600">Fully Paid</p>
              </div>

              <div>
                <p className="text-[11px] font-black text-gray-500">Settlement</p>
                <p className="mt-0.5 text-[13px] font-black text-gray-800">{readableStatus(billing.settlementStatus)}</p>
              </div>
            </div>

            <div className="mt-5 border-l-4 border-[#d1b553] bg-[#f1f1f3] px-3 py-2">
              <p className="text-[9px] font-black uppercase text-gray-500">Office Notes</p>
              <p className="mt-0.5 text-[12px] font-semibold text-gray-700">{billing.internalNotes}</p>
            </div>
          </div>

          <div className="grid place-items-center rounded-lg bg-white p-4 text-center shadow-sm ring-1 ring-gray-100">
            <div>
              <div className="mx-auto mb-2 grid h-9 w-9 place-items-center text-2xl text-[#c8b06c]">▣</div>
              <p className="text-[11px] font-black uppercase text-gray-500">Next Due Date</p>
              <p className="mt-1 text-[22px] font-black text-gray-800">
                {billing.settlementStatus === "COMPLETED" ? "N/A" : formatDate(billing.dueDate)}
              </p>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-gray-100">
          <div className="flex items-center justify-between bg-[#e9e9eb] px-4 py-2.5">
            <p className="text-[11px] font-black uppercase tracking-wide text-gray-600">Documents & Proofs</p>
            <span className="rounded bg-white px-3 py-1 text-[10px] font-bold text-gray-500">3 Files Attached</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left">
              <thead className="bg-[#f7f7f9]">
                <tr>
                  <th className="px-4 py-3 text-[11px] font-black uppercase text-gray-500">Document Name</th>
                  <th className="px-4 py-3 text-[11px] font-black uppercase text-gray-500">Status</th>
                  <th className="px-4 py-3 text-right text-[11px] font-black uppercase text-gray-500">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {["Receipt Document", "Payment Proof", "Estimate Copy"].map((document) => (
                  <tr key={document}>
                    <td className="px-4 py-3 text-[12px] font-bold text-gray-700">{document}</td>
                    <td className="px-4 py-3">
                      <span className="text-[11px] font-bold text-emerald-600">● Uploaded</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-3 text-[#9c7d18]">
                        <button type="button" className="hover:text-gray-900">
                          <IconEye />
                        </button>
                        <button type="button" className="hover:text-gray-900">
                          <IconDownload />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="sticky bottom-0 z-10 mt-6 flex flex-wrap items-center justify-end gap-2 border-t border-gray-100 bg-white px-5 py-3 sm:px-6">
        <button
          type="button"
          onClick={onClose}
          className="rounded-md border border-dashed border-blue-400 bg-white px-5 py-2 text-[12px] font-bold text-gray-700 hover:bg-gray-50"
        >
          Close
        </button>

        <button
          type="button"
          onClick={onEdit}
          className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-blue-400 bg-white px-5 py-2 text-[12px] font-bold text-[#8f6e07] hover:bg-gray-50"
        >
          <IconEdit />
          Edit Billing
        </button>

        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-md bg-gold px-5 py-2 text-[12px] font-extrabold text-white shadow-md shadow-gold/20 hover:opacity-90"
        >
          <IconDownload />
          Download Estimate
        </button>

        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 rounded-md bg-gold px-5 py-2 text-[12px] font-extrabold text-white shadow-md shadow-gold/20 hover:opacity-90"
        >
          <IconPrint />
          Print Estimate
        </button>
      </div>
    </Modal>
  );
}

function KpiCard({
  title,
  value,
  tone,
  icon,
}: {
  title: string;
  value: string | number;
  tone: "gold" | "green" | "red" | "dark";
  icon: React.ReactNode;
}) {
  const valueClass =
    tone === "green"
      ? "text-emerald-700"
      : tone === "red"
        ? "text-red-600"
        : tone === "gold"
          ? "text-[#8f6e07]"
          : "text-gray-900";

  const iconClass =
    tone === "green"
      ? "bg-emerald-50 text-emerald-700"
      : tone === "red"
        ? "bg-red-50 text-red-500"
        : tone === "gold"
          ? "bg-gold/10 text-gold"
          : "bg-gray-100 text-gray-700";

  return (
    <div className="flex min-h-[76px] items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm">
      <div>
        <p className="text-[10px] font-black uppercase text-gray-500">{title}</p>
        <p className={`mt-1 text-[23px] font-black leading-none ${valueClass}`}>{value}</p>
      </div>

      <span className={`grid h-8 w-8 place-items-center rounded-md ${iconClass}`}>{icon}</span>
    </div>
  );
}

const SuperAdminBillingPage: React.FC = () => {
  const [billing, setBilling] = useState<BillingRecord>(dummyBilling);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<BillingStatus | "">("");
  const [branch, setBranch] = useState("");
  const [date, setDate] = useState("");

  const [addOpen, setAddOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const visibleBillings = useMemo(() => {
    const row = billing;

    const matchesSearch =
      !search ||
      row.billingId.toLowerCase().includes(search.toLowerCase()) ||
      row.buyerName.toLowerCase().includes(search.toLowerCase()) ||
      row.projectName.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = !status || row.billingStatus === status;
    const matchesBranch = !branch || row.branchName === branch;
    const matchesDate = !date || row.createdAt === date;

    return matchesSearch && matchesStatus && matchesBranch && matchesDate ? [row] : [];
  }, [billing, branch, date, search, status]);

  const paidRecords = billing.billingStatus === "PAID" || billing.billingStatus === "COMPLETED" ? 1 : 0;
  const balancePending = billing.billingStatus === "PENDING" || billing.billingStatus === "PARTIAL_PAYMENT" ? 1 : 0;
  const pendingVerification = billing.billingStatus === "FINAL_SETTLEMENT" ? 1 : 0;

  return (
    <div className="min-h-screen bg-[#f7f7f9] px-3 py-4 text-[12px] sm:px-5 lg:px-6">
      <div className="mx-auto max-w-[1180px]">
        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-[24px] font-black leading-tight text-gray-900">
              Billing
            </h1>
            <p className="mt-0.5 text-[13px] font-medium text-gray-600">
              Manage billing records, payment status, and estimate copies.
            </p>
          </div>

          <div className="inline-flex w-fit items-center gap-2 rounded-full bg-white px-4 py-2 text-[10px] font-black uppercase tracking-[0.12em] text-gray-500 shadow-sm">
            Admin
            <span className="text-gray-300">›</span>
            <span className="text-[#9c7d18]">Billing</span>
          </div>
        </div>

        <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            title="Total Billing Records"
            value={1}
            tone="dark"
            icon={
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 3h10v18H7V3Zm3 5h4M10 12h4M10 16h4" />
              </svg>
            }
          />

          <KpiCard
            title="Paid Records"
            value={paidRecords}
            tone="green"
            icon={
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m5 13 4 4L19 7" />
              </svg>
            }
          />

          <KpiCard
            title="Balance Pending"
            value={balancePending}
            tone="red"
            icon={
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v4m0 4h.01M10.3 3.86 1.82 18a2 2 0 0 0 1.72 3h16.92a2 2 0 0 0 1.72-3L13.7 3.86a2 2 0 0 0-3.4 0Z" />
              </svg>
            }
          />

          <KpiCard
            title="Pending Verification"
            value={pendingVerification}
            tone="gold"
            icon={
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3 5 6v5c0 5 3.5 8.5 7 10 3.5-1.5 7-5 7-10V6l-7-3Z" />
              </svg>
            }
          />
        </div>

        <div className="mb-5 rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-[70px_1fr_1fr_1fr_145px]">
            <div className="grid h-10 place-items-center rounded-md border border-gray-200 bg-[#fbfbfc] text-gray-600">
              <IconSearch />
            </div>

            <select
              value={status}
              onChange={(event) => setStatus(event.target.value as BillingStatus | "")}
              className="h-10 rounded-md border border-gray-200 bg-[#fbfbfc] px-3 text-[12px] font-bold text-gray-700 outline-none focus:border-gold focus:ring-2 focus:ring-gold/20"
            >
              <option value="">All Status</option>
              {STATUS_OPTIONS.map((item) => (
                <option key={item} value={item}>
                  {readableStatus(item)}
                </option>
              ))}
            </select>

            <select
              value={branch}
              onChange={(event) => setBranch(event.target.value)}
              className="h-10 rounded-md border border-gray-200 bg-[#fbfbfc] px-3 text-[12px] font-bold text-gray-700 outline-none focus:border-gold focus:ring-2 focus:ring-gold/20"
            >
              <option value="">All Branches</option>
              <option value="Chennai Central Hub">Chennai Central Hub</option>
            </select>

            <input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className="h-10 rounded-md border border-gray-200 bg-[#fbfbfc] px-3 text-[12px] font-bold text-gray-700 outline-none focus:border-gold focus:ring-2 focus:ring-gold/20"
            />

            <button
              type="button"
              onClick={() => setAddOpen(true)}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-dashed border-blue-400 bg-gold px-4 text-[12px] font-black leading-tight text-white shadow-sm hover:opacity-90"
            >
              <span className="grid h-4 w-4 place-items-center rounded-full border border-white text-[10px]">
                +
              </span>
              Add Billing
            </button>
          </div>

          <div className="mt-3">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by billing id, applicant name, or project..."
              className="h-10 w-full rounded-md border border-gray-200 bg-[#fbfbfc] px-3 text-[12px] font-semibold text-gray-700 outline-none focus:border-gold focus:ring-2 focus:ring-gold/20"
            />
          </div>
        </div>

        <div className="hidden overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm md:block">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] table-fixed text-left">
              <thead className="bg-[#eeeeef]">
                <tr>
                  <th className="w-[100px] px-4 py-3 text-[11px] font-black uppercase tracking-wide text-gray-600">
                    Billing ID
                  </th>
                  <th className="w-[170px] px-4 py-3 text-[11px] font-black uppercase tracking-wide text-gray-600">
                    Applicant
                  </th>
                  <th className="w-[140px] px-4 py-3 text-[11px] font-black uppercase tracking-wide text-gray-600">
                    Project
                  </th>
                  <th className="w-[110px] px-4 py-3 text-[11px] font-black uppercase tracking-wide text-gray-600">
                    Plot / Sq.Ft
                  </th>
                  <th className="w-[105px] px-4 py-3 text-[11px] font-black uppercase tracking-wide text-gray-600">
                    Method
                  </th>
                  <th className="w-[120px] px-4 py-3 text-[11px] font-black uppercase tracking-wide text-gray-600">
                    Amount
                  </th>
                  <th className="w-[115px] px-4 py-3 text-[11px] font-black uppercase tracking-wide text-gray-600">
                    Status
                  </th>
                  <th className="w-[100px] px-4 py-3 text-right text-[11px] font-black uppercase tracking-wide text-gray-600">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {visibleBillings.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-[12px] font-bold text-gray-400">
                      No billing records found.
                    </td>
                  </tr>
                ) : (
                  visibleBillings.map((item) => (
                    <tr key={item.id} className="border-t border-gray-100 transition hover:bg-[#fafafa]">
                      <td className="px-4 py-4 align-top">
                        <p className="text-[12px] font-black leading-snug text-[#9c7d18]">
                          #{item.billingId}
                        </p>
                      </td>

                      <td className="px-4 py-4 align-top">
                        <div className="flex items-center gap-2.5">
                          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gold/10 text-[10px] font-black text-[#9c7d18]">
                            {getInitials(item.buyerName)}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-[12px] font-extrabold leading-snug text-gray-800">
                              {item.buyerName}
                            </p>
                            <p className="mt-0.5 truncate text-[10px] font-semibold text-gray-500">
                              {item.buyerPhone}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4 align-top">
                        <p className="line-clamp-2 text-[12px] font-bold leading-snug text-gray-700">
                          {item.projectName}
                        </p>
                      </td>

                      <td className="px-4 py-4 align-top">
                        <p className="text-[12px] font-bold leading-snug text-gray-700">
                          Plot {item.plotNumber}
                          <br />
                          <span className="text-[10px] text-gray-500">
                            {item.plotArea} Sq.Ft
                          </span>
                        </p>
                      </td>

                      <td className="px-4 py-4 align-top">
                        <span className={`inline-flex rounded px-2 py-1 text-[10px] font-black ${paymentBadgeClass(item.paymentMethod)}`}>
                          {item.paymentMethod === "BANK_TRANSFER"
                            ? "NEFT / Bank"
                            : paymentMethodLabel(item.paymentMethod)}
                        </span>
                      </td>

                      <td className="px-4 py-4 align-top">
                        <p className="text-[13px] font-black text-gray-900">
                          {formatCurrency(item.amountReceived)}
                        </p>
                      </td>

                      <td className="px-4 py-4 align-top">
                        <StatusBadge status={item.billingStatus} />
                      </td>

                      <td className="px-4 py-4 align-top">
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setViewOpen(true)}
                            className="grid h-7 w-7 place-items-center rounded-md text-[#9c7d18] hover:bg-gold/10"
                            aria-label="View"
                          >
                            <IconEye />
                          </button>

                          <button
                            type="button"
                            onClick={() => setEditOpen(true)}
                            className="grid h-7 w-7 place-items-center rounded-md text-gray-500 hover:bg-gray-100"
                            aria-label="Edit"
                          >
                            <IconEdit />
                          </button>

                          <button
                            type="button"
                            className="grid h-7 w-7 place-items-center rounded-md text-gray-400 hover:bg-red-50 hover:text-red-600"
                            aria-label="Delete"
                          >
                            <IconTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3">
            <p className="text-[11px] font-bold text-gray-500">
              Showing 1  record
            </p>

            <div className="flex items-center gap-2">
              <button className="rounded-md border border-gray-200 px-3 py-1.5 text-[11px] font-bold text-gray-400">
                Previous
              </button>
              <button className="rounded-md bg-gold px-3 py-1.5 text-[11px] font-black text-white">
                1
              </button>
              <button className="rounded-md border border-gray-200 px-3 py-1.5 text-[11px] font-bold text-gray-400">
                Next
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-3 md:hidden">
          {visibleBillings.length === 0 ? (
            <div className="rounded-lg border border-gray-200 bg-white p-6 text-center text-[12px] font-bold text-gray-400">
              No billing records found.
            </div>
          ) : (
            visibleBillings.map((item) => (
              <div key={item.id} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[12px] font-black text-[#9c7d18]">
                      #{item.billingId}
                    </p>
                    <p className="mt-1 text-[14px] font-black text-gray-900">
                      {item.buyerName}
                    </p>
                    <p className="text-[11px] font-bold text-gray-500">
                      {item.buyerPhone}
                    </p>
                  </div>

                  <StatusBadge status={item.billingStatus} />
                </div>

                <div className="grid grid-cols-2 gap-3 text-[12px]">
                  <div>
                    <p className="font-black text-gray-500">Project</p>
                    <p className="mt-1 font-bold text-gray-800">{item.projectName}</p>
                  </div>

                  <div>
                    <p className="font-black text-gray-500">Amount</p>
                    <p className="mt-1 font-black text-gray-900">
                      {formatCurrency(item.amountReceived)}
                    </p>
                  </div>

                  <div>
                    <p className="font-black text-gray-500">Plot</p>
                    <p className="mt-1 font-bold text-gray-800">
                      {item.plotNumber} / {item.plotArea} Sq.Ft
                    </p>
                  </div>

                  <div>
                    <p className="font-black text-gray-500">Method</p>
                    <p className="mt-1 font-bold text-gray-800">
                      {paymentMethodLabel(item.paymentMethod)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex justify-end gap-2">
                  <button
                    onClick={() => setViewOpen(true)}
                    className="rounded-md bg-gold px-4 py-2 text-[11px] font-black text-white"
                  >
                    View
                  </button>
                  <button
                    onClick={() => setEditOpen(true)}
                    className="rounded-md border border-gray-200 px-4 py-2 text-[11px] font-black text-gray-700"
                  >
                    Edit
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <AddBillingModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        seed={billing}
        onSave={(updatedBilling) => setBilling(updatedBilling)}
      />

      <ViewBillingModal
        open={viewOpen}
        onClose={() => setViewOpen(false)}
        billing={billing}
        onEdit={() => {
          setViewOpen(false);
          setEditOpen(true);
        }}
      />

      <EditBillingModal
        key={billing.id + billing.amountReceived + billing.billingStatus}
        open={editOpen}
        onClose={() => setEditOpen(false)}
        billing={billing}
        onSave={(updatedBilling) => setBilling(updatedBilling)}
      />
    </div>
  );
};

export default SuperAdminBillingPage;