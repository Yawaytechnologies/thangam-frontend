import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminsApi, type AdminParams, type CreateAdminData, type UpdateAdminData } from '../api/admins.api';
import type { UserStatus } from '../types';

export function useAdmins(params?: AdminParams) {
  return useQuery({
    queryKey: ['admins', params],
    queryFn: () => adminsApi.getAll(params),
  });
}

export function useAdmin(id: string) {
  return useQuery({
    queryKey: ['admins', id],
    queryFn: () => adminsApi.getOne(id),
    enabled: !!id,
  });
}

export function useAdminProfile() {
  return useQuery({
    queryKey: ['admin', 'profile'],
    queryFn: () => adminsApi.getProfile(),
  });
}

export function useCreateAdmin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateAdminData) => adminsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admins'] });
    },
  });
}

export function useUpdateAdmin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAdminData }) =>
      adminsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admins'] });
    },
  });
}

export function useUpdateAdminStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: UserStatus }) =>
      adminsApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admins'] });
    },
  });
}

export function useUploadAdminPhoto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) =>
      adminsApi.uploadPhoto(id, file),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['admins', id] });
      queryClient.invalidateQueries({ queryKey: ['admins'] });
    },
  });
}
