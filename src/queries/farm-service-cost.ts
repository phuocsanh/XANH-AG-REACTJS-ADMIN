/**
 * React Query hooks cho Farm Service Cost API
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import api from '@/utils/api';
import type {
  FarmServiceCost,
  CreateFarmServiceCostDto,
  UpdateFarmServiceCostDto,
  SearchFarmServiceCostDto,
} from '@/models/farm-service-cost';

// Query keys
export const farmServiceCostKeys = {
  all: ['farm-service-costs'] as const,
  lists: () => [...farmServiceCostKeys.all, 'list'] as const,
  list: (filters: SearchFarmServiceCostDto) => [...farmServiceCostKeys.lists(), filters] as const,
  details: () => [...farmServiceCostKeys.all, 'detail'] as const,
  detail: (id: number) => [...farmServiceCostKeys.details(), id] as const,
};

/**
 * Hook để tìm kiếm farm service costs
 */
export function useFarmServiceCostsQuery(params: SearchFarmServiceCostDto = {}) {
  return useQuery({
    queryKey: farmServiceCostKeys.list(params),
    queryFn: async () => {
      return await api.postRaw<{ data: FarmServiceCost[]; total: number }>(
        '/farm-service-costs/search',
        params as any
      );
    },
  });
}

/**
 * Hook để lấy chi tiết farm service cost
 */
export function useFarmServiceCostQuery(id: number) {
  return useQuery({
    queryKey: farmServiceCostKeys.detail(id),
    queryFn: async () => {
      return await api.get<FarmServiceCost>(`/farm-service-costs/${id}`);
    },
    enabled: !!id,
  });
}

/**
 * Hook để tạo farm service cost mới
 */
export function useCreateFarmServiceCostMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (createDto: CreateFarmServiceCostDto) => {
      return await api.postRaw<FarmServiceCost>('/farm-service-costs', createDto as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: farmServiceCostKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['store-profit-reports'] });
      queryClient.invalidateQueries({ queryKey: ['profit-reports'] });
      toast.success('Tạo chi phí dịch vụ thành công');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Có lỗi xảy ra khi tạo chi phí dịch vụ');
    },
  });
}

/**
 * Hook để cập nhật farm service cost
 */
export function useUpdateFarmServiceCostMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateFarmServiceCostDto }) => {
      return await api.patchRaw<FarmServiceCost>(`/farm-service-costs/${id}`, data as any);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: farmServiceCostKeys.lists() });
      queryClient.invalidateQueries({ queryKey: farmServiceCostKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: ['store-profit-reports'] });
      queryClient.invalidateQueries({ queryKey: ['profit-reports'] });
      toast.success('Cập nhật chi phí dịch vụ thành công');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Có lỗi xảy ra khi cập nhật chi phí dịch vụ');
    },
  });
}

/**
 * Hook để xóa farm service cost
 */
export function useDeleteFarmServiceCostMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/farm-service-costs/${id}`);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: farmServiceCostKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['store-profit-reports'] });
      queryClient.invalidateQueries({ queryKey: ['profit-reports'] });
      toast.success('Xóa chi phí dịch vụ thành công');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Có lỗi xảy ra khi xóa chi phí dịch vụ');
    },
  });
}
