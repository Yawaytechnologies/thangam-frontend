import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  documentsApi,
  type DocumentEntityType,
} from '../api/documents.api';

export function useDocuments(entityType: DocumentEntityType, entityId: string) {
  return useQuery({
    queryKey: ['documents', entityType, entityId],
    queryFn: () => documentsApi.getByEntity(entityType, entityId),
    enabled: !!entityId,
  });
}

export function useDocumentUrl(id: string) {
  return useQuery({
    queryKey: ['document-url', id],
    queryFn: () => documentsApi.getUrl(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useUploadDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      entityType,
      entityId,
      documentType,
      file,
    }: {
      entityType: DocumentEntityType;
      entityId: string;
      documentType: string;
      file: File;
    }) => documentsApi.upload(entityType, entityId, documentType, file),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['documents', variables.entityType, variables.entityId],
      });
    },
  });
}
