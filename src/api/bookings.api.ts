import api from '../lib/axios';
import type { Booking, BookingStatus, PaginatedResponse } from '../types';

export interface BookingParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: BookingStatus;
  branchId?: string;
  propertyId?: string;
}

export interface CreateBookingData {
  propertyId: string;
  applicantName: string;
  cellNumber: string;
  projectName: string;
  plotNumber: string;
  bookingDate: string;
  branchId?: string;
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

  downloadPdf: async (id: string): Promise<void> => {
    const response = await api.get(`/bookings/${id}/pdf`, { responseType: 'blob' });
    triggerBlobDownload(response.data as Blob, `booking-${id}.pdf`);
  },
};
