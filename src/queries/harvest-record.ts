/**
 * React Query hooks cho quản lý thu hoạch (Harvest Record)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/utils/api';
import type {
  HarvestRecord,
  CreateHarvestRecordDto,
} from '@/models/rice-farming';

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
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: harvestRecordKeys.byCrop(variables.rice_crop_id) });
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
    onSuccess: (_, variables) => {
      // Khi update, dto có thể không có rice_crop_id nếu chỉ update 1 trường
      // Nhưng trong HarvestRecordsTab.tsx, dto luôn được spread từ values và thêm rice_crop_id
      // Tuy nhiên dto là Partial. Nếu logic thay đổi thì có thể lỗi.
      // Dù sao, backend trả về record có rice_crop_id, hoặc ta invalid tất cả crop records nếu cần.
      // Cách tốt nhất cho update: Nếu dto có rice_crop_id dùng nó.
      // Nếu không, hy vọng data trả về có.
      // Hoặc invalidate 'harvest-records' chung (hơi rộng).
      
      // Trong trường hợp này, ứng dụng React luôn gửi rice_crop_id trong DTO khi update (xem HarvestRecordsTab.tsx).
      // Nhưng để chắc chắn, ta check cả 2 nguồn.
      const cropId = variables.dto.rice_crop_id;
      if (cropId) {
         queryClient.invalidateQueries({ queryKey: harvestRecordKeys.byCrop(cropId) });
      } else {
         // Fallback invalidate lại toàn bộ
         queryClient.invalidateQueries({ queryKey: harvestRecordKeys.all });
      }
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
