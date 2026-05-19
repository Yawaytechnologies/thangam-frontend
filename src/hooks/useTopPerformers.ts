import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  topPerformersApi,
  type CreateTopPerformerData,
  type UpdateTopPerformerData,
  type ReorderTopPerformersData,
} from '../api/top-performers.api';

export function useTopPerformers() {
  return useQuery({
    queryKey: ['top-performers'],
    queryFn: () => topPerformersApi.getAll(),
  });
}

export function useCreateTopPerformer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTopPerformerData) => topPerformersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['top-performers'] });
    },
  });
}

export function useUpdateTopPerformer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTopPerformerData }) =>
      topPerformersApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['top-performers'] });
    },
  });
}

export function useRemoveTopPerformer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => topPerformersApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['top-performers'] });
    },
  });
}

export function useReorderTopPerformers() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ReorderTopPerformersData) => topPerformersApi.reorder(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['top-performers'] });
    },
  });
}

export function useToggleFreeze() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => topPerformersApi.toggleFreeze(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['top-performers'] });
    },
  });
}
