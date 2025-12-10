import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../utils/api';
import { 
  CreateOperatingCostDto, 
  UpdateOperatingCostDto, 
  OperatingCost, 
  SearchOperatingCostDto 
} from '../types/operating-cost.types';

export const operatingCostKeys = {
  all: ['operating-costs'] as const,
  lists: () => [...operatingCostKeys.all, 'list'] as const,
  list: (filters: string) => [...operatingCostKeys.lists(), { filters }] as const,
  details: () => [...operatingCostKeys.all, 'detail'] as const,
  detail: (id: number) => [...operatingCostKeys.details(), id] as const,
};

// --- QUERIES ---

// --- QUERIES ---

export const useOperatingCosts = (params: SearchOperatingCostDto) => {
  return useQuery({
    queryKey: operatingCostKeys.list(JSON.stringify(params)),
    queryFn: async () => {
      try {
          // Use POST search as requested, with plural endpoint
          const res = await api.postRaw<{ data: OperatingCost[], total: number }>('/operating-costs/search', params as any);
          return res;
      } catch (e) {
          console.error("Failed to fetch operating costs", e);
          throw e;
      }
    },
  });
};

export const useOperatingCost = (id: number) => {
  return useQuery({
    queryKey: operatingCostKeys.detail(id),
    queryFn: async () => {
      // Update to plural
      return await api.get<OperatingCost>(`/operating-costs/${id}`);
    },
    enabled: !!id,
  });
};

// --- MUTATIONS ---

export const useCreateOperatingCost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateOperatingCostDto) => {
      // Update to plural
      return await api.postRaw<OperatingCost>('/operating-costs', data as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: operatingCostKeys.lists() });
    },
  });
};

export const useUpdateOperatingCost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateOperatingCostDto }) => {
      // Update to plural
      return await api.patchRaw<OperatingCost>(`/operating-costs/${id}`, data as any);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: operatingCostKeys.lists() });
      queryClient.invalidateQueries({ queryKey: operatingCostKeys.detail(data.id) });
    },
  });
};

export const useDeleteOperatingCost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      // Update to plural
      return await api.delete(`/operating-costs/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: operatingCostKeys.lists() });
    },
  });
};
