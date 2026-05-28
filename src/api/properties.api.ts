import api from '../lib/axios';
import type { Property, PropertyType, WorkflowStatus, PaginatedResponse } from '../types';

export interface PropertyParams {
  page?: number;
  limit?: number;
  search?: string;
  propertyType?: PropertyType;
  workflowStatus?: WorkflowStatus;
  branchId?: string;
}

export interface CreatePropertyData {
  propertyName: string;
  projectName: string;
  plotNumber: string;
  propertyType: PropertyType;
  squareFeet?: number;
  propertyCode?: string;
  facing?: string;
  approvalStatus?: string;
  address?: string;
  city?: string;
  district?: string;
  state?: string;
  pincode?: string;
  mapLocation?: string;
  branchId?: string;
}

export type UpdatePropertyData = Partial<CreatePropertyData>;

export interface WorkflowDocument {
  id: string;
  documentType: string;
  documentUrl: string;
  uploadedAt: string;
}

export interface WorkflowHistoryEntry {
  id: string;
  entityType: string;
  entityId: string;
  fromStatus: WorkflowStatus | null;
  toStatus: WorkflowStatus;
  remarks: string | null;
  performedBy: string | null;
  createdAt: string;
}

export type PropertyWorkflow = WorkflowHistoryEntry;

export interface UpdateWorkflowData {
  workflowStatus: WorkflowStatus;
  remarks?: string;
}

export const propertiesApi = {
  getAll: (params?: PropertyParams): Promise<PaginatedResponse<Property>> =>
    api.get('/properties', { params }).then((r) => r.data.data),

  getOne: (id: string): Promise<Property> =>
    api.get(`/properties/${id}`).then((r) => r.data.data),

  getWorkflow: (id: string): Promise<WorkflowHistoryEntry[]> =>
    api.get(`/properties/${id}/workflow`).then((r) => r.data.data),

  getDocuments: (id: string): Promise<WorkflowDocument[]> =>
    api.get(`/properties/${id}/documents`).then((r) => r.data.data),

  create: (data: CreatePropertyData): Promise<Property> =>
    api.post('/properties', data).then((r) => r.data.data),

  update: (id: string, data: UpdatePropertyData): Promise<Property> =>
    api.put(`/properties/${id}`, data).then((r) => r.data.data),

  updateWorkflow: (id: string, data: UpdateWorkflowData): Promise<PropertyWorkflow> =>
    api.patch(`/properties/${id}/workflow`, data).then((r) => r.data.data),

  uploadImages: (id: string, files: File[]): Promise<Property> => {
    const form = new FormData();
    files.forEach((f) => form.append('images', f));
    return api.post(`/properties/${id}/images`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data.data);
  },
};
