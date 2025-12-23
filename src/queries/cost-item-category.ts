import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/utils/api';
import {
  CostItemCategory,
  CreateCostItemCategoryDto,
  UpdateCostItemCategoryDto,
  CostItemCategoryFilters
} from '@/models/cost-item-category';

export const costItemCategoryKeys = {
  all: ['cost-item-categories'] as const,
  lists: () => [...costItemCategoryKeys.all, 'list'] as const,
  list: (filters: CostItemCategoryFilters) => [...costItemCategoryKeys.lists(), { filters }] as const,
  details: () => [...costItemCategoryKeys.all, 'detail'] as const,
  detail: (id: number) => [...costItemCategoryKeys.details(), id] as const,
};

// --- QUERIES ---

export const useCostItemCategories = (params?: CostItemCategoryFilters) => {
  return useQuery({
    queryKey: costItemCategoryKeys.list(params || {}),
    queryFn: async () => {
      // Backend API endpoint: POST /cost-item-categories/search
      // Response structure: { success, data: [...], meta, pagination }
      const { page = 1, limit = 10, ...filters } = params || {};
      
      const response = await api.postRaw<{
        success: boolean;
        data: CostItemCategory[];
        meta?: any;
        pagination?: any;
      }>('/cost-item-categories/search', {
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

export const useCostItemCategory = (id: number) => {
  return useQuery({
    queryKey: costItemCategoryKeys.detail(id),
    queryFn: async () => {
      return await api.get<CostItemCategory>(`/cost-item-categories/${id}`);
    },
    enabled: !!id,
  });
};

// --- MUTATIONS ---

export const useCreateCostItemCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateCostItemCategoryDto) => {
      return await api.postRaw<CostItemCategory>('/cost-item-categories', data as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: costItemCategoryKeys.lists() });
    },
  });
};

export const useUpdateCostItemCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateCostItemCategoryDto }) => {
      return await api.patchRaw<CostItemCategory>(`/cost-item-categories/${id}`, data as any);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: costItemCategoryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: costItemCategoryKeys.detail(data.id) });
    },
  });
};

export const useDeleteCostItemCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      return await api.delete(`/cost-item-categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: costItemCategoryKeys.lists() });
    },
  });
};
