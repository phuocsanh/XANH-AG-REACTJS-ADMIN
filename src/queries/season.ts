import { useMutation, useQuery, useInfiniteQuery } from "@tanstack/react-query"
import { toast } from "react-toastify"
import api from "@/utils/api"
import { queryClient } from "@/provider/app-provider-tanstack"
import { Season, CreateSeasonDto, UpdateSeasonDto } from "@/models/season"
import { handleApiError } from "@/utils/error-handler"
import { usePaginationQuery } from "@/hooks/use-pagination-query"
import { invalidateResourceQueries } from "@/utils/query-helpers"

// ========== QUERY KEYS ==========
export const seasonKeys = {
  all: ["seasons"] as const,
  lists: () => [...seasonKeys.all, "list"] as const,
  list: (params?: Record<string, unknown>) =>
    [...seasonKeys.lists(), params] as const,
  details: () => [...seasonKeys.all, "detail"] as const,
  detail: (id: number) => [...seasonKeys.details(), id] as const,
  active: () => [...seasonKeys.all, "active"] as const,
} as const

// ========== SEASON HOOKS ==========

/**
 * Hook lấy danh sách mùa vụ (POST /season/search)
 */
export const useSeasonsQuery = (params?: Record<string, unknown>) => {
  const page = (params?.page as number) || 1
  const limit = (params?.limit as number) || 100 // Lấy nhiều để hiển thị tất cả

  return useQuery({
    queryKey: seasonKeys.list(params),
    queryFn: async () => {
      const response = await api.postRaw<{
        data: Season[]
        total: number
        page: number
        limit: number
        pagination?: any
      }>('/season/search', {
        page,
        limit,
        ...params
      })

      // Interceptor giữ nguyên response có pagination
      // response = { success, data: [...], total, page, limit, pagination }
      return {
        data: {
          items: response.data || [],
          total: response.total || 0,
          page: response.page || 1,
          limit: response.limit || 100,
          total_pages: Math.ceil((response.total || 0) / (response.limit || 100)),
          has_next: (response.page || 1) * (response.limit || 100) < (response.total || 0),
          has_prev: (response.page || 1) > 1,
        },
        status: 200,
        message: 'Success',
        success: true
      }
    },
    refetchOnMount: true,
    staleTime: 0,
  })
}

/**
 * Interface cho API response theo đúng format của ComboBox
 */
export interface SeasonSearchResponse {
  data: Array<any>
  total: number
  hasMore: boolean
  nextPage?: number
}

interface SearchSeasonsParams {
  page: number
  limit: number
  search?: string
}

/**
 * Hàm search mùa vụ cho ComboBox
 */
export const searchSeasonsApi = async ({
  page,
  limit,
  search = "",
}: SearchSeasonsParams): Promise<SeasonSearchResponse> => {
  try {
    const searchDto: any = {
      page,
      limit,
    }

    if (search.trim()) {
      searchDto.keyword = search.trim()
    }

    const response = await api.postRaw<{
      data: Season[]
      total: number
      page: number
      limit: number
    }>('/season/search', searchDto)

    // Chuyển đổi dữ liệu sang format của ComboBox
    const mappedData = (response.data || []).map((season: Season) => ({
      ...season,
      value: season.id,
      label: `${season.name} (${season.year})`,
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
    console.error("Error searching seasons:", error)
    handleApiError(error, "Có lỗi xảy ra khi tìm kiếm mùa vụ")
    return {
      data: [],
      total: 0,
      hasMore: false,
      nextPage: undefined,
    }
  }
}

/**
 * Hook search mùa vụ cho ComboBox với infinite loading
 */
export const useSeasonSearch = (
  searchTerm: string = "",
  limit: number = 20,
  enabled: boolean = true
) => {
  return useInfiniteQuery<SeasonSearchResponse, Error>({
    queryKey: [...seasonKeys.all, "search-infinite", searchTerm],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await searchSeasonsApi({
        page: pageParam as number,
        limit,
        search: searchTerm,
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
 * Hook lấy mùa vụ mới nhất (đang hoạt động hoặc mới tạo gần nhất)
 */
export const useActiveSeasonQuery = () => {
  return useQuery({
    queryKey: seasonKeys.active(),
    queryFn: async () => {
      const response = await api.postRaw<{
        data: Season[]
        total: number
        page: number
        limit: number
      }>("/season/search", {
        page: 1,
        limit: 20,
        sort: 'created_at:DESC' // Sắp xếp mới nhất lên đầu
      })
      
      // Trả về season đầu tiên (mới nhất) hoặc null nếu không có
      return response.data?.[0] || null
    },
  })
}

/**
 * Hook lấy mùa vụ theo ID
 */
export const useSeasonQuery = (id: number) => {
  return useQuery({
    queryKey: seasonKeys.detail(id),
    queryFn: async () => {
      const response = await api.get<Season>(`/season/${id}`)
      return response
    },
    enabled: !!id,
  })
}

/**
 * Hook tạo mùa vụ mới
 */
export const useCreateSeasonMutation = () => {
  return useMutation({
    mutationFn: async (season: CreateSeasonDto) => {
      const response = await api.postRaw<Season>("/season", season as any)
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: seasonKeys.all })
      toast.success("Tạo mùa vụ thành công!")
    },
    onError: (error: unknown) => {
      handleApiError(error, "Có lỗi xảy ra khi tạo mùa vụ")
    },
  })
}

/**
 * Hook cập nhật mùa vụ
 */
export const useUpdateSeasonMutation = () => {
  return useMutation({
    mutationFn: async ({
      id,
      season,
    }: {
      id: number
      season: UpdateSeasonDto
    }) => {
      const response = await api.patchRaw<Season>(`/season/${id}`, season as any)
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: seasonKeys.all })
      toast.success("Cập nhật mùa vụ thành công!")
    },
    onError: (error: unknown) => {
      handleApiError(error, "Có lỗi xảy ra khi cập nhật mùa vụ")
    },
  })
}

/**
 * Hook xóa mùa vụ
 */
export const useDeleteSeasonMutation = () => {
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.delete(`/season/${id}`)
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: seasonKeys.all })
      toast.success("Xóa mùa vụ thành công!")
    },
    onError: (error: unknown) => {
      handleApiError(error, "Có lỗi xảy ra khi xóa mùa vụ")
    },
  })
}
