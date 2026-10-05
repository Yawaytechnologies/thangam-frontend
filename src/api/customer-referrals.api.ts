import api from '../lib/axios';
import type { PaginatedResponse } from '../types';

export interface CustomerReferral {
  id: string;
  customerName: string;
  customerPhone: string;
  notes: string;
  propertyId: string;
  assignedAgentId: string;
  currentReviewerId: string | null;
  status: string;
  version: number;
  bookingId?: string | null;
  createdAt: string;
}

export interface CustomerReferralDetail extends CustomerReferral {
  assignedAgent: { id: string; fullName: string; memberId: string; role: string } | null;
  reviewer: { id: string; fullName: string; memberId: string; role: string } | null;
  property: {
    id: string;
    propertyName: string;
    projectName: string;
    plotNumber: string;
    squareFeet: number | null;
    workflowStatus: string;
  } | null;
  booking?: { id: string; bookingId: string; status: string } | null;
  activities: {
    id: string;
    actorName: string;
    action: string;
    notes: string;
    createdAt: string;
  }[];
}

export const customerReferralsApi = {
  list: (page = 1): Promise<PaginatedResponse<CustomerReferral>> =>
    api.get('/customer-referrals', { params: { page, limit: 20 } }).then((r) => r.data.data),
  detail: (id: string): Promise<CustomerReferralDetail> =>
    api.get(`/customer-referrals/${id}`).then((r) => r.data.data),
};
