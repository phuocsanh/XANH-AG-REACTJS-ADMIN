/**
 * React Query hooks cho quản lý vụ lúa (Rice Crop)
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
} from '@/types/rice-farming.types';

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
 * Lấy danh sách vụ lúa
 */
export const useRiceCrops = (filters?: RiceCropFilters) => {
  return useQuery({
    queryKey: riceCropKeys.list(filters || {}),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.customer_id) params.append('customer_id', filters.customer_id.toString());
      if (filters?.season_id) params.append('season_id', filters.season_id.toString());
      if (filters?.status) params.append('status', filters.status);
      if (filters?.growth_stage) params.append('growth_stage', filters.growth_stage);

      return await api.get<RiceCrop[]>(`/rice-crops?${params.toString()}`);
    },
  });
};

/**
 * Lấy chi tiết vụ lúa
 */
export const useRiceCrop = (id: number) => {
  return useQuery({
    queryKey: riceCropKeys.detail(id),
    queryFn: async () => {
      return await api.get<RiceCrop>(`/rice-crops/${id}`);
    },
    enabled: !!id,
  });
};

/**
 * Thống kê vụ lúa theo khách hàng
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
 * Tạo vụ lúa mới
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
 * Cập nhật vụ lúa
 */
export const useUpdateRiceCrop = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, dto }: { id: number; dto: UpdateRiceCropDto }) => {
      return await api.patchRaw<RiceCrop>(`/rice-crops/${id}`, dto);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: riceCropKeys.detail(data.id) });
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
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: riceCropKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: riceCropKeys.lists() });
    },
  });
};

/**
 * Cập nhật trạng thái vụ lúa
 */
export const useUpdateStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, dto }: { id: number; dto: UpdateStatusDto }) => {
      return await api.patchRaw<RiceCrop>(`/rice-crops/${id}/status`, dto);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: riceCropKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: riceCropKeys.lists() });
    },
  });
};

/**
 * Xóa vụ lúa
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
