import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/utils/api';
import {
  OperatingCostCategory,
  CreateOperatingCostCategoryDto,
  UpdateOperatingCostCategoryDto,
  OperatingCostCategoryFilters
} from '@/types/operating-cost-category.types';

export const operatingCostCategoryKeys = {
  all: ['operating-cost-categories'] as const,
  lists: () => [...operatingCostCategoryKeys.all, 'list'] as const,
  list: (filters: OperatingCostCategoryFilters) => [...operatingCostCategoryKeys.lists(), { filters }] as const,
  details: () => [...operatingCostCategoryKeys.all, 'detail'] as const,
  detail: (id: number) => [...operatingCostCategoryKeys.details(), id] as const,
};

// --- QUERIES ---

export const useOperatingCostCategories = (params?: OperatingCostCategoryFilters) => {
  return useQuery({
    queryKey: operatingCostCategoryKeys.list(params || {}),
    queryFn: async () => {
      // Backend API endpoint: POST /operating-cost-categories/search
      // Response structure: { success, data: [...], meta, pagination }
      const { page = 1, limit = 10, ...filters } = params || {};
      
      const response = await api.postRaw<{
        success: boolean;
        data: OperatingCostCategory[];
        meta?: any;
        pagination?: any;
      }>('/operating-cost-categories/search', {
        page,
        limit,
        ...filters
      });
      
      return {
          data: response.data || [],
          total: response.pagination?.total || response.data?.length || 0,
      };
    },
  });
};

export const useOperatingCostCategory = (id: number) => {
  return useQuery({
    queryKey: operatingCostCategoryKeys.detail(id),
    queryFn: async () => {
      return await api.get<OperatingCostCategory>(`/operating-cost-categories/${id}`);
    },
    enabled: !!id,
  });
};

// --- MUTATIONS ---

export const useCreateOperatingCostCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateOperatingCostCategoryDto) => {
      return await api.postRaw<OperatingCostCategory>('/operating-cost-categories', data as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: operatingCostCategoryKeys.lists() });
    },
  });
};

export const useUpdateOperatingCostCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateOperatingCostCategoryDto }) => {
      return await api.patchRaw<OperatingCostCategory>(`/operating-cost-categories/${id}`, data as any);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: operatingCostCategoryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: operatingCostCategoryKeys.detail(data.id) });
    },
  });
};

export const useDeleteOperatingCostCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      return await api.delete(`/operating-cost-categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: operatingCostCategoryKeys.lists() });
    },
  });
};
