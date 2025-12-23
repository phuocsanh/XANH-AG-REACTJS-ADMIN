/**
 * React Query hooks cho theo dõi sinh trưởng (Growth Tracking)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/utils/api';
import type {
  GrowthTracking,
  CreateGrowthTrackingDto,
} from '@/models/rice-farming';

// ==================== QUERY KEYS ====================

export const growthTrackingKeys = {
  all: ['growth-trackings'] as const,
  byCrop: (cropId: number) => [...growthTrackingKeys.all, 'crop', cropId] as const,
};

// ==================== QUERIES ====================

/**
 * Lấy bản ghi theo dõi theo Ruộng lúa
 */
export const useGrowthTrackings = (cropId: number) => {
  return useQuery({
    queryKey: growthTrackingKeys.byCrop(cropId),
    queryFn: async () => {
      const response = await api.get<any>(`/growth-trackings/crop/${cropId}`);
      return response.data || response;
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
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: growthTrackingKeys.byCrop(variables.rice_crop_id) });
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
    onSuccess: (data, variables) => {
      // Sử dụng variables.dto.rice_crop_id nếu có, nếu không thì dùng data.rice_crop_id (fallback)
      const cropId = variables.dto.rice_crop_id || data.rice_crop_id;
      if (cropId) {
        queryClient.invalidateQueries({ queryKey: growthTrackingKeys.byCrop(cropId) });
      }
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
