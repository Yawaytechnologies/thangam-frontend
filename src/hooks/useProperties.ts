import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  propertiesApi,
  type PropertyParams,
  type CreatePropertyData,
  type UpdatePropertyData,
  type UpdateWorkflowData,
} from '../api/properties.api';

export function useProperties(params?: PropertyParams) {
  return useQuery({
    queryKey: ['properties', params],
    queryFn: () => propertiesApi.getAll(params),
  });
}

export function useAllProperties(params?: Omit<PropertyParams, 'page' | 'limit'>) {
  return useQuery({
    queryKey: ['properties', 'all', params],
    queryFn: async () => {
      const firstPage = await propertiesApi.getAll({ ...params, page: 1, limit: 100 });
      const pageSize = firstPage.limit || 100;
      const totalPages = Math.ceil(firstPage.total / pageSize);

      if (totalPages <= 1) return firstPage.data;

      const remainingPages = await Promise.all(
        Array.from({ length: totalPages - 1 }, (_, index) =>
          propertiesApi.getAll({ ...params, page: index + 2, limit: pageSize })
        )
      );

      return [firstPage.data, ...remainingPages.map((page) => page.data)].flat();
    },
  });
}

export function useProperty(id: string) {
  return useQuery({
    queryKey: ['properties', id],
    queryFn: () => propertiesApi.getOne(id),
    enabled: !!id,
  });
}

export function usePropertyWorkflow(id: string) {
  return useQuery({
    queryKey: ['properties', id, 'workflow'],
    queryFn: () => propertiesApi.getWorkflow(id),
    enabled: !!id,
  });
}

export function usePropertyDocuments(id: string) {
  return useQuery({
    queryKey: ['properties', id, 'documents'],
    queryFn: () => propertiesApi.getDocuments(id),
    enabled: !!id,
  });
}

export function useCreateProperty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePropertyData) => propertiesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      toast.success('Property created successfully.');
    },
  });
}

export function useUpdateProperty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePropertyData }) =>
      propertiesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      toast.success('Property updated successfully.');
    },
  });
}

export function useUpdatePropertyWorkflow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateWorkflowData }) =>
      propertiesApi.updateWorkflow(id, data),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      queryClient.invalidateQueries({ queryKey: ['properties', variables.id, 'workflow'] });
      toast.success('Property workflow updated successfully.');
    },
  });
}

export function useUploadPropertyImages() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, files }: { id: string; files: File[] }) =>
      propertiesApi.uploadImages(id, files),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['properties', id] });
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      toast.success('Property images uploaded successfully.', { id: 'property-images-uploaded' });
    },
  });
}
