import api from '../lib/axios';

export type DocumentEntityType =
  | 'property'
  | 'booking'
  | 'billing'
  | 'member'
  | 'admin'
  | 'branch';

export interface Document {
  id: string;
  entityType: DocumentEntityType;
  entityId: string;
  documentType: string;
  documentUrl: string;
  fileName: string;
  fileSize?: number;
  mimeType?: string;
  uploadedAt: string;
}

export interface DocumentUrlResponse {
  url: string;
  expiresAt: string;
}

export const documentsApi = {
  upload: (
    entityType: DocumentEntityType,
    entityId: string,
    documentType: string,
    file: File,
  ): Promise<Document> => {
    const form = new FormData();
    form.append('file', file);
    form.append('entityType', entityType);
    form.append('entityId', entityId);
    form.append('documentType', documentType);
    return api
      .post('/documents/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data.data);
  },

  getUrl: (id: string): Promise<DocumentUrlResponse> =>
    api.get(`/documents/${id}/url`).then((r) => r.data.data),

  getByEntity: (
    entityType: DocumentEntityType,
    entityId: string,
  ): Promise<Document[]> =>
    api
      .get(`/documents/entity/${entityType}/${entityId}`)
      .then((r) => r.data.data),
};
