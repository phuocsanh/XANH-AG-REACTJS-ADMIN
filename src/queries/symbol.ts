// Query hooks cho Symbol

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import api from "@/utils/api"
import {
  Symbol,
  CreateSymbolDto,
  UpdateSymbolDto,
  SymbolListParams,
} from "@/models/symbol.model"
import { handleApiError } from "@/utils/error-handler"
import { usePaginationQuery } from "@/hooks/use-pagination-query"

// Lấy danh sách ký hiệu
export const useSymbolsQuery = (params?: SymbolListParams) => {
  // Tách riêng các tham số phân trang
  const paginationParams = params
    ? {
        page:
          params.offset !== undefined
            ? Math.floor(params.offset / (params.limit || 10)) + 1
            : 1,
        limit: params.limit,
        search: params.search,
      }
    : undefined

  return usePaginationQuery<Symbol>("/symbols", paginationParams)
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
