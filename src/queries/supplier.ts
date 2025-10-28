import { useMutation, useQuery } from "@tanstack/react-query"
import { toast } from "react-toastify"
import api from "@/utils/api"
import { queryClient } from "@/provider/app-provider-tanstack"
import {
  CreateSupplierRequest,
  UpdateSupplierRequest,
  SupplierApiResponse,
  SupplierListApiResponse,
} from "@/models/supplier.model"

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
  return useQuery({
    queryKey: supplierKeys.list(params),
    queryFn: async () => {
      const response = await api.get<SupplierListApiResponse>("/suppliers", {
        params,
      })
      return response
    },
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
      return response
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
      const response = await api.post<SupplierApiResponse>(
        "/suppliers",
        supplier
      )
      return response
    },
    onSuccess: () => {
      // Invalidate và refetch danh sách nhà cung cấp
      queryClient.invalidateQueries({ queryKey: supplierKeys.lists() })
      toast.success("Tạo nhà cung cấp thành công!")
    },
    onError: (error: Error) => {
      toast.error(`Lỗi khi tạo nhà cung cấp: ${error.message}`)
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
      const response = await api.put<SupplierApiResponse>(
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
    onError: (error: Error) => {
      toast.error(`Lỗi khi cập nhật nhà cung cấp: ${error.message}`)
    },
  })
}

/**
 * Hook xóa nhà cung cấp
 */
export const useDeleteSupplierMutation = () => {
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/suppliers/${id}`)
    },
    onSuccess: () => {
      // Invalidate và refetch danh sách nhà cung cấp
      queryClient.invalidateQueries({ queryKey: supplierKeys.lists() })
      toast.success("Xóa nhà cung cấp thành công!")
    },
    onError: (error: Error) => {
      toast.error(`Lỗi khi xóa nhà cung cấp: ${error.message}`)
    },
  })
}
