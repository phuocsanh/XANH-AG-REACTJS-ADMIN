/**
 * React Query hooks cho theo dõi sinh trưởng (Growth Tracking)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/utils/api';
import type {
  GrowthTracking,
  CreateGrowthTrackingDto,
} from '@/types/rice-farming.types';

// ==================== QUERY KEYS ====================

export const growthTrackingKeys = {
  all: ['growth-trackings'] as const,
  byCrop: (cropId: number) => [...growthTrackingKeys.all, 'crop', cropId] as const,
};

// ==================== QUERIES ====================

/**
 * Lấy bản ghi theo dõi theo vụ lúa
 */
export const useGrowthTrackings = (cropId: number) => {
  return useQuery({
    queryKey: growthTrackingKeys.byCrop(cropId),
    queryFn: async () => {
      return await api.get<GrowthTracking[]>(`/growth-trackings/crop/${cropId}`);
    },
    enabled: !!cropId,
  });
};

// ==================== MUTATIONS ====================

/**
 * Tạo bản ghi theo dõi
 */
export const useCreateGrowthTracking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: CreateGrowthTrackingDto) => {
      return await api.postRaw<GrowthTracking>('/growth-trackings', dto);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: growthTrackingKeys.byCrop(data.rice_crop_id) });
    },
  });
};

/**
 * Cập nhật bản ghi theo dõi
 */
export const useUpdateGrowthTracking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, dto }: { id: number; dto: Partial<CreateGrowthTrackingDto> }) => {
      return await api.patchRaw<GrowthTracking>(`/growth-trackings/${id}`, dto);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: growthTrackingKeys.byCrop(data.rice_crop_id) });
    },
  });
};

/**
 * Xóa bản ghi theo dõi
 */
export const useDeleteGrowthTracking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, cropId }: { id: number; cropId: number }) => {
      await api.delete(`/growth-trackings/${id}`);
      return cropId;
    },
    onSuccess: (cropId) => {
      queryClient.invalidateQueries({ queryKey: growthTrackingKeys.byCrop(cropId) });
    },
  });
};
