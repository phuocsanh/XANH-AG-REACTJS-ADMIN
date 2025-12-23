/**
 * React Query hooks cho Quản Lý Vùng/Lô Đất (Area of Each Plot of Land)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/utils/api';
import { message } from 'antd';
import type { AreaOfEachPlotOfLand } from '@/models/rice-farming';

// ==================== INTERFACES ====================

/** DTO tạo vùng/lô đất */
export interface CreateAreaDto {
  name: string;
  code?: string;
  acreage: number;
  [key: string]: any; // Index signature để tương thích với api.postRaw
}

/** DTO cập nhật vùng/lô đất */
export interface UpdateAreaDto {
  name?: string;
  code?: string;
  acreage?: number;
  [key: string]: any; // Index signature để tương thích với api.patchRaw
}

/** Response từ API list */
interface AreaListResponse {
  data: {
    items: AreaOfEachPlotOfLand[];
    total: number;
    page: number;
    limit: number;
  };
}

// ==================== QUERY KEYS ====================

export const areaKeys = {
  all: ['area-of-each-plot-of-land'] as const,
  lists: () => [...areaKeys.all, 'list'] as const,
  list: (params: any) => [...areaKeys.lists(), params] as const,
  details: () => [...areaKeys.all, 'detail'] as const,
  detail: (id: number) => [...areaKeys.details(), id] as const,
};

// ==================== QUERIES ====================

/**
 * Lấy danh sách vùng/lô đất
 */
export const useAreasQuery = (params?: { page?: number; limit?: number }) => {
  return useQuery({
    queryKey: areaKeys.list(params || {}),
    queryFn: async () => {
      const response = await api.postRaw<{ data: AreaOfEachPlotOfLand[]; total: number }>(
        '/area-of-each-plot-of-land/search',
        {
          page: params?.page || 1,
          limit: params?.limit || 100,
        }
      );
      
      // Wrap response để tương thích với component
      return {
        data: {
          items: response.data || [],
          total: response.total || 0,
          page: params?.page || 1,
          limit: params?.limit || 100,
        }
      };
    },
  });
};

/**
 * Lấy chi tiết vùng/lô đất
 */
export const useAreaQuery = (id: number) => {
  return useQuery({
    queryKey: areaKeys.detail(id),
    queryFn: async () => {
      return await api.get<AreaOfEachPlotOfLand>(`/area-of-each-plot-of-land/${id}`);
    },
    enabled: !!id,
  });
};

// ==================== MUTATIONS ====================

/**
 * Tạo vùng/lô đất mới
 */
export const useCreateAreaMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: CreateAreaDto) => {
      return await api.postRaw<AreaOfEachPlotOfLand>('/area-of-each-plot-of-land', dto);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: areaKeys.lists() });
      message.success('Tạo vùng/lô đất thành công!');
    },
    onError: (error: any) => {
      message.error(error?.response?.data?.message || 'Có lỗi xảy ra khi tạo vùng/lô đất!');
    },
  });
};

/**
 * Cập nhật vùng/lô đất
 */
export const useUpdateAreaMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateAreaDto }) => {
      return await api.patchRaw<AreaOfEachPlotOfLand>(`/area-of-each-plot-of-land/${id}`, data);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: areaKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: areaKeys.lists() });
      message.success('Cập nhật vùng/lô đất thành công!');
    },
    onError: (error: any) => {
      message.error(error?.response?.data?.message || 'Có lỗi xảy ra khi cập nhật vùng/lô đất!');
    },
  });
};

/**
 * Xóa vùng/lô đất
 */
export const useDeleteAreaMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/area-of-each-plot-of-land/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: areaKeys.lists() });
      message.success('Xóa vùng/lô đất thành công!');
    },
    onError: (error: any) => {
      message.error(error?.response?.data?.message || 'Có lỗi xảy ra khi xóa vùng/lô đất!');
    },
  });
};
