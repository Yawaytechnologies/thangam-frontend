import api from '../lib/axios';
import { downloadResponseFile } from '../lib/download-file';
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
  status?: BookingStatus;
  payments?: BookingPaymentData[];
  denominations?: BookingDenominationData[];
}

export type UpdateBookingData = Partial<CreateBookingData>;

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

  uploadSignature: (id: string, file: File): Promise<unknown> => {
    const form = new FormData();
    form.append('file', file);
    form.append('entityType', 'booking');
    form.append('entityId', id);
    form.append('documentType', 'BOOKING_DOCUMENT');
    return api.post('/documents/upload', form, { skipAuthRedirect: true }).then((r) => r.data.data);
  },

  delete: (id: string): Promise<void> =>
    api.delete(`/bookings/${id}`).then(() => undefined),

  downloadPdf: async (id: string, filename = `booking-${id}.pdf`): Promise<void> => {
    const response = await api.get(`/bookings/${id}/pdf`, { responseType: 'blob' });
    await downloadResponseFile(response.data, String(response.headers['content-type'] ?? ''), filename);
  },
};
