import api from '../lib/axios';
import type { Booking, BookingStatus, PaginatedResponse } from '../types';

export interface BookingParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: BookingStatus;
  branchId?: string;
  propertyId?: string;
  startDate?: string;
  endDate?: string;
}

export interface BookingPaymentData {
  bankName?: string;
  favourOf?: string;
  chequeNumber?: string;
  chequeDate?: string;
  gpayReference?: string;
  cashAmount?: number;
  totalAmount: number;
  paymentMethod: string;
}

export interface BookingDenominationData {
  denomination: number;
  count: number;
  amount: number;
}

export interface CreateBookingData {
  propertyId: string;
  applicantName: string;
  relation?: string;
  applicantAddress?: string;
  pinCode?: string;
  cellNumber: string;
  dateOfBirth?: string;
  weddingDay?: string;
  projectName: string;
  plotNumber: string;
  squareFeet?: number;
  bookingDate: string;
  edDdSmBmName?: string;
  referenceCode?: string;
  directorName?: string;
  signatureUrl?: string;
  branchId?: string;
  payments?: BookingPaymentData[];
  denominations?: BookingDenominationData[];
}

export type UpdateBookingData = Partial<CreateBookingData>;

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

export const bookingsApi = {
  getAll: (params?: BookingParams): Promise<PaginatedResponse<Booking>> =>
    api.get('/bookings', { params }).then((r) => r.data.data),

  getOne: (id: string): Promise<Booking> =>
    api.get(`/bookings/${id}`).then((r) => r.data.data),

  create: (data: CreateBookingData): Promise<Booking> =>
    api.post('/bookings', data).then((r) => r.data.data),

  update: (id: string, data: UpdateBookingData): Promise<Booking> =>
    api.put(`/bookings/${id}`, data).then((r) => r.data.data),

  updateStatus: (id: string, status: BookingStatus): Promise<Booking> =>
    api.patch(`/bookings/${id}/status`, { status }).then((r) => r.data.data),

  delete: (id: string): Promise<void> =>
    api.delete(`/bookings/${id}`).then(() => undefined),

  downloadPdf: async (id: string): Promise<void> => {
    const response = await api.get(`/bookings/${id}/pdf`, { responseType: 'blob' });
    triggerBlobDownload(response.data as Blob, `booking-${id}.pdf`);
  },
};
