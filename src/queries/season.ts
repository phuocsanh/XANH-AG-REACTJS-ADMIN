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
 * Hook lấy danh sách mùa vụ
 */
export const useSeasonsQuery = (params?: Record<string, unknown>) => {
  return usePaginationQuery<Season>("/season", params)
}

/**
 * Hook lấy mùa vụ đang hoạt động
 */
export const useActiveSeasonQuery = () => {
  return useQuery({
    queryKey: seasonKeys.active(),
    queryFn: async () => {
      const response = await api.get<Season>("/season/active")
      return response
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
      invalidateResourceQueries("/season")
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
      invalidateResourceQueries("/season")
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
      invalidateResourceQueries("/season")
      toast.success("Xóa mùa vụ thành công!")
    },
    onError: (error: unknown) => {
      handleApiError(error, "Có lỗi xảy ra khi xóa mùa vụ")
    },
  })
}
