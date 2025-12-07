import { useMutation, useQuery } from "@tanstack/react-query"
import { toast } from "react-toastify"
import api from "@/utils/api"
import { queryClient } from "@/provider/app-provider-tanstack"
import {
  CreateSupplierRequest,
  UpdateSupplierRequest,
  SupplierApiResponse,
  Supplier,
} from "@/models/supplier.model"
import { handleApiError } from "@/utils/error-handler"
import { usePaginationQuery } from "@/hooks/use-pagination-query"
import { invalidateResourceQueries } from "@/utils/query-helpers"

// ========== QUERY KEYS ==========
export const supplierKeys = {
  all: ["suppliers"] as const,
  lists: () => [...supplierKeys.all, "list"] as const,
  list: (params?: Record<string, unknown>) =>
    [...supplierKeys.lists(), params] as const,
  details: () => [...supplierKeys.all, "detail"] as const,
  detail: (id: number) => [...supplierKeys.details(), id] as const,
} as const

// ========== SUPPLIER HOOKS ==========

/**
 * Hook lấy danh sách nhà cung cấp (POST /suppliers/search)
 */
export const useSuppliersQuery = (params?: Record<string, unknown>) => {
  const page = (params?.page as number) || 1
  const limit = (params?.limit as number) || 10

  return useQuery({
    queryKey: supplierKeys.list(params),
    queryFn: async () => {
      const response = await api.postRaw<{
        data: Supplier[]
        total: number
        page: number
        limit: number
      }>('/suppliers/search', {
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

/**
 * Hook lấy nhà cung cấp theo ID
 */
export const useSupplierQuery = (id: number) => {
  return useQuery({
    queryKey: supplierKeys.detail(id),
    queryFn: async () => {
      const response = await api.get<SupplierApiResponse>(`/suppliers/${id}`)
      // Trả về response.data thay vì toàn bộ response để phù hợp với interceptor
      return response.data
    },
    enabled: !!id,
  })
}

/**
 * Hook tạo nhà cung cấp mới
 */
export const useCreateSupplierMutation = () => {
  return useMutation({
    mutationFn: async (supplier: CreateSupplierRequest) => {
      const response = await api.postRaw<SupplierApiResponse>(
        "/suppliers",
        supplier
      )
      console.log("Create supplier response:", response)
      return response
    },
    onSuccess: (data) => {
      console.log("Create supplier success:", data)
      // Invalidate và refetch danh sách nhà cung cấp
      invalidateResourceQueries("/suppliers")
      toast.success("Tạo nhà cung cấp thành công!")
    },
    onError: (error: unknown) => {
      handleApiError(error, "Có lỗi xảy ra khi tạo nhà cung cấp")
    },
  })
}

/**
 * Hook cập nhật nhà cung cấp
 */
export const useUpdateSupplierMutation = () => {
  return useMutation({
    mutationFn: async ({
      id,
      supplier,
    }: {
      id: number
      supplier: UpdateSupplierRequest
    }) => {
      const response = await api.putRaw<SupplierApiResponse>(
        `/suppliers/${id}`,
        supplier
      )
      return response
    },
    onSuccess: () => {
      // Invalidate và refetch danh sách nhà cung cấp
      invalidateResourceQueries("/suppliers")
      toast.success("Cập nhật nhà cung cấp thành công!")
    },
    onError: (error: unknown) => {
      handleApiError(error, "Có lỗi xảy ra khi cập nhật nhà cung cấp")
    },
  })
}

/**
 * Hook xóa nhà cung cấp
 */
export const useDeleteSupplierMutation = () => {
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.delete(`/suppliers/${id}`)
      return response
    },
    onSuccess: () => {
      // Invalidate và refetch danh sách nhà cung cấp
      invalidateResourceQueries("/suppliers")
      toast.success("Xóa nhà cung cấp thành công!")
    },
    onError: (error: unknown) => {
      handleApiError(error, "Có lỗi xảy ra khi xóa nhà cung cấp")
    },
  })
}
