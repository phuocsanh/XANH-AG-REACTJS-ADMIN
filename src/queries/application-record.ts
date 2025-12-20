/**
 * React Query hooks cho quản lý nhật ký phun thuốc/bón phân (Application Record)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/utils/api';
import type {
  ApplicationRecord,
  CreateApplicationRecordDto,
} from '@/types/rice-farming.types';

// ==================== QUERY KEYS ====================

export const applicationRecordKeys = {
  all: ['application-records'] as const,
  byCrop: (cropId: number) => [...applicationRecordKeys.all, 'crop', cropId] as const,
};

// ==================== QUERIES ====================

/**
 * Lấy nhật ký theo Ruộng lúa
 */
export const useApplicationRecords = (cropId: number) => {
  return useQuery({
    queryKey: applicationRecordKeys.byCrop(cropId),
    queryFn: async () => {
      const response = await api.get<any>(`/application-records/crop/${cropId}`);
      return response.data || response;
    },
    enabled: !!cropId,
  });
};

// ==================== MUTATIONS ====================

/**
 * Tạo nhật ký mới
 */
export const useCreateApplicationRecord = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: CreateApplicationRecordDto) => {
      return await api.postRaw<ApplicationRecord>('/application-records', dto);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: applicationRecordKeys.byCrop(data.rice_crop_id) });
    },
  });
};

/**
 * Cập nhật nhật ký
 */
export const useUpdateApplicationRecord = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, dto }: { id: number; dto: Partial<CreateApplicationRecordDto> }) => {
      return await api.patchRaw<ApplicationRecord>(`/application-records/${id}`, dto);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: applicationRecordKeys.byCrop(data.rice_crop_id) });
    },
  });
};

/**
 * Xóa nhật ký
 */
export const useDeleteApplicationRecord = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, cropId }: { id: number; cropId: number }) => {
      await api.delete(`/application-records/${id}`);
      return cropId;
    },
    onSuccess: (cropId) => {
      queryClient.invalidateQueries({ queryKey: applicationRecordKeys.byCrop(cropId) });
    },
  });
};
