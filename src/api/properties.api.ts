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
  city?: string;
  state?: string;
  branchId?: string;
}

export type UpdatePropertyData = Partial<CreatePropertyData>;

export interface WorkflowDocument {
  id: string;
  documentType: string;
  documentUrl: string;
  uploadedAt: string;
}

export interface PropertyWorkflow {
  id: string;
  propertyId: string;
  status: WorkflowStatus;
  updatedAt: string;
}

export interface UpdateWorkflowData {
  status: WorkflowStatus;
  notes?: string;
}

export const propertiesApi = {
  getAll: (params?: PropertyParams): Promise<PaginatedResponse<Property>> =>
    api.get('/properties', { params }).then((r) => r.data.data),

  getOne: (id: string): Promise<Property> =>
    api.get(`/properties/${id}`).then((r) => r.data.data),

  getWorkflow: (id: string): Promise<PropertyWorkflow> =>
    api.get(`/properties/${id}/workflow`).then((r) => r.data.data),

  getDocuments: (id: string): Promise<WorkflowDocument[]> =>
    api.get(`/properties/${id}/documents`).then((r) => r.data.data),

  create: (data: CreatePropertyData): Promise<Property> =>
    api.post('/properties', data).then((r) => r.data.data),

  update: (id: string, data: UpdatePropertyData): Promise<Property> =>
    api.put(`/properties/${id}`, data).then((r) => r.data.data),

  updateWorkflow: (id: string, data: UpdateWorkflowData): Promise<PropertyWorkflow> =>
    api.patch(`/properties/${id}/workflow`, data).then((r) => r.data.data),
};
