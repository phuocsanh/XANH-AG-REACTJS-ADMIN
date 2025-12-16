import { useMutation, useQuery } from "@tanstack/react-query"
import { toast } from "react-toastify"
import api from "@/utils/api"
import { queryClient } from "@/provider/app-provider-tanstack"
import { SalesReturn, CreateSalesReturnDto } from "@/models/sales-return"
import { handleApiError } from "@/utils/error-handler"

// ========== QUERY KEYS ==========
export const salesReturnKeys = {
  all: ["sales-returns"] as const,
  lists: () => [...salesReturnKeys.all, "list"] as const,
  list: (params?: Record<string, unknown>) =>
    [...salesReturnKeys.lists(), params] as const,
  details: () => [...salesReturnKeys.all, "detail"] as const,
  detail: (id: number) => [...salesReturnKeys.details(), id] as const,
} as const

// ========== SALES RETURN HOOKS ==========

/**
 * Hook lấy danh sách phiếu trả hàng
 */
export const useSalesReturnsQuery = (params?: Record<string, unknown>) => {
  const page = (params?.page as number) || 1
  const limit = (params?.limit as number) || 10

  return useQuery({
    queryKey: salesReturnKeys.list(params),
    queryFn: async () => {
      const response = await api.postRaw<{
        data: SalesReturn[]
        total: number
        page: number
        limit: number
      }>('/sales-returns/search', {
        page,
        limit,
        ...params
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

/**
 * Hook lấy phiếu trả hàng theo ID
 */
export const useSalesReturnQuery = (id: number) => {
  return useQuery({
    queryKey: salesReturnKeys.detail(id),
    queryFn: async () => {
      const response = await api.get<SalesReturn>(`/sales-returns/${id}`)
      return response
    },
    enabled: !!id,
  })
}

/**
 * Hook tạo phiếu trả hàng
 */
export const useCreateSalesReturnMutation = () => {
  return useMutation({
    mutationFn: async (salesReturn: CreateSalesReturnDto) => {
      const response = await api.postRaw<SalesReturn>("/sales-returns", salesReturn as any)
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salesReturnKeys.lists() })
      toast.success("Tạo phiếu trả hàng thành công!")
    },
    onError: (error: unknown) => {
      handleApiError(error, "Có lỗi xảy ra khi tạo phiếu trả hàng")
    },
  })
}


/**
 * Hook xóa phiếu trả hàng
 */
export const useDeleteSalesReturnMutation = () => {
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.delete(`/sales-returns/${id}`)
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salesReturnKeys.lists() })
      toast.success("Xóa phiếu trả hàng thành công!")
    },
    onError: (error: unknown) => {
      handleApiError(error, "Có lỗi xảy ra khi xóa phiếu trả hàng")
    },
  })
}
