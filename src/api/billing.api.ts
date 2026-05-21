import api from '../lib/axios';
import type { Billing, BillingStatus, PaymentMethod, PaginatedResponse } from '../types';

export interface BillingParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: BillingStatus;
  branchId?: string;
  bookingId?: string;
}

export interface CreateBillingData {
  bookingId: string;
  buyerName: string;
  buyerPhone: string;
  paymentMethod: PaymentMethod;
  amountInNumbers: number;
  amountInWords?: string;
  billingDate: string;
}

export type UpdateBillingData = Partial<CreateBillingData>;

function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

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

  downloadPdf: async (id: string): Promise<void> => {
    const response = await api.get(`/billing/${id}/pdf`, { responseType: 'blob' });
    triggerBlobDownload(response.data as Blob, `billing-${id}.pdf`);
  },

  downloadEstimate: async (id: string): Promise<void> => {
    const response = await api.get(`/billing/${id}/estimate`, { responseType: 'blob' });
    triggerBlobDownload(response.data as Blob, `estimate-${id}.pdf`);
  },
};
