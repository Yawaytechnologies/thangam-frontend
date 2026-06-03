import api from '../lib/axios';
import { downloadResponseFile } from '../lib/download-file';
import type { Billing, BillingStatus, PaymentMethod, PaginatedResponse } from '../types';

export interface BillingParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: BillingStatus;
  branchId?: string;
  bookingId?: string;
  startDate?: string;
  endDate?: string;
}

export interface CreateBillingData {
  bookingId: string;
  buyerName: string;
  buyerPhone: string;
  buyerAddress?: string;
  orderNumber?: string;
  billingNumber?: string;
  billingDate: string;
  paymentMethod: PaymentMethod;
  amountInNumbers: number;
  totalReceived: number;
  totalBalance?: number;
  operationalNotes?: string;
  settlementNotes?: string;
  termsConditions?: string;
  signatureUrl?: string;
  bankName?: string;
  favourOf?: string;
  chequeNumber?: string;
  chequeDate?: string;
  gpayReference?: string;
}

export type UpdateBillingData = Partial<CreateBillingData>;

export const billingApi = {
  getAll: (params?: BillingParams): Promise<PaginatedResponse<Billing>> =>
    api.get('/billing', { params }).then((r) => r.data.data),

  getOne: (id: string): Promise<Billing> =>
    api.get(`/billing/${id}`).then((r) => r.data.data),

  create: (data: CreateBillingData): Promise<Billing> =>
    api.post('/billing', data).then((r) => r.data.data),

  update: (id: string, data: UpdateBillingData): Promise<Billing> =>
    api.put(`/billing/${id}`, data).then((r) => r.data.data),

  updateStatus: (id: string, status: BillingStatus): Promise<Billing> =>
    api.patch(`/billing/${id}/status`, { status }).then((r) => r.data.data),

  uploadSignature: (id: string, file: File): Promise<unknown> => {
    const form = new FormData();
    form.append('file', file);
    form.append('entityType', 'billing');
    form.append('entityId', id);
    form.append('documentType', 'BILLING_DOCUMENT');
    return api.post('/documents/upload', form, { skipAuthRedirect: true }).then((r) => r.data.data);
  },

  delete: (id: string): Promise<void> =>
    api.delete(`/billing/${id}`).then(() => undefined),

  downloadPdf: async (id: string, filename = `billing-${id}.pdf`): Promise<void> => {
    const response = await api.get(`/billing/${id}/pdf`, { responseType: 'blob' });
    await downloadResponseFile(response.data, String(response.headers['content-type'] ?? ''), filename);
  },

  downloadEstimate: async (id: string): Promise<void> => {
    const response = await api.get(`/billing/${id}/estimate`, { responseType: 'blob' });
    await downloadResponseFile(response.data, String(response.headers['content-type'] ?? ''), `estimate-${id}.pdf`);
  },
};
