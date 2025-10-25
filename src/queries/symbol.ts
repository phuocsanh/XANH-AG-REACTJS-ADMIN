// Query hooks cho Symbol

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import api from "@/utils/api"
import {
  Symbol,
  CreateSymbolDto,
  UpdateSymbolDto,
  SymbolListParams,
} from "@/models/symbol.model"

// Lấy danh sách ký hiệu
export const useSymbolsQuery = (params?: SymbolListParams) => {
  return useQuery({
    queryKey: ["symbols", params],
    queryFn: async () => {
      // Thay đổi cách xử lý dữ liệu trả về
      const response = await api.get<Symbol[]>("/symbols", {
        params,
      })
      // Trả về dữ liệu trực tiếp thay vì PaginationResponse
      return response
    },
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
      const response = await api.post<Symbol>("/symbols", symbolData)
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["symbols"] })
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
      const response = await api.patch<Symbol>(`/symbols/${id}`, symbolData)
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["symbols"] })
      queryClient.invalidateQueries({ queryKey: ["symbol"] })
    },
  })
}

// Xóa ký hiệu
export const useDeleteSymbolMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.delete<void>(`/symbols/${id}`)
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["symbols"] })
    },
  })
}
