/**
 * React Query hooks cho Quản Lý Canh Tác (Rice Crop)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/utils/api';
import type {
  RiceCrop,
  CreateRiceCropDto,
  UpdateRiceCropDto,
  UpdateGrowthStageDto,
  UpdateStatusDto,
  RiceCropFilters,
  CustomerStats,
} from '@/models/rice-farming';

// ==================== QUERY KEYS ====================

export const riceCropKeys = {
  all: ['rice-crops'] as const,
  lists: () => [...riceCropKeys.all, 'list'] as const,
  list: (filters: RiceCropFilters) => [...riceCropKeys.lists(), filters] as const,
  details: () => [...riceCropKeys.all, 'detail'] as const,
  detail: (id: number) => [...riceCropKeys.details(), id] as const,
  stats: (customerId: number) => [...riceCropKeys.all, 'stats', customerId] as const,
};

// ==================== QUERIES ====================

/**
 * Lấy  Danh sách ruộng lúa (POST /rice-crops/search)
 */
export const useRiceCrops = (params?: Record<string, unknown>, options?: { enabled?: boolean }) => {
  const page = (params?.page as number) || 1
  const limit = (params?.limit as number) || 10

  return useQuery({
    queryKey: riceCropKeys.list(params as any),
    queryFn: async () => {
      const searchBody = {
        page,
        limit,
        ...params
      }

      const response = await api.postRaw<{
        data: RiceCrop[]
        total: number
        page: number
        limit: number
      }>('/rice-crops/search', searchBody)

      return {
          data: response.data || [],
          total: response.total || 0
      }
    },
    enabled: options?.enabled,
  });
};

/**
 * Lấy chi tiết Ruộng lúa
 */
export const useRiceCrop = (id: number) => {
  return useQuery({
    queryKey: riceCropKeys.detail(id),
    queryFn: async () => {
      const response = await api.get<RiceCrop>(`/rice-crops/${id}`);
      return response;
    },
    enabled: !!id,
  });
};

/**
 * Thống kê Ruộng lúa theo khách hàng
 */
export const useCustomerStats = (customerId: number) => {
  return useQuery({
    queryKey: riceCropKeys.stats(customerId),
    queryFn: async () => {
      return await api.get<CustomerStats>(`/rice-crops/customer/${customerId}/stats`);
    },
    enabled: !!customerId,
  });
};

// ==================== MUTATIONS ====================

/**
 * Tạo Ruộng lúa mới
 */
export const useCreateRiceCrop = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: CreateRiceCropDto) => {
      return await api.postRaw<RiceCrop>('/rice-crops', dto);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: riceCropKeys.lists() });
    },
  });
};

/**
 * Cập nhật Ruộng lúa
 */
export const useUpdateRiceCrop = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, dto }: { id: number; dto: UpdateRiceCropDto }) => {
      return await api.patchRaw<RiceCrop>(`/rice-crops/${id}`, dto);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: riceCropKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: riceCropKeys.lists() });
    },
  });
};

/**
 * Cập nhật giai đoạn sinh trưởng
 */
export const useUpdateGrowthStage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, dto }: { id: number; dto: UpdateGrowthStageDto }) => {
      return await api.patchRaw<RiceCrop>(`/rice-crops/${id}/growth-stage`, dto);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: riceCropKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: riceCropKeys.lists() });
    },
  });
};

/**
 * Cập nhật trạng thái Ruộng lúa
 */
export const useUpdateStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, dto }: { id: number; dto: UpdateStatusDto }) => {
      return await api.patchRaw<RiceCrop>(`/rice-crops/${id}/status`, dto);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: riceCropKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: riceCropKeys.lists() });
    },
  });
};

/**
 * Xóa Ruộng lúa
 */
export const useDeleteRiceCrop = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/rice-crops/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: riceCropKeys.lists() });
    },
  });
};
