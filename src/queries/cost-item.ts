/**
 * React Query hooks cho quản lý chi phí (Cost Item)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/utils/api';
import type {
  CostItem,
  CreateCostItemDto,
  CostItemFilters,
  CostSummary,
} from '@/types/rice-farming.types';

// ==================== QUERY KEYS ====================

export const costItemKeys = {
  all: ['cost-items'] as const,
  lists: () => [...costItemKeys.all, 'list'] as const,
  list: (filters: CostItemFilters) => [...costItemKeys.lists(), filters] as const,
  summary: (cropId: number) => [...costItemKeys.all, 'summary', cropId] as const,
};

// ==================== QUERIES ====================

/**
 * Lấy danh sách chi phí (POST /cost-items/search)
 */
export const useCostItems = (filters?: CostItemFilters) => {
  return useQuery({
    queryKey: costItemKeys.list(filters || {}),
    queryFn: async () => {
      const searchBody: any = {
        page: 1,
        limit: 1000,
      }

      if (filters?.rice_crop_id) searchBody.rice_crop_id = filters.rice_crop_id
      if (filters?.category) searchBody.category = filters.category

      const response = await api.postRaw<{
        data: CostItem[]
        total: number
        page: number
        limit: number
      }>('/cost-items/search', searchBody)

      return response.data || []
    },
  });
};

/**
 * Tổng hợp chi phí theo vụ lúa
 */
export const useCostSummary = (cropId: number) => {
  return useQuery({
    queryKey: costItemKeys.summary(cropId),
    queryFn: async () => {
      return await api.get<CostSummary>(`/cost-items/crop/${cropId}/summary`);
    },
    enabled: !!cropId,
  });
};

// ==================== MUTATIONS ====================

/**
 * Tạo chi phí mới
 */
export const useCreateCostItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: CreateCostItemDto) => {
      return await api.postRaw<CostItem>('/cost-items', dto);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: costItemKeys.lists() });
      queryClient.invalidateQueries({ queryKey: costItemKeys.summary(data.rice_crop_id) });
    },
  });
};

/**
 * Cập nhật chi phí
 */
export const useUpdateCostItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, dto }: { id: number; dto: Partial<CreateCostItemDto> }) => {
      return await api.patchRaw<CostItem>(`/cost-items/${id}`, dto);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: costItemKeys.lists() });
      queryClient.invalidateQueries({ queryKey: costItemKeys.summary(data.rice_crop_id) });
    },
  });
};

/**
 * Xóa chi phí
 */
export const useDeleteCostItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, cropId }: { id: number; cropId: number }) => {
      await api.delete(`/cost-items/${id}`);
      return cropId;
    },
    onSuccess: (cropId) => {
      queryClient.invalidateQueries({ queryKey: costItemKeys.lists() });
      queryClient.invalidateQueries({ queryKey: costItemKeys.summary(cropId) });
    },
  });
};
