import { useAuthStore } from '../stores/auth.store';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  propertiesApi,
  type PropertyParams,
  type CreatePropertyData,
  type UpdatePropertyData,
  type UpdateWorkflowData,
} from '../api/properties.api';

export function useProperties(params?: PropertyParams) {
  const user = useAuthStore(state => state.user);
  const scope = [user?.id, user?.role, user?.admin?.branchId, user?.member?.branchId];
  return useQuery({
    queryKey: [...['properties', params], ...scope],
    queryFn: () => propertiesApi.getAll(params),
  });
}

export function useProperty(id: string) {
  const user = useAuthStore(state => state.user);
  const scope = [user?.id, user?.role, user?.admin?.branchId, user?.member?.branchId];
  return useQuery({
    queryKey: [...['properties', id], ...scope],
    queryFn: () => propertiesApi.getOne(id),
    enabled: !!id,
  });
}

export function usePropertyWorkflow(id: string) {
  const user = useAuthStore(state => state.user);
  const scope = [user?.id, user?.role, user?.admin?.branchId, user?.member?.branchId];
  return useQuery({
    queryKey: [...['properties', id, 'workflow'], ...scope],
    queryFn: () => propertiesApi.getWorkflow(id),
    enabled: !!id,
  });
}

export function usePropertyDocuments(id: string) {
  const user = useAuthStore(state => state.user);
  const scope = [user?.id, user?.role, user?.admin?.branchId, user?.member?.branchId];
  return useQuery({
    queryKey: [...['properties', id, 'documents'], ...scope],
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
    },
  });
}
