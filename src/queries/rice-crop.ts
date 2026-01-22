/**
 * React Query hooks cho Quản Lý Canh Tác (Rice Crop)
 */

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { handleApiError } from "@/utils/error-handler"
import api from '@/utils/api';
import type {
  RiceCrop,
  CreateRiceCropDto,
  UpdateRiceCropDto,
  UpdateGrowthStageDto,
  UpdateStatusDto,
  RiceCropFilters,
  CustomerStats,
} from '@/models/rice-farming';

// ==================== QUERY KEYS ====================

export const riceCropKeys = {
  all: ['rice-crops'] as const,
  lists: () => [...riceCropKeys.all, 'list'] as const,
  list: (filters: RiceCropFilters) => [...riceCropKeys.lists(), filters] as const,
  details: () => [...riceCropKeys.all, 'detail'] as const,
  detail: (id: number) => [...riceCropKeys.details(), id] as const,
  stats: (customerId: number) => [...riceCropKeys.all, 'stats', customerId] as const,
};

// ==================== QUERIES ====================

/**
 * Lấy  Danh sách ruộng lúa (POST /rice-crops/search)
 */
export const useRiceCrops = (params?: Record<string, unknown>, options?: { enabled?: boolean }) => {
  const page = (params?.page as number) || 1
  const limit = (params?.limit as number) || 10

  return useQuery({
    queryKey: riceCropKeys.list(params as any),
    queryFn: async () => {
      const searchBody = {
        page,
        limit,
        ...params
      }

      const response = await api.postRaw<{
        data: RiceCrop[]
        total: number
        page: number
        limit: number
      }>('/rice-crops/search', searchBody)

      return {
          data: response.data || [],
          total: response.total || 0
      }
    },
    enabled: options?.enabled,
  });
};

/**
 * Interface cho API response theo đúng format của ComboBox
 */
export interface RiceCropSearchResponse {
  data: Array<any>
  total: number
  hasMore: boolean
  nextPage?: number
}

interface SearchRiceCropsParams {
  page: number
  limit: number
  search?: string
  season_id?: number
  customer_id?: number
}

/**
 * Hàm search ruộng lúa cho ComboBox
 */
export const searchRiceCropsApi = async ({
  page,
  limit,
  search = "",
  season_id,
  customer_id,
}: SearchRiceCropsParams): Promise<RiceCropSearchResponse> => {
  try {
    const searchDto: any = {
      page,
      limit,
      season_id,
      customer_id,
    }

    if (search.trim()) {
      searchDto.keyword = search.trim()
    }

    const response = await api.postRaw<{
      data: RiceCrop[]
      total: number
      page: number
      limit: number
    }>('/rice-crops/search', searchDto)

    // Chuyển đổi dữ liệu sang format của ComboBox
    const mappedData = (response.data || []).map((crop: RiceCrop) => ({
      ...crop,
      value: crop.id,
      label: `${crop.field_name} - ${crop.customer?.name || 'N/A'}`,
    }))

    const total = response.total || mappedData.length
    const currentPage = response.page || page
    const currentLimit = response.limit || limit
    const hasMore = total > currentPage * currentLimit

    return {
      data: mappedData,
      total,
      hasMore,
      nextPage: hasMore ? currentPage + 1 : undefined,
    }
  } catch (error) {
    console.error("Error searching rice crops:", error)
    handleApiError(error, "Có lỗi xảy ra khi tìm kiếm ruộng lúa")
    return {
      data: [],
      total: 0,
      hasMore: false,
      nextPage: undefined,
    }
  }
}

/**
 * Hook search ruộng lúa cho ComboBox với infinite loading
 */
export const useRiceCropSearch = (
  params: { search?: string; season_id?: number; customer_id?: number } = {},
  limit: number = 20,
  enabled: boolean = true
) => {
  const { search = "", season_id, customer_id } = params
  return useInfiniteQuery<RiceCropSearchResponse, Error>({
    queryKey: [...riceCropKeys.all, "search-infinite", search, season_id, customer_id],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await searchRiceCropsApi({
        page: pageParam as number,
        limit,
        search,
        season_id,
        customer_id,
      })
      return response
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      return lastPage.hasMore ? lastPage.nextPage : undefined
    },
    enabled: enabled,
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * Lấy chi tiết Ruộng lúa
 */
export const useRiceCrop = (id: number) => {
  return useQuery({
    queryKey: riceCropKeys.detail(id),
    queryFn: async () => {
      const response = await api.get<RiceCrop>(`/rice-crops/${id}`);
      return response;
    },
    enabled: !!id,
  });
};

/**
 * Thống kê Ruộng lúa theo khách hàng
 */
export const useCustomerStats = (customerId: number) => {
  return useQuery({
    queryKey: riceCropKeys.stats(customerId),
    queryFn: async () => {
      return await api.get<CustomerStats>(`/rice-crops/customer/${customerId}/stats`);
    },
    enabled: !!customerId,
  });
};

// ==================== MUTATIONS ====================

/**
 * Tạo Ruộng lúa mới
 */
export const useCreateRiceCrop = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: CreateRiceCropDto) => {
      return await api.postRaw<RiceCrop>('/rice-crops', dto);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: riceCropKeys.lists() });
    },
  });
};

/**
 * Cập nhật Ruộng lúa
 */
export const useUpdateRiceCrop = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, dto }: { id: number; dto: UpdateRiceCropDto }) => {
      return await api.patchRaw<RiceCrop>(`/rice-crops/${id}`, dto);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: riceCropKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: riceCropKeys.lists() });
    },
  });
};

/**
 * Cập nhật giai đoạn sinh trưởng
 */
export const useUpdateGrowthStage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, dto }: { id: number; dto: UpdateGrowthStageDto }) => {
      return await api.patchRaw<RiceCrop>(`/rice-crops/${id}/growth-stage`, dto);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: riceCropKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: riceCropKeys.lists() });
    },
  });
};

/**
 * Cập nhật trạng thái Ruộng lúa
 */
export const useUpdateStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, dto }: { id: number; dto: UpdateStatusDto }) => {
      return await api.patchRaw<RiceCrop>(`/rice-crops/${id}/status`, dto);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: riceCropKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: riceCropKeys.lists() });
    },
  });
};

/**
 * Xóa Ruộng lúa
 */
export const useDeleteRiceCrop = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/rice-crops/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: riceCropKeys.lists() });
    },
  });
};
