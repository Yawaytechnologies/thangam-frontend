import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { billingApi, type BillingParams, type CreateBillingData, type UpdateBillingData } from '../api/billing.api';
import type { BillingStatus } from '../types';

export function useBillings(params?: BillingParams) {
  return useQuery({
    queryKey: ['billing', params],
    queryFn: () => billingApi.getAll(params),
  });
}

export function useBilling(id: string) {
  return useQuery({
    queryKey: ['billing', id],
    queryFn: () => billingApi.getOne(id),
    enabled: !!id,
  });
}

export function useCreateBilling() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateBillingData) => billingApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billing'] });
    },
  });
}

export function useUpdateBilling() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateBillingData }) =>
      billingApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billing'] });
    },
  });
}

export function useDeleteBilling() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => billingApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billing'] });
      toast.success('Billing record deleted successfully.');
    },
  });
}

export function useUpdateBillingStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: BillingStatus }) =>
      billingApi.updateStatus(id, status),
    onSuccess: (_data, { status }) => {
      queryClient.invalidateQueries({ queryKey: ['billing'] });
      toast.success(`Billing status changed to ${status.replaceAll('_', ' ').toLowerCase()}.`);
    },
  });
}

export function useUploadBillingSignature() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) =>
      billingApi.uploadSignature(id, file),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['billing', id] });
      queryClient.invalidateQueries({ queryKey: ['billing'] });
    },
  });
}
