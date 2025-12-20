/**
 * React Query hooks cho quản lý thu hoạch (Harvest Record)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/utils/api';
import type {
  HarvestRecord,
  CreateHarvestRecordDto,
} from '@/types/rice-farming.types';

// ==================== QUERY KEYS ====================

export const harvestRecordKeys = {
  all: ['harvest-records'] as const,
  byCrop: (cropId: number) => [...harvestRecordKeys.all, 'crop', cropId] as const,
};

// ==================== QUERIES ====================

/**
 * Lấy bản ghi thu hoạch theo Ruộng lúa
 */
export const useHarvestRecords = (cropId: number) => {
  return useQuery({
    queryKey: harvestRecordKeys.byCrop(cropId),
    queryFn: async () => {
      const response = await api.get<any>(`/harvest-records/crop/${cropId}`);
      // Backend có thể wrap trong { data: [...] }
      return response.data || response;
    },
    enabled: !!cropId,
  });
};

// ==================== MUTATIONS ====================

/**
 * Tạo bản ghi thu hoạch
 */
export const useCreateHarvestRecord = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: CreateHarvestRecordDto) => {
      return await api.postRaw<HarvestRecord>('/harvest-records', dto);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: harvestRecordKeys.byCrop(data.rice_crop_id) });
    },
  });
};

/**
 * Cập nhật bản ghi thu hoạch
 */
export const useUpdateHarvestRecord = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, dto }: { id: number; dto: Partial<CreateHarvestRecordDto> }) => {
      return await api.patchRaw<HarvestRecord>(`/harvest-records/${id}`, dto);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: harvestRecordKeys.byCrop(data.rice_crop_id) });
    },
  });
};

/**
 * Xóa bản ghi thu hoạch
 */
export const useDeleteHarvestRecord = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, cropId }: { id: number; cropId: number }) => {
      await api.delete(`/harvest-records/${id}`);
      return cropId;
    },
    onSuccess: (cropId) => {
      queryClient.invalidateQueries({ queryKey: harvestRecordKeys.byCrop(cropId) });
    },
  });
};
