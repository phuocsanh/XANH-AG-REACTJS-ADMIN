// Query hooks cho Symbol

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import api from "@/utils/api"
import {
  Symbol,
  CreateSymbolDto,
  UpdateSymbolDto,
  SymbolListParams, // Keep this import as it might be used elsewhere or was part of the original context
} from "@/models/symbol.model"
import { handleApiError } from "@/utils/error-handler"
import { usePaginationQuery } from "@/hooks/use-pagination-query"

// Query keys
export const symbolKeys = {
  all: ["symbols"] as const,
  lists: () => [...symbolKeys.all, "list"] as const,
  list: (params: Record<string, unknown>) =>
    [...symbolKeys.lists(), { params }] as const,
  details: () => [...symbolKeys.all, "detail"] as const,
  detail: (id: number) => [...symbolKeys.details(), id] as const,
}

/**
 * Hook lấy danh sách ký hiệu (POST /symbols/search)
 */
export const useSymbolsQuery = (params?: Record<string, unknown>) => {
  const page = (params?.page as number) || 1
  const limit = (params?.limit as number) || 10

  return useQuery({
    queryKey: symbolKeys.list(params || {}),
    queryFn: async () => {
      const response = await api.postRaw<{
        data: Symbol[]
        total: number
        page: number
        limit: number
      }>('/symbols/search', {
        page,
        limit,
      })

      return {
        data: {
          items: response.data,
          total: response.total,
          page: response.page,
          limit: response.limit,
          total_pages: Math.ceil(response.total / response.limit),
          has_next: response.page * response.limit < response.total,
          has_prev: response.page > 1,
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

// Lấy thông tin ký hiệu theo ID
export const useSymbolQuery = (id: number) => {
  return useQuery({
    queryKey: ["symbol", id],
    queryFn: async () => {
      const response = await api.get<Symbol>(`/symbols/${id}`)
      return response
    },
    enabled: !!id,
  })
}

// Tạo mới ký hiệu
export const useCreateSymbolMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (symbolData: CreateSymbolDto) => {
      const response = await api.postRaw<Symbol>("/symbols", symbolData)
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["symbols"] })
    },
    onError: (error: unknown) => {
      handleApiError(error, "Có lỗi xảy ra khi tạo ký hiệu")
    },
  })
}

// Cập nhật ký hiệu
export const useUpdateSymbolMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      symbolData,
    }: {
      id: number
      symbolData: UpdateSymbolDto
    }) => {
      // Không truyền ID trong body request, chỉ truyền qua URL
      const response = await api.putRaw<Symbol>(`/symbols/${id}`, symbolData)
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["symbols"] })
      queryClient.invalidateQueries({ queryKey: ["symbol"] })
    },
    onError: (error: unknown) => {
      handleApiError(error, "Có lỗi xảy ra khi cập nhật ký hiệu")
    },
  })
}

// Xóa ký hiệu
export const useDeleteSymbolMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      console.log("Calling DELETE API for symbol ID:", id)
      const response = await api.delete<void>(`/symbols/${id}`)
      console.log("DELETE API response:", response)
      return response
    },
    onSuccess: () => {
      console.log("Delete symbol successful, invalidating queries")
      queryClient.invalidateQueries({ queryKey: ["symbols"] })
    },
    onError: (error: unknown) => {
      handleApiError(error, "Có lỗi xảy ra khi xóa ký hiệu")
    },
  })
}
