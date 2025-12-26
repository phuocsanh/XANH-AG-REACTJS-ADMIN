/**
 * React Query hooks cho quản lý lịch canh tác (Farming Schedule)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/utils/api';
import type {
  FarmingSchedule,
  CreateFarmingScheduleDto,
  FarmingScheduleFilters,
} from '@/models/rice-farming';

// ==================== QUERY KEYS ====================

export const farmingScheduleKeys = {
  all: ['farming-schedules'] as const,
  lists: () => [...farmingScheduleKeys.all, 'list'] as const,
  list: (filters: FarmingScheduleFilters) => [...farmingScheduleKeys.lists(), filters] as const,
  upcoming: (days: number) => [...farmingScheduleKeys.all, 'upcoming', days] as const,
  byCrop: (cropId: number) => [...farmingScheduleKeys.all, 'crop', cropId] as const,
};

// ==================== QUERIES ====================

/**
 * Lấy danh sách lịch canh tác
 * Nếu có rice_crop_id thì dùng endpoint /crop/:id
 */
export const useFarmingSchedules = (filters?: FarmingScheduleFilters) => {
  return useQuery({
    queryKey: farmingScheduleKeys.list(filters || {}),
    queryFn: async () => {
      // Nếu có rice_crop_id, dùng endpoint crop
      if (filters?.rice_crop_id) {
        const response = await api.get<FarmingSchedule[]>(`/farming-schedules/crop/${filters.rice_crop_id}`);
        return response;
      }
      
      // Fallback: lấy lịch sắp tới
      const response = await api.get<FarmingSchedule[]>(`/farming-schedules/upcoming?days=30`);
      return response;
    },
  });
};

/**
 * Lấy lịch sắp tới
 */
export const useUpcomingSchedules = (days: number = 7) => {
  return useQuery({
    queryKey: farmingScheduleKeys.upcoming(days),
    queryFn: async () => {
      const response = await api.get<FarmingSchedule[]>(`/farming-schedules/upcoming?days=${days}`);
      return response;
    },
  });
};

/**
 * Lấy lịch theo Ruộng lúa
 */
export const useCropSchedules = (cropId: number) => {
  return useQuery({
    queryKey: farmingScheduleKeys.byCrop(cropId),
    queryFn: async () => {
      const response = await api.get<FarmingSchedule[]>(`/farming-schedules/crop/${cropId}`);
      return response;
    },
    enabled: !!cropId,
  });
};

// ==================== MUTATIONS ====================

/**
 * Tạo lịch canh tác
 */
export const useCreateFarmingSchedule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: CreateFarmingScheduleDto) => {
      return await api.postRaw<FarmingSchedule>('/farming-schedules', dto);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: farmingScheduleKeys.lists() });
      queryClient.invalidateQueries({ queryKey: farmingScheduleKeys.byCrop(data.rice_crop_id) });
      queryClient.invalidateQueries({ queryKey: farmingScheduleKeys.all });
    },
  });
};

/**
 * Cập nhật lịch canh tác
 */
export const useUpdateFarmingSchedule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, dto }: { id: number; dto: Partial<CreateFarmingScheduleDto> }) => {
      return await api.patchRaw<FarmingSchedule>(`/farming-schedules/${id}`, dto);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: farmingScheduleKeys.lists() });
      queryClient.invalidateQueries({ queryKey: farmingScheduleKeys.byCrop(data.rice_crop_id) });
      queryClient.invalidateQueries({ queryKey: farmingScheduleKeys.all });
    },
  });
};

/**
 * Đánh dấu hoàn thành
 */
export const useMarkScheduleComplete = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      return await api.patchRaw<FarmingSchedule>(`/farming-schedules/${id}/complete`, {});
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: farmingScheduleKeys.lists() });
      queryClient.invalidateQueries({ queryKey: farmingScheduleKeys.byCrop(data.rice_crop_id) });
      queryClient.invalidateQueries({ queryKey: farmingScheduleKeys.all });
    },
  });
};

/**
 * Xóa lịch canh tác
 */
export const useDeleteFarmingSchedule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, cropId }: { id: number; cropId: number }) => {
      await api.delete(`/farming-schedules/${id}`);
      return cropId;
    },
    onSuccess: (cropId) => {
      queryClient.invalidateQueries({ queryKey: farmingScheduleKeys.lists() });
      queryClient.invalidateQueries({ queryKey: farmingScheduleKeys.byCrop(cropId) });
      queryClient.invalidateQueries({ queryKey: farmingScheduleKeys.all });
    },
  });
};

// Export alias để tương thích với tên đã dùng trong components
export { useMarkScheduleComplete as useCompleteFarmingSchedule };
