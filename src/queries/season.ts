import { useMutation, useQuery } from "@tanstack/react-query"
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
