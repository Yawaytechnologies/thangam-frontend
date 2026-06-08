import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
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
      toast.success('Top performer added successfully.');
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
      toast.success('Top performer updated successfully.');
    },
  });
}

export function useRemoveTopPerformer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => topPerformersApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['top-performers'] });
      toast.success('Top performer removed successfully.');
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
    mutationFn: (frozen: boolean) => topPerformersApi.toggleFreeze(frozen),
    onSuccess: (_data, frozen) => {
      queryClient.invalidateQueries({ queryKey: ['top-performers'] });
      toast.success(frozen ? 'Top performers list frozen.' : 'Top performers list unfrozen.');
    },
  });
}
