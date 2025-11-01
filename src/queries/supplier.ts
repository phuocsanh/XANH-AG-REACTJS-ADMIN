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
 * Hook lấy danh sách nhà cung cấp
 */
export const useSuppliersQuery = (params?: Record<string, unknown>) => {
  return usePaginationQuery<Supplier[]>("/suppliers", params)
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
      queryClient.invalidateQueries({ queryKey: supplierKeys.lists() })
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
      queryClient.invalidateQueries({ queryKey: supplierKeys.lists() })
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
      queryClient.invalidateQueries({ queryKey: supplierKeys.lists() })
      toast.success("Xóa nhà cung cấp thành công!")
    },
    onError: (error: unknown) => {
      handleApiError(error, "Có lỗi xảy ra khi xóa nhà cung cấp")
    },
  })
}
